"use client";

import { create } from "zustand";

export type LayoutMode =
  | "tree"
  | "force"
  | "galaxy"
  | "circular"
  | "architecture"
  | "module"
  | "heatmap"
  | "folder"
  | "network";

export type AgentName =
  | "planner_agent"
  | "repository_analyzer"
  | "architect_agent"
  | "bug_hunter_agent"
  | "security_agent"
  | "performance_agent"
  | "documentation_agent"
  | "reviewer_agent"
  | "learning_agent"
  | "feature_suggestion_agent";

export interface GraphStoreState {
  // Navigation & Depth Level (Level 1 to 5)
  drillLevel: number; // 1: Root, 2: Folders, 3: Files, 4: Symbols, 5: Agent Overlays
  expandedNodeIds: Set<string>;

  // Layout & View Options
  layoutMode: LayoutMode;

  // Agent Traversal Overlays
  selectedAgent: AgentName | null;

  // Inspector Selection & Hover
  selectedNodeId: string | null;
  hoveredNode: any | null;
  hoverPos: { x: number; y: number } | null;

  // Search & Filtering
  searchQuery: string;
  selectedLanguage: string | null;
  selectedRisk: "all" | "critical" | "high" | "medium" | "low";
  selectedFolderFilter: string | null;

  // Actions
  setDrillLevel: (level: number) => void;
  toggleExpandNode: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSelectedAgent: (agent: AgentName | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setHoveredNode: (node: any | null, pos?: { x: number; y: number } | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedLanguage: (lang: string | null) => void;
  setSelectedRisk: (risk: "all" | "critical" | "high" | "medium" | "low") => void;
  setSelectedFolderFilter: (folder: string | null) => void;
}

export const useGraphStore = create<GraphStoreState>((set) => ({
  drillLevel: 2,
  expandedNodeIds: new Set(["root", "backend"]),

  layoutMode: "tree",
  selectedAgent: null,

  selectedNodeId: null,
  hoveredNode: null,
  hoverPos: null,

  searchQuery: "",
  selectedLanguage: null,
  selectedRisk: "all",
  selectedFolderFilter: null,

  setDrillLevel: (drillLevel) => set({ drillLevel }),

  toggleExpandNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.expandedNodeIds);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { expandedNodeIds: next };
    }),

  collapseAll: () => set({ expandedNodeIds: new Set(["root"]) }),
  expandAll: () => set({ expandedNodeIds: new Set(["*"]) }),

  setLayoutMode: (layoutMode) => set({ layoutMode }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent, drillLevel: selectedAgent ? 5 : 2 }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setHoveredNode: (hoveredNode, hoverPos = null) => set({ hoveredNode, hoverPos }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedLanguage: (selectedLanguage) => set({ selectedLanguage }),
  setSelectedRisk: (selectedRisk) => set({ selectedRisk }),
  setSelectedFolderFilter: (selectedFolderFilter) => set({ selectedFolderFilter }),
}));
