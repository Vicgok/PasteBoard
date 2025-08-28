import { supabase } from "@/lib/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useClipboardStore, type ClipboardItem } from "@/stores/index";
class ClipboardService {
  private realTimeSubscription: RealtimeChannel | null = null;
  private pendingRequests: Map<
    string,
    Promise<ClipboardItem[] | ClipboardItem | boolean>
  > = new Map();
  //   private lastFetchTimestamp = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache

  async fetchClipboardHistory(
    userId: string,
    limit = 50,
    forceRefresh = false
  ) {
    const { items, lastFetch, setItems, setLoading } =
      useClipboardStore.getState();

    // Return cached data if still fresh and not forcing refresh
    if (
      !forceRefresh &&
      lastFetch &&
      Date.now() - lastFetch < this.CACHE_DURATION &&
      items.length > 0
    ) {
      return items;
    }

    // Check for pending request to prevent duplicates
    const requestKey = `fetch-${userId}-${limit}`;
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const fetchPromise = (async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("clipboard_entries")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formattedItems: ClipboardItem[] =
          data?.map((item) => ({
            id: item.id,
            content: item.content,
            created_at: item.created_at,
            device_name: item.device_name || "Unknown Device",
            device_id: item.device_id || "",
            content_type: item.content_type,
            user_id: item.user_id,
          })) || [];

        setItems(formattedItems);
        return formattedItems;
      } catch (error) {
        console.error("Error fetching clipboard history:", error);
        throw error;
      } finally {
        setLoading(false);
        this.pendingRequests.delete(requestKey);
      }
    })();

    this.pendingRequests.set(requestKey, fetchPromise);
    return fetchPromise;
  }

  async saveClipboardEntry(
    content: string,
    contentType: string,
    userId: string
  ) {
    const { addItem } = useClipboardStore.getState();

    // Prevent duplicate saves for same content
    const saveKey = `save-${userId}-${content.substring(0, 50)}`;
    if (this.pendingRequests.has(saveKey)) {
      return this.pendingRequests.get(saveKey);
    }

    const savePromise = (async () => {
      try {
        const deviceName = navigator.userAgent.includes("Mobile")
          ? "Mobile Device"
          : "Desktop";

        const { data, error } = await supabase
          .from("clipboard_entries")
          .insert([
            {
              user_id: userId,
              content: content,
              content_type: contentType,
              device_name: deviceName,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        const newItem: ClipboardItem = {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          device_name: data.device_name,
          device_id: data.device_id || "",
          content_type: data.content_type,
          user_id: data.user_id,
        };

        addItem(newItem);
        return newItem;
      } catch (error) {
        console.error("Error saving clipboard entry:", error);
        throw error;
      } finally {
        this.pendingRequests.delete(saveKey);
      }
    })();

    this.pendingRequests.set(saveKey, savePromise);
    return savePromise;
  }

  async updateClipboardEntry(id: string, updates: Partial<ClipboardItem>) {
    const { updateItem } = useClipboardStore.getState();

    try {
      const { data, error } = await supabase
        .from("clipboard_entries")
        .update({
          content: updates.content,
          content_type: updates.content_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      updateItem(id, data);
      return data;
    } catch (error) {
      console.error("Error updating clipboard entry:", error);
      throw error;
    }
  }

  async deleteClipboardEntry(id: string) {
    const { deleteItem } = useClipboardStore.getState();

    try {
      const { error } = await supabase
        .from("clipboard_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      deleteItem(id);
      return true;
    } catch (error) {
      console.error("Error deleting clipboard entry:", error);
      throw error;
    }
  }

  setupRealTimeSubscription(userId: string) {
    if (this.realTimeSubscription) return;

    const { addItem, updateItem, deleteItem } = useClipboardStore.getState();

    this.realTimeSubscription = supabase
      .channel(`clipboard_entries_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clipboard_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as ClipboardItem;
            addItem(newItem);
          }
          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as ClipboardItem;
            updateItem(updatedItem.id, updatedItem);
          }
          if (payload.eventType === "DELETE") {
            deleteItem(payload.old.id);
          }
        }
      )
      .subscribe();
  }

  cleanupRealTimeSubscription() {
    if (this.realTimeSubscription) {
      supabase.removeChannel(this.realTimeSubscription);
      this.realTimeSubscription = null;
    }
  }

  cleanup() {
    this.cleanupRealTimeSubscription();
    this.pendingRequests.clear();
  }
}

export const clipboardService = new ClipboardService();
