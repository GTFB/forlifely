'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  minAmount: number
  expectedReturn: number
  term: string
}

export default function InvestorProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/i/products', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setProducts([
            {
              id: '1',
              name: 'Консервативный портфель',
              description: 'Низкий риск, стабильный доход',
              minAmount: 100000,
              expectedReturn: 8,
              term: '12 месяцев',
            },
            {
              id: '2',
              name: 'Сбалансированный портфель',
              description: 'Средний риск, оптимальная доходность',
              minAmount: 200000,
              expectedReturn: 12,
              term: '24 месяца',
            },
            {
              id: '3',
              name: 'Агрессивный портфель',
              description: 'Высокий риск, максимальная доходность',
              minAmount: 500000,
              expectedReturn: 18,
              term: '36 месяцев',
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Products fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load products')
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleInvest = (productId: string) => {
    // TODO: Navigate to investment form
    console.log('Invest in product:', productId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Продукты</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Минимальная сумма:</span>
                <span className="font-medium">{formatCurrency(product.minAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ожидаемая доходность:</span>
                <span className="font-medium">{product.expectedReturn}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Срок:</span>
                <span className="font-medium">{product.term}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleInvest(product.id)}>
                Инвестировать
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

