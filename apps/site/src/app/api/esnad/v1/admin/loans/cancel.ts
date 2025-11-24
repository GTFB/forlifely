/// <reference types="@cloudflare/workers-types" />

import { handleLoanDecision, loanDecisionCorsHeaders } from "./decision-handler"

type RequestContext = Parameters<typeof handleLoanDecision>[0]

export const onRequestPut = async (context: RequestContext) =>
    handleLoanDecision(context, {
        statusName: "CANCELLED",
        successMessage: "Loan application cancelled",
        operation: "cancel",
    })

export const onRequestOptions = async () =>
    new Response(null, {
        status: 204,
        headers: loanDecisionCorsHeaders,
    })
