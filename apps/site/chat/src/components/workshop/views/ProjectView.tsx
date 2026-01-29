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
import { Badge } from "@/components/ui/badge";
import { BookOpen, Folder, BookMarked, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "../WorkshopProvider";
import { GoalsResponse, GoalNode } from "@/shared/types/shared";

interface GanttItem {
  id: string;
  title: string;
  type: "volume" | "chapter" | "scene";
  status: string;
  level: number;
  parentId?: string;
  children?: GanttItem[];
}

export function ProjectView({ projectGaid }: { projectGaid: string }) {
  const { setCurrentVolume, setCurrentChapter, setCurrentScene } = useWorkshop();
  const [project, setProject] = useState<GoalNode | null>(null);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjectData();
  }, [projectGaid]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshop/goals", {
        credentials: "include",
      });
      if (!response.ok) return;

      const data = await response.json() as GoalsResponse;
      const findProject = (nodes: GoalNode[]): GoalNode | null => {
        for (const node of nodes) {
          if (node.gaid === projectGaid || node.fullGaid === projectGaid) {
            return node;
          }
          if (node.children) {
            const found = findProject(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const foundProject = findProject(data.goals || []);
      setProject(foundProject);

      if (foundProject) {
        // Build Gantt items from project structure
        const items: GanttItem[] = [];
        const buildGanttItems = (
          nodes: GoalNode[],
          level: number = 0,
          parentId?: string
        ): void => {
          nodes.forEach((node) => {
            if (node.type === "volume" || node.type === "chapter" || node.type === "scene") {
              const item: GanttItem = {
                id: node.gaid,
                title: node.title,
                type: node.type,
                status: node.statusName || "idea",
                level,
                parentId,
              };
              items.push(item);

              if (node.children && node.children.length > 0) {
                buildGanttItems(node.children, level + 1, node.gaid);
              }
            }
          });
        };

        if (foundProject.children) {
          buildGanttItems(foundProject.children);
        }
        setGanttItems(items);
        // Auto-expand all items
        setExpandedItems(new Set(items.map((item) => item.id)));
      }
    } catch (error) {
      console.error("Failed to load project data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "идея":
      case "idea":
        return "bg-yellow-500 text-white";
      case "черновик":
      case "draft":
        return "bg-blue-500 text-white";
      case "редактор":
      case "editor":
        return "bg-red-500 text-white";
      case "готово":
      case "done":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "идея":
      case "idea":
        return "Идея";
      case "черновик":
      case "draft":
        return "Черновик";
      case "редактор":
      case "editor":
        return "Редактор";
      case "готово":
      case "done":
        return "Готово";
      default:
        return status || "Идея";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
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

  const getProgressPercentage = (status: string): number => {
    switch (status?.toLowerCase()) {
      case "идея":
      case "idea":
        return 10;
      case "черновик":
      case "draft":
        return 40;
      case "редактор":
      case "editor":
        return 70;
      case "готово":
      case "done":
        return 100;
      default:
        return 10;
    }
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleItemClick = (item: GanttItem) => {
    const nodeGaid = item.id;
    if (item.type === "volume") {
      setCurrentVolume(nodeGaid);
    } else if (item.type === "chapter") {
      setCurrentChapter(nodeGaid);
    } else if (item.type === "scene") {
      setCurrentScene(nodeGaid, null);
    }
  };

  // Build hierarchical structure
  const buildHierarchy = (items: GanttItem[]): GanttItem[] => {
    const itemMap = new Map<string, GanttItem>();
    const rootItems: GanttItem[] = [];

    // First pass: create map
    items.forEach((item) => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    items.forEach((item) => {
      const mappedItem = itemMap.get(item.id)!;
      if (item.parentId) {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(mappedItem);
        } else {
          rootItems.push(mappedItem);
        }
      } else {
        rootItems.push(mappedItem);
      }
    });

    return rootItems;
  };

  const renderGanttRow = (item: GanttItem): React.ReactNode => {
    const Icon = getTypeIcon(item.type);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const progress = getProgressPercentage(item.status);
    const childRows: React.ReactNode[] = [];

    if (hasChildren && isExpanded) {
      item.children!.forEach((child) => {
        childRows.push(renderGanttRow(child));
      });
    }

    return (
      <React.Fragment key={item.id}>
        <TableRow
          className={cn(
            "cursor-pointer hover:bg-accent/50",
            item.type === "volume" && "font-semibold",
            item.type === "chapter" && "font-medium"
          )}
          onClick={() => handleItemClick(item)}
        >
          <TableCell className="w-8">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
                className="h-4 w-4 p-0 flex items-center justify-center hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
          </TableCell>
          <TableCell
            className={cn(
              "font-medium",
              item.type === "volume" && "pl-2",
              item.type === "chapter" && "pl-6",
              item.type === "scene" && "pl-10"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.title}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge
              variant="secondary"
              className={cn("border-0 text-white", getStatusColor(item.status))}
            >
              {getStatusLabel(item.status)}
            </Badge>
          </TableCell>
          <TableCell className="w-full">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  getStatusColor(item.status)
                )}
                style={{ width: `${progress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
          </TableCell>
        </TableRow>
        {childRows}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Проект не найден
      </div>
    );
  }

  const hierarchicalItems = buildHierarchy(ganttItems);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{project.title}</h1>
        </div>

        {/* Gantt Chart Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="min-w-[200px]">Название</TableHead>
                <TableHead className="w-[120px]">Статус</TableHead>
                <TableHead>Прогресс</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hierarchicalItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Нет томов, глав или сцен
                  </TableCell>
                </TableRow>
              ) : (
                hierarchicalItems.map((item) => renderGanttRow(item))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ScrollArea>
  );
}

