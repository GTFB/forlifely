"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/packages/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "../WorkshopProvider";
import { Input } from "@/components/ui/input";
import { CreateDialog } from "../CreateDialog";
import { GoalsResponse, AssetsResponse, GoalNode } from "@/shared/types/shared";

interface Asset {
  aaid: string;
  title: string;
  type_name: string;
  sceneCount?: number;
}

interface ChapterData {
  chapter: GoalNode;
  scenes: GoalNode[];
  description?: string;
  characters: Asset[];
  locations: Asset[];
  items: Asset[];
}

export function ChapterView({ chapterGaid }: { chapterGaid: string }) {
  const { setCurrentScene } = useWorkshop();
  const [data, setData] = useState<ChapterData | null>(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadChapterData();
  }, [chapterGaid]);

  const loadChapterData = async () => {
    try {
      setLoading(true);
      // Load goals hierarchy
      const goalsResponse = await fetch("/api/workshop/goals", {
        credentials: "include",
      });
      if (!goalsResponse.ok) return;

      const goalsData = await goalsResponse.json() as GoalsResponse;
      const findChapter = (nodes: GoalNode[]): GoalNode | null => {
        for (const node of nodes) {
          if (node.gaid === chapterGaid || node.fullGaid === chapterGaid) {
            return node;
          }
          if (node.children) {
            const found = findChapter(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const chapter = findChapter(goalsData.goals || []);
      if (!chapter) return;

      const scenes = chapter.children?.filter((s) => s.type === "scene") || [];

      // Load assets with scene counts - use fullGaid if available, otherwise gaid
      const parentGaidForStats = chapter.fullGaid || chapter.gaid || chapterGaid;
      const assetsResponse = await fetch(`/api/workshop/assets/stats?parent_gaid=${parentGaidForStats}`, {
        credentials: "include",
      });
      const assetsData = assetsResponse.ok ? await assetsResponse.json() as { characters?: Asset[]; locations?: Asset[]; items?: Asset[] } : { characters: [], locations: [], items: [] };
      
      console.log("Chapter assets data:", assetsData);

      const descriptionText = ""; // TODO: Load from goal.gin or associated text

      setData({
        chapter,
        scenes,
        description: descriptionText,
        characters: assetsData.characters || [],
        locations: assetsData.locations || [],
        items: assetsData.items || [],
      });
      setDescription(descriptionText);
      setTitle(chapter.title);
    } catch (error) {
      console.error("Failed to load chapter data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      // await saveDescription(chapterGaid, description);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to save description:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      // Use gaid from data.chapter, fallback to chapterGaid
      const goalIdToUpdate = data?.chapter?.gaid || chapterGaid;
      const response = await fetch(`/api/workshop/goals/${goalIdToUpdate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim() }),
      });
      if (response.ok) {
        setIsEditingTitle(false);
        await loadChapterData();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        console.error("Failed to save title:", response.status, errorData);
      }
    } catch (error) {
      console.error("Failed to save title:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateScene = async (name: string) => {
    try {
      const response = await fetch("/api/workshop/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: name,
          type: "scene",
          parent_full_gaid: chapterGaid,
        }),
      });
      if (response.ok) {
        await loadChapterData();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка создания сцены: ${errorData.error || "Неизвестная ошибка"}`);
        throw new Error(errorData.error || "Failed to create scene");
      }
    } catch (error) {
      console.error("Failed to create scene:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Глава не найдена
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveTitle();
                  } else if (e.key === "Escape") {
                    setTitle(data.chapter.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
              />
            </div>
          ) : (
            <>
              <h1 
                className="text-2xl font-bold mb-2 flex-1 cursor-pointer hover:bg-accent/50 rounded px-2 py-1 -mx-2 -my-1"
                onClick={() => setIsEditingTitle(true)}
              >
                {title}
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
          <Badge 
            variant="secondary" 
            className={cn(
              "border-0 text-white",
              data.chapter.statusName?.toLowerCase() === "idea" && "bg-yellow-500",
              data.chapter.statusName?.toLowerCase() === "draft" && "bg-blue-500",
              data.chapter.statusName?.toLowerCase() === "editor" && "bg-red-500",
              data.chapter.statusName?.toLowerCase() === "done" && "bg-green-500",
              !data.chapter.statusName && "bg-yellow-500"
            )}
          >
            {data.chapter.statusName === "idea" ? "Идея" : 
             data.chapter.statusName === "draft" ? "Черновик" :
             data.chapter.statusName === "editor" ? "Редактор" :
             data.chapter.statusName === "done" ? "Готово" : "Идея"}
          </Badge>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Краткое описание главы</label>
            <Button size="sm" onClick={handleSaveDescription} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите суть главы..."
            className="min-h-[100px]"
          />
        </div>

        {/* Scenes List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Сцены</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить сцену
            </Button>
          </div>
          {data.scenes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет сцен</p>
          ) : (
            <div className="space-y-1">
              {data.scenes.map((scene) => (
                <div
                  key={scene.gaid}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setCurrentScene(scene.gaid, null)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{scene.title}</span>
                  {scene.statusName && (
                    <Badge variant="secondary" className="text-xs">
                      {scene.statusName}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assets Tables */}
        <div className="space-y-4">
          {/* Characters Table */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Персонажи</h2>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Имя</TableHead>
                    <TableHead className="text-right">Сцен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.characters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Нет персонажей
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.characters.map((character) => (
                      <TableRow key={character.aaid}>
                        <TableCell>{character.title}</TableCell>
                        <TableCell className="text-right">{character.sceneCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Locations Table */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Локации</h2>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="text-right">Сцен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Нет локаций
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.locations.map((location) => (
                      <TableRow key={location.aaid}>
                        <TableCell>{location.title}</TableCell>
                        <TableCell className="text-right">{location.sceneCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Предметы</h2>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="text-right">Сцен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Нет предметов
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((item) => (
                      <TableRow key={item.aaid}>
                        <TableCell>{item.title}</TableCell>
                        <TableCell className="text-right">{item.sceneCount || 0}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      <CreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Создать сцену"
        placeholder="Название сцены..."
        onCreate={handleCreateScene}
        showParentSelect={false}
        parentOptions={[]}
      />
    </ScrollArea>
  );
}

