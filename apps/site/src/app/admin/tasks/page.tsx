'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  closestCorners,
} from '@dnd-kit/core'
import {
  useDroppable,
} from '@dnd-kit/core'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Loader2, Plus, GripVertical } from 'lucide-react'
import { AdminHeader } from '@/components/admin/AdminHeader'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrentUser, TaskApi, TaskAssignee, TaskPriority, TaskStatus } from '@/shared/types/tasks'

type Task = TaskApi & { id: string; date: string }

const statusColumns = [
  { id: 'todo', title: 'К выполнению' },
  { id: 'in-progress', title: 'В работе' },
  { id: 'done', title: 'Выполнено' },
]

const mapApiTask = (task: TaskApi): Task => ({
  id: task.uuid,
  uuid: task.uuid,
  title: task.title,
  clientLink: task.clientLink || '',
  priority: task.priority || 'medium',
  assignee: {
    uuid: task.assignee?.uuid,
    name: task.assignee?.name || 'Не назначен',
    avatar: task.assignee?.avatar ?? null,
  },
  date: task.updatedAt || task.createdAt || new Date().toISOString(),
  status: task.status || 'todo',
})

const assigneeKey = (assignee: TaskAssignee): string => assignee.uuid || assignee.name

function DroppableColumn({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[300px] rounded-lg border-2 p-4 transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  )
}

function DraggableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Высокий'
      case 'medium':
        return 'Средний'
      case 'low':
        return 'Низкий'
      default:
        return priority
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-move hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{task.title}</CardTitle>
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <CardDescription className="text-xs">
          <Link href={task.clientLink || '#'} className="text-primary hover:underline">
            {task.clientLink}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
            {getPriorityLabel(task.priority)}
          </Badge>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar || undefined} alt={task.assignee.name} />
              <AvatarFallback className="text-xs">
                {task.assignee.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(task.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </CardContent>
    </Card>
  )
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [currentUser, setCurrentUser] = React.useState<CurrentUser | null>(null)
  const [assignees, setAssignees] = React.useState<TaskAssignee[]>([])
  const [managerFilter, setManagerFilter] = React.useState<string>('all')
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: '',
    clientLink: '',
    priority: 'medium' as TaskPriority,
    assigneeUuid: '',
    status: 'todo' as TaskStatus,
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)

        const meResponse = await fetch('/api/auth/me', { credentials: 'include' })
        if (!meResponse.ok) {
          throw new Error('Не удалось загрузить пользователя')
        }
        const meData = (await meResponse.json()) as {
          user: { uuid: string; name?: string; email?: string; roles?: { name?: string }[] }
        }
        const roles = meData.user.roles || []
        const isAdmin = roles.some((role) => role?.name === 'Administrator' || role?.name === 'admin')
        const me: CurrentUser = {
          uuid: meData.user.uuid,
          name: meData.user.name || meData.user.email || 'Пользователь',
          roles,
          isAdmin,
        }
        setCurrentUser(me)
        if (!isAdmin) {
          setManagerFilter(me.uuid)
          setFormData((prev) => ({ ...prev, assigneeUuid: prev.assigneeUuid || me.uuid }))
        }

        const [tasksResponse, assigneesResponse] = await Promise.all([
          fetch('/api/esnad/v1/admin/tasks', { credentials: 'include' }),
          fetch('/api/esnad/v1/admin/tasks/assignees', { credentials: 'include' }),
        ])

        const tasksPayload = await tasksResponse.json().catch(() => null)
        const assigneesPayload = await assigneesResponse.json().catch(() => null)

        if (!tasksResponse.ok) {
          const message =
            (tasksPayload as { message?: string })?.message || 'Не удалось загрузить задачи'
          throw new Error(message)
        }

        if (assigneesResponse.ok && (assigneesPayload as { assignees?: TaskAssignee[] }).assignees) {
          const apiAssignees = (assigneesPayload as { assignees: TaskAssignee[] }).assignees
          const merged = [...apiAssignees]
          if (!merged.some((a) => a.uuid === me.uuid)) {
            merged.push({ uuid: me.uuid, name: me.name })
          }
          setAssignees(merged)
          if (isAdmin) {
            setFormData((prev) => ({
              ...prev,
              assigneeUuid: prev.assigneeUuid || merged[0]?.uuid || me.uuid,
            }))
          }
        } else {
          setAssignees([{ uuid: me.uuid, name: me.name }])
        }

        const payload = tasksPayload as { tasks?: TaskApi[] }
        setTasks((payload.tasks || []).map(mapApiTask))
      } catch (err) {
        console.error('Tasks fetch error:', err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить задачи')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  React.useEffect(() => {
    if (currentUser && !formData.assigneeUuid) {
      setFormData((prev) => ({ ...prev, assigneeUuid: currentUser.uuid }))
    }
  }, [currentUser, formData.assigneeUuid])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string

    if (statusColumns.some((col) => col.id === newStatus)) {
      const previousTasks = tasks
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
        )
      )

      try {
        const response = await fetch(`/api/esnad/v1/admin/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok) {
          const message =
            (payload as { message?: string; error?: string })?.message ||
            (payload as { message?: string; error?: string })?.error ||
            'Не удалось обновить статус задачи'
          throw new Error(message)
        }
        if ((payload as { task?: TaskApi }).task) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId ? mapApiTask((payload as { task: TaskApi }).task) : task
            )
          )
        }
      } catch (err) {
        console.error('Task update error:', err)
        setError(err instanceof Error ? err.message : 'Не удалось обновить статус задачи')
        setTasks(previousTasks)
      }
    }

    setActiveId(null)
  }

  const assigneeOptions = React.useMemo(() => {
    const map = new Map<string, TaskAssignee>()
    assignees.forEach((assignee) => {
      const key = assigneeKey(assignee)
      if (!map.has(key)) {
        map.set(key, assignee)
      }
    })
    if (currentUser) {
      const key = currentUser.uuid || currentUser.name
      if (!map.has(key)) {
        map.set(key, { uuid: currentUser.uuid, name: currentUser.name })
      }
    }
    return Array.from(map.values())
  }, [assignees, currentUser])

  const filteredTasks = tasks.filter((task) => {
    if (managerFilter === 'all') return true
    return assigneeKey(task.assignee) === managerFilter
  })

  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === 'todo'),
    'in-progress': filteredTasks.filter((task) => task.status === 'in-progress'),
    done: filteredTasks.filter((task) => task.status === 'done'),
  }

  const activeTask = tasks.find((task) => task.id === activeId)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      setError('Не удалось определить пользователя')
      return
    }
    try {
      setSubmitting(true)
      setError(null)

      const selectedAssignee = assigneeOptions.find(
        (option) => assigneeKey(option) === (formData.assigneeUuid || currentUser.uuid)
      )
      const assigneeUuid = currentUser.isAdmin
        ? selectedAssignee?.uuid || currentUser.uuid
        : currentUser.uuid

      const response = await fetch('/api/esnad/v1/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          clientLink: formData.clientLink || undefined,
          priority: formData.priority,
          status: formData.status,
          assigneeUuid,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const message =
          (payload as { message?: string; error?: string })?.message ||
          (payload as { message?: string; error?: string })?.error ||
          'Не удалось создать задачу'
        throw new Error(message)
      }

      if ((payload as { task?: TaskApi }).task) {
        setTasks((prev) => [...prev, mapApiTask((payload as { task: TaskApi }).task)])
      }
      setFormData({
        title: '',
        clientLink: '',
        priority: 'medium',
        assigneeUuid: currentUser.uuid,
        status: 'todo',
      })
      setDialogOpen(false)
    } catch (err) {
      console.error('Create task error:', err)
      setError(err instanceof Error ? err.message : 'Не удалось создать задачу')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <AdminHeader title="Менеджер задач" />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
        <AdminHeader title="Менеджер задач" />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader title="Менеджер задач" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Менеджер задач</h1>
          <div className="flex gap-2">
            <Select value={managerFilter} onValueChange={setManagerFilter} disabled={!currentUser?.isAdmin}>
              <SelectTrigger className="w-[200px]" disabled={!currentUser?.isAdmin}>
                <SelectValue placeholder="Ответственный" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {assigneeOptions.map((manager) => (
                  <SelectItem key={assigneeKey(manager)} value={assigneeKey(manager)}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задачу
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новую задачу</DialogTitle>
                  <DialogDescription>
                    Заполните форму для создания новой задачи
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название задачи *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="Введите название задачи"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientLink">Ссылка на заявку</Label>
                    <Input
                      id="clientLink"
                      value={formData.clientLink}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, clientLink: e.target.value }))
                      }
                      placeholder="/admin/deals/deal-001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Приоритет *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: 'low' | 'medium' | 'high') =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                      }>
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignee">Ответственный *</Label>
                    <Select
                      value={formData.assigneeUuid}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, assigneeUuid: value }))
                      }
                      disabled={currentUser ? !currentUser.isAdmin : false}>
                      <SelectTrigger id="assignee">
                        <SelectValue placeholder="Выберите ответственного" />
                      </SelectTrigger>
                      <SelectContent>
                        {assigneeOptions.map((manager) => (
                          <SelectItem key={assigneeKey(manager)} value={assigneeKey(manager)}>
                            {manager.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Статус *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'todo' | 'in-progress' | 'done') =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">К выполнению</SelectItem>
                        <SelectItem value="in-progress">В работе</SelectItem>
                        <SelectItem value="done">Выполнено</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        'Создать задачу'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto">
            {statusColumns.map((column) => (
              <DroppableColumn key={column.id} id={column.id} title={column.title}>
                {tasksByStatus[column.id as keyof typeof tasksByStatus].map((task) => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <DraggableTask task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
        </div>
      </main>
    </>
  )
}

