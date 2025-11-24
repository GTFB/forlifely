/// <reference types="@cloudflare/workers-types" />

import { handleLoanDecision, loanDecisionCorsHeaders } from "../decision-handler"
import { buildRequestEnv } from '@/shared/env'

type RequestContext = Parameters<typeof handleLoanDecision>[0]

export async function PUT(request: Request) {
    const env = buildRequestEnv()
    const context = { request, env } satisfies RequestContext
    return handleLoanDecision(context, {
        statusName: "CANCELLED",
        successMessage: "Loan application cancelled",
        operation: "cancel",
    })
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: loanDecisionCorsHeaders,
    })
}
