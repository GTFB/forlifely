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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Loader2, ChevronDown } from 'lucide-react'

interface FormData {
  // Client Primary Info
  firstName: string
  lastName: string
  middleName: string
  phoneNumber: string
  email: string
  dateOfBirth: string
  placeOfBirth: string
  citizenship: string
  passportSeries: string
  passportNumber: string
  passportIssueDate: string
  passportIssuedBy: string
  passportDivisionCode: string
  inn: string
  snils: string
  maritalStatus: string
  numberOfChildren: string
  productName: string
  productPrice: string
  purchaseLocation: string
  permanentAddress: string
  registrationAddress: string

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
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    clientPrimaryInfo: true, // Первая секция открыта по умолчанию
  })

  const [formData, setFormData] = React.useState<Partial<FormData>>({
    consentToProcessData: false,
  })

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

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
        const data = await response.json() as { error?: string }
        throw new Error(data.error || 'Failed to submit application')
      }

      const data = await response.json() as { applicationId?: string }
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
      <h3 className="text-lg font-semibold">Личные данные</h3>
      
      <div className="grid gap-4 md:grid-cols-3">
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
          <Label htmlFor="middleName">
            Отчество <span className="text-muted-foreground">(только русские буквы)</span>
          </Label>
          <Input
            id="middleName"
            value={formData.middleName || ''}
            onChange={(e) => handleInputChange('middleName', e.target.value)}
            pattern="^[А-Яа-яЁё\s-]+$"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Дата рождения *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="placeOfBirth">Место рождения *</Label>
          <Input
            id="placeOfBirth"
            value={formData.placeOfBirth || ''}
            onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
            placeholder="Город, область"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="example@mail.ru"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="citizenship">Гражданство *</Label>
          <Input
            id="citizenship"
            value={formData.citizenship || ''}
            onChange={(e) => handleInputChange('citizenship', e.target.value)}
            placeholder="РФ"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maritalStatus">Семейное положение</Label>
          <Select
            value={formData.maritalStatus || ''}
            onValueChange={(value) => handleInputChange('maritalStatus', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите семейное положение" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Холост/не замужем</SelectItem>
              <SelectItem value="married">Женат/замужем</SelectItem>
              <SelectItem value="divorced">В разводе</SelectItem>
              <SelectItem value="widowed">Вдова/вдовец</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfChildren">Количество детей</Label>
        <Input
          id="numberOfChildren"
          type="number"
          min="0"
          value={formData.numberOfChildren || ''}
          onChange={(e) => handleInputChange('numberOfChildren', e.target.value)}
          placeholder="0"
        />
      </div>

      <h3 className="text-lg font-semibold mt-6">Паспортные данные</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="passportSeries">Серия паспорта *</Label>
          <Input
            id="passportSeries"
            value={formData.passportSeries || ''}
            onChange={(e) => handleInputChange('passportSeries', e.target.value)}
            placeholder="1234"
            maxLength={4}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passportNumber">Номер паспорта *</Label>
          <Input
            id="passportNumber"
            value={formData.passportNumber || ''}
            onChange={(e) => handleInputChange('passportNumber', e.target.value)}
            placeholder="567890"
            maxLength={6}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportIssueDate">Дата выдачи паспорта *</Label>
        <Input
          id="passportIssueDate"
          type="date"
          value={formData.passportIssueDate || ''}
          onChange={(e) => handleInputChange('passportIssueDate', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportIssuedBy">Кем выдан паспорт *</Label>
        <Textarea
          id="passportIssuedBy"
          value={formData.passportIssuedBy || ''}
          onChange={(e) => handleInputChange('passportIssuedBy', e.target.value)}
          placeholder="Наименование органа, выдавшего паспорт"
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passportDivisionCode">Код подразделения *</Label>
        <Input
          id="passportDivisionCode"
          value={formData.passportDivisionCode || ''}
          onChange={(e) => handleInputChange('passportDivisionCode', e.target.value)}
          placeholder="123-456"
          pattern="[0-9]{3}-[0-9]{3}"
          required
        />
      </div>

      <h3 className="text-lg font-semibold mt-6">Документы</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inn">ИНН</Label>
          <Input
            id="inn"
            value={formData.inn || ''}
            onChange={(e) => handleInputChange('inn', e.target.value)}
            placeholder="123456789012"
            maxLength={12}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snils">СНИЛС</Label>
          <Input
            id="snils"
            value={formData.snils || ''}
            onChange={(e) => handleInputChange('snils', e.target.value)}
            placeholder="123-456-789 12"
            maxLength={14}
          />
        </div>
      </div>

      <h3 className="text-lg font-semibold mt-6">Адреса</h3>

      <div className="space-y-2">
        <Label htmlFor="permanentAddress">Постоянное место жительства (прописка) *</Label>
        <Textarea
          id="permanentAddress"
          value={formData.permanentAddress || ''}
          onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
          placeholder="Полный адрес регистрации"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registrationAddress">Адрес фактического проживания</Label>
        <Textarea
          id="registrationAddress"
          value={formData.registrationAddress || ''}
          onChange={(e) => handleInputChange('registrationAddress', e.target.value)}
          placeholder="Полный адрес фактического проживания (если отличается от прописки)"
          rows={3}
        />
      </div>

      <h3 className="text-lg font-semibold mt-6">Информация о товаре</h3>

      <div className="space-y-2">
        <Label htmlFor="productName">Наименование товара</Label>
        <Input
          id="productName"
          value={formData.productName || ''}
          onChange={(e) => handleInputChange('productName', e.target.value)}
          placeholder="Название товара"
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
            placeholder="0"
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="getcontactInfo_sb">Информация из Гетконтакт (СБ) *</Label>
              <Textarea
                id="getcontactInfo_sb"
                value={formData.getcontactInfo_sb || ''}
                onChange={(e) => handleInputChange('getcontactInfo_sb', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePurpose_sb">Цель покупки товара (СБ)</Label>
              <Textarea
                id="purchasePurpose_sb"
                value={formData.purchasePurpose_sb || ''}
                onChange={(e) => handleInputChange('purchasePurpose_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referralSource_sb">От кого перешли по ссылке (СБ)</Label>
              <Textarea
                id="referralSource_sb"
                value={formData.referralSource_sb || ''}
                onChange={(e) => handleInputChange('referralSource_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentInfo_sb">Место работы (организация), должность и стаж на текущем месте (СБ) *</Label>
              <Textarea
                id="employmentInfo_sb"
                value={formData.employmentInfo_sb || ''}
                onChange={(e) => handleInputChange('employmentInfo_sb', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalIncome_sb">Пенсии, выплаты и другие доп. доходы (СБ)</Label>
              <Textarea
                id="additionalIncome_sb"
                value={formData.additionalIncome_sb || ''}
                onChange={(e) => handleInputChange('additionalIncome_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="officialIncome_sb">Официальное трудоустройство и сумма доходов по отдельности (СБ) *</Label>
              <Textarea
                id="officialIncome_sb"
                value={formData.officialIncome_sb || ''}
                onChange={(e) => handleInputChange('officialIncome_sb', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus_sb">Семейное положение клиента (СБ) *</Label>
              <Select
                value={formData.maritalStatus_sb || ''}
                onValueChange={(value) => handleInputChange('maritalStatus_sb', value)}
                required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите семейное положение" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="married">Женат/замужем</SelectItem>
                  <SelectItem value="single">Холост/не замужем</SelectItem>
                  <SelectItem value="divorced">В разводе</SelectItem>
                  <SelectItem value="widowed">Вдова/вдовец</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="childrenInfo_sb">Дети (количество детей) клиента и их возраст (в диапазоне 0-10-20-30 лет) (СБ)</Label>
              <Textarea
                id="childrenInfo_sb"
                value={formData.childrenInfo_sb || ''}
                onChange={(e) => handleInputChange('childrenInfo_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditHistory_sb">Имеются ли действующие кредиты/рассрочки? Где? Суммы платежей? А до этого были? (СБ) *</Label>
              <Textarea
                id="creditHistory_sb"
                value={formData.creditHistory_sb || ''}
                onChange={(e) => handleInputChange('creditHistory_sb', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collateralInfo_sb">Есть ли имущество, чтобы при необходимости использовать в качестве залога? (СБ)</Label>
              <Textarea
                id="collateralInfo_sb"
                value={formData.collateralInfo_sb || ''}
                onChange={(e) => handleInputChange('collateralInfo_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="housingInfo_sb">Имеется ли собственное жилье? Или съемное, или с родителями? (СБ)</Label>
              <Textarea
                id="housingInfo_sb"
                value={formData.housingInfo_sb || ''}
                onChange={(e) => handleInputChange('housingInfo_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalContact_sb">Дополнительный номер (СБ) *</Label>
              <Input
                id="additionalContact_sb"
                type="tel"
                value={formData.additionalContact_sb || ''}
                onChange={(e) => handleInputChange('additionalContact_sb', e.target.value)}
                placeholder="+7 (___) ___-__-__"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relativesContactPermission_sb">Готовы ли предоставить контактный номер родителей, брата или сестры до 40 лет? (СБ)</Label>
              <Textarea
                id="relativesContactPermission_sb"
                value={formData.relativesContactPermission_sb || ''}
                onChange={(e) => handleInputChange('relativesContactPermission_sb', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localFeedback_sb">Информация от других людей с местности клиента. (У кого спросили, что сказали, дословно) (СБ) *</Label>
              <Textarea
                id="localFeedback_sb"
                value={formData.localFeedback_sb || ''}
                onChange={(e) => handleInputChange('localFeedback_sb', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="psychologicalAssessment_sb">Психологическая оценка клиента (подробный текст) (СБ) *</Label>
              <Textarea
                id="psychologicalAssessment_sb"
                value={formData.psychologicalAssessment_sb || ''}
                onChange={(e) => handleInputChange('psychologicalAssessment_sb', e.target.value)}
                rows={5}
                required
              />
            </div>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fsspInfo_p1">Информация из ФССП, и других баз 2 (П1) *</Label>
              <Textarea
                id="fsspInfo_p1"
                value={formData.fsspInfo_p1 || ''}
                onChange={(e) => handleInputChange('fsspInfo_p1', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="getcontactInfo_p1">Информация из Гетконтакт (П1) *</Label>
              <Textarea
                id="getcontactInfo_p1"
                value={formData.getcontactInfo_p1 || ''}
                onChange={(e) => handleInputChange('getcontactInfo_p1', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship_p1">Кем приходится клиенту? (П1) *</Label>
              <Input
                id="relationship_p1"
                value={formData.relationship_p1 || ''}
                onChange={(e) => handleInputChange('relationship_p1', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName_p1">ФИО поручителя (П1)</Label>
              <Input
                id="fullName_p1"
                value={formData.fullName_p1 || ''}
                onChange={(e) => handleInputChange('fullName_p1', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportPhoto_p1">Фото паспорта (П1)</Label>
              <Input
                id="passportPhoto_p1"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  handleInputChange('passportPhoto_p1', files as File[])
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber_p1">Номер телефона поручителя (спросить есть ли еще номер) (П1)</Label>
              <Input
                id="phoneNumber_p1"
                type="tel"
                value={formData.phoneNumber_p1 || ''}
                onChange={(e) => handleInputChange('phoneNumber_p1', e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_p1">Фактическое место жительства (П1) *</Label>
              <Textarea
                id="address_p1"
                value={formData.address_p1 || ''}
                onChange={(e) => handleInputChange('address_p1', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentIncome_p1">Офиц. трудоустройство и сумма доходов отдельно (П1)</Label>
              <Textarea
                id="employmentIncome_p1"
                value={formData.employmentIncome_p1 || ''}
                onChange={(e) => handleInputChange('employmentIncome_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus_p1">Семейное положение поручителя (П1) *</Label>
              <Input
                id="maritalStatus_p1"
                value={formData.maritalStatus_p1 || ''}
                onChange={(e) => handleInputChange('maritalStatus_p1', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childrenInfo_p1">Дети (количество детей) клиента и их возраст (в диапазоне 0-10-20-30 лет) (П1)</Label>
              <Textarea
                id="childrenInfo_p1"
                value={formData.childrenInfo_p1 || ''}
                onChange={(e) => handleInputChange('childrenInfo_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalIncome_p1">Пенсии, выплаты и другие доп. доходы (П1) *</Label>
              <Textarea
                id="additionalIncome_p1"
                value={formData.additionalIncome_p1 || ''}
                onChange={(e) => handleInputChange('additionalIncome_p1', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditHistory_p1">Имеются ли действующие кредиты/рассрочки? Где? Суммы платежей? А до этого были? (П1)</Label>
              <Textarea
                id="creditHistory_p1"
                value={formData.creditHistory_p1 || ''}
                onChange={(e) => handleInputChange('creditHistory_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collateralInfo_p1">Есть ли имущество, чтобы при необходимости использовать в качестве залога? (П1)</Label>
              <Textarea
                id="collateralInfo_p1"
                value={formData.collateralInfo_p1 || ''}
                onChange={(e) => handleInputChange('collateralInfo_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="housingInfo_p1">Имеется ли собственное жилье? Или съемное, или с родителями? (П1)</Label>
              <Textarea
                id="housingInfo_p1"
                value={formData.housingInfo_p1 || ''}
                onChange={(e) => handleInputChange('housingInfo_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isNewClient_p1">Клиент новый? Если нет, то какая оценка клиента в базе Эснад? (П1)</Label>
              <Textarea
                id="isNewClient_p1"
                value={formData.isNewClient_p1 || ''}
                onChange={(e) => handleInputChange('isNewClient_p1', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="psychologicalAssessment_p1">Психологическая оценка клиента (подробный текст) (П1)</Label>
              <Textarea
                id="psychologicalAssessment_p1"
                value={formData.psychologicalAssessment_p1 || ''}
                onChange={(e) => handleInputChange('psychologicalAssessment_p1', e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalPhoneNumber_p1">Имеется ли доп. номер (П1)</Label>
              <Input
                id="additionalPhoneNumber_p1"
                type="tel"
                value={formData.additionalPhoneNumber_p1 || ''}
                onChange={(e) => handleInputChange('additionalPhoneNumber_p1', e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
          </div>
        )
      case 'guarantor2':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Информация о втором поручителе</p>
            <div className="space-y-2">
              <Label htmlFor="fsspInfo_p2">Информация из ФССП, и других баз. 3 (П2)</Label>
              <Textarea
                id="fsspInfo_p2"
                value={formData.fsspInfo_p2 || ''}
                onChange={(e) => handleInputChange('fsspInfo_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="getcontactInfo_p2">Информация из Гетконтакт (П2)</Label>
              <Textarea
                id="getcontactInfo_p2"
                value={formData.getcontactInfo_p2 || ''}
                onChange={(e) => handleInputChange('getcontactInfo_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName_p2">ФИО поручителя 2 (П2)</Label>
              <Input
                id="fullName_p2"
                value={formData.fullName_p2 || ''}
                onChange={(e) => handleInputChange('fullName_p2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passportPhoto_p2">Фото паспорта (П2)</Label>
              <Input
                id="passportPhoto_p2"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  handleInputChange('passportPhoto_p2', files as File[])
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber_p2">Номер телефона поручителя 2 (П2)</Label>
              <Input
                id="phoneNumber_p2"
                type="tel"
                value={formData.phoneNumber_p2 || ''}
                onChange={(e) => handleInputChange('phoneNumber_p2', e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship_p2">Кем приходится клиенту? (П2)</Label>
              <Input
                id="relationship_p2"
                value={formData.relationship_p2 || ''}
                onChange={(e) => handleInputChange('relationship_p2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_p2">Фактическое место жительства 2 (П2)</Label>
              <Textarea
                id="address_p2"
                value={formData.address_p2 || ''}
                onChange={(e) => handleInputChange('address_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentIncome_p2">Офиц. трудоустройство и суммы доходов отдельно (П2) *</Label>
              <Textarea
                id="employmentIncome_p2"
                value={formData.employmentIncome_p2 || ''}
                onChange={(e) => handleInputChange('employmentIncome_p2', e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus_p2">Семейное положение 2 (П2)</Label>
              <Input
                id="maritalStatus_p2"
                value={formData.maritalStatus_p2 || ''}
                onChange={(e) => handleInputChange('maritalStatus_p2', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childrenInfo_p2">Дети, количество, их возраст (П2)</Label>
              <Textarea
                id="childrenInfo_p2"
                value={formData.childrenInfo_p2 || ''}
                onChange={(e) => handleInputChange('childrenInfo_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditHistory_p2">Имеются ли действующие кредиты,рассрочки? Где? суммы платежей? А до этого были? (П2)</Label>
              <Textarea
                id="creditHistory_p2"
                value={formData.creditHistory_p2 || ''}
                onChange={(e) => handleInputChange('creditHistory_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalIncome_p2">Пенсии, выплаты, другие доп. доходы (П2)</Label>
              <Textarea
                id="additionalIncome_p2"
                value={formData.additionalIncome_p2 || ''}
                onChange={(e) => handleInputChange('additionalIncome_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relativesContact_p2">Номер родителей, брата (П2)</Label>
              <Input
                id="relativesContact_p2"
                type="tel"
                value={formData.relativesContact_p2 || ''}
                onChange={(e) => handleInputChange('relativesContact_p2', e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isNewClient_p2">Клиент новый? Если нет, то какая оценка в нашей базе? (П2)</Label>
              <Textarea
                id="isNewClient_p2"
                value={formData.isNewClient_p2 || ''}
                onChange={(e) => handleInputChange('isNewClient_p2', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="psychologicalAssessment_p2">Психологическая оценка и другое описание (П2)</Label>
              <Textarea
                id="psychologicalAssessment_p2"
                value={formData.psychologicalAssessment_p2 || ''}
                onChange={(e) => handleInputChange('psychologicalAssessment_p2', e.target.value)}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additionalPhoneNumber_p2">Имеется ли доп. номер? (П2)</Label>
              <Input
                id="additionalPhoneNumber_p2"
                type="tel"
                value={formData.additionalPhoneNumber_p2 || ''}
                onChange={(e) => handleInputChange('additionalPhoneNumber_p2', e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>
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
          <Collapsible
            key={section.id}
            open={openSections[section.id] || false}
            onOpenChange={() => toggleSection(section.id)}>
            <Card className={index === currentSection ? 'border-primary' : ''}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle>{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                        openSections[section.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>{renderSection(section.id)}</CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
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


