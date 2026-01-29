"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/packages/components/ui/select";
import { Label } from "@/components/ui/label";

interface ParentOption {
  value: string;
  label: string;
  type?: "book" | "volume" | "chapter";
}

interface ParentOptionGroup {
  label: string;
  options: ParentOption[];
}

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  placeholder?: string;
  onCreate: (name: string, parentGaid?: string) => Promise<void>;
  showParentSelect?: boolean;
  parentOptions?: Array<{ value: string; label: string }>;
  parentOptionGroups?: ParentOptionGroup[];
  selectedParent?: string;
  onParentChange?: (value: string) => void;
  initialValue?: string;
}

export function CreateDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Enter name...",
  onCreate,
  showParentSelect = false,
  parentOptions = [],
  parentOptionGroups,
  selectedParent,
  onParentChange,
  initialValue,
}: CreateDialogProps & { initialValue?: string }) {
  const [name, setName] = useState(initialValue || "");
  const [loading, setLoading] = useState(false);
  const [parentGaid, setParentGaid] = useState(selectedParent || "");

  React.useEffect(() => {
    if (open) {
      // Set initial value if provided (for editing), otherwise reset
      setName(initialValue || "");
      if (selectedParent) {
        setParentGaid(selectedParent);
      } else if (showParentSelect) {
        // Try to get first option from groups or flat options
        const firstOption = parentOptionGroups?.[0]?.options?.[0] || parentOptions[0];
        if (firstOption) {
          setParentGaid(firstOption.value);
          onParentChange?.(firstOption.value);
        } else {
          setParentGaid("");
        }
      } else {
        setParentGaid("");
      }
    }
  }, [open, selectedParent, showParentSelect, parentOptions, parentOptionGroups, onParentChange, initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (showParentSelect && !parentGaid) {
      alert("Пожалуйста, выберите проект");
      return;
    }

    try {
      setLoading(true);
      await onCreate(name.trim(), showParentSelect ? parentGaid : undefined);
      setName("");
      setParentGaid("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating:", error);
      // Error is already handled in onCreate with alert
      // Don't close dialog on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="py-4 space-y-4">
            {showParentSelect && (parentOptionGroups && parentOptionGroups.length > 0 || parentOptions.length > 0) && (
              <div className="space-y-2">
                <Label htmlFor="parent">
                  {title.includes("том") 
                    ? "Родительский проект" 
                    : title.includes("главу")
                    ? "Родитель"
                    : title.includes("сцену")
                    ? "Родитель"
                    : "Родительский элемент"}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={parentGaid}
                  onValueChange={(value) => {
                    setParentGaid(value);
                    onParentChange?.(value);
                  }}
                  disabled={loading}
                  required
                >
                  <SelectTrigger id="parent" className={!parentGaid ? "border-destructive" : ""}>
                    <SelectValue 
                      placeholder={
                        title.includes("том")
                          ? "Выберите проект"
                          : title.includes("главу")
                          ? "Выберите проект или том"
                          : title.includes("сцену")
                          ? "Выберите проект, том или главу"
                          : title.includes("персонаж") || title.includes("локаци") || title.includes("предмет")
                          ? "Выберите проект"
                          : "Выберите родительский элемент"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptionGroups && parentOptionGroups.length > 0 ? (
                      // Render grouped options
                      parentOptionGroups.map((group, groupIndex) => (
                        <SelectGroup key={groupIndex}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))
                    ) : (
                      // Render flat options (backward compatibility)
                      parentOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Название</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={placeholder}
                autoFocus
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim() || (showParentSelect && !parentGaid)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {title.includes("Редактировать") ? "Сохранить" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

