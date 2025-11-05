'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'

interface FormData {
  // Client Primary Info
  firstName: string
  lastName: string
  phoneNumber: string
  productName: string
  productPrice: string
  purchaseLocation: string
  permanentAddress: string

  // Product and Terms
  documentPhotos: File[]
  comfortableMonthlyPayment: string
  purchasePrice: string
  downPayment: string
  installmentTerm: string
  monthlyPayment: string
  markupAmount: string
  partnerLocation: string
  convenientPaymentDate: string

  // Security Review (СБ)
  fsspInfo_sb: string
  getcontactInfo_sb: string
  purchasePurpose_sb: string
  referralSource_sb: string
  employmentInfo_sb: string
  additionalIncome_sb: string
  officialIncome_sb: string
  maritalStatus_sb: string
  childrenInfo_sb: string
  creditHistory_sb: string
  collateralInfo_sb: string
  housingInfo_sb: string
  additionalContact_sb: string
  relativesContactPermission_sb: string
  localFeedback_sb: string
  psychologicalAssessment_sb: string

  // Guarantor 1 (П1)
  responsibleAgent_p1: string
  fsspInfo_p1: string
  getcontactInfo_p1: string
  relationship_p1: string
  fullName_p1: string
  passportPhoto_p1: File[]
  phoneNumber_p1: string
  address_p1: string
  employmentIncome_p1: string
  maritalStatus_p1: string
  childrenInfo_p1: string
  additionalIncome_p1: string
  creditHistory_p1: string
  collateralInfo_p1: string
  housingInfo_p1: string
  isNewClient_p1: string
  psychologicalAssessment_p1: string
  additionalPhoneNumber_p1: string

  // Guarantor 2 (П2)
  fsspInfo_p2: string
  getcontactInfo_p2: string
  fullName_p2: string
  passportPhoto_p2: File[]
  phoneNumber_p2: string
  relationship_p2: string
  address_p2: string
  employmentIncome_p2: string
  maritalStatus_p2: string
  childrenInfo_p2: string
  creditHistory_p2: string
  additionalIncome_p2: string
  relativesContact_p2: string
  isNewClient_p2: string
  psychologicalAssessment_p2: string
  additionalPhoneNumber_p2: string

  // Final Docs
  contractDocuments: File[]

  // Consent
  consentToProcessData: boolean
}

