"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface WorkshopState {
  currentSceneGaid: string | null;
  currentTextTaid: string | null;
  currentProjectGaid: string | null;
  currentVolumeGaid: string | null; // Added for volume selection
  currentChapterGaid: string | null; // Added for chapter selection
  zenMode: boolean;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  selectedAssetAaid: string | null;
  // Store previous panel visibility state before entering zen mode
  prevLeftPanelVisible: boolean;
  prevRightPanelVisible: boolean;
}

interface WorkshopContextType {
  state: WorkshopState;
  setCurrentScene: (gaid: string | null, taid: string | null) => void;
  setCurrentProject: (gaid: string | null) => void;
  setCurrentVolume: (gaid: string | null) => void; // Added
  setCurrentChapter: (gaid: string | null) => void; // Added
  setZenMode: (enabled: boolean) => void;
  setLeftPanelVisible: (visible: boolean) => void;
  setRightPanelVisible: (visible: boolean) => void;
  setSelectedAsset: (aaid: string | null) => void;
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export function WorkshopProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkshopState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("workshop-state");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      currentSceneGaid: null,
      currentTextTaid: null,
      currentProjectGaid: null,
      currentVolumeGaid: null,
      currentChapterGaid: null,
      zenMode: false,
      leftPanelVisible: true,
      rightPanelVisible: true,
      selectedAssetAaid: null,
      prevLeftPanelVisible: true,
      prevRightPanelVisible: true,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("workshop-state", JSON.stringify(state));
    }
  }, [state]);

  const setCurrentScene = (gaid: string | null, taid: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      currentSceneGaid: gaid, 
      currentTextTaid: taid, 
      currentProjectGaid: null,
      currentVolumeGaid: null,
      currentChapterGaid: null
    }));
  };

  const setCurrentProject = (gaid: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      currentProjectGaid: gaid, 
      currentSceneGaid: null, 
      currentTextTaid: null,
      currentVolumeGaid: null,
      currentChapterGaid: null
    }));
  };

  const setCurrentVolume = (gaid: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      currentVolumeGaid: gaid,
      currentProjectGaid: null,
      currentChapterGaid: null,
      currentSceneGaid: null, 
      currentTextTaid: null
    }));
  };

  const setCurrentChapter = (gaid: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      currentChapterGaid: gaid,
      currentProjectGaid: null,
      currentVolumeGaid: null,
      currentSceneGaid: null, 
      currentTextTaid: null
    }));
  };

  const setZenMode = (enabled: boolean) => {
    setState((prev) => {
      if (enabled) {
        // Entering zen mode: save current visibility and hide panels
        return {
          ...prev,
          zenMode: true,
          prevLeftPanelVisible: prev.leftPanelVisible,
          prevRightPanelVisible: prev.rightPanelVisible,
          leftPanelVisible: false,
          rightPanelVisible: false,
        };
      } else {
        // Exiting zen mode: restore previous visibility
        return {
          ...prev,
          zenMode: false,
          leftPanelVisible: prev.prevLeftPanelVisible,
          rightPanelVisible: prev.prevRightPanelVisible,
        };
      }
    });
  };

  const setLeftPanelVisible = (visible: boolean) => {
    setState((prev) => ({ ...prev, leftPanelVisible: visible }));
  };

  const setRightPanelVisible = (visible: boolean) => {
    setState((prev) => ({ ...prev, rightPanelVisible: visible }));
  };

  const setSelectedAsset = (aaid: string | null) => {
    setState((prev) => ({ 
      ...prev, 
      selectedAssetAaid: aaid,
      // Clear other selections when selecting an asset, but keep scene open
      currentProjectGaid: null,
      currentVolumeGaid: null,
      currentChapterGaid: null,
      // Don't clear currentSceneGaid and currentTextTaid to keep scene open
    }));
  };

  return (
    <WorkshopContext.Provider
      value={{
        state,
        setCurrentScene,
        setCurrentProject,
        setCurrentVolume,
        setCurrentChapter,
        setZenMode,
        setLeftPanelVisible,
        setRightPanelVisible,
        setSelectedAsset,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop() {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error("useWorkshop must be used within WorkshopProvider");
  }
  return context;
}

