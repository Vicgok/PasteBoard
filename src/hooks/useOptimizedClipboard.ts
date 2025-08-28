import { useCallback, useEffect, useMemo } from "react";
import {
  useAuthStore,
  useClipboardStore,
  type ClipboardItem,
} from "@/stores/index";
import { clipboardService } from "@/services/clipboardService";
import { toast } from "sonner";
import { useDebounce } from "./useDebounce";

export function useClipboard() {
  const { user } = useAuthStore();
  const {
    items,
    activeContent,
    selectedType,
    loading,
    setActiveContent,
    setSelectedType,
  } = useClipboardStore();

  // Debounce active content to reduce unnecessary re-renders
  const debouncedActiveContent = useDebounce(activeContent, 300);

  // Setup real-time subscription when user changes
  useEffect(() => {
    if (!user?.id) return;

    clipboardService.setupRealTimeSubscription(user.id);
    clipboardService.fetchClipboardHistory(user.id, 50);

    return () => {
      clipboardService.cleanupRealTimeSubscription();
    };
  }, [user?.id]);

  // Memoized recent items (last 10)
  const recentItems = useMemo(() => items.slice(0, 10), [items]);

  // Optimized save function with deduplication
  const saveClipboardEntry = useCallback(
    async (content: string, contentType: string) => {
      if (!user?.id) {
        toast.error("User not authenticated");
        return false;
      }

      if (!content.trim()) {
        toast.error("No content to save");
        return false;
      }

      // Check for duplicate content in recent items
      const isDuplicate = recentItems.some(
        (item) =>
          item.content === content &&
          Date.now() - new Date(item.created_at).getTime() < 60000 // 1 minute
      );

      if (isDuplicate) {
        toast.info("Similar content was recently saved");
        return false;
      }

      try {
        await clipboardService.saveClipboardEntry(
          content,
          contentType,
          user.id
        );
        return true;
      } catch (error) {
        console.error("Error saving clipboard entry:", error);
        toast.error("Failed to save clipboard entry");
        return false;
      }
    },
    [user?.id, recentItems]
  );

  // Optimized copy function
  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Copied to clipboard!");
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, []);

  // Optimized paste function
  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setActiveContent(text);
      return text;
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      toast.error("Failed to paste from clipboard");
      return null;
    }
  }, [setActiveContent]);

  // Auto-detect content type
  const detectContentType = useCallback((content: string) => {
    if (content.match(/^https?:\/\//)) return "url";
    if (
      content.match(/[{}();]/) ||
      content.includes("function") ||
      content.includes("const ") ||
      content.includes("import ") ||
      content.includes("class ") ||
      content.includes("def ") ||
      content.includes("<?php") ||
      content.includes("<script")
    )
      return "code";
    return "text";
  }, []);

  return {
    // State
    items,
    recentItems,
    activeContent,
    debouncedActiveContent,
    selectedType,
    loading,

    // Actions
    setActiveContent,
    setSelectedType,
    saveClipboardEntry,
    copyToClipboard,
    pasteFromClipboard,
    detectContentType,

    // Service methods
    fetchHistory: (forceRefresh = false) =>
      user?.id
        ? clipboardService.fetchClipboardHistory(user.id, 50, forceRefresh)
        : Promise.resolve([]),
    updateEntry: (id: string, updates: Partial<ClipboardItem>) =>
      clipboardService.updateClipboardEntry(id, updates),
    deleteEntry: (id: string) => clipboardService.deleteClipboardEntry(id),
  };
}
