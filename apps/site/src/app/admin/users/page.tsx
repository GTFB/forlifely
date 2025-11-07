'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Search, MoreHorizontal, Loader2, Download } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  type: 'Human' | 'Contractor'
  status: 'active' | 'blocked'
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/users', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setUsers([
            {
              id: 'user-1',
              name: 'Иванов Иван Иванович',
              email: 'ivanov@example.com',
              type: 'Human',
              status: 'active',
              createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'user-2',
              name: 'Петрова Мария Сергеевна',
              email: 'petrova@example.com',
              type: 'Human',
              status: 'active',
              createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'user-3',
              name: 'ООО "Магазин Электроники"',
              email: 'shop@example.com',
              type: 'Contractor',
              status: 'active',
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'user-4',
              name: 'Сидоров Петр Александрович',
              email: 'sidorov@example.com',
              type: 'Human',
              status: 'blocked',
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 'user-5',
              name: 'ИП Козлова Анна Дмитриевна',
              email: 'kozlova@example.com',
              type: 'Contractor',
              status: 'active',
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            // Add more mock users...
            ...Array.from({ length: 15 }, (_, i) => ({
              id: `user-${i + 6}`,
              name: `Пользователь ${i + 6}`,
              email: `user${i + 6}@example.com`,
              type: (i % 2 === 0 ? 'Human' : 'Contractor') as 'Human' | 'Contractor',
              status: (i % 3 === 0 ? 'blocked' : 'active') as 'active' | 'blocked',
              createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
            })),
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Users fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load users')
        setLoading(false)
      }
    }

    fetchUsers()
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)))
    } else {
      setSelectedUsers(new Set())
    }
  }

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers)
    if (checked) {
      newSelected.add(userId)
    } else {
      newSelected.delete(userId)
    }
    setSelectedUsers(newSelected)
  }

  const handleBlock = async (userId: string) => {
    // TODO: Implement block API
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, status: 'blocked' as const } : user
      )
    )
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Пользователи" />
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
        <AdminHeader title="Пользователи" />
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
      <AdminHeader title="Пользователи" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Пользователи</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Действия
                  <MoreHorizontal className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Массовые действия</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Экспорт
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Нет пользователей
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Имя</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата регистрации</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>Редактировать</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/deals?search=${user.email}`}>
                                Посмотреть сделки
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleBlock(user.id)}
                              className="text-destructive">
                              Заблокировать
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

