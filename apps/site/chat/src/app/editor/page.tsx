"use client"

import * as React from "react"
import { WorkshopProvider, useWorkshop } from "@/components/workshop/WorkshopProvider"
import { WorkshopBinder } from "@/components/workshop/WorkshopBinder"
import { WorkshopCanvas } from "@/components/workshop/WorkshopCanvas"
import { WorkshopNeuralDeck } from "@/components/workshop/WorkshopNeuralDeck"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"

function WorkshopContent() {
  const { state } = useWorkshop()

  return (
    <div className="h-screen w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Binder */}
        {state.leftPanelVisible && (
          <>
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <WorkshopBinder />
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Center Panel - Canvas */}
        <ResizablePanel defaultSize={state.leftPanelVisible && state.rightPanelVisible ? 55 : state.leftPanelVisible || state.rightPanelVisible ? 75 : 100} minSize={30}>
          <WorkshopCanvas />
        </ResizablePanel>

        {/* Right Panel - Neural Deck */}
        {state.rightPanelVisible && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={50}>
              <WorkshopNeuralDeck />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

export default function EditorPage() {
  return (
    <WorkshopProvider>
      <WorkshopContent />
    </WorkshopProvider>
  )
}

