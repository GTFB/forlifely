import { DealsRepository } from "@/shared/repositories/deals.repository"
import {
    LoanApplication,
    LoanApplicationDataIn,
    LoanApplicationDecision,
    LoanApplicationStatus,
} from "@/shared/types/esnad"

type RequestContext = {
    request: Request
    env: {
        DB: D1Database
    }
}

type LoanDecisionPayload = {
    uuid: string
    securityServiceComment: string
    managerUuid: string
}

type HandleLoanDecisionOptions = {
    statusName: LoanApplicationStatus
    successMessage: string
    operation: string
}

export class BadRequestError extends Error {
    constructor(message: string, public status: number = 400) {
        super(message)
        this.name = "BadRequestError"
    }
}

export const loanDecisionCorsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "PUT, OPTIONS",
    "access-control-allow-headers": "content-type",
} as const

const jsonHeaders = {
    ...loanDecisionCorsHeaders,
    "content-type": "application/json",
} as const

const parseLoanDecisionPayload = async (request: Request): Promise<LoanDecisionPayload> => {
    let rawBody: unknown

    try {
        rawBody = await request.json()
    } catch {
        throw new BadRequestError("Invalid JSON body")
    }

    const body = rawBody as Partial<LoanDecisionPayload>
    const uuid = typeof body.uuid === "string" ? body.uuid.trim() : ""
    const securityServiceComment =
        typeof body.securityServiceComment === "string" ? body.securityServiceComment.trim() : ""
    const managerUuid =
        typeof body.managerUuid === "string" ? body.managerUuid.trim() : ""

    const missingFields = []
    if (!uuid) missingFields.push("uuid")
    if (!securityServiceComment) missingFields.push("securityServiceComment")
    if (!managerUuid) missingFields.push("managerUuid")

    if (missingFields.length) {
        throw new BadRequestError(`Missing required fields: ${missingFields.join(", ")}`)
    }

    return {
        uuid,
        securityServiceComment,
        managerUuid,
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

export const handleLoanDecision = async (
    context: RequestContext,
    options: HandleLoanDecisionOptions,
): Promise<Response> => {
    const { request, env } = context

    try {
        const payload = await parseLoanDecisionPayload(request)
        const dealsRepository = new DealsRepository(env.DB)

        const existingDeal = (await dealsRepository.findByUuid(payload.uuid)) as LoanApplication | undefined

        if (!existingDeal) {
            throw new BadRequestError("Loan application not found", 404)
        }

        const currentDataIn = normalizeLoanApplicationDataIn(existingDeal.dataIn)

        const decision: LoanApplicationDecision = {
            securityServiceComment: payload.securityServiceComment,
        }

        const result = await dealsRepository.updateLoanApplicationDeal(payload.uuid, {
            statusName: options.statusName,
            dataIn: {
                ...currentDataIn,
                managerUuid: payload.managerUuid,
                decision,
            },
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: options.successMessage,
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

        console.error(`Failed to ${options.operation} loan application`, error)

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


