"use client"

import * as React from "react"
import { HeroHeader } from "@/components/home/header"
import { GamesList } from "@/components/public/games-list"
import FooterSection from "@/components/marketing-blocks/footer"

interface GameItem {
  gaid: string
  fullGaid: string
  title: string | null
  statusName: string | null
  game: any
  rewardPoints: number
  platform: string
  genres: string[]
  coverImage?: string
}

export default function GamesPage() {
  const [games, setGames] = React.useState<GameItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [page, setPage] = React.useState(1)
  const [pagination, setPagination] = React.useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null)

  React.useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/public/games?page=${page}&limit=20`)
        if (!res.ok) {
          throw new Error("Failed to load games")
        }
        const json = (await res.json()) as { success?: boolean; data?: GameItem[]; pagination?: { page: number; limit: number; total: number; totalPages: number } }
        if (json.success && json.data) {
          setGames(json.data)
          if (json.pagination) {
            setPagination(json.pagination)
          }
        } else {
          setGames([])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки")
        setGames([])
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [page])

  return (
    <div className="flex-1">
      <HeroHeader />
      <main className="min-h-screen">
        <section className="px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="text-center">
              <h1 className="font-heading text-balance text-4xl font-bold md:text-5xl">
                Открытые игры для тестирования
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                Выберите игру, выполните тестирование и получите награды за качественные отчеты
              </p>
            </div>

            <GamesList games={games} loading={loading} error={error} />

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Страница {pagination.page} из {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Вперед
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  )
}
