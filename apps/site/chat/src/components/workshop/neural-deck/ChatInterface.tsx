"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import { useWorkshop } from "../WorkshopProvider";
import { cn } from "@/lib/utils";
import { ChatRequest, ChatResponse } from "@/shared/types/shared";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatHistoryResponse {
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
}

export function ChatInterface() {
  const { state } = useWorkshop();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<React.ElementRef<typeof ScrollArea>>(null);

  // Function to scroll to bottom
  const scrollToBottom = () => {
    // Use double requestAnimationFrame to ensure DOM is fully updated
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          // Find the viewport element (Radix ScrollArea viewport)
          const viewport = messagesContainerRef.current.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          } else {
            // Fallback: try to find any scrollable parent
            let element: HTMLElement | null = messagesContainerRef.current.parentElement;
            while (element) {
              if (element.scrollHeight > element.clientHeight) {
                element.scrollTop = element.scrollHeight;
                break;
              }
              element = element.parentElement;
            }
          }
        }
      });
    });
  };

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const response = await fetch("/api/ai/chat/history", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json() as ChatHistoryResponse;
          // Transform API messages to component format
          const historyMessages: Message[] = data.messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(historyMessages);
        } else {
          console.error("Failed to load chat history:", response.status);
          // Continue with empty messages if history fails to load
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        // Continue with empty messages if history fails to load
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (!loadingHistory) {
      scrollToBottom();
    }
  }, [messages, loading, loadingHistory]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    // Scroll to bottom immediately after adding user message
    scrollToBottom();

    try {
      const requestBody: ChatRequest = {
        message: input,
        context: {
          scene_gaid: state.currentSceneGaid || undefined,
          text_content: "", // Can be enhanced to include current text
        },
      };
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json() as ChatResponse;
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "No response",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4" ref={messagesContainerRef}>
          {loadingHistory && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>Loading chat history...</p>
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation with AI Co-pilot</p>
              <p className="text-sm mt-2">Ask questions about your story or request help with writing</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI Co-pilot..."
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

