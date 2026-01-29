"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, Pencil, X } from "lucide-react";
import { useWorkshop } from "../WorkshopProvider";
import { AssetResponse, AssetsResponse } from "@/shared/types/shared";

interface Asset {
  aaid: string;
  title: string;
  type_name: string;
  gin?: any;
}

interface Relation {
  uuid: string;
  sourceEntity: string;
  targetEntity: string;
  type: string;
  gin?: {
    timeline?: Array<{
      state: string;
      intensity: number;
      contextSummary: string;
      validFromChapterAid?: string;
      validToChapterAid?: string;
    }>;
  };
}

export function ContextPanel() {
  const { state } = useWorkshop();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [editDescription, setEditDescription] = useState("");
  const [editPsychotype, setEditPsychotype] = useState("");
  const [editAppearance, setEditAppearance] = useState("");
  const [editTraits, setEditTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (state.selectedAssetAaid) {
        await loadSelectedAsset();
      } else if (state.currentSceneGaid) {
        await loadContext();
      } else {
        // Clear everything if nothing is selected
        setAssets([]);
        setRelations([]);
        setSelectedAsset(null);
        setLoading(false);
        setAssetLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentSceneGaid, state.selectedAssetAaid]);

  const loadContext = async () => {
    try {
      setLoading(true);
      setSelectedAsset(null);
      const response = await fetch(
        `/api/workshop/context?goal_gaid=${state.currentSceneGaid}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json() as { assets?: AssetResponse[]; relations?: any[] };
        setAssets((data.assets || []) as Asset[]);
        setRelations(data.relations || []);
      } else {
        // Silently handle errors
        console.debug("Failed to load context, status:", response.status);
        setAssets([]);
        setRelations([]);
      }
    } catch (error) {
      // Silently handle network errors
      console.debug("Failed to load context:", error);
      setAssets([]);
      setRelations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedAsset = async () => {
    if (!state.selectedAssetAaid) {
      setSelectedAsset(null);
      return;
    }
    
    try {
      setAssetLoading(true);
      setSelectedAsset(null); // Clear previous asset
      setAssets([]); // Clear scene context
      setRelations([]); // Clear relations
      const response = await fetch(
        `/api/workshop/assets/${state.selectedAssetAaid}`,
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json() as { asset?: AssetResponse };
        if (data.asset) {
          setSelectedAsset(data.asset as Asset);
        } else {
          console.error("Asset data is missing in response:", data);
          setSelectedAsset(null);
        }
      } else if (response.status === 404) {
        // Asset not found - silently handle
        setSelectedAsset(null);
      } else {
        // Other errors - log for debugging
        const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        console.error("Failed to load asset:", response.status, errorData);
        setSelectedAsset(null);
      }
    } catch (error) {
      // Network errors - log for debugging
      console.error("Failed to load asset:", error);
      setSelectedAsset(null);
    } finally {
      setAssetLoading(false);
    }
  };

  // Initialize edit form when entering edit mode or when asset changes
  // This hook must be at the top level, not inside conditional blocks
  useEffect(() => {
    if (selectedAsset) {
      const currentGin = typeof selectedAsset.gin === 'string' 
        ? JSON.parse(selectedAsset.gin) 
        : selectedAsset.gin || {};
      
      if (isEditing) {
        setEditDescription(currentGin.description || "");
        setEditPsychotype(currentGin.psychotype || "");
        setEditAppearance(currentGin.appearance || "");
        setEditTraits(currentGin.traits && Array.isArray(currentGin.traits) ? [...currentGin.traits] : []);
      } else {
        // Reset form when exiting edit mode
        setEditDescription("");
        setEditPsychotype("");
        setEditAppearance("");
        setEditTraits([]);
        setNewTrait("");
      }
    }
  }, [isEditing, selectedAsset]);

  if (loading || assetLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  // Show selected asset details
  if (state.selectedAssetAaid) {
    if (assetLoading || !selectedAsset) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p>Загрузка данных персонажа...</p>
          </div>
        </div>
      );
    }
    const gin = typeof selectedAsset.gin === 'string' 
      ? JSON.parse(selectedAsset.gin) 
      : selectedAsset.gin || {};

    const handleSave = async () => {
      if (!state.selectedAssetAaid) return;

      try {
        setSaving(true);
        const updatedGin = {
          ...gin,
          description: editDescription || undefined,
          psychotype: selectedAsset.type_name === "character" ? (editPsychotype || undefined) : undefined,
          appearance: selectedAsset.type_name === "character" ? (editAppearance || undefined) : undefined,
          traits: selectedAsset.type_name === "character" && editTraits.length > 0 ? editTraits : undefined,
        };

        // Remove undefined values
        Object.keys(updatedGin).forEach(key => {
          if (updatedGin[key] === undefined) {
            delete updatedGin[key];
          }
        });

        const response = await fetch(`/api/workshop/assets/${state.selectedAssetAaid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            gin: updatedGin,
          }),
        });

        if (response.ok) {
          const data = await response.json() as { asset?: AssetResponse };
          setSelectedAsset(data.asset as Asset);
          setIsEditing(false);
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
          console.error("Failed to save asset:", errorData);
          alert(`Ошибка сохранения: ${errorData.error || "Неизвестная ошибка"}`);
        }
      } catch (error) {
        console.error("Failed to save asset:", error);
        alert("Ошибка при сохранении");
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      setIsEditing(false);
      // Reset form to original values
      setEditDescription(gin.description || "");
      setEditPsychotype(gin.psychotype || "");
      setEditAppearance(gin.appearance || "");
      setEditTraits(gin.traits && Array.isArray(gin.traits) ? [...gin.traits] : []);
    };

    const handleAddTrait = () => {
      if (newTrait.trim() && !editTraits.includes(newTrait.trim())) {
        setEditTraits([...editTraits, newTrait.trim()]);
        setNewTrait("");
      }
    };

    const handleRemoveTrait = (traitToRemove: string) => {
      setEditTraits(editTraits.filter(t => t !== traitToRemove));
    };

    return (
      <ScrollArea className="h-full p-4">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedAsset.title}</CardTitle>
                  <CardDescription>
                    {selectedAsset.type_name === "character" && "Персонаж"}
                    {selectedAsset.type_name === "location" && "Локация"}
                    {selectedAsset.type_name === "item" && "Предмет"}
                  </CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Сохранение..." : "Сохранить"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAsset.type_name === "character" && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Описание</h4>
                    {isEditing ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Опишите персонажа..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {gin.description || <span className="italic text-muted-foreground/50">Нет описания</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Психотип</h4>
                    {isEditing ? (
                      <Input
                        value={editPsychotype}
                        onChange={(e) => setEditPsychotype(e.target.value)}
                        placeholder="Психотип персонажа..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {gin.psychotype || <span className="italic text-muted-foreground/50">Не указан</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Внешность</h4>
                    {isEditing ? (
                      <Textarea
                        value={editAppearance}
                        onChange={(e) => setEditAppearance(e.target.value)}
                        placeholder="Опишите внешность персонажа..."
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {gin.appearance || <span className="italic text-muted-foreground/50">Не описана</span>}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Черты характера</h4>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {editTraits.map((trait, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {trait}
                              <button
                                type="button"
                                onClick={() => handleRemoveTrait(trait)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newTrait}
                            onChange={(e) => setNewTrait(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTrait();
                              }
                            }}
                            placeholder="Добавить черту..."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddTrait}
                          >
                            Добавить
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {gin.traits && Array.isArray(gin.traits) && gin.traits.length > 0 ? (
                          gin.traits.map((trait: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {trait}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm italic text-muted-foreground/50">Нет черт характера</span>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
              {(selectedAsset.type_name === "location" || selectedAsset.type_name === "item") && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Описание</h4>
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Опишите локацию/предмет..."
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {gin.description || <span className="italic text-muted-foreground/50">Нет описания</span>}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    );
  }

  if (!state.currentSceneGaid && !state.selectedAssetAaid) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p>Нет выбранной сцены или персонажа</p>
          <p className="text-sm mt-2">Выберите сцену или персонажа для просмотра контекста</p>
        </div>
      </div>
    );
  }

  const characters = assets.filter((a) => a.type_name === "character");

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Characters in Scene</h3>
          {characters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No characters found</p>
          ) : (
            <div className="space-y-2">
              {characters.map((character) => (
                <Card key={character.aaid}>
                  <CardHeader>
                    <CardTitle className="text-sm">{character.title}</CardTitle>
                    {character.gin?.psychotype && (
                      <CardDescription>{character.gin.psychotype}</CardDescription>
                    )}
                  </CardHeader>
                  {character.gin?.traits && character.gin.traits.length > 0 && (
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {character.gin.traits.map((trait: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {relations.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Relationships</h3>
            <div className="space-y-2">
              {relations.map((relation) => {
                const currentState = relation.gin?.timeline?.find(
                  (t) =>
                    (!t.validFromChapterAid || t.validFromChapterAid <= state.currentSceneGaid!) &&
                    (!t.validToChapterAid || t.validToChapterAid >= state.currentSceneGaid!)
                );
                return (
                  <Card key={relation.uuid}>
                    <CardContent className="pt-4">
                      <div className="text-sm">
                        <span className="font-medium">{relation.sourceEntity}</span>
                        <span className="mx-2 text-muted-foreground">
                          {currentState?.state || relation.type}
                        </span>
                        <span className="font-medium">{relation.targetEntity}</span>
                      </div>
                      {currentState?.contextSummary && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {currentState.contextSummary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

