'use client'
import { InstanceDetails } from "@/components/application-blocks/instance-details/InstanceDetails"
import { Badge } from "@/packages/components/ui/badge"
import { Button } from "@/packages/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"


export default function AdminDetailsCollectionPageClient({
    instance,
    altrpIndex,
    title,
}:{
    instance: any,
    altrpIndex: string,
    title: string
}) {
    const router = useRouter()
    return (
        <>
            {/* Header with tabs */}
            <div className="flex items-center justify-between mb-4 relative">
                {/* Left block: back button + logo + title */}
                <div className="flex items-center gap-4 flex-1">
                    <Button onClick={() => router.push('/admin?c=contractors&p=1&ps=20')} variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        {instance.mediaId && (
                            <img
                                src={`/api/altrp/v1/admin/files/${instance.mediaId}`}
                                alt="Logo"
                                className="h-12 w-12 rounded object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                }}
                            />
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">{title}</h1>
                            <p className="text-muted-foreground">
                                CAID: {instance.caid}
                            </p>
                        </div>
                    </div>
                </div>


                {/* Right block: badge */}
                <div className="flex-1 flex justify-end">
                    {instance.statusName && (
                        <Badge variant="secondary">
                            {instance.statusName}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Tab content */}
            <InstanceDetails
                altrpIndex={altrpIndex}
                instance={instance}
                showTabsOnly={false}
                activeTab={'con'}
                setActiveTab={(value) => {
                    // Handle tab change if needed
                }}
            />
        </>
    )
}