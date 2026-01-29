"use client";

import React, { useState, useEffect, useRef } from "react";
import { TipTapEditor } from "@/packages/components/blocks-app/cms/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Maximize2, Minimize2, Save, Pencil } from "lucide-react";
import { useWorkshop } from "../WorkshopProvider";
import { VoiceInputButton } from "../VoiceInputButton";
import { cn } from "@/lib/utils";
import { GoalsResponse, AssetsResponse, TextResponseWrapper } from "@/shared/types/shared";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  aaid: string;
  title: string;
  type_name: string;
}

export function SceneView({ sceneGaid }: { sceneGaid: string }) {
  const { state, setZenMode } = useWorkshop();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [characters, setCharacters] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Asset[]>([]);
  const [items, setItems] = useState<Asset[]>([]);
  
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Store scene goal data to get fullGaid
  const [sceneGoalData, setSceneGoalData] = useState<{ gaid: string; fullGaid?: string } | null>(null);
  
  // Loading state for Magic buttons
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);

  useEffect(() => {
    loadSceneData();
  }, [sceneGaid]);

  const loadSceneData = async () => {
    try {
      setLoading(true);
      
      // Load goal to get title (primary source)
      let goalTitle = "";
      let sceneGoal: any = null;
      const goalResponse = await fetch(`/api/workshop/goals?type=all`, {
        credentials: "include",
      });
      
      if (goalResponse.ok) {
        const goalsData = await goalResponse.json() as GoalsResponse;
        const goals = goalsData.goals || [];
        
        // Find the scene goal
        const findScene = (nodes: any[]): any => {
          for (const node of nodes) {
            if ((node.gaid === sceneGaid || node.fullGaid === sceneGaid) && node.type === "scene") {
              return node;
            }
            if (node.children) {
              const found = findScene(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        sceneGoal = findScene(goals);
        if (sceneGoal) {
          if (sceneGoal.title) {
            goalTitle = sceneGoal.title;
          }
          // Store scene goal data for saving
          setSceneGoalData({
            gaid: sceneGoal.gaid,
            fullGaid: sceneGoal.fullGaid,
          });
        }
        
        // Find the first book project - same logic as WorkshopBinder
        const findFirstBook = (nodes: any[]): any => {
          for (const node of nodes) {
            if (node.type === "book") {
              return node;
            }
            if (node.children) {
              const found = findFirstBook(node.children);
              if (found) return found;
            }
          }
          return null;
        };
        
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          // Use the same approach as WorkshopBinder: fullGaid || gaid as xaid parameter
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          const assetsResponse = await fetch(`/api/workshop/assets?xaid=${projectGaid}`, {
            credentials: "include",
          });
          
          if (assetsResponse.ok) {
            const assetsData = await assetsResponse.json() as AssetsResponse;
            const assets = assetsData.assets || [];
            setCharacters(assets.filter((a: Asset) => a.type_name === "character"));
            setLocations(assets.filter((a: Asset) => a.type_name === "location"));
            setItems(assets.filter((a: Asset) => a.type_name === "item"));
          }
        }
      }
      
      // Load text content - use fullGaid if available, otherwise gaid
      let textData: TextResponseWrapper | null = null;
      const goalGaidToLoad = sceneGoal?.fullGaid || sceneGoal?.gaid || sceneGaid;
      
      const textResponse = await fetch(`/api/workshop/texts?goal_gaid=${goalGaidToLoad}`, {
        credentials: "include",
      });
      
      if (textResponse.ok) {
        textData = await textResponse.json() as TextResponseWrapper;
        if (textData.text) {
          setContent(textData.text.content || "");
          // Use goal title if available, otherwise fallback to text title
          setTitle(goalTitle || textData.text.title || "");
          
          // Load scene metadata (selected assets, description)
          if (textData.text.gin) {
            const gin = typeof textData.text.gin === 'string' 
              ? JSON.parse(textData.text.gin) 
              : textData.text.gin;
            
            console.log("Loaded gin data:", gin);
            
            if (gin.description !== undefined) {
              setDescription(gin.description || "");
            }
            
            if (gin.assets) {
              if (gin.assets.characters) {
                setSelectedCharacters(new Set(gin.assets.characters));
                console.log("Loaded characters:", gin.assets.characters);
              }
              if (gin.assets.locations) {
                setSelectedLocations(new Set(gin.assets.locations));
                console.log("Loaded locations:", gin.assets.locations);
              }
              if (gin.assets.items) {
                setSelectedItems(new Set(gin.assets.items));
                console.log("Loaded items:", gin.assets.items);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error("Failed to load scene data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update goal title first (primary source)
      // Use gaid from sceneGoalData, fallback to sceneGaid
      if (title.trim() && sceneGoalData) {
        try {
          const goalIdToUpdate = sceneGoalData.gaid || sceneGaid;
          const response = await fetch(`/api/workshop/goals/${goalIdToUpdate}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: title.trim() }),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error("Failed to update goal title:", response.status, errorData);
          }
        } catch (error) {
          console.error("Failed to update goal title:", error);
        }
      }
      
      // Use fullGaid if available, otherwise use gaid
      const goalGaidToSave = sceneGoalData?.fullGaid || sceneGoalData?.gaid || sceneGaid;
      
      const saveData = {
        content,
        title: title.trim() || "", // Also save to text for consistency
        goal_gaid: goalGaidToSave,
        gin: {
          goal_gaid: goalGaidToSave,
          description,
          assets: {
            characters: Array.from(selectedCharacters),
            locations: Array.from(selectedLocations),
            items: Array.from(selectedItems),
          },
        },
      };
      
      console.log("Saving scene data:", saveData);
      
      // Save text - use the same goal_gaid as in saveData
      const textResponse = await fetch(`/api/workshop/texts?goal_gaid=${goalGaidToSave}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(saveData),
      });

      if (textResponse.ok) {
        const result = await textResponse.json();
        console.log("Save successful:", result);
        setLastSaved(new Date());
      } else {
        const errorData = await textResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to save scene:", textResponse.status, errorData);
      }
    } catch (error) {
      console.error("Failed to save scene:", error);
    } finally {
      setSaving(false);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
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

  const handleGenerateDescription = async () => {
    try {
      setGeneratingDescription(true);
      
      const response = await fetch("/api/ai/scene/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentDescription: description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.description) {
          setDescription(data.description);
          // Auto-save after generation
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, 500);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to generate description:", response.status, errorData);
        // TODO: Show error toast/notification to user
      }
    } catch (error) {
      console.error("Error generating description:", error);
      // TODO: Show error toast/notification to user
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleGenerateChapter = async () => {
    try {
      setGeneratingChapter(true);
      
      const response = await fetch("/api/ai/scene/generate-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          characterAaids: Array.from(selectedCharacters),
          locationAaids: Array.from(selectedLocations),
          itemAaids: Array.from(selectedItems),
          sceneDescription: description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
          // Auto-save after generation
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            handleSave();
          }, 500);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to generate chapter:", response.status, errorData);
        toast({
          variant: "destructive",
          title: "Failed to generate chapter",
          description: errorData.error || errorData.details || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error generating chapter:", error);
      toast({
        variant: "destructive",
        title: "Failed to generate chapter",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setGeneratingChapter(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", state.zenMode && "zen-mode")}>
      {!state.zenMode && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2 flex-1">
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false);
                  handleSave();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false);
                    handleSave();
                  } else if (e.key === "Escape") {
                    setIsEditingTitle(false);
                  }
                }}
                placeholder="Название сцены"
                className="text-lg font-semibold h-auto py-1"
                autoFocus
              />
            ) : (
              <>
                <h1 
                  className="text-lg font-semibold flex-1 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 -mx-2"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title || "Название сцены"}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTitle(true)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            {lastSaved && !isEditingTitle && (
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
      )}

      {state.zenMode && (
        <div className="absolute top-4 right-4 z-50">
          <Button variant="ghost" size="sm" onClick={() => setZenMode(false)}>
            <Minimize2 className="h-4 w-4 mr-2" />
            Выйти из Zen
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!state.zenMode && (
            <>
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Краткое описание сцены</label>
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-600 h-7 px-3 text-xs"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                  >
                    {generatingDescription ? "Генерация..." : "🪄 Magic"}
                  </Button>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (saveTimeoutRef.current) {
                      clearTimeout(saveTimeoutRef.current);
                    }
                    saveTimeoutRef.current = setTimeout(() => {
                      handleSave();
                    }, 1000);
                  }}
                  placeholder="Опишите суть сцены..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Multi-select for assets */}
              <div className="space-y-2">
                <div className="flex items-center justify-end">
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-600 h-7 px-3 text-xs"
                    size="sm"
                    onClick={handleGenerateChapter}
                    disabled={generatingChapter}
                  >
                    {generatingChapter ? "Генерация..." : "🪄 Magic"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                {/* Characters */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Персонажи</label>
                  <MultiSelect
                    options={characters.map((c) => ({
                      value: c.aaid,
                      label: c.title,
                    }))}
                    selected={selectedCharacters}
                    onSelectedChange={(newSelected) => {
                      setSelectedCharacters(newSelected);
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      saveTimeoutRef.current = setTimeout(() => {
                        handleSave();
                      }, 1000);
                    }}
                    placeholder="Нет персонажей"
                    emptyText="Нет персонажей"
                    searchPlaceholder="Поиск персонажей..."
                  />
                </div>

                {/* Locations */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Локации</label>
                  <MultiSelect
                    options={locations.map((l) => ({
                      value: l.aaid,
                      label: l.title,
                    }))}
                    selected={selectedLocations}
                    onSelectedChange={(newSelected) => {
                      setSelectedLocations(newSelected);
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      saveTimeoutRef.current = setTimeout(() => {
                        handleSave();
                      }, 1000);
                    }}
                    placeholder="Нет локаций"
                    emptyText="Нет локаций"
                    searchPlaceholder="Поиск локаций..."
                  />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Предметы</label>
                  <MultiSelect
                    options={items.map((i) => ({
                      value: i.aaid,
                      label: i.title,
                    }))}
                    selected={selectedItems}
                    onSelectedChange={(newSelected) => {
                      setSelectedItems(newSelected);
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      saveTimeoutRef.current = setTimeout(() => {
                        handleSave();
                      }, 1000);
                    }}
                    placeholder="Нет предметов"
                    emptyText="Нет предметов"
                    searchPlaceholder="Поиск предметов..."
                  />
                </div>
                </div>
              </div>
            </>
          )}

          {/* Editor */}
          <div className={cn(
            state.zenMode && "max-w-4xl mx-auto prose prose-lg dark:prose-invert font-serif"
          )}>
            <TipTapEditor
              content={content}
              onChange={handleContentChange}
              placeholder="Начните писать сцену..."
            />
          </div>
        </div>
      </ScrollArea>

      {!state.zenMode && (
        <VoiceInputButton onTranscribe={(text) => {
          setContent((prev) => prev + "\n" + text);
        }} />
      )}
    </div>
  );
}

