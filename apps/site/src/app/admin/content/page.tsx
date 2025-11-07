'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export default function AdminContentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'blog'
  const [blogPosts, setBlogPosts] = React.useState<ContentItem[]>([])
  const [pages, setPages] = React.useState<ContentItem[]>([])
  const [faqs, setFaqs] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoints
        // const [blogRes, pagesRes, faqRes] = await Promise.all([
        //   fetch('/api/admin/content/blog', { credentials: 'include' }),
        //   fetch('/api/admin/content/pages', { credentials: 'include' }),
        //   fetch('/api/admin/content/faq', { credentials: 'include' }),
        // ])
        
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
          setPages([
            {
              id: 'page-1',
              title: 'О компании',
              slug: 'about',
              status: 'published',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'page-2',
              title: 'Контакты',
              slug: 'contacts',
              status: 'published',
              createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ])
          setFaqs([
            {
              id: 'faq-1',
              title: 'Как быстро одобряется заявка?',
              slug: 'kak-bystro-odobryaetsya-zayavka',
              status: 'published',
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'faq-2',
              title: 'Какие документы нужны?',
              slug: 'kakie-dokumenty-nuzhny',
              status: 'published',
              createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'blog':
        return blogPosts
      case 'pages':
        return pages
      case 'faq':
        return faqs
      default:
        return []
    }
  }

  const handleAddNew = () => {
    router.push(`/admin/content/${activeTab}/new`)
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Управление контентом" />
        <main className="flex-1 overflow-y-auto">
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
        <AdminHeader title="Управление контентом" />
        <main className="flex-1 overflow-y-auto">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Управление контентом" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Управление контентом</h1>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить новую запись
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => router.push(`/admin/content?tab=${value}`)}>
          <TabsList>
            <TabsTrigger value="blog">Блог</TabsTrigger>
            <TabsTrigger value="pages">Страницы</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          <TabsContent value="blog" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Страницы</CardTitle>
              </CardHeader>
              <CardContent>
                {pages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Нет страниц
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
                      {pages.map((page) => (
                        <TableRow
                          key={page.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/content/pages/${page.id}`)}>
                          <TableCell className="font-medium">{page.title}</TableCell>
                          <TableCell className="text-muted-foreground">{page.slug}</TableCell>
                          <TableCell>
                            <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                              {page.status === 'published' ? 'Опубликовано' : 'Черновик'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(page.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(page.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Нет вопросов
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Вопрос</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата создания</TableHead>
                        <TableHead>Обновлено</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faqs.map((faq) => (
                        <TableRow
                          key={faq.id}
                          className="cursor-pointer"
                          onClick={() => router.push(`/admin/content/faq/${faq.id}`)}>
                          <TableCell className="font-medium">{faq.title}</TableCell>
                          <TableCell className="text-muted-foreground">{faq.slug}</TableCell>
                          <TableCell>
                            <Badge variant={faq.status === 'published' ? 'default' : 'secondary'}>
                              {faq.status === 'published' ? 'Опубликовано' : 'Черновик'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(faq.createdAt)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(faq.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
    </>
  )
}

