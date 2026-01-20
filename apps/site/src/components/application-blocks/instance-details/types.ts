export interface InstanceDetailsProps{
    title?: string
    altrpIndex: string, 
    collectionName?: string,
    instance: any,
    showTabsOnly?:boolean,
    activeTab?: string,
    setActiveTab?: (value: string) => void
}