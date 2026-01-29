'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Camera, Heart, Share2, ShoppingCart, Star, Info, Package, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseProductTitle, extractImages, extractPrice } from '@/lib/product-utils'
import { useCart } from '@/contexts/CartContext'
import { Container } from '@/components/Container'

interface Product {
  id: number
  uuid: string
  title: string | Record<string, any> | null
  category: string | null
  type: string | null
  variants?: any[]
}

interface ProductResponse {
  success: boolean
  data: Product & { variants?: any[] }
}

const RatingStars = ({ rating = 4.6, className }: { rating?: number; className?: string }) => (
  <div className={cn('flex items-center gap-0.5', className)}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          'size-4',
          i < Math.floor(rating) ? 'fill-foreground text-foreground' : 'text-foreground'
        )}
      />
    ))}
    <span className="ml-2 text-sm font-medium">{rating}</span>
  </div>
)

export function ProductDetail() {
  const params = useParams()
  const productId = params?.id as string
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return

      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/products/${productId}`)
        const data: ProductResponse = await response.json()

        if (data.success && data.data) {
          setProduct(data.data)
          if (data.data.variants && data.data.variants.length > 0) {
            setSelectedVariant(data.data.variants[0])
          }
        } else {
          setError('Товар не найден')
        }
      } catch (err) {
        console.error('Failed to fetch product:', err)
        setError('Не удалось загрузить товар')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const images = selectedVariant ? extractImages(selectedVariant.data_in) : []
  const price = selectedVariant ? extractPrice(selectedVariant.data_in) : null
  const title = product ? parseProductTitle(product.title) : ''

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      productData: product,
      variantData: selectedVariant,
      quantity: 1,
    })
  }

  if (loading) {
    return (
      <section className="py-12">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2">
            <div className="aspect-square bg-muted rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-10 bg-muted rounded w-full animate-pulse" />
            </div>
          </div>
        </Container>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="py-12">
        <Container>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">{error || 'Товар не найден'}</p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-12">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div>
            <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
              {images.length > 0 ? (
                <>
                  <img
                    alt={title}
                    className="size-full object-cover"
                    src={images[selectedImageIndex] || images[0]}
                  />
                  {product.category && (
                    <Badge className="absolute top-4 left-4 border-transparent bg-orange-500 text-white hover:bg-orange-600">
                      {product.category}
                    </Badge>
                  )}
                  {images.length > 1 && (
                    <div className="absolute right-4 bottom-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur-sm">
                      <Camera className="mr-1 inline size-4" />
                      {images.length} фото
                    </div>
                  )}
                </>
              ) : (
                <div className="size-full flex items-center justify-center text-muted-foreground">
                  Нет изображения
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      'relative aspect-square size-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 p-0 transition-all',
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary/20 shadow-md'
                        : 'border-muted hover:border-muted-foreground/50'
                    )}
                    aria-label={`Показать изображение ${index + 1} из ${title}`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img alt={`${title} ${index + 1}`} className="size-full object-cover" src={image} />
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl leading-tight font-bold text-balance">{title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <RatingStars rating={4.6} />
                </div>
                <span className="text-muted-foreground text-sm">3 отзыва</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground text-sm">SKU: {product.uuid.slice(0, 8)}</span>
              </div>
            </div>

            {price !== null && (
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">${price.toFixed(2)}</span>
              </div>
            )}

            <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 dark:bg-green-950/50">
              <div className="size-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">В наличии</span>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Продвинутая камера безопасности для умного дома с обнаружением движения на основе ИИ, четким видео 4K и интеграцией с умным домом.
            </p>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 1 && (
              <div className="space-y-4">
                <div className="font-semibold">Выберите вариант</div>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const variantTitle = parseProductTitle(variant.title) || `Вариант ${variant.id}`
                    const isSelected = selectedVariant?.id === variant.id
                    return (
                      <Button
                        key={variant.id}
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedVariant(variant)
                          setSelectedImageIndex(0)
                        }}
                      >
                        {variantTitle}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button size="lg" className="h-12 w-full gap-2" onClick={handleAddToCart} disabled={!selectedVariant}>
                <ShoppingCart className="size-5" />
                Добавить в корзину
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" size="lg" className="h-12 flex-1 gap-2">
                  <Heart className="size-5" />
                  Сохранить
                </Button>
                <Button variant="outline" size="lg" className="h-12 flex-1 gap-2">
                  <Share2 className="size-5" />
                  Поделиться
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid h-12 w-full grid-cols-4 rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="overview" className="h-10 gap-2 text-sm">
                <Info className="size-4" />
                Обзор
              </TabsTrigger>
              <TabsTrigger value="specs" className="h-10 gap-2 text-sm">
                <Package className="size-4" />
                Характеристики
              </TabsTrigger>
              <TabsTrigger value="reviews" className="h-10 gap-2 text-sm">
                <MessageSquare className="size-4" />
                Отзывы (3)
              </TabsTrigger>
              <TabsTrigger value="gallery" className="h-10 gap-2 text-sm">
                <Camera className="size-4" />
                Галерея
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-8">
              <Card className="shadow-none">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-balance">Ключевые особенности</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Разрешение 4K Ultra HD</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Обнаружение движения на основе ИИ</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Технология ночного видения</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Двусторонняя аудиосвязь</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Защита от погодных условий (IP65)</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Интеграция с умным домом</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Облачное и локальное хранилище</span>
                    </div>
                    <div className="group flex items-center gap-3">
                      <div className="bg-primary/20 size-2 rounded-full transition-colors" />
                      <span className="text-sm">Управление через мобильное приложение</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="specs" className="mt-8">
              <Card className="shadow-none">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-balance">Характеристики</h3>
                  <p className="text-muted-foreground">Характеристики будут указаны здесь.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-8">
              <Card className="shadow-none">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-balance">Отзывы</h3>
                  <p className="text-muted-foreground">Отзывы покупателей будут показаны здесь.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="gallery" className="mt-8">
              <Card className="shadow-none">
                <CardContent className="p-8">
                  <h3 className="mb-6 text-xl font-semibold text-balance">Галерея изображений</h3>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {images.map((image, index) => (
                        <div key={index} className="aspect-square overflow-hidden rounded-lg">
                          <img src={image} alt={`${title} ${index + 1}`} className="size-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Изображения недоступны</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Container>
    </section>
  )
}



