import { useRouter } from "next/navigation"
import { InstanceDetailsProps } from "./types"
import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Building2, FileText, FolderKanban, Target, Users, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/packages/components/ui/dialog"
import { AdminStateProvider } from "@/components/admin/AdminStateProvider"
import { Button } from "@/packages/components/ui/button"
import { GeneralTabFactory } from "./general-tabs/GeneralTabFactory"
import { OLAPTab } from "@/shared/collections/BaseCollection"
import { DataTable } from "../data-table"


export function InstanceDetails({ 
    altrpIndex, 
    collectionName,
    instance,
    title,
    activeTab,
    setActiveTab: externalSetActiveTab,
    olapTabs = []
  }: InstanceDetailsProps) {
    const router = useRouter()
    const [internalActiveTab, setInternalActiveTab] = React.useState(activeTab)
    
    // Use external state if provided, otherwise use internal state
    const setActiveTab =  setInternalActiveTab
    
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


    const finalTabs = [
      {
        label: 'Общее',
        id: 'general',
        icon: 'Building2',
      },
      ...olapTabs,
    ]

    const tabsList = (
      <TabsList className="inline-flex items-center justify-center gap-2 w-auto">
        {
          finalTabs.map((tab,idx)=>{
            return  <TabsTrigger value={tab.id} key={tab.id} className="flex flex-col items-center justify-center gap-1 px-3 py-2">
              <Building2 className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
            </TabsTrigger>
          })
        }
      </TabsList>
    )
  
    return (<>
    
    <Tabs value={internalActiveTab} onValueChange={setActiveTab} className="w-full">
          {tabsList}
        {/* TabsList is rendered in header, so we don't render it here */}
        <TabsContent value="general" className="mt-4">
          <GeneralTabFactory collectionName={collectionName} instance={instance}/>
        </TabsContent>
        {olapTabs.map((tab, idx)=>{
          return <OlapTabContent key={`olap-tab-${tab.id}`} olapTab={tab} instance={instance}></OlapTabContent>
        })}
        {/* todo: Universal dialog for linking other entities (deals, goals, finances) */}
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
      </>
    )
  }

  function OlapTabContent({
    olapTab,
    instance
  }: {
    olapTab: OLAPTab
    instance: any,
  }){
    return (<TabsContent value={olapTab.id} className="mt-4">
        <AdminStateProvider
          initialState={{
            collection: olapTab.collection,
            page: 1,
            pageSize: 10,
            filters: [{ field: olapTab.foreignKey, op: 'eq', value: instance[olapTab.localKey] as string }],
            search: "",
          }}
        >
        <DataTableWithLinkButton
          onLinkClick={() => {
            //todo: реализовать
          }}
        />
        </AdminStateProvider>
      </TabsContent>)
  }
  
function DataTableWithLinkButton({ onLinkClick }: { onLinkClick: () => void }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (!containerRef.current) return
    
    const insertButton = () => {
      // Find the container with buttons (ml-auto class)
      const buttonsContainer = containerRef.current?.querySelector('.ml-auto.flex.items-center') as HTMLElement
      if (!buttonsContainer) return
      
      // Check if button already exists
      if (buttonsContainer.querySelector('[data-link-button]')) return
      
      // Find the "Add" button - look for button that contains "+" or "Добавить" or "Add" text
      // and is a direct child or in a direct child div of buttonsContainer
      const allElements = Array.from(buttonsContainer.children)
      let addButton: HTMLElement | null = null
      
      // Look through direct children
      for (const child of allElements) {
        if (child.tagName === 'BUTTON') {
          const btn = child as HTMLElement
          const text = btn.textContent || ''
          const hasPlus = text.includes('+') || text.includes('Добавить') || text.includes('Add')
          if (hasPlus) {
            addButton = btn
            break
          }
        } else if (child.tagName === 'DIV') {
          // Check if it contains a button with plus
          const btn = child.querySelector('button') as HTMLElement
          if (btn) {
            const text = btn.textContent || ''
            const hasPlus = text.includes('+') || text.includes('Добавить') || text.includes('Add')
            if (hasPlus) {
              addButton = btn
              break
            }
          }
        }
      }
      
      // Fallback: find last button in container
      if (!addButton) {
        const lastButton = buttonsContainer.querySelector('button:last-of-type') as HTMLElement
        if (lastButton) {
          addButton = lastButton
        }
      }
      
      if (!addButton) return
      
      // Get the parent of addButton (should be buttonsContainer or a direct child)
      const addButtonParent = addButton.parentElement
      if (!addButtonParent) return
      
      // Create button element
      const buttonElement = document.createElement('button')
      buttonElement.setAttribute('data-link-button', 'true')
      buttonElement.type = 'button'
      buttonElement.className = 'inline-flex items-center justify-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-sm font-medium text-white h-9 px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
      buttonElement.innerHTML = `
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span>Привязать</span>
      `
      buttonElement.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        onLinkClick()
      }
      
      // Insert AFTER the "Add" button in the same parent container
      if (addButton.nextSibling) {
        addButtonParent.insertBefore(buttonElement, addButton.nextSibling)
      } else {
        addButtonParent.appendChild(buttonElement)
      }
    }
    
    // Try to insert immediately
    insertButton()
    
    // Also try after a short delay in case DataTable hasn't rendered yet
    const timeoutId = setTimeout(insertButton, 100)
    
    // Also observe for DOM changes
    const observer = new MutationObserver(() => {
      insertButton()
    })
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      })
    }
    
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
      // Cleanup on unmount
      const existingButton = containerRef.current?.querySelector('[data-link-button]')
      if (existingButton) {
        existingButton.remove()
      }
    }
  }, [onLinkClick])
  
  return (
    <div ref={containerRef}>
      <DataTable />
    </div>
  )
}