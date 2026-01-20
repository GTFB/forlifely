import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card"
import { BarChart3, Briefcase, FolderKanban, Target, Users, Wallet } from "lucide-react"
import React from "react"
export function DashboardTab({ altrpIndex }: { altrpIndex: string }) {
    const [metrics, setMetrics] = React.useState({
      contactsCount: 0,
      dealsCount: 0,
      dealsTotal: 0,
      projectsCount: 0,
      goalsCount: 0,
      financesIncome: 0,
      financesExpense: 0,
      financesBalance: 0,
    })
    const [loading, setLoading] = React.useState(true)
  
    React.useEffect(() => {
      const fetchMetrics = async () => {
        try {
          setLoading(true)
          
          // Fetch all related data
          const [contactsRes, dealsRes, projectsRes, goalsRes, financesRes] = await Promise.all([
            fetch(`/api/admin/state?c=humans&ps=1000&filters[0][field]=data_in.contractor_altrpIndex&filters[0][op]=eq&filters[0][value]=${encodeURIComponent(altrpIndex)}`, { credentials: 'include' }),
            fetch(`/api/admin/state?c=deals&ps=1000&filters[0][field]=client_aid&filters[0][op]=eq&filters[0][value]=${encodeURIComponent(altrpIndex)}`, { credentials: 'include' }),
            fetch(`/api/admin/state?c=deals&ps=1000&filters[0][field]=client_aid&filters[0][op]=eq&filters[0][value]=${encodeURIComponent(altrpIndex)}&filters[1][field]=status_name&filters[1][op]=eq&filters[1][value]=project`, { credentials: 'include' }),
            fetch(`/api/admin/state?c=goals&ps=1000&filters[0][field]=data_in.contractor_altrpIndex&filters[0][op]=eq&filters[0][value]=${encodeURIComponent(altrpIndex)}`, { credentials: 'include' }),
            fetch(`/api/admin/state?c=finances&ps=1000&filters[0][field]=data_in.contractor_altrpIndex&filters[0][op]=eq&filters[0][value]=${encodeURIComponent(altrpIndex)}`, { credentials: 'include' }),
          ])
  
          const [contactsData, dealsData, projectsData, goalsData, financesData] = await Promise.all([
            contactsRes.ok ? (contactsRes.json() as Promise<{ data?: any[] }>) : Promise.resolve({ data: [] }),
            dealsRes.ok ? (dealsRes.json() as Promise<{ data?: any[] }>) : Promise.resolve({ data: [] }),
            projectsRes.ok ? (projectsRes.json() as Promise<{ data?: any[] }>) : Promise.resolve({ data: [] }),
            goalsRes.ok ? (goalsRes.json() as Promise<{ data?: any[] }>) : Promise.resolve({ data: [] }),
            financesRes.ok ? (financesRes.json() as Promise<{ data?: any[] }>) : Promise.resolve({ data: [] }),
          ])
  
          // Calculate metrics
          const contactsCount = contactsData.data?.length || 0
          const dealsCount = dealsData.data?.length || 0
          const projectsCount = projectsData.data?.length || 0
          const goalsCount = goalsData.data?.length || 0
          
          // Calculate deals total
          let dealsTotal = 0
          if (dealsData.data) {
            dealsData.data.forEach((deal: any) => {
              const dataIn = typeof deal.data_in === 'string' ? JSON.parse(deal.data_in || '{}') : (deal.data_in || {})
              const total = Number(dataIn.total || dataIn.totalAmount || 0)
              dealsTotal += total
            })
          }
  
          // Calculate finances
          let financesIncome = 0
          let financesExpense = 0
          if (financesData.data) {
            financesData.data.forEach((finance: any) => {
              const sum = Number(finance.sum || 0)
              const type = finance.type || ''
              if (type === 'income' || sum > 0) {
                financesIncome += Math.abs(sum)
              } else {
                financesExpense += Math.abs(sum)
              }
            })
          }
  
          setMetrics({
            contactsCount,
            dealsCount,
            dealsTotal: dealsTotal / 100, // Convert from cents
            projectsCount,
            goalsCount,
            financesIncome: financesIncome / 100,
            financesExpense: financesExpense / 100,
            financesBalance: (financesIncome - financesExpense) / 100,
          })
          setLoading(false)
        } catch (err) {
          console.error('Error fetching metrics:', err)
          setLoading(false)
        }
      }
  
      fetchMetrics()
    }, [altrpIndex])
  
    if (loading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Загрузка метрик...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }
  
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Контакты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.contactsCount}</div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Сделки</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dealsCount}</div>
            <p className="text-xs text-muted-foreground">
              Сумма: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(metrics.dealsTotal)}
            </p>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проекты</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.projectsCount}</div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Задачи</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.goalsCount}</div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доходы</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(metrics.financesIncome)}
            </div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Расходы</CardTitle>
            <Wallet className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(metrics.financesExpense)}
            </div>
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Баланс</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.financesBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(metrics.financesBalance)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }