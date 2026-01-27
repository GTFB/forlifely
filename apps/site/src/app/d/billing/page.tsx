"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function BillingPage() {
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null)
  const [transactions, setTransactions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletResponse, transactionsResponse] = await Promise.all([
          fetch("/api/altrp/v1/s/wallets", { credentials: "include" }),
          fetch("/api/altrp/v1/s/wallet-transactions", { credentials: "include" }),
        ])

        if (walletResponse.ok) {
          const walletData = await walletResponse.json() as {
            success?: boolean
            wallets?: Array<{ balance?: number | null }>
          }
          if (walletData.success && walletData.wallets && walletData.wallets.length > 0) {
            setWalletBalance(walletData.wallets[0].balance || 0)
          }
        }

        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json() as {
            success?: boolean
            data?: any[]
          }
          if (transactionsData.success) {
            setTransactions(transactionsData.data || [])
          }
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Финансы</h1>
          <p className="text-muted-foreground">Управление кошельком и транзакциями</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Пополнить баланс
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Баланс кошелька</CardTitle>
          <CardDescription>Ваши доступные средства</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {loading ? "Загрузка..." : walletBalance !== null ? `${walletBalance} баллов` : "0 баллов"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История транзакций</CardTitle>
          <CardDescription>Недавние транзакции кошелька</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Загрузка транзакций...</div>
          ) : transactions.length === 0 ? (
            <div className="text-muted-foreground">Транзакций пока нет</div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description || "Транзакция"}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className={`font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount} баллов
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
