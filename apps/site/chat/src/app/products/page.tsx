"use client"

import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/Container"

interface Product {
  id: number
  uuid: string
  paid: string
  title: string | Record<string, any> | null
  category: string | null
  type: string | null
  status_name: string | null
  is_public: number | null
  order: number | null
  created_at: string
  updated_at: string
}

interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

function getProductTitle(product: Product): string {
  if (!product.title) return "No title"
  
  if (typeof product.title === "string") {
    try {
      const parsed = JSON.parse(product.title)
      if (typeof parsed === "object" && parsed !== null) {
        return parsed.en || parsed.ru || parsed.title || "No title"
      }
      return parsed
    } catch {
      return product.title
    }
  }
  
  if (typeof product.title === "object" && product.title !== null) {
    const titleObj = product.title as Record<string, any>
    return titleObj.en || titleObj.ru || titleObj.title || "No title"
  }
  
  return String(product.title)
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })

  const fetchProducts = React.useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/products?page=${page}&pageSize=${pagination.pageSize}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load products: ${response.status}`)
      }
      
      const data: ProductsResponse = await response.json()
      
      if (data.success) {
        setProducts(data.data)
        setPagination(data.pagination)
      } else {
        const errorMessage = (data as any).error || "Failed to load products"
        throw new Error(errorMessage)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageSize])

  React.useEffect(() => {
    fetchProducts(1)
  }, [])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchProducts(newPage)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Products</h1>
        <p className="text-muted-foreground">
          Total products: {loading ? "..." : pagination.total}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            className="mt-2 px-4 py-2 text-sm border border-red-300 dark:border-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            onClick={() => fetchProducts(pagination.page)}
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 bg-card">
              <div className="h-6 bg-muted rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-full mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found</p>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-6 bg-card hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                    {getProductTitle(product)}
                  </h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {product.category && (
                      <p>
                        <span className="font-medium">Category:</span> {product.category}
                      </p>
                    )}
                    {product.type && (
                      <p>
                        <span className="font-medium">Type:</span> {product.type}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    {product.status_name && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Status:</span> {product.status_name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono">
                      ID: {product.uuid}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString("en-US")}
                    </span>
                    <Link
                      href={`/products/${product.id}`}
                      className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground px-4">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Container>
  )
}

