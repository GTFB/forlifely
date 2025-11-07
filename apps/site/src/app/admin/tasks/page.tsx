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

interface Task {
  id: string
  title: string
  clientLink: string
  priority: 'low' | 'medium' | 'high'
  assignee: {
    name: string
    avatar?: string
  }
  date: string
  status: 'todo' | 'in-progress' | 'done'
}

const statusColumns = [
  { id: 'todo', title: 'К выполнению' },
  { id: 'in-progress', title: 'В работе' },
  { id: 'done', title: 'Выполнено' },
]

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
          <Link href={task.clientLink} className="text-primary hover:underline">
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
              <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
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
  const [managerFilter, setManagerFilter] = React.useState<string>('all')
  const [activeId, setActiveId] = React.useState<string | null>(null)

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
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/admin/tasks', { credentials: 'include' })
        
        // Mock data
        setTimeout(() => {
          setTasks([
            {
              id: 'task-1',
              title: 'Проверить документы заявки DEAL-001',
              clientLink: '/admin/deals/DEAL-001',
              priority: 'high',
              assignee: { name: 'Иванов И.И.' },
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'todo',
            },
            {
              id: 'task-2',
              title: 'Связаться с клиентом по заявке DEAL-002',
              clientLink: '/admin/deals/DEAL-002',
              priority: 'medium',
              assignee: { name: 'Петрова М.С.' },
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'todo',
            },
            {
              id: 'task-3',
              title: 'Запросить дополнительные документы',
              clientLink: '/admin/deals/DEAL-003',
              priority: 'high',
              assignee: { name: 'Сидоров П.А.' },
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'in-progress',
            },
            {
              id: 'task-4',
              title: 'Одобрить заявку DEAL-004',
              clientLink: '/admin/deals/DEAL-004',
              priority: 'medium',
              assignee: { name: 'Козлова А.Д.' },
              date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'in-progress',
            },
            {
              id: 'task-5',
              title: 'Проверить кредитную историю',
              clientLink: '/admin/deals/DEAL-005',
              priority: 'low',
              assignee: { name: 'Иванов И.И.' },
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'in-progress',
            },
            {
              id: 'task-6',
              title: 'Завершить обработку заявки DEAL-006',
              clientLink: '/admin/deals/DEAL-006',
              priority: 'medium',
              assignee: { name: 'Петрова М.С.' },
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'done',
            },
            {
              id: 'task-7',
              title: 'Отправить уведомление клиенту',
              clientLink: '/admin/deals/DEAL-007',
              priority: 'low',
              assignee: { name: 'Сидоров П.А.' },
              date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'done',
            },
            {
              id: 'task-8',
              title: 'Проверить поручителя',
              clientLink: '/admin/deals/DEAL-008',
              priority: 'high',
              assignee: { name: 'Козлова А.Д.' },
              date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'done',
            },
          ])
          setLoading(false)
        }, 500)
      } catch (err) {
        console.error('Tasks fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tasks')
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as string

    if (statusColumns.some((col) => col.id === newStatus)) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
        )
      )
      // TODO: Update task status via API
    }

    setActiveId(null)
  }

  const filteredTasks = tasks.filter((task) => {
    if (managerFilter === 'all') return true
    return task.assignee.name === managerFilter
  })

  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === 'todo'),
    'in-progress': filteredTasks.filter((task) => task.status === 'in-progress'),
    done: filteredTasks.filter((task) => task.status === 'done'),
  }

  const uniqueManagers = Array.from(new Set(tasks.map((task) => task.assignee.name)))
  const activeTask = tasks.find((task) => task.id === activeId)

  if (loading) {
    return (
      <>
        <AdminHeader title="Менеджер задач" />
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
        <AdminHeader title="Менеджер задач" />
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
      <AdminHeader title="Менеджер задач" />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Менеджер задач</h1>
          <div className="flex gap-2">
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Ответственный" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {uniqueManagers.map((manager) => (
                  <SelectItem key={manager} value={manager}>
                    {manager}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
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

