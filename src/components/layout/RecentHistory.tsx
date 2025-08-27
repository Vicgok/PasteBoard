import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/shadcn_ui/card";
import { Badge } from "@/components/shadcn_ui/badge";
import { Pencil, Trash2, Clipboard, RefreshCw } from "lucide-react";
import { Input } from "@/components/shadcn_ui/input";
import { Button } from "@/components/shadcn_ui/button";
import { Textarea } from "@/components/shadcn_ui/textarea";
import { ScrollArea } from "@/components/shadcn_ui/scroll-area";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/shadcn_ui/dialog";
type ClipboardType = "text" | "code" | "url" | "other";
interface ClipboardItem {
  id: string;
  content: string;
  created_at: string;
  device_name: string;
  device_id: string;
  content_type: ClipboardType;
  user_id: string;
}

interface RecentHistoryProps {
  user?: { id: string; email: string; name?: string } | null;
  maxItems?: number;
  refreshTrigger?: number;
}

const RecentHistory: React.FC<RecentHistoryProps> = ({
  user,
  maxItems = 5,
  refreshTrigger,
}) => {
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<ClipboardItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState<"text" | "code" | "url" | "other">(
    "text"
  );
  // 🔹 useCallback ensures stable reference & prevents double fetch
  const loadHistory = useCallback(async () => {
    if (!user?.id) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from("clipboard_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(maxItems);

      if (supabaseError) throw supabaseError;
      setHistory(data || []);
    } catch (err) {
      setError(`Failed to load history: ${err}`);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, maxItems]);

  // Load once when user or maxItems changes
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Refresh manually when parent triggers
  useEffect(() => {
    if (refreshTrigger && user?.id) {
      setTimeout(() => loadHistory(), 500);
    }
  }, [refreshTrigger, user?.id, loadHistory]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`recent_history_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clipboard_entries",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as ClipboardItem;
            setHistory((prev) => {
              if (prev.some((item) => item.id === newItem.id)) return prev;
              return [newItem, ...prev.slice(0, maxItems - 1)];
            });
            toast.success("New clipboard entry saved!");
          }
          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as ClipboardItem;
            setHistory((prev) =>
              prev.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              )
            );
          }
          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setHistory((prev) => prev.filter((item) => item.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, maxItems]);

  // Helpers
  const getColorScheme = (type: string) => {
    switch (type.toLowerCase()) {
      case "code":
        return "from-purple-100 to-purple-50";
      case "url":
        return "from-orange-100 to-orange-50";
      case "text":
        return "from-green-100 to-green-50";
      default:
        return "from-indigo-100 to-indigo-50";
    }
  };

  const formatTime = (dateString: string) => {
    const diff = Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 60000
    );
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440)
      return `${Math.floor(diff / 60)} hour${diff >= 120 ? "s" : ""} ago`;
    return `${Math.floor(diff / 1440)} day${diff >= 2880 ? "s" : ""} ago`;
  };

  const truncateContent = (content: string, maxLength = 50) =>
    content.length <= maxLength ? content : content.slice(0, maxLength) + "...";

  const getDisplayType = (item: ClipboardItem) => {
    if (/^\d{6}$/.test(item.content)) return "OTP";
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.content)) return "Email";
    return (
      item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)
    );
  };

  const handleHistoryItemClick = async (item: ClipboardItem) => {
    try {
      await navigator.clipboard.writeText(item.content);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const editClipboardEntry = async (
    id: string,
    updatedContent: string,
    updatedType: "text" | "code" | "url" | "other"
  ) => {
    try {
      const { error } = await supabase
        .from("clipboard_entries")
        .update({
          content: updatedContent,
          content_type: updatedType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Clipboard entry updated");
      loadHistory(); // refresh
    } catch (err) {
      console.error("Error updating clipboard entry:", err);
      toast.error("Failed to update entry");
    }
  };

  return (
    <>
      <Card className="shadow-md rounded-2xl flex flex-col justify-between h-full p-4">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Recent History
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadHistory}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="link"
              className="text-xs text-blue-500"
              onClick={() => setViewAllOpen(true)}
            >
              View All
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-center">
          <ScrollArea className="h-[450px] pr-2">
            <div className="space-y-3">
              {loading && history.length === 0 && (
                <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading
                  history...
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center py-8 text-red-500 text-sm">
                  {error}
                </div>
              )}
              {user && !loading && history.length === 0 && !error && (
                <p className="text-center text-sm text-gray-500">
                  No clipboard history yet
                </p>
              )}

              {history.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border bg-gradient-to-r ${getColorScheme(
                    item.content_type
                  )} 
                  flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer group`}
                  onClick={() => handleHistoryItemClick(item)}
                >
                  <div className="flex-1 min-w-0">
                    <Badge className="text-xs mb-1" variant="secondary">
                      {getDisplayType(item)}
                    </Badge>
                    <div className="text-sm font-medium truncate">
                      {truncateContent(item.content)}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>{formatTime(item.created_at)}</span>
                      {item.device_name && (
                        <>
                          <span>•</span>
                          <span>{item.device_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Clipboard className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      {/* View all dialog */}
      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              Clipboard History
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="mb-3">
            <Input
              placeholder="Search clipboard history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Scrollable List */}
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-3">
              {history
                .filter((item) =>
                  item.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border bg-white flex items-center justify-between hover:shadow transition`}
                  >
                    <div className="flex-1 min-w-0">
                      <Badge className="text-xs mb-1" variant="secondary">
                        {getDisplayType(item)}
                      </Badge>
                      <div className="text-sm font-medium truncate">
                        {item.content}
                      </div>
                      <div className="text-xs text-gray-500 flex gap-2">
                        <span>{formatTime(item.created_at)}</span>
                        <span>• {item.device_name || "Unknown"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(item.content)
                        }
                        className="p-1 hover:text-blue-500"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setEditContent(item.content);
                          setEditType(item.content_type);
                          setEditOpen(true);
                        }}
                        className="p-1 hover:text-green-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from("clipboard_entries")
                            .delete()
                            .eq("id", item.id);
                          if (error) toast.error("Failed to delete");
                          else toast.success("Deleted successfully");
                        }}
                        className="p-1 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit in view all */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Clipboard Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none h-28"
              placeholder="Edit clipboard content..."
            />

            <div className="flex gap-2 flex-wrap">
              {["text", "code", "url", "other"].map((type) => (
                <button
                  key={type}
                  onClick={() => setEditType(type as ClipboardType)}
                  className={`px-3 py-1 rounded-lg border text-sm transition-all ${
                    editType === type
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!editItem) return;
                editClipboardEntry(editItem.id, editContent, editType);
                setEditOpen(false);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecentHistory;
