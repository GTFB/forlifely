"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatInterface } from "./neural-deck/ChatInterface";
import { ContextPanel } from "./neural-deck/ContextPanel";
import { TrendsPanel } from "./neural-deck/TrendsPanel";
import { MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import { useWorkshop } from "./WorkshopProvider";

export function WorkshopNeuralDeck() {
  const { state } = useWorkshop();
  const [activeTab, setActiveTab] = useState("chat");

  // Auto-switch to context tab when asset is selected
  useEffect(() => {
    if (state.selectedAssetAaid) {
      setActiveTab("context");
    }
  }, [state.selectedAssetAaid]);

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="context" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Context</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
          <ChatInterface />
        </TabsContent>
        <TabsContent value="context" className="flex-1 m-0 overflow-hidden">
          <ContextPanel />
        </TabsContent>
        <TabsContent value="trends" className="flex-1 m-0 overflow-hidden">
          <TrendsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