export function InstallmentApplicationForm() {
  const router = useRouter()
  const [currentSection, setCurrentSection] = React.useState(0)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState<Partial<FormData>>({
    consentToProcessData: false,
  })

  const sections = [
    {
      id: 'clientPrimaryInfo',
      title: 'Основная информация (заполняет клиент)',
      description: 'Введите ваши основные данные',
    },
    {
      id: 'productAndTerms',
      title: 'Товар и условия рассрочки',
      description: 'Информация о товаре и условиях рассрочки',
    },
    {
      id: 'securityReview',
      title: 'Рассмотрение (СБ)',
      description: 'Информация для службы безопасности',
    },
    {
      id: 'guarantor1',
      title: 'Поручитель 1 (П1)',
      description: 'Информация о первом поручителе',
    },
    {
      id: 'guarantor2',
      title: 'Поручитель 2 (П2)',
      description: 'Информация о втором поручителе',
    },
    {
      id: 'finalDocs',
      title: 'ДКП и другие документы',
      description: 'Загрузите необходимые документы',
    },
    {
      id: 'consent',
      title: 'Согласие',
      description: 'Подтвердите согласие на обработку данных',
    },
  ]

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateMonthlyPayment = React.useCallback(() => {
    const price = parseFloat(formData.purchasePrice || '0')
    const down = parseFloat(formData.downPayment || '0')
    const term = parseFloat(formData.installmentTerm || '0')

    if (price > 0 && term > 0) {
      const remaining = price - down
      const monthly = remaining / term
      handleInputChange('monthlyPayment', monthly.toFixed(2))
    }
  }, [formData.purchasePrice, formData.downPayment, formData.installmentTerm])

  React.useEffect(() => {
    calculateMonthlyPayment()
  }, [calculateMonthlyPayment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.consentToProcessData) {
      setError('Необходимо дать согласие на обработку персональных данных')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // Prepare form data
      const submitData: any = { ...formData }

      // Handle file uploads (would need to be uploaded separately in production)
      // For now, just include file names
      if (formData.documentPhotos) {
        submitData.documentPhotos = formData.documentPhotos.map((f) => f.name)
      }

      const response = await fetch('/api/c/installment-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit application')
      }

      const data = await response.json()
      router.push(`/c/deals`)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const renderClientPrimaryInfo = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            Имя * <span className="text-muted-foreground">(только русские буквы)</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            pattern="^[А-Яа-яЁё\s-]+$"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Фамилия * <span className="text-muted-foreground">(только русские буквы)</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            pattern="^[А-Яа-яЁё\s-]+$"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Телефон *</Label>
        <Input
          id="phoneNumber"
          type="tel"
          value={formData.phoneNumber || ''}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          placeholder="+7 (___) ___-__-__"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productName">Наименование товара</Label>
        <Input
          id="productName"
          value={formData.productName || ''}
          onChange={(e) => handleInputChange('productName', e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="productPrice">Цена товара</Label>
          <Input
            id="productPrice"
            type="number"
            value={formData.productPrice || ''}
            onChange={(e) => handleInputChange('productPrice', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="purchaseLocation">Место покупки</Label>
          <Input
            id="purchaseLocation"
            value={formData.purchaseLocation || ''}
            onChange={(e) => handleInputChange('purchaseLocation', e.target.value)}
            placeholder="Название магазина или город"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="permanentAddress">Факт. постоянное место жительства *</Label>
        <Textarea
          id="permanentAddress"
          value={formData.permanentAddress || ''}
          onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
          required
          rows={3}
        />
      </div>
    </div>
  )

  const renderProductAndTerms = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentPhotos">Фото документов *</Label>
        <Input
          id="documentPhotos"
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            handleInputChange('documentPhotos', files as File[])
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comfortableMonthlyPayment">Комфортный ежемесячный платеж</Label>
        <Input
          id="comfortableMonthlyPayment"
          type="number"
          value={formData.comfortableMonthlyPayment || ''}
          onChange={(e) => handleInputChange('comfortableMonthlyPayment', e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Цена закупа (стоимость товара) *</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice || ''}
            onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="downPayment">Первый взнос *</Label>
          <Input
            id="downPayment"
            type="number"
            value={formData.downPayment || ''}
            onChange={(e) => handleInputChange('downPayment', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installmentTerm">Срок рассрочки (в мес.) *</Label>
          <Input
            id="installmentTerm"
            type="number"
            min="1"
            max="60"
            value={formData.installmentTerm || ''}
            onChange={(e) => handleInputChange('installmentTerm', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="monthlyPayment">Ежемесячный платеж *</Label>
          <Input
            id="monthlyPayment"
            type="number"
            value={formData.monthlyPayment || ''}
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="markupAmount">Наценка в руб.</Label>
          <Input
            id="markupAmount"
            type="number"
            value={formData.markupAmount || ''}
            readOnly
            className="bg-muted"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="partnerLocation">У какого партнера или где находится товар?</Label>
        <Input
          id="partnerLocation"
          value={formData.partnerLocation || ''}
          onChange={(e) => handleInputChange('partnerLocation', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="convenientPaymentDate">Удобная дата для оплаты (число месяца)</Label>
        <Input
          id="convenientPaymentDate"
          type="number"
          min="1"
          max="31"
          value={formData.convenientPaymentDate || ''}
          onChange={(e) => handleInputChange('convenientPaymentDate', e.target.value)}
        />
      </div>
    </div>
  )

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'clientPrimaryInfo':
        return renderClientPrimaryInfo()
      case 'productAndTerms':
        return renderProductAndTerms()
      case 'securityReview':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Эта секция заполняется службой безопасности
            </p>
            <div className="space-y-2">
              <Label htmlFor="fsspInfo_sb">Информация из ФССП, и других баз. 1 (СБ) *</Label>
              <Textarea
                id="fsspInfo_sb"
                value={formData.fsspInfo_sb || ''}
                onChange={(e) => handleInputChange('fsspInfo_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="getcontactInfo_sb">Информация из Гетконтакт (СБ) *</Label>
              <Textarea
                id="getcontactInfo_sb"
                value={formData.getcontactInfo_sb || ''}
                onChange={(e) => handleInputChange('getcontactInfo_sb', e.target.value)}
                rows={3}
              />
            </div>
            {/* Additional СБ fields can be added here */}
          </div>
        )
      case 'guarantor1':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleAgent_p1">Ответственный за рассмотрение (П1) *</Label>
              <Input
                id="responsibleAgent_p1"
                value={formData.responsibleAgent_p1 || ''}
                onChange={(e) => handleInputChange('responsibleAgent_p1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship_p1">Кем приходится клиенту? (П1) *</Label>
              <Input
                id="relationship_p1"
                value={formData.relationship_p1 || ''}
                onChange={(e) => handleInputChange('relationship_p1', e.target.value)}
              />
            </div>
            {/* Additional П1 fields can be added here */}
          </div>
        )
      case 'guarantor2':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Информация о втором поручителе</p>
            {/* П2 fields can be added here */}
          </div>
        )
      case 'finalDocs':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractDocuments">ДКП и другие документы</Label>
              <Input
                id="contractDocuments"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  handleInputChange('contractDocuments', files as File[])
                }}
              />
            </div>
          </div>
        )
      case 'consent':
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={formData.consentToProcessData || false}
                onCheckedChange={(checked) =>
                  handleInputChange('consentToProcessData', checked)
                }
              />
              <Label
                htmlFor="consent"
                className="text-sm leading-relaxed cursor-pointer">
                Нажимая кнопку «Отправить», я даю свое согласие на обработку моих персональных
                данных, в соответствии с Федеральным законом от 27.07.2006 года №152-ФЗ «О
                персональных данных», на условиях и для целей, определенных в Согласии на обработку
                персональных данных *
              </Label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {sections.map((section, index) => (
          <Card
            key={section.id}
            className={index === currentSection ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {(index === currentSection || index < currentSection) && renderSection(section.id)}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}>
          Назад
        </Button>
        {currentSection < sections.length - 1 ? (
          <Button
            type="button"
            onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}>
            Далее
          </Button>
        ) : (
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Отправка...
              </>
            ) : (
              'Отправить заявку'
            )}
          </Button>
        )}
      </div>
    </form>
  )
}


