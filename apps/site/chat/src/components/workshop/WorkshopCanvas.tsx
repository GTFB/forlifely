"use client";

import React, { useState, useEffect, useRef } from "react";
import { TipTapEditor } from "@/packages/components/blocks-app/cms/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Minimize2, Save, BookOpen, Folder, FileText, ChevronRight, ChevronDown, BookMarked } from "lucide-react";
import { useWorkshop } from "./WorkshopProvider";
import { VoiceInputButton } from "./VoiceInputButton";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { VolumeView } from "./views/VolumeView";
import { ChapterView } from "./views/ChapterView";
import { SceneView } from "./views/SceneView";
import { ProjectView } from "./views/ProjectView";
import { GoalsResponse, TextResponseWrapper, GoalNode } from "@/shared/types/shared";

export function WorkshopCanvas() {
  const { state, setZenMode, setCurrentScene } = useWorkshop();
  const [projectTree, setProjectTree] = useState<GoalNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");

  useEffect(() => {
    if (state.currentProjectGaid) {
      loadProjectTree(state.currentProjectGaid);
    } else if (state.currentTextTaid) {
      loadText(state.currentTextTaid);
    } else if (state.currentSceneGaid) {
      loadTextByGoal(state.currentSceneGaid);
    }
  }, [state.currentProjectGaid, state.currentTextTaid, state.currentSceneGaid]);

  const loadProjectTree = async (gaid: string) => {
    try {
      const response = await fetch("/api/workshop/goals", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as GoalsResponse;
        const findProject = (nodes: GoalNode[]): GoalNode | null => {
          for (const node of nodes) {
            if (node.gaid === gaid || node.fullGaid === gaid) {
              return node;
            }
            if (node.children) {
              const found = findProject(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        const project = findProject(data.goals || []);
        setProjectTree(project || null);
        // Auto-expand project node
        if (project) {
          setExpandedNodes(new Set([project.gaid]));
        }
      }
    } catch (error) {
      console.error("Failed to load project tree:", error);
    }
  };

  const toggleNode = (gaid: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(gaid)) {
        next.delete(gaid);
      } else {
        next.add(gaid);
      }
      return next;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "book":
        return BookOpen;
      case "volume":
        return Folder;
      case "chapter":
        return BookMarked;
      case "scene":
        return FileText;
      default:
        return FileText;
    }
  };

  const renderTreeNode = (node: GoalNode, level: number = 0) => {
    const Icon = getTypeIcon(node.type);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.gaid);
    const isScene = node.type === "scene";

    if (!hasChildren) {
      return (
        <div
          key={node.gaid}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
            level > 0 && "ml-4"
          )}
          onClick={() => {
            if (isScene) {
              setCurrentScene(node.gaid, null);
            }
          }}
        >
          <div className="w-4" />
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{node.title || "Untitled"}</span>
        </div>
      );
    }

    return (
      <Collapsible
        key={node.gaid}
        open={isExpanded}
        onOpenChange={() => toggleNode(node.gaid)}
        className={cn(level > 0 && "ml-4")}
      >
        <CollapsibleTrigger className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors w-full text-left">
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{node.title || "Untitled"}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-4">
          {node.children!.map((child) => renderTreeNode(child, level + 1))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const loadText = async (taid: string) => {
    try {
      const response = await fetch(`/api/workshop/texts/${taid}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as TextResponseWrapper;
        setContent(data.text?.content || "");
        setCurrentTitle(data.text?.title || "");
      } else {
        // Silently handle errors
        console.debug("Failed to load text, status:", response.status);
      }
    } catch (error) {
      // Silently handle network errors
      console.debug("Failed to load text:", error);
    }
  };

  const loadTextByGoal = async (gaid: string) => {
    try {
      const response = await fetch(`/api/workshop/texts?goal_gaid=${gaid}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as TextResponseWrapper;
        if (data.text) {
          setContent(data.text.content || "");
          setCurrentTitle(data.text.title || "");
        } else {
          // Text doesn't exist, create it
          try {
            const createResponse = await fetch("/api/workshop/texts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                title: "Untitled Scene",
                content: "",
                goal_gaid: gaid,
              }),
            });
            if (createResponse.ok) {
              const createData = await createResponse.json() as TextResponseWrapper;
              if (createData.text) {
                setContent(createData.text.content || "");
                setCurrentTitle(createData.text.title || "Untitled Scene");
              } else {
                setContent("");
                setCurrentTitle("Untitled Scene");
              }
            } else {
              // Failed to create text
              console.debug("Failed to create text, status:", createResponse.status);
            }
          } catch (createError) {
            // Silently handle creation errors
            console.debug("Failed to create text:", createError);
          }
        }
      } else {
        // Silently handle errors - scene might not have text yet
        console.debug("Failed to load text by goal, status:", response.status);
      }
    } catch (error) {
      // Silently handle network errors
      console.debug("Failed to load text by goal:", error);
    }
  };

  const handleSave = async () => {
    if (!state.currentTextTaid && !state.currentSceneGaid) return;

    try {
      setSaving(true);
      const url = state.currentTextTaid
        ? `/api/workshop/texts/${state.currentTextTaid}`
        : `/api/workshop/texts`;
      const method = state.currentTextTaid ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          title: currentTitle,
          goal_gaid: state.currentSceneGaid,
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error("Failed to save text:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Auto-save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Route to different views based on selection
  if (state.currentVolumeGaid) {
    return <VolumeView volumeGaid={state.currentVolumeGaid} />;
  }

  if (state.currentChapterGaid) {
    return <ChapterView chapterGaid={state.currentChapterGaid} />;
  }

  if (state.currentProjectGaid) {
    return <ProjectView projectGaid={state.currentProjectGaid} />;
  }

  if (state.currentSceneGaid) {
    return <SceneView sceneGaid={state.currentSceneGaid} />;
  }

  if (!state.currentSceneGaid && !state.currentTextTaid) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">Ничего не выбрано</p>
          <p className="text-sm">Выберите проект, том, главу или сцену из левой панели</p>
        </div>
      </div>
    );
  }

  // Fallback for old text-based editing (if currentTextTaid is set)
  return (
    <div className={cn("flex flex-col h-full bg-background", state.zenMode && "zen-mode")}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{currentTitle || "Untitled"}</h2>
          {lastSaved && (
            <Badge variant="outline" className="text-xs">
              Сохранено {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setZenMode(!state.zenMode)}>
            {state.zenMode ? (
              <>
                <Minimize2 className="h-4 w-4 mr-2" />
                Выйти из Zen
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 mr-2" />
                Zen Mode
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className={cn(
          "h-full",
          state.zenMode && "max-w-4xl mx-auto prose prose-lg dark:prose-invert font-serif"
        )}>
          <TipTapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Начните писать..."
          />
        </div>
        {!state.zenMode && (
          <VoiceInputButton onTranscribe={(text) => {
            setContent((prev) => prev + "\n" + text);
          }} />
        )}
      </div>
    </div>
  );
}

