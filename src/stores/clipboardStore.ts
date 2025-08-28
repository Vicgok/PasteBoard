import { create } from "zustand";

export interface ClipboardItem {
  id: string;
  content: string;
  created_at: string;
  device_name: string;
  device_id: string;
  content_type: "text" | "code" | "url" | "other";
  user_id: string;
}

interface ClipboardState {
  // State
  items: ClipboardItem[];
  activeContent: string;
  selectedType: "text" | "code" | "url" | "other";
  loading: boolean;
  lastFetch: number | null;

  // Actions
  setItems: (items: ClipboardItem[]) => void;
  addItem: (item: ClipboardItem) => void;
  updateItem: (id: string, updates: Partial<ClipboardItem>) => void;
  deleteItem: (id: string) => void;
  setActiveContent: (content: string) => void;
  setSelectedType: (type: "text" | "code" | "url" | "other") => void;
  setLoading: (loading: boolean) => void;
  setLastFetch: (timestamp: number) => void;
  clearItems: () => void;
}

export const useClipboardStore = create<ClipboardState>()((set) => ({
  // Initial state
  items: [],
  activeContent: "",
  selectedType: "text",
  loading: false,
  lastFetch: null,

  // Actions
  setItems: (items) => set({ items, lastFetch: Date.now() }),
  addItem: (item) =>
    set((state) => ({
      items: [item, ...state.items.slice(0, 49)], // Keep only 50 items
    })),
  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  setActiveContent: (content) => set({ activeContent: content }),
  setSelectedType: (type) => set({ selectedType: type }),
  setLoading: (loading) => set({ loading }),
  setLastFetch: (timestamp) => set({ lastFetch: timestamp }),
  clearItems: () => set({ items: [], lastFetch: null }),
}));
