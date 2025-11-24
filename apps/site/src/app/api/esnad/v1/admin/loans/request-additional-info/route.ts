/// <reference types="@cloudflare/workers-types" />

import { DealsRepository } from "@/shared/repositories/deals.repository"
import {
    LoanApplication,
    LoanApplicationDataIn,
} from "@/shared/types/esnad"
import { BadRequestError, loanDecisionCorsHeaders } from "../decision-handler"
import type { Env } from '@/shared/types'
import { buildRequestEnv } from '@/shared/env'

type RequestContext = {
    request: Request
    env: Env
}

type AdditionalInfoRequestPayload = {
    uuid: string
    comment: string
}

const jsonHeaders = {
    ...loanDecisionCorsHeaders,
    "content-type": "application/json",
} as const

const parseAdditionalInfoRequestPayload = async (
    request: Request,
): Promise<AdditionalInfoRequestPayload> => {
    let rawBody: unknown

    try {
        rawBody = await request.json()
    } catch {
        throw new BadRequestError("Invalid JSON body")
    }

    const body = rawBody as Partial<AdditionalInfoRequestPayload>
    const uuid = typeof body.uuid === "string" ? body.uuid.trim() : ""
    const comment = typeof body.comment === "string" ? body.comment.trim() : ""

    const missingFields = []
    if (!uuid) missingFields.push("uuid")
    if (!comment) missingFields.push("comment")

    if (missingFields.length) {
        throw new BadRequestError(`Missing required fields: ${missingFields.join(", ")}`)
    }

    return {
        uuid,
        comment,
    }
}

const normalizeLoanApplicationDataIn = (rawDataIn: LoanApplication["dataIn"]): LoanApplicationDataIn => {
    let parsed: unknown = rawDataIn

    if (typeof rawDataIn === "string") {
        try {
            parsed = JSON.parse(rawDataIn) as LoanApplicationDataIn
        } catch {
            throw new BadRequestError("Unable to parse loan application payload")
        }
    }

    if (!parsed || typeof parsed !== "object") {
        throw new BadRequestError("Loan application payload is malformed")
    }

    const dataIn = parsed as LoanApplicationDataIn

    if (dataIn.type !== "LOAN_APPLICATION") {
        throw new BadRequestError("Provided deal is not a loan application")
    }

    return dataIn
}

export const onRequestPut = async (context: RequestContext): Promise<Response> => {
    const { request, env } = context

    try {
        const payload = await parseAdditionalInfoRequestPayload(request)
        const dealsRepository = new DealsRepository()

        const existingDeal = (await dealsRepository.findByUuid(payload.uuid)) as LoanApplication | undefined

        if (!existingDeal) {
            throw new BadRequestError("Loan application not found", 404)
        }

        const currentDataIn = normalizeLoanApplicationDataIn(existingDeal.dataIn)

        const result = await dealsRepository.updateLoanApplicationDeal(payload.uuid, {
            statusName: "ADDITIONAL_INFO_REQUESTED",
            dataIn: {
                ...currentDataIn,
                additionalInfoRequest: {
                    comment: payload.comment,
                },
            },
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: "Additional info requested",
                deal: result.updatedDeal,
                journal: result.journal,
            }),
            {
                status: 200,
                headers: jsonHeaders,
            },
        )
    } catch (error) {
        const status = error instanceof BadRequestError ? error.status : 500
        const message = error instanceof Error ? error.message : "Unexpected error"

        console.error("Failed to request additional info for loan application", error)

        return new Response(
            JSON.stringify({
                success: false,
                error: status === 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST",
                message,
            }),
            {
                status,
                headers: jsonHeaders,
            },
        )
    }
}

export const onRequestOptions = async () =>
    new Response(null, {
        status: 204,
        headers: loanDecisionCorsHeaders,
    })

type HandlerContext = Parameters<typeof onRequestPut>[0]

export async function PUT(request: Request) {
    const env = buildRequestEnv()
    const context = { request, env } satisfies HandlerContext
    return onRequestPut(context)
}

export async function OPTIONS() {
    return onRequestOptions()
}


