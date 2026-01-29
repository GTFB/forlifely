/// <reference types="@cloudflare/workers-types" />

import { MeRepository } from '@/shared/repositories/me.repository';
import { getSession } from '@/shared/session';
import { buildRequestEnv } from '@/shared/env'
import { PushSubscription } from 'web-push'
import { HumanRepository } from '@/shared/repositories/human.repository';

export async function POST(request: Request) {
    const env = buildRequestEnv()

    if (!env.AUTH_SECRET) {
        console.error('AUTH_SECRET not configured')
        return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
            status: 401,
            headers: { "content-type": "application/json" },
        })
    }

    // Get user from session
    const user = await getSession(request, env.AUTH_SECRET)

    if (!user || !user.id) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 401,
            headers: { "content-type": "application/json" },
        })
    }

    const {subscription} = await request.json() as {subscription: PushSubscription}

    const meRepository = MeRepository.getInstance(env.DB)

    const userWithRoles = await meRepository.findByIdWithRoles(Number(user.id))

    if(!userWithRoles?.human) {
        return new Response(JSON.stringify({ error: 'Human not found' }), {
            status: 401,
            headers: { "content-type": "application/json" },
        })
    }

    const humanRepository = HumanRepository.getInstance(env.DB)

    let dataIn = userWithRoles.human.dataIn || {} as any
    if(typeof dataIn === 'string') {
        dataIn = JSON.parse(dataIn)
    }
    const uuid = userWithRoles.human.uuid
    dataIn.push_subscription = subscription
    userWithRoles.human.dataIn = JSON.stringify(dataIn)
    await humanRepository.update(uuid, userWithRoles.human)

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
    })
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
        },
    })
}


