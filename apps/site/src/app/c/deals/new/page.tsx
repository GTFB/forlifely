'use client'

import * as React from 'react'
import { InstallmentApplicationForm } from '@/components/cabinet/forms/InstallmentApplicationForm'

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Новая заявка на рассрочку</h1>
      <InstallmentApplicationForm />
    </div>
  )
}

