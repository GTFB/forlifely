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
import { BookMarked, Save, ChevronRight, ChevronDown, Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "../WorkshopProvider";
import { Input } from "@/components/ui/input";
import { CreateDialog } from "../CreateDialog";
import { GoalsResponse, GoalNode } from "@/shared/types/shared";

interface Asset {
  aaid: string;
  title: string;
  type_name: string;
  sceneCount?: number;
}

interface VolumeData {
  volume: GoalNode;
  chapters: GoalNode[];
  description?: string;
  characters: Asset[];
  locations: Asset[];
  items: Asset[];
}

export function VolumeView({ volumeGaid }: { volumeGaid: string }) {
  const { setCurrentChapter } = useWorkshop();
  const [data, setData] = useState<VolumeData | null>(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadVolumeData();
  }, [volumeGaid]);

  const loadVolumeData = async () => {
    try {
      setLoading(true);
      // Load goals hierarchy
      const goalsResponse = await fetch("/api/workshop/goals", {
        credentials: "include",
      });
      if (!goalsResponse.ok) return;

      const goalsData = await goalsResponse.json() as GoalsResponse;
      const findVolume = (nodes: GoalNode[]): GoalNode | null => {
        for (const node of nodes) {
          if (node.gaid === volumeGaid || node.fullGaid === volumeGaid) {
            return node;
          }
          if (node.children) {
            const found = findVolume(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const volume = findVolume(goalsData.goals || []);
      if (!volume) return;

      const chapters = volume.children?.filter((c) => c.type === "chapter") || [];

      // Load assets with scene counts - use fullGaid if available, otherwise gaid
      const parentGaidForStats = volume.fullGaid || volume.gaid || volumeGaid;
      const assetsResponse = await fetch(`/api/workshop/assets/stats?parent_gaid=${parentGaidForStats}`, {
        credentials: "include",
      });
      const assetsData = assetsResponse.ok ? await assetsResponse.json() as { characters?: Asset[]; locations?: Asset[]; items?: Asset[] } : { characters: [], locations: [], items: [] };
      
      console.log("Volume assets data:", assetsData);

      // Load description from goal's gin or text
      const descriptionText = ""; // TODO: Load from goal.gin or associated text

      setData({
        volume,
        chapters,
        description: descriptionText,
        characters: assetsData.characters || [],
        locations: assetsData.locations || [],
        items: assetsData.items || [],
      });
      setDescription(descriptionText);
      setTitle(volume.title);
    } catch (error) {
      console.error("Failed to load volume data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    // TODO: Save description to goal.gin or associated text
    setSaving(true);
    try {
      // await saveDescription(volumeGaid, description);
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
      // Use gaid from data.volume, fallback to volumeGaid
      const goalIdToUpdate = data?.volume?.gaid || volumeGaid;
      const response = await fetch(`/api/workshop/goals/${goalIdToUpdate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim() }),
      });
      if (response.ok) {
        setIsEditingTitle(false);
        await loadVolumeData();
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

  const handleCreateChapter = async (name: string) => {
    try {
      const response = await fetch("/api/workshop/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: name,
          type: "chapter",
          parent_full_gaid: volumeGaid,
        }),
      });
      if (response.ok) {
        await loadVolumeData();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка создания главы: ${errorData.error || "Неизвестная ошибка"}`);
        throw new Error(errorData.error || "Failed to create chapter");
      }
    } catch (error) {
      console.error("Failed to create chapter:", error);
      throw error;
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
        Том не найден
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
                    setTitle(data.volume.title);
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
              data.volume.statusName?.toLowerCase() === "idea" && "bg-yellow-500",
              data.volume.statusName?.toLowerCase() === "draft" && "bg-blue-500",
              data.volume.statusName?.toLowerCase() === "editor" && "bg-red-500",
              data.volume.statusName?.toLowerCase() === "done" && "bg-green-500",
              !data.volume.statusName && "bg-yellow-500"
            )}
          >
            {data.volume.statusName === "idea" ? "Идея" : 
             data.volume.statusName === "draft" ? "Черновик" :
             data.volume.statusName === "editor" ? "Редактор" :
             data.volume.statusName === "done" ? "Готово" : "Идея"}
          </Badge>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Краткое описание тома</label>
            <Button size="sm" onClick={handleSaveDescription} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опишите суть тома..."
            className="min-h-[100px]"
          />
        </div>

        {/* Chapters List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Главы</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить главу
            </Button>
          </div>
          {data.chapters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет глав</p>
          ) : (
            <div className="space-y-1">
              {data.chapters.map((chapter) => (
                <div
                  key={chapter.gaid}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setCurrentChapter(chapter.gaid)}
                >
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{chapter.title}</span>
                  {chapter.statusName && (
                    <Badge variant="secondary" className="text-xs">
                      {chapter.statusName}
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
        title="Создать главу"
        placeholder="Название главы..."
        onCreate={handleCreateChapter}
        showParentSelect={false}
        parentOptions={[]}
      />
    </ScrollArea>
  );
}

