'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { useRouter } from 'next/navigation'

interface ContentItem {
  id: string
  title: string
  slug: string
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}

export default function AdminBlogPage() {
  const router = useRouter()
  const [blogPosts, setBlogPosts] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/content/blog', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setBlogPosts([
            {
              id: 'post-1',
              title: 'Как оформить рассрочку',
              slug: 'kak-oformit-rassrochku',
              status: 'published',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'post-2',
              title: 'Преимущества рассрочки',
              slug: 'preimushchestva-rassrochki',
              status: 'published',
              createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'post-3',
              title: 'Новые условия кредитования',
              slug: 'novye-usloviya-kreditovaniya',
              status: 'draft',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Content fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load content')
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const handleAddNew = () => {
    router.push('/admin/content/blog/new')
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Блог" />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Блог" />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Блог" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Статьи блога</h1>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить новую статью
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Статьи блога</CardTitle>
            </CardHeader>
            <CardContent>
              {blogPosts.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Нет статей
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead>Обновлено</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogPosts.map((post) => (
                      <TableRow
                        key={post.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/content/blog/${post.id}`)}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="text-muted-foreground">{post.slug}</TableCell>
                        <TableCell>
                          <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                            {post.status === 'published' ? 'Опубликовано' : 'Черновик'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(post.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}

