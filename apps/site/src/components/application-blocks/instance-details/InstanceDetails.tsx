import { useRouter } from "next/navigation"
import { InstanceDetailsProps } from "./types"
import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Building2, FileText, FolderKanban, Target, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/packages/components/ui/card"
import { DashboardTab } from "./DashboardTab"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/packages/components/ui/dialog"
import { AdminStateProvider } from "@/components/admin/AdminStateProvider"
import { Button } from "@/packages/components/ui/button"

export function InstanceDetails({ 
    altrpIndex, 
    collectionName,
    instance,
    title,
    showTabsOnly = false,
    activeTab: externalActiveTab,
    setActiveTab: externalSetActiveTab
  }: InstanceDetailsProps) {
    const router = useRouter()
    const [internalActiveTab, setInternalActiveTab] = React.useState("general")
    
    // Use external state if provided, otherwise use internal state
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab
    const setActiveTab = externalSetActiveTab || setInternalActiveTab
    
    
    const [linkContactDialogOpen, setLinkContactDialogOpen] = React.useState(false)
    const [selectedContactId, setSelectedContactId] = React.useState<string | null>(null)
    const [linking, setLinking] = React.useState(false)
    
    // State for linking other entities
    const [linkEntityDialogOpen, setLinkEntityDialogOpen] = React.useState(false)
    const [linkEntityConfig, setLinkEntityConfig] = React.useState<{
      collection: string
      linkField: string
      dialogTitle: string
    } | null>(null)
    const [selectedEntityId, setSelectedEntityId] = React.useState<string | null>(null)
    const [linkingEntity, setLinkingEntity] = React.useState(false)
  
    const tabsList = (
      <TabsList className="inline-flex items-center justify-center gap-2 w-auto">
        <TabsTrigger value="general" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <Building2 className="h-5 w-5" />
          <span className="text-xs">Общее</span>
        </TabsTrigger>
        <TabsTrigger value="contacts" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <Users className="h-5 w-5" />
          <span className="text-xs">Контакты</span>
        </TabsTrigger>
        <TabsTrigger value="deals" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <Briefcase className="h-5 w-5" />
          <span className="text-xs">Сделки</span>
        </TabsTrigger>
        <TabsTrigger value="projects" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <FolderKanban className="h-5 w-5" />
          <span className="text-xs">Проекты</span>
        </TabsTrigger>
        <TabsTrigger value="goals" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <Target className="h-5 w-5" />
          <span className="text-xs">Задачи</span>
        </TabsTrigger>
        <TabsTrigger value="finances" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <Wallet className="h-5 w-5" />
          <span className="text-xs">Финансы</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex flex-col items-center justify-center gap-1 px-3 py-2">
          <FileText className="h-5 w-5" />
          <span className="text-xs">Документы</span>
        </TabsTrigger>
      </TabsList>
    )
  
    if (showTabsOnly) {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {tabsList}
        </Tabs>
      )
    }
  
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* TabsList is rendered in header, so we don't render it here */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Общее
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {instance.reg && (
                  <div>
                    <p className="text-sm text-muted-foreground">Рег. №</p>
                    <p className="font-medium">{instance.reg}</p>
                  </div>
                )}
                {instance.tin && (
                  <div>
                    <p className="text-sm text-muted-foreground">ИНН</p>
                    <p className="font-medium">{instance.tin}</p>
                  </div>
                )}
                {instance.cityName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Город</p>
                    <p className="font-medium">{instance.cityName}</p>
                  </div>
                )}
                {instance.dataIn && typeof instance.dataIn === 'object' && (
                  Object.entries(instance.dataIn).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null
                    return (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground">{key}</p>
                        <p className="font-medium">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
          <div className="mt-4">
            <DashboardTab altrpIndex={altrpIndex} />
          </div>
        </TabsContent>
  
        {/* Dialog for linking existing contact */}
        <Dialog open={linkContactDialogOpen} onOpenChange={setLinkContactDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Выберите контакт для привязки</DialogTitle>
              <DialogDescription>
                Выберите существующую запись из списка для привязки к контрагенту "{title}"
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AdminStateProvider
                initialState={{
                  collection: "humans",
                  page: 1,
                  pageSize: 20,
                  filters: [],
                  search: "",
                }}
              >AdminStateProvider
              </AdminStateProvider>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLinkContactDialogOpen(false)
                  setSelectedContactId(null)
                }}
              >
                Отмена
              </Button>
              <Button 
                onClick={async () => {
                  if (!selectedContactId) return
                  
                  setLinking(true)
                  try {
                    // Fetch current human data
                    const humanRes = await fetch(`/api/admin/state?c=humans&ps=1&filters[0][field]=id&filters[0][op]=eq&filters[0][value]=${selectedContactId}`, {
                      credentials: 'include'
                    })
                    
                    if (!humanRes.ok) {
                      throw new Error('Failed to fetch human data')
                    }
                    
                    const humanData = await humanRes.json() as { data?: any[] }
                    const human = humanData.data?.[0]
                    
                    if (!human) {
                      throw new Error('Human not found')
                    }
                    
                    // Get current data_in
                    let dataIn: any = {}
                    if (human.data_in) {
                      try {
                        dataIn = typeof human.data_in === 'string' 
                          ? JSON.parse(human.data_in) 
                          : human.data_in
                      } catch {
                        dataIn = {}
                      }
                    }
                    
                    // Update data_in with contractor_altrpIndex
                    dataIn.contractor_altrpIndex = altrpIndex
                    
                    // Update human record
                    const updateRes = await fetch(`/api/admin/humans/${human.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      credentials: 'include',
                      body: JSON.stringify({
                        data_in: dataIn
                      })
                    })
                    
                    if (!updateRes.ok) {
                      const errorData = await updateRes.json() as { error?: string }
                      throw new Error(errorData.error || 'Failed to link contact')
                    }
                    
                    // Close dialog and refresh table
                    setLinkContactDialogOpen(false)
                    setSelectedContactId(null)
                    // Trigger a refresh by updating a key or reloading
                    window.location.reload()
                  } catch (error) {
                    console.error('Error linking contact:', error)
                    alert(error instanceof Error ? error.message : 'Ошибка при привязке контакта')
                  } finally {
                    setLinking(false)
                  }
                }}
                disabled={!selectedContactId || linking}
                className="bg-green-600 hover:bg-green-700"
              >
                {linking ? 'Привязка...' : 'Привязать'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  
        {/* Universal dialog for linking other entities (deals, goals, finances) */}
        {linkEntityConfig && (
          <Dialog open={linkEntityDialogOpen} onOpenChange={setLinkEntityDialogOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{linkEntityConfig.dialogTitle}</DialogTitle>
                <DialogDescription>
                  Выберите существующую запись из списка для привязки к контрагенту "{title}"
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-hidden">
                <AdminStateProvider
                  initialState={{
                    collection: linkEntityConfig.collection,
                    page: 1,
                    pageSize: 20,
                    filters: [],
                    search: "",
                  }}
                >
                  AdminStateProvider
                </AdminStateProvider>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLinkEntityDialogOpen(false)
                    setSelectedEntityId(null)
                    setLinkEntityConfig(null)
                  }}
                >
                  Отмена
                </Button>
                <Button 
                  onClick={async () => {
                    if (!selectedEntityId || !linkEntityConfig) return
                    
                    setLinkingEntity(true)
                    try {
                      // Fetch current entity data
                      const entityRes = await fetch(`/api/admin/state?c=${linkEntityConfig.collection}&ps=1&filters[0][field]=id&filters[0][op]=eq&filters[0][value]=${selectedEntityId}`, {
                        credentials: 'include'
                      })
                      
                      if (!entityRes.ok) {
                        throw new Error('Failed to fetch entity data')
                      }
                      
                      const entityData = await entityRes.json() as { data?: any[] }
                      const entity = entityData.data?.[0]
                      
                      if (!entity) {
                        throw new Error('Entity not found')
                      }
                      
                      // Update entity based on linkField type
                      if (linkEntityConfig.linkField === 'client_aid') {
                        // For deals: update client_aid directly
                        const updateRes = await fetch(`/api/admin/${linkEntityConfig.collection}/${entity.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({
                            client_aid: altrpIndex
                          })
                        })
                        
                        if (!updateRes.ok) {
                          const errorData = await updateRes.json() as { error?: string }
                          throw new Error(errorData.error || 'Failed to link entity')
                        }
                      } else if (linkEntityConfig.linkField === 'data_in.contractor_altrpIndex') {
                        // For goals, finances: update data_in.contractor_altrpIndex
                        let dataIn: any = {}
                        if (entity.data_in) {
                          try {
                            dataIn = typeof entity.data_in === 'string' 
                              ? JSON.parse(entity.data_in) 
                              : entity.data_in
                          } catch {
                            dataIn = {}
                          }
                        }
                        
                        dataIn.contractor_altrpIndex = altrpIndex
                        
                        const updateRes = await fetch(`/api/admin/${linkEntityConfig.collection}/${entity.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({
                            data_in: dataIn
                          })
                        })
                        
                        if (!updateRes.ok) {
                          const errorData = await updateRes.json() as { error?: string }
                          throw new Error(errorData.error || 'Failed to link entity')
                        }
                      }
                      
                      // Close dialog and refresh
                      setLinkEntityDialogOpen(false)
                      setSelectedEntityId(null)
                      setLinkEntityConfig(null)
                      window.location.reload()
                    } catch (error) {
                      console.error('Error linking entity:', error)
                      alert(error instanceof Error ? error.message : 'Ошибка при привязке записи')
                    } finally {
                      setLinkingEntity(false)
                    }
                  }}
                  disabled={!selectedEntityId || linkingEntity}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {linkingEntity ? 'Привязка...' : 'Привязать'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Tabs>
    )
  }