"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  BookOpen,
  Folder,
  FileText,
  Plus,
  Users,
  MapPin,
  StickyNote,
  ChevronRight,
  ChevronDown,
  Trash2,
  MoreVertical,
  BookMarked,
  Pencil,
  Copy,
  MessageSquare,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useWorkshop } from "./WorkshopProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/packages/hooks/use-theme";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateDialog } from "./CreateDialog";
import { AssetsResponse, GoalsResponse, TextResponseWrapper, AssetResponse, GoalNode } from "@/shared/types/shared";

interface Asset {
  aaid: string;
  title: string;
  type_name: string;
  gin?: any;
  xaid?: string;
}

type MeResponse = {
  user?: { id: string; email: string; name: string; role: string };
  error?: string;
};

export function WorkshopBinder() {
  const { state, setCurrentScene, setCurrentProject, setCurrentVolume, setCurrentChapter, setSelectedAsset } = useWorkshop();
  const [goals, setGoals] = useState<GoalNode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [characters, setCharacters] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Asset[]>([]);
  const [items, setItems] = useState<Asset[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogType, setCreateDialogType] = useState<"project" | "volume" | "chapter" | "scene" | "character" | "location" | "item" | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedParentGaid, setSelectedParentGaid] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"projects" | "dialogs" | "support" | "settings" | null>("projects");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGaid, setEditingGaid] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingType, setEditingType] = useState<"book" | "volume" | "chapter" | "scene" | null>(null);
  const [editingParentGaid, setEditingParentGaid] = useState<string | null>(null);
  
  // Asset editing state
  const [editingAssetAaid, setEditingAssetAaid] = useState<string | null>(null);
  const [editingAssetTitle, setEditingAssetTitle] = useState("");
  const [editingAssetType, setEditingAssetType] = useState<"character" | "location" | "item" | null>(null);
  const [editingAssetProject, setEditingAssetProject] = useState<string | null>(null);
  const [assetEditDialogOpen, setAssetEditDialogOpen] = useState(false);
  
  // Asset collapsible states per project
  const [projectAssetStates, setProjectAssetStates] = useState<Map<string, { characters: boolean; locations: boolean; items: boolean }>>(new Map());
  
  // Store assets per project
  const [projectAssets, setProjectAssets] = useState<Map<string, { characters: Asset[]; locations: Asset[]; items: Asset[] }>>(new Map());
  
  // Scene asset selection state
  const [selectedSceneCharacters, setSelectedSceneCharacters] = useState<Set<string>>(new Set());
  const [selectedSceneLocations, setSelectedSceneLocations] = useState<Set<string>>(new Set());
  const [selectedSceneItems, setSelectedSceneItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGoals();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data: MeResponse = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const loadGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/workshop/goals", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as GoalsResponse;
        setGoals(data.goals || []);
        // Auto-expand all nodes initially
        const expandAllNodes = (nodes: GoalNode[]): Set<string> => {
          const expanded = new Set<string>();
          const traverse = (nodeList: GoalNode[]) => {
            nodeList.forEach((node) => {
              if (node.children && node.children.length > 0) {
                expanded.add(node.gaid);
                traverse(node.children);
              }
            });
          };
          traverse(nodes);
          return expanded;
        };
        setExpandedNodes(expandAllNodes(data.goals || []));
      }
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async (projectGaid: string) => {
    try {
      const response = await fetch(`/api/workshop/assets?xaid=${projectGaid}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as AssetsResponse;
        const assets = (data.assets || []) as Asset[];
        setCharacters(assets.filter((a: Asset) => a.type_name === "character"));
        setLocations(assets.filter((a: Asset) => a.type_name === "location"));
        setItems(assets.filter((a: Asset) => a.type_name === "item"));
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
    }
  };
  
  // Load assets for a specific project
  const loadProjectAssets = async (projectGaid: string): Promise<{ characters: Asset[]; locations: Asset[]; items: Asset[] }> => {
    try {
      const response = await fetch(`/api/workshop/assets?xaid=${projectGaid}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json() as AssetsResponse;
        const assets = (data.assets || []) as Asset[];
        return {
          characters: assets.filter((a: Asset) => a.type_name === "character"),
          locations: assets.filter((a: Asset) => a.type_name === "location"),
          items: assets.filter((a: Asset) => a.type_name === "item"),
        };
      }
    } catch (error) {
      console.error("Failed to load project assets:", error);
    }
    return { characters: [], locations: [], items: [] };
  };
  
  // Asset management functions
  const handleEditAsset = (asset: Asset) => {
    setEditingAssetAaid(asset.aaid);
    setEditingAssetTitle(asset.title);
    setEditingAssetType(asset.type_name as "character" | "location" | "item");
    // Find project for this asset
    const firstBook = findFirstBook(goals);
    if (firstBook) {
      setEditingAssetProject(firstBook.fullGaid || firstBook.gaid);
    }
    setAssetEditDialogOpen(true);
  };
  
  const handleDeleteAsset = async (aaid: string, typeName: string) => {
    const typeNameRu = typeName === "character" ? "персонажа" : typeName === "location" ? "локацию" : "предмет";
    if (!confirm(`Вы уверены, что хотите удалить этот ${typeNameRu}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/workshop/assets/${aaid}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        // Reload assets for all projects
        const books = goals.filter((g) => g.type === "book");
        for (const book of books) {
          const projectGaid = book.fullGaid || book.gaid;
          const assets = await loadProjectAssets(projectGaid);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaid, assets);
            return newMap;
          });
        }
        // Also reload main assets list
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          await loadAssets(projectGaid);
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка удаления: ${error.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to delete asset:", error);
      alert("Ошибка при удалении");
    }
  };
  
  const handleDuplicateAsset = async (asset: Asset) => {
    try {
      // Find the project this asset belongs to
      const assetProject = goals.find((g) => g.type === "book" && (g.fullGaid === asset.xaid || g.gaid === asset.xaid));
      const projectGaid = assetProject ? (assetProject.fullGaid || assetProject.gaid) : (findFirstBook(goals)?.fullGaid || findFirstBook(goals)?.gaid);
      
      if (!projectGaid) {
        alert("Сначала создайте проект");
        return;
      }
      
      const response = await fetch("/api/workshop/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `${asset.title} (копия)`,
          type_name: asset.type_name,
          xaid: projectGaid,
          gin: asset.gin,
        }),
      });
      
      if (response.ok) {
        // Reload assets for all projects
        const books = goals.filter((g) => g.type === "book");
        for (const book of books) {
          const projectGaid = book.fullGaid || book.gaid;
          const assets = await loadProjectAssets(projectGaid);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaid, assets);
            return newMap;
          });
        }
        // Also reload main assets list
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          await loadAssets(projectGaid);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка дублирования: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to duplicate asset:", error);
      alert("Ошибка при дублировании");
    }
  };
  
  const handleAssignAssetToProject = async (asset: Asset, targetProjectGaid: string) => {
    try {
      const response = await fetch(`/api/workshop/assets/${asset.aaid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          xaid: targetProjectGaid,
        }),
      });
      
      if (response.ok) {
        // Reload assets for all projects
        const books = goals.filter((g) => g.type === "book");
        for (const book of books) {
          const projectGaid = book.fullGaid || book.gaid;
          const assets = await loadProjectAssets(projectGaid);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaid, assets);
            return newMap;
          });
        }
        // Also reload main assets list
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          await loadAssets(projectGaid);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка назначения: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to assign asset:", error);
      alert("Ошибка при назначении");
    }
  };
  
  const handleSaveAsset = async (title: string, projectGaid?: string) => {
    if (!editingAssetAaid || !editingAssetType) return;
    
    try {
      const updateData: any = { title };
      if (projectGaid) {
        updateData.xaid = projectGaid;
      }
      
      const response = await fetch(`/api/workshop/assets/${editingAssetAaid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      
      if (response.ok) {
        // Reload assets for all projects
        const books = goals.filter((g) => g.type === "book");
        for (const book of books) {
          const projectGaid = book.fullGaid || book.gaid;
          const assets = await loadProjectAssets(projectGaid);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaid, assets);
            return newMap;
          });
        }
        // Also reload main assets list
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          await loadAssets(projectGaid);
        }
        setAssetEditDialogOpen(false);
        setEditingAssetAaid(null);
        setEditingAssetTitle("");
        setEditingAssetType(null);
        setEditingAssetProject(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка сохранения: ${errorData.error || "Неизвестная ошибка"}`);
        throw new Error(errorData.error || "Failed to save asset");
      }
    } catch (error) {
      console.error("Failed to save asset:", error);
      throw error;
    }
  };
  
  const toggleProjectAssetSection = (projectGaid: string, section: "characters" | "locations" | "items") => {
    setProjectAssetStates((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(projectGaid) || { characters: false, locations: false, items: false };
      newMap.set(projectGaid, {
        ...current,
        [section]: !current[section],
      });
      return newMap;
    });
  };
  
  const getProjectAssetState = (projectGaid: string, section: "characters" | "locations" | "items"): boolean => {
    return projectAssetStates.get(projectGaid)?.[section] || false;
  };

  const findFirstBook = (nodes: GoalNode[]): GoalNode | null => {
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

  useEffect(() => {
    if (goals.length > 0) {
      // Load assets for all projects
      const loadAllProjectAssets = async () => {
        const books = goals.filter((g) => g.type === "book");
        for (const book of books) {
          const projectGaid = book.fullGaid || book.gaid;
          const assets = await loadProjectAssets(projectGaid);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaid, assets);
            return newMap;
          });
        }
        // Also load for main list (first book)
        const firstBook = findFirstBook(goals);
        if (firstBook) {
          const projectGaid = firstBook.fullGaid || firstBook.gaid;
          loadAssets(projectGaid);
        }
      };
      loadAllProjectAssets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  // Load scene asset selections when scene is opened
  useEffect(() => {
    if (state.currentSceneGaid) {
      loadSceneAssetSelections();
    } else {
      // Clear selections when no scene is selected
      setSelectedSceneCharacters(new Set());
      setSelectedSceneLocations(new Set());
      setSelectedSceneItems(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSceneGaid]);

  const loadSceneAssetSelections = async () => {
    if (!state.currentSceneGaid) return;
    
    try {
      const textResponse = await fetch(`/api/workshop/texts?goal_gaid=${state.currentSceneGaid}`, {
        credentials: "include",
      });
      
      if (textResponse.ok) {
        const textData = await textResponse.json() as TextResponseWrapper;
        if (textData.text?.gin) {
          const gin = typeof textData.text.gin === 'string' 
            ? JSON.parse(textData.text.gin) 
            : textData.text.gin;
          
          if (gin && typeof gin === 'object' && 'assets' in gin) {
            const assets = gin.assets as { characters?: string[]; locations?: string[]; items?: string[] };
            setSelectedSceneCharacters(new Set(assets.characters || []));
            setSelectedSceneLocations(new Set(assets.locations || []));
            setSelectedSceneItems(new Set(assets.items || []));
          }
        }
      } else {
        // Silently handle errors - scene might not have text yet
        console.debug("No text found for scene:", state.currentSceneGaid);
      }
    } catch (error) {
      // Silently handle network errors
      console.debug("Failed to load scene asset selections:", error);
    }
  };

  const saveSceneAssetSelections = async (type: 'characters' | 'locations' | 'items', selected: Set<string>) => {
    if (!state.currentSceneGaid) return;
    
    try {
      // Get current text data
      const textResponse = await fetch(`/api/workshop/texts?goal_gaid=${state.currentSceneGaid}`, {
        credentials: "include",
      });
      
      let currentGin: any = {};
      let currentContent = "";
      let currentTitle = "";
      
      if (textResponse.ok) {
        const textData = await textResponse.json() as TextResponseWrapper;
        if (textData.text) {
          currentContent = textData.text.content || "";
          currentTitle = textData.text.title || "";
          if (textData.text.gin) {
            currentGin = typeof textData.text.gin === 'string' 
              ? JSON.parse(textData.text.gin) 
              : textData.text.gin;
          }
        }
      }
      
      // Update assets in gin
      if (!currentGin.assets) {
        currentGin.assets = {};
      }
      currentGin.assets[type] = Array.from(selected);
      
      // Save updated text
      await fetch(`/api/workshop/texts?goal_gaid=${state.currentSceneGaid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: currentContent,
          title: currentTitle,
          goal_gaid: state.currentSceneGaid,
          gin: currentGin,
        }),
      });
    } catch (error) {
      console.error("Failed to save scene asset selections:", error);
    }
  };

  const findParentForScene = (): string | null => {
    // Find selected chapter, or first chapter in first book
    const firstBook = findFirstBook(goals);
    if (!firstBook) return null;

    const findFirstChapter = (node: GoalNode): GoalNode | null => {
      if (node.type === "chapter") {
        return node;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findFirstChapter(child);
          if (found) return found;
        }
      }
      return null;
    };

    return findFirstChapter(firstBook)?.fullGaid || firstBook.fullGaid || firstBook.gaid;
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

  const statusOptions = [
    { value: "idea", label: "Идея", color: "bg-yellow-500" },
    { value: "draft", label: "Черновик", color: "bg-blue-500" },
    { value: "editor", label: "Редактор", color: "bg-red-500" },
    { value: "done", label: "Готово", color: "bg-green-500" },
  ];

  const handleChangeStatus = async (gaid: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/workshop/goals/${gaid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status_name: newStatus }),
      });
      
      if (response.ok) {
        await loadGoals();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка изменения статуса: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to change status:", error);
      alert("Ошибка при изменении статуса");
    }
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

  const handleDelete = async (gaid: string, type: string) => {
    const typeName = type === "book" ? "проект" : type === "volume" ? "том" : type === "chapter" ? "главу" : "сцену";
    if (!confirm(`Вы уверены, что хотите удалить этот ${typeName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/workshop/goals/${gaid}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        await loadGoals();
        // Clear selection if deleted item was selected
        if (state.currentSceneGaid === gaid || state.currentProjectGaid === gaid || state.currentVolumeGaid === gaid || state.currentChapterGaid === gaid) {
          setCurrentScene(null, null);
          setCurrentProject(null);
        }
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка удаления: ${error.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Ошибка при удалении");
    }
  };

  const handleEdit = async (name: string, parentGaid?: string) => {
    if (!editingGaid) return;

    try {
      const response = await fetch(`/api/workshop/goals/${editingGaid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: name,
          parent_full_gaid: parentGaid,
        }),
      });

      if (response.ok) {
        await loadGoals();
        setEditDialogOpen(false);
        setEditingGaid(null);
        setEditingTitle("");
        setEditingType(null);
        setEditingParentGaid(null);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        console.error("Failed to update goal:", errorData);
        alert(`Ошибка обновления: ${errorData.error || "Неизвестная ошибка"}`);
        throw new Error(errorData.error || "Failed to update goal");
      }
    } catch (error) {
      console.error("Failed to update:", error);
      throw error;
    }
  };

  const handleDuplicate = async (gaid: string, type: string) => {
    try {
      // Find the goal to duplicate
      const findGoal = (nodes: GoalNode[], targetGaid: string): GoalNode | null => {
        for (const node of nodes) {
          if (node.gaid === targetGaid || node.fullGaid === targetGaid) {
            return node;
          }
          if (node.children) {
            const found = findGoal(node.children, targetGaid);
            if (found) return found;
          }
        }
        return null;
      };
      
      const goalToDuplicate = findGoal(goals, gaid);
      if (!goalToDuplicate) {
        alert("Элемент не найден");
        return;
      }
      
      // Get parent for duplicate (same parent as original)
      const findParent = (nodes: GoalNode[], targetGaid: string): GoalNode | null => {
        for (const n of nodes) {
          if (n.children) {
            for (const child of n.children) {
              if (child.gaid === targetGaid || child.fullGaid === targetGaid) {
                return n;
              }
              const found = findParent([child], targetGaid);
              if (found) return found;
            }
          }
        }
        return null;
      };
      
      const parent = findParent(goals, gaid);
      const parentGaid = parent?.fullGaid || parent?.gaid || null;
      
      // Create duplicate with title "Copy of [original title]"
      const duplicateTitle = `Копия ${goalToDuplicate.title}`;
      
      const response = await fetch("/api/workshop/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: duplicateTitle,
          type: type,
          parent_full_gaid: parentGaid,
        }),
      });
      
      if (response.ok) {
        await loadGoals();
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        alert(`Ошибка дублирования: ${errorData.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("Failed to duplicate:", error);
      alert("Ошибка при дублировании");
    }
  };

  const getEditParentOptions = (): Array<{ value: string; label: string }> => {
    if (editingType === "volume") {
      return goals
        .filter((g) => g.type === "book")
        .map((book) => ({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
        }));
    } else if (editingType === "chapter") {
      // For chapters: return flat list (will be grouped in dialog)
      const options: Array<{ value: string; label: string }> = [];
      
      // Add projects
      goals
        .filter((g) => g.type === "book")
        .forEach((book) => {
          options.push({
            value: book.fullGaid || book.gaid,
            label: book.title || "Untitled Project",
          });
        });
      
      // Add volumes
      const volumes: GoalNode[] = [];
      const collectVolumes = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "volume") {
            volumes.push(node);
          }
          if (node.children) {
            collectVolumes(node.children);
          }
        });
      };
      collectVolumes(goals);
      volumes.forEach((volume) => {
        options.push({
          value: volume.fullGaid || volume.gaid,
          label: volume.title || "Untitled Volume",
        });
      });
      
      return options;
    } else if (editingType === "scene") {
      // For scenes: return flat list (will be grouped in dialog)
      const options: Array<{ value: string; label: string }> = [];
      
      // Add projects
      goals
        .filter((g) => g.type === "book")
        .forEach((book) => {
          options.push({
            value: book.fullGaid || book.gaid,
            label: book.title || "Untitled Project",
          });
        });
      
      // Add volumes
      const volumes: GoalNode[] = [];
      const collectVolumes = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "volume") {
            volumes.push(node);
          }
          if (node.children) {
            collectVolumes(node.children);
          }
        });
      };
      collectVolumes(goals);
      volumes.forEach((volume) => {
        options.push({
          value: volume.fullGaid || volume.gaid,
          label: volume.title || "Untitled Volume",
        });
      });
      
      // Add chapters
      const chapters: GoalNode[] = [];
      const collectChapters = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "chapter") {
            chapters.push(node);
          }
          if (node.children) {
            collectChapters(node.children);
          }
        });
      };
      collectChapters(goals);
      chapters.forEach((chapter) => {
        options.push({
          value: chapter.fullGaid || chapter.gaid,
          label: chapter.title || "Untitled Chapter",
        });
      });
      
      return options;
    }
    return [];
  };

  const getEditParentOptionGroups = (): Array<{ label: string; options: Array<{ value: string; label: string }> }> | null => {
    if (editingType === "chapter") {
      // For chapters: group by projects and volumes
      const groups: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];
      
      // Projects group
      const projects = goals
        .filter((g) => g.type === "book")
        .map((book) => ({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
        }));
      if (projects.length > 0) {
        groups.push({ label: "Проекты", options: projects });
      }
      
      // Volumes group
      const volumes: GoalNode[] = [];
      const collectVolumes = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "volume") {
            volumes.push(node);
          }
          if (node.children) {
            collectVolumes(node.children);
          }
        });
      };
      collectVolumes(goals);
      const volumeOptions = volumes.map((volume) => ({
        value: volume.fullGaid || volume.gaid,
        label: volume.title || "Untitled Volume",
      }));
      if (volumeOptions.length > 0) {
        groups.push({ label: "Тома", options: volumeOptions });
      }
      
      return groups.length > 0 ? groups : null;
    } else if (editingType === "scene") {
      // For scenes: group by projects, volumes, and chapters
      const groups: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [];
      
      // Projects group
      const projects = goals
        .filter((g) => g.type === "book")
        .map((book) => ({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
        }));
      if (projects.length > 0) {
        groups.push({ label: "Проекты", options: projects });
      }
      
      // Volumes group
      const volumes: GoalNode[] = [];
      const collectVolumes = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "volume") {
            volumes.push(node);
          }
          if (node.children) {
            collectVolumes(node.children);
          }
        });
      };
      collectVolumes(goals);
      const volumeOptions = volumes.map((volume) => ({
        value: volume.fullGaid || volume.gaid,
        label: volume.title || "Untitled Volume",
      }));
      if (volumeOptions.length > 0) {
        groups.push({ label: "Тома", options: volumeOptions });
      }
      
      // Chapters group
      const chapters: GoalNode[] = [];
      const collectChapters = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "chapter") {
            chapters.push(node);
          }
          if (node.children) {
            collectChapters(node.children);
          }
        });
      };
      collectChapters(goals);
      const chapterOptions = chapters.map((chapter) => ({
        value: chapter.fullGaid || chapter.gaid,
        label: chapter.title || "Untitled Chapter",
      }));
      if (chapterOptions.length > 0) {
        groups.push({ label: "Главы", options: chapterOptions });
      }
      
      return groups.length > 0 ? groups : null;
    }
    return null;
  };

  const renderNode = (node: GoalNode, level: number = 0) => {
    const Icon = getTypeIcon(node.type);
    // Check selection by type and gaid/fullGaid to avoid false matches
    const isSelected = 
      (node.type === "book" && (state.currentProjectGaid === node.gaid || state.currentProjectGaid === node.fullGaid)) ||
      (node.type === "volume" && (state.currentVolumeGaid === node.gaid || state.currentVolumeGaid === node.fullGaid)) ||
      (node.type === "chapter" && (state.currentChapterGaid === node.gaid || state.currentChapterGaid === node.fullGaid)) ||
      (node.type === "scene" && (state.currentSceneGaid === node.gaid || state.currentSceneGaid === node.fullGaid));
    const isScene = node.type === "scene";
    const isBook = node.type === "book";
    const isVolume = node.type === "volume";
    const isChapter = node.type === "chapter";
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.gaid);

    const handleClick = () => {
      const nodeGaid = node.fullGaid || node.gaid;
      if (isBook) {
        setCurrentProject(nodeGaid);
      } else if (isVolume) {
        setCurrentVolume(nodeGaid);
      } else if (isChapter) {
        setCurrentChapter(nodeGaid);
      } else if (isScene) {
        setCurrentScene(nodeGaid, null);
      }
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        toggleNode(node.gaid);
      }
    };

    return (
      <div key={node.gaid} className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group",
            isSelected && "bg-accent/50",
            level > 0 && "ml-4"
          )}
          onClick={handleClick}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={handleToggle}
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
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 text-sm truncate">{node.title || "Untitled"}</span>
          {node.statusName && (
            <Badge
              variant="secondary"
              className={cn("h-5 px-1.5 text-xs border-0", getStatusColor(node.statusName))}
            >
              {getStatusLabel(node.statusName)}
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingGaid(node.gaid);
                  setEditingTitle(node.title);
                  setEditingType(
                    (node.type === "book" || node.type === "volume" || node.type === "chapter" || node.type === "scene")
                      ? (node.type as "book" | "volume" | "chapter" | "scene")
                      : null
                  );
                  // Find current parent by searching through goals tree
                  const findParent = (nodes: GoalNode[], targetGaid: string): GoalNode | null => {
                    for (const n of nodes) {
                      if (n.children) {
                        for (const child of n.children) {
                          if (child.gaid === targetGaid || child.fullGaid === targetGaid) {
                            return n;
                          }
                          const found = findParent([child], targetGaid);
                          if (found) return found;
                        }
                      }
                    }
                    return null;
                  };
                  const parent = findParent(goals, node.gaid);
                  setEditingParentGaid(parent?.fullGaid || parent?.gaid || null);
                  setEditDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              {(node.type === "volume" || node.type === "chapter" || node.type === "scene") && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(node.gaid, node.type);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Дублировать
                </DropdownMenuItem>
              )}
              {node.type === "book" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const nodeGaid = node.fullGaid || node.gaid;
                    setSelectedParentGaid(nodeGaid);
                    setCreateDialogType("volume");
                    setCreateDialogOpen(true);
                  }}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  Добавить том
                </DropdownMenuItem>
              )}
              {node.type === "volume" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const nodeGaid = node.fullGaid || node.gaid;
                    setSelectedParentGaid(nodeGaid);
                    setCreateDialogType("chapter");
                    setCreateDialogOpen(true);
                  }}
                >
                  <BookMarked className="mr-2 h-4 w-4" />
                  Добавить главу
                </DropdownMenuItem>
              )}
              {node.type === "chapter" && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    const nodeGaid = node.fullGaid || node.gaid;
                    setSelectedParentGaid(nodeGaid);
                    setCreateDialogType("scene");
                    setCreateDialogOpen(true);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Добавить сцену
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Изменить статус</DropdownMenuLabel>
              {statusOptions.map((status) => (
                <DropdownMenuItem
                  key={status.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChangeStatus(node.gaid, status.value);
                  }}
                  className={cn(
                    "flex items-center gap-2",
                    node.statusName?.toLowerCase() === status.value && "bg-accent"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", status.color)} />
                  <span>{status.label}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(node.gaid, node.type);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
        {/* Render assets under project */}
        {isBook && isExpanded && (
          <>
            <Separator className="my-2 ml-2" />
            {renderProjectAssets(node)}
          </>
        )}
      </div>
    );
  };
  
  const renderProjectAssets = (project: GoalNode) => {
    const projectGaid = project.fullGaid || project.gaid;
    const assets = projectAssets.get(projectGaid) || { characters: [], locations: [], items: [] };
    
    const renderAssetList = (
      assets: Asset[],
      type: "character" | "location" | "item",
      icon: React.ComponentType<{ className?: string }>,
      sectionKey: "characters" | "locations" | "items"
    ) => {
      const isOpen = getProjectAssetState(projectGaid, sectionKey);
      const typeNameRu = type === "character" ? "Персонажи" : type === "location" ? "Локации" : "Предметы";
      
      return (
        <Collapsible open={isOpen} onOpenChange={() => toggleProjectAssetSection(projectGaid, sectionKey)}>
          <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm ml-2">
            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
              {React.createElement(icon, { className: "h-4 w-4 text-muted-foreground" })}
              <span>{typeNameRu}</span>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-6 w-6 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParentGaid(projectGaid);
                  setCreateDialogType(type);
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
              </button>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-90"
                )}
              />
            </div>
          </div>
          <CollapsibleContent className="ml-6 mt-1">
            {assets.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">
                Нет {type === "character" ? "персонажей" : type === "location" ? "локаций" : "предметов"}
              </div>
            ) : (
              <div className="space-y-1">
                {assets.map((asset) => {
                  const isSelected = state.selectedAssetAaid === asset.aaid;
                  return (
                    <div
                      key={asset.aaid}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors text-sm group",
                        isSelected && "bg-accent/50"
                      )}
                      onClick={() => setSelectedAsset(isSelected ? null : asset.aaid)}
                    >
                      <span className="flex-1 truncate">{asset.title}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAsset(asset);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateAsset(asset);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Дублировать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Назначить под проект</DropdownMenuLabel>
                          {goals
                            .filter((g) => g.type === "book")
                            .map((book) => {
                              const bookGaid = book.fullGaid || book.gaid;
                              const isCurrentProject = bookGaid === projectGaid;
                              return (
                                <DropdownMenuItem
                                  key={book.gaid}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCurrentProject) {
                                      handleAssignAssetToProject(asset, bookGaid);
                                    }
                                  }}
                                  disabled={isCurrentProject}
                                >
                                  {book.title || "Untitled Project"}
                                  {isCurrentProject && " (текущий)"}
                                </DropdownMenuItem>
                              );
                            })}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAsset(asset.aaid, asset.type_name);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    };
    
    return (
      <div className="ml-2 space-y-1 mt-2">
        {renderAssetList(assets.characters, "character", Users, "characters")}
        {renderAssetList(assets.locations, "location", MapPin, "locations")}
        {renderAssetList(assets.items, "item", StickyNote, "items")}
      </div>
    );
  };

  const handleCreateProject = () => {
    setCreateDialogType("project");
    setCreateDialogOpen(true);
  };

  const handleCreateVolume = (parentGaid?: string) => {
    const books = goals.filter((g) => g.type === "book");
    if (books.length === 0) {
      alert("Сначала создайте проект");
      return;
    }
    if (parentGaid) {
      setSelectedParentGaid(parentGaid);
    } else {
      // Set the last project as default
      const lastBook = books[books.length - 1];
      setSelectedParentGaid(lastBook.fullGaid || lastBook.gaid);
    }
    setCreateDialogType("volume");
    setCreateDialogOpen(true);
  };

  const handleCreateChapter = (parentGaid?: string) => {
    if (parentGaid) {
      setSelectedParentGaid(parentGaid);
    }
    setCreateDialogType("chapter");
    setCreateDialogOpen(true);
  };

  const handleCreateScene = (parentGaid?: string) => {
    if (parentGaid) {
      setSelectedParentGaid(parentGaid);
    }
    setCreateDialogType("scene");
    setCreateDialogOpen(true);
  };

  const getVolumeParentOptions = (): Array<{ value: string; label: string }> => {
    return goals
      .filter((g) => g.type === "book")
      .map((book) => ({
        value: book.fullGaid || book.gaid,
        label: book.title || "Untitled Project",
      }));
  };

  const getChapterParentOptions = (): Array<{ value: string; label: string; type: "book" | "volume" }> => {
    const options: Array<{ value: string; label: string; type: "book" | "volume" }> = [];
    
    // Add projects
    goals
      .filter((g) => g.type === "book")
      .forEach((book) => {
        options.push({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
          type: "book",
        });
      });
    
    // Add volumes
    const volumes: GoalNode[] = [];
    const collectVolumes = (nodes: GoalNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "volume") {
          volumes.push(node);
        }
        if (node.children) {
          collectVolumes(node.children);
        }
      });
    };
    collectVolumes(goals);
    volumes.forEach((volume) => {
      options.push({
        value: volume.fullGaid || volume.gaid,
        label: volume.title || "Untitled Volume",
        type: "volume",
      });
    });
    
    return options;
  };

  const getSceneParentOptions = (): Array<{ value: string; label: string; type: "book" | "volume" | "chapter" }> => {
    const options: Array<{ value: string; label: string; type: "book" | "volume" | "chapter" }> = [];
    
    // Add projects
    goals
      .filter((g) => g.type === "book")
      .forEach((book) => {
        options.push({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
          type: "book",
        });
      });
    
    // Add volumes
    const volumes: GoalNode[] = [];
    const collectVolumes = (nodes: GoalNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "volume") {
          volumes.push(node);
        }
        if (node.children) {
          collectVolumes(node.children);
        }
      });
    };
    collectVolumes(goals);
    volumes.forEach((volume) => {
      options.push({
        value: volume.fullGaid || volume.gaid,
        label: volume.title || "Untitled Volume",
        type: "volume",
      });
    });
    
    // Add chapters
    const chapters: GoalNode[] = [];
    const collectChapters = (nodes: GoalNode[]) => {
      nodes.forEach((node) => {
        if (node.type === "chapter") {
          chapters.push(node);
        }
        if (node.children) {
          collectChapters(node.children);
        }
      });
    };
    collectChapters(goals);
    chapters.forEach((chapter) => {
      options.push({
        value: chapter.fullGaid || chapter.gaid,
        label: chapter.title || "Untitled Chapter",
        type: "chapter",
      });
    });
    
    return options;
  };

  const getParentOptions = (): Array<{ value: string; label: string }> => {
    if (createDialogType === "volume") {
      return goals
        .filter((g) => g.type === "book")
        .map((book) => ({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
        }));
    } else if (createDialogType === "chapter") {
      // Get all volumes from all books
      const volumes: GoalNode[] = [];
      const collectVolumes = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "volume") {
            volumes.push(node);
          }
          if (node.children) {
            collectVolumes(node.children);
          }
        });
      };
      collectVolumes(goals);
      return volumes.map((volume) => ({
        value: volume.fullGaid || volume.gaid,
        label: volume.title || "Untitled Volume",
      }));
    } else if (createDialogType === "scene") {
      // Get all chapters from all volumes
      const chapters: GoalNode[] = [];
      const collectChapters = (nodes: GoalNode[]) => {
        nodes.forEach((node) => {
          if (node.type === "chapter") {
            chapters.push(node);
          }
          if (node.children) {
            collectChapters(node.children);
          }
        });
      };
      collectChapters(goals);
      return chapters.map((chapter) => ({
        value: chapter.fullGaid || chapter.gaid,
        label: chapter.title || "Untitled Chapter",
      }));
    } else if (["character", "location", "item"].includes(createDialogType || "")) {
      // Return projects for assets
      return goals
        .filter((g) => g.type === "book")
        .map((book) => ({
          value: book.fullGaid || book.gaid,
          label: book.title || "Untitled Project",
        }));
    }
    return [];
  };


  const handleCreateCharacter = () => {
    setCreateDialogType("character");
    setCreateDialogOpen(true);
  };

  const handleCreateLocation = () => {
    setCreateDialogType("location");
    setCreateDialogOpen(true);
  };

  const handleCreateItem = () => {
    setCreateDialogType("item");
    setCreateDialogOpen(true);
  };

  const handleCreateNote = async () => {
    // TODO: Implement note creation
    console.log("Create new note");
  };

  const handleCreate = async (name: string, parentGaid?: string) => {
    if (parentGaid) {
      setSelectedParentGaid(parentGaid);
    }
    if (!createDialogType) return;

    try {
      if (createDialogType === "project") {
        let response: Response;
        try {
          response = await fetch("/api/workshop/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: name,
              type: "book",
            }),
          });
        } catch (fetchError) {
          console.error("Network error creating project:", fetchError);
          alert(`Ошибка сети при создании проекта: ${fetchError instanceof Error ? fetchError.message : "Не удалось выполнить запрос"}`);
          throw fetchError;
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log("Project created:", data);
          await loadGoals();
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` })) as { error?: string };
          console.error("Failed to create project:", errorData);
          alert(`Ошибка создания проекта: ${errorData.error || "Неизвестная ошибка"}`);
          throw new Error(errorData.error || "Failed to create project");
        }
      } else if (createDialogType === "volume" || createDialogType === "chapter" || createDialogType === "scene") {
        const parentGaidToUse = parentGaid || selectedParentGaid;
        if (!parentGaidToUse) {
          alert("Не найден родительский элемент");
          return;
        }
        
        let response: Response;
        try {
          response = await fetch("/api/workshop/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: name,
              type: createDialogType,
              parent_full_gaid: parentGaidToUse,
            }),
          });
        } catch (fetchError) {
          console.error(`Network error creating ${createDialogType}:`, fetchError);
          alert(`Ошибка сети при создании: ${fetchError instanceof Error ? fetchError.message : "Не удалось выполнить запрос"}`);
          throw fetchError;
        }
        
        if (response.ok) {
          await loadGoals();
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` })) as { error?: string };
          console.error(`Failed to create ${createDialogType}:`, errorData);
          alert(`Ошибка создания: ${errorData.error || "Неизвестная ошибка"}`);
          throw new Error(errorData.error || `Failed to create ${createDialogType}`);
        }
      } else if (["character", "location", "item"].includes(createDialogType)) {
        const projectGaidToUse = parentGaid || selectedParentGaid || findFirstBook(goals)?.fullGaid || findFirstBook(goals)?.gaid;
        if (!projectGaidToUse) {
          alert("Сначала создайте проект");
          return;
        }
        
        let response: Response;
        try {
          response = await fetch("/api/workshop/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: name,
              type_name: createDialogType,
              xaid: projectGaidToUse,
            }),
          });
        } catch (fetchError) {
          console.error(`Network error creating ${createDialogType}:`, fetchError);
          alert(`Ошибка сети при создании ${createDialogType === "character" ? "персонажа" : createDialogType === "location" ? "локации" : "предмета"}: ${fetchError instanceof Error ? fetchError.message : "Не удалось выполнить запрос"}`);
          throw fetchError;
        }
        
        if (response.ok) {
          // Reload assets for the project
          const assets = await loadProjectAssets(projectGaidToUse);
          setProjectAssets((prev) => {
            const newMap = new Map(prev);
            newMap.set(projectGaidToUse, assets);
            return newMap;
          });
          // Also reload main assets list if this is the first book
          const firstBook = findFirstBook(goals);
          if (firstBook && (firstBook.fullGaid || firstBook.gaid) === projectGaidToUse) {
            await loadAssets(projectGaidToUse);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` })) as { error?: string };
          console.error(`Failed to create ${createDialogType}:`, errorData);
          alert(`Ошибка создания ${createDialogType === "character" ? "персонажа" : createDialogType === "location" ? "локации" : "предмета"}: ${errorData.error || "Неизвестная ошибка"}`);
          throw new Error(errorData.error || `Failed to create ${createDialogType}`);
        }
      }
    } catch (error) {
      console.error("Failed to create:", error);
      // Re-throw to prevent dialog from closing on error
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-sm">NeuroPublisher</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleCreateProject}>
                <BookOpen className="mr-2 h-4 w-4" />
                Новый проект
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Folder className="mr-2 h-4 w-4" />
                  Новый том
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {getVolumeParentOptions().length === 0 ? (
                    <DropdownMenuItem disabled>
                      Нет проектов
                    </DropdownMenuItem>
                  ) : (
                    getVolumeParentOptions().map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleCreateVolume(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <BookMarked className="mr-2 h-4 w-4" />
                  Новая глава
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {getChapterParentOptions().length === 0 ? (
                    <DropdownMenuItem disabled>
                      Нет проектов или томов
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {getChapterParentOptions()
                        .filter((opt) => opt.type === "book")
                        .length > 0 && (
                        <>
                          <DropdownMenuLabel>Проекты</DropdownMenuLabel>
                          {getChapterParentOptions()
                            .filter((opt) => opt.type === "book")
                            .map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleCreateChapter(option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          {getChapterParentOptions().filter((opt) => opt.type === "volume").length > 0 && (
                            <DropdownMenuSeparator />
                          )}
                        </>
                      )}
                      {getChapterParentOptions().filter((opt) => opt.type === "volume").length > 0 && (
                        <>
                          <DropdownMenuLabel>Тома</DropdownMenuLabel>
                          {getChapterParentOptions()
                            .filter((opt) => opt.type === "volume")
                            .map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleCreateChapter(option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FileText className="mr-2 h-4 w-4" />
                  Новая сцена
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {getSceneParentOptions().length === 0 ? (
                    <DropdownMenuItem disabled>
                      Нет проектов, томов или глав
                    </DropdownMenuItem>
                  ) : (
                    <>
                      {getSceneParentOptions().filter((opt) => opt.type === "book").length > 0 && (
                        <>
                          <DropdownMenuLabel>Проекты</DropdownMenuLabel>
                          {getSceneParentOptions()
                            .filter((opt) => opt.type === "book")
                            .map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleCreateScene(option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          {(getSceneParentOptions().filter((opt) => opt.type === "volume").length > 0 ||
                            getSceneParentOptions().filter((opt) => opt.type === "chapter").length > 0) && (
                            <DropdownMenuSeparator />
                          )}
                        </>
                      )}
                      {getSceneParentOptions().filter((opt) => opt.type === "volume").length > 0 && (
                        <>
                          <DropdownMenuLabel>Тома</DropdownMenuLabel>
                          {getSceneParentOptions()
                            .filter((opt) => opt.type === "volume")
                            .map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleCreateScene(option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                          {getSceneParentOptions().filter((opt) => opt.type === "chapter").length > 0 && (
                            <DropdownMenuSeparator />
                          )}
                        </>
                      )}
                      {getSceneParentOptions().filter((opt) => opt.type === "chapter").length > 0 && (
                        <>
                          <DropdownMenuLabel>Главы</DropdownMenuLabel>
                          {getSceneParentOptions()
                            .filter((opt) => opt.type === "chapter")
                            .map((option) => (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => handleCreateScene(option.value)}
                              >
                                {option.label}
                              </DropdownMenuItem>
                            ))}
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="px-2 py-2 border-b space-y-1">
        <Button
          variant={activeSection === "projects" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setActiveSection("projects");
            // Collapse all projects when switching away
            if (activeSection !== "projects") {
              setExpandedNodes(new Set());
            }
          }}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Проекты
        </Button>
        <Button
          variant={activeSection === "dialogs" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setActiveSection("dialogs");
            // Collapse all projects
            setExpandedNodes(new Set());
          }}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Диалоги
        </Button>
        <Button
          variant={activeSection === "support" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setActiveSection("support");
            // Collapse all projects
            setExpandedNodes(new Set());
          }}
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Поддержка
        </Button>
        <Button
          variant={activeSection === "settings" ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setActiveSection("settings");
            // Collapse all projects
            setExpandedNodes(new Set());
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Настройки
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {activeSection === "projects" && (
            <>
              {loading ? (
                <div className="text-sm text-muted-foreground p-4">Загрузка...</div>
              ) : goals.length === 0 ? (
                <div className="text-sm text-muted-foreground p-4 text-center">
                  <p className="mb-2">Нет проектов</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateProject}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Создать проект
                  </Button>
                </div>
              ) : (
                goals.map((goal) => renderNode(goal))
              )}
            </>
          )}
          {activeSection === "dialogs" && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Диалоги</p>
              <p className="text-xs mt-2">Раздел в разработке</p>
            </div>
          )}
          {activeSection === "support" && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Поддержка</p>
              <p className="text-xs mt-2">Раздел в разработке</p>
            </div>
          )}
          {activeSection === "settings" && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Настройки</p>
              <p className="text-xs mt-2">Раздел в разработке</p>
            </div>
          )}
        </div>
      </ScrollArea>
      <CreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title={
          createDialogType === "project"
            ? "Создать проект"
            : createDialogType === "volume"
            ? "Создать том"
            : createDialogType === "chapter"
            ? "Создать главу"
            : createDialogType === "scene"
            ? "Создать сцену"
            : createDialogType === "character"
            ? "Создать персонажа"
            : createDialogType === "location"
            ? "Создать локацию"
            : createDialogType === "item"
            ? "Создать предмет"
            : "Создать"
        }
        placeholder={
          createDialogType === "project"
            ? "Название проекта..."
            : createDialogType === "volume"
            ? "Название тома..."
            : createDialogType === "chapter"
            ? "Название главы..."
            : createDialogType === "scene"
            ? "Название сцены..."
            : createDialogType === "character"
            ? "Имя персонажа..."
            : createDialogType === "location"
            ? "Название локации..."
            : createDialogType === "item"
            ? "Название предмета..."
            : "Введите название..."
        }
        onCreate={handleCreate}
        showParentSelect={["character", "location", "item"].includes(createDialogType || "")}
        parentOptions={getParentOptions()}
        selectedParent={selectedParentGaid || undefined}
        onParentChange={(value) => setSelectedParentGaid(value)}
      />
      <CreateDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingGaid(null);
            setEditingTitle("");
            setEditingType(null);
            setEditingParentGaid(null);
          }
        }}
        title={
          editingType === "volume"
            ? "Редактировать том"
            : editingType === "chapter"
            ? "Редактировать главу"
            : editingType === "scene"
            ? "Редактировать сцену"
            : "Редактировать"
        }
        placeholder="Введите новое название..."
        onCreate={handleEdit}
        showParentSelect={editingType === "volume" || editingType === "chapter" || editingType === "scene"}
        parentOptionGroups={editingType === "chapter" || editingType === "scene" ? getEditParentOptionGroups() || undefined : undefined}
        parentOptions={editingType === "volume" ? getEditParentOptions() : undefined}
        selectedParent={editingParentGaid || undefined}
        onParentChange={(value) => setEditingParentGaid(value)}
        initialValue={editingTitle}
      />
      <CreateDialog
        open={assetEditDialogOpen}
        onOpenChange={setAssetEditDialogOpen}
        title={
          editingAssetType === "character"
            ? "Редактировать персонажа"
            : editingAssetType === "location"
            ? "Редактировать локацию"
            : editingAssetType === "item"
            ? "Редактировать предмет"
            : "Редактировать"
        }
        placeholder="Введите новое название..."
        onCreate={handleSaveAsset}
        showParentSelect={true}
        parentOptions={goals
          .filter((g) => g.type === "book")
          .map((book) => ({
            value: book.fullGaid || book.gaid,
            label: book.title || "Untitled Project",
          }))}
        selectedParent={editingAssetProject || undefined}
        onParentChange={(value) => setEditingAssetProject(value)}
        initialValue={editingAssetTitle}
      />
      {user && (
        <div className="border-t p-2">
          <UserMenu
            user={{
              name: user.name || "User",
              email: user.email || "",
              avatar: "/avatars/placeholder-user.jpg",
            }}
          />
        </div>
      )}
    </div>
  );
}

function UserMenu({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light", false);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (e) {
      router.push("/");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-2 hover:bg-accent"
        >
          <Avatar className="h-8 w-8 rounded-lg mr-2">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-lg">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium truncate">{user.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="right"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck className="mr-2 h-4 w-4" />
            Аккаунт
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            Уведомления
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Sun className="mr-2 h-4 w-4" />
            )}
            {theme === "light" ? "Темный режим" : "Светлый режим"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

