import React, { useState, useEffect } from "react";
import {
  Clipboard,
  Trash2,
  Search,
  Copy,
  Check,
  X,
  Code,
  Globe,
  Type,
  Hash,
} from "lucide-react";
import { Button } from "../shadcn_ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn_ui/card";
import { Textarea } from "../shadcn_ui/textarea";
import { Badge } from "../shadcn_ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface ClipboardItem {
  id: string;
  content: string;
  created_at: Date;
  device_name: string;
  content_type: "text" | "code" | "url" | "other";
}

interface ActiveClipBoardProps {
  onClipboardUpdate?: () => void; // Callback to notify parent of clipboard updates
}

const ActiveClipBoard: React.FC<ActiveClipBoardProps> = ({
  onClipboardUpdate,
}) => {
  // State Management
  const [clipboardContent, setClipboardContent] = useState<string>("");
  const [selectedType, setSelectedType] = useState<
    "text" | "code" | "url" | "other"
  >("text");
  // const [isLive, setIsLive] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [pasteSuccess, setPasteSuccess] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Quick Actions State
  const [showSearchDialog, setShowSearchDialog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data State
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([]);

  // Content type options
  const contentTypes = [
    { value: "text", label: "Text", icon: Type, color: "text-gray-500" },
    { value: "code", label: "Code", icon: Code, color: "text-blue-500" },
    { value: "url", label: "URL", icon: Globe, color: "text-green-500" },
    { value: "other", label: "Other", icon: Hash, color: "text-purple-500" },
  ] as const;

  const initialized = React.useRef(false);
  // Initialize user and fetch data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          console.log("User authenticated:", user.id);
          setUserId(user.id);
          await fetchClipboardHistory(user.id);
        } else {
          console.log("No user found");
          setUserId(null);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        toast.error("Authentication error");
      }
    };
    if (!initialized.current) {
      initialized.current = true;
      initializeUser();
    }
  }, []);

  // Auto-detect content type
  useEffect(() => {
    if (clipboardContent) {
      const detectedType = detectContentType(clipboardContent);
      setSelectedType(detectedType);
    }
  }, [clipboardContent]);

  useEffect(() => {
    if (!userId) return;
    fetchClipboardHistory(userId);
    const channel = supabase
      .channel("clipboard_entries")
      .on(
        "postgres_changes",
        {
          event: "*", // listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "clipboard_entries",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Realtime change received:", payload);
          fetchClipboardHistory(userId); // re-fetch data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
  // Supabase Functions
  const fetchClipboardHistory = async (userId: string): Promise<void> => {
    try {
      console.log("Fetching clipboard history for user:", userId);

      const { data, error } = await supabase
        .from("clipboard_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Fetched clipboard data:", data);

      const formattedHistory =
        data?.map((item) => ({
          id: item.id,
          content: item.content,
          created_at: new Date(item.created_at),
          device_name: item.device_name || "Unknown Device",
          content_type: item.content_type as "text" | "code" | "url" | "other",
        })) || [];

      setClipboardHistory(formattedHistory);
    } catch (error) {
      console.error("Error fetching clipboard history:", error);
      toast.error("Failed to load clipboard history");
    }
  };

  const saveClipboardEntry = async (
    content: string,
    contentType: string
  ): Promise<boolean> => {
    if (!userId) {
      console.error("No userId found when saving clipboard entry");
      toast.error("User not authenticated");
      return false;
    }

    try {
      console.log("Saving clipboard entry:", {
        userId,
        content: content.substring(0, 50),
        contentType,
      });

      // Detect device name
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

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Successfully saved clipboard entry:", data);

      // Add to local state
      const newItem: ClipboardItem = {
        id: data.id,
        content: data.content,
        created_at: new Date(data.created_at),
        device_name: data.device_name,
        content_type: data.content_type,
      };

      setClipboardHistory((prev) => [newItem, ...prev.slice(0, 49)]);

      // Notify parent component
      if (onClipboardUpdate) {
        onClipboardUpdate();
      }

      return true;
    } catch (error) {
      console.error("Error saving clipboard entry:", error);
      toast.error("Failed to save clipboard entry");
      return false;
    }
  };

  // const saveNote = async (
  //   title: string,
  //   content: string,
  //   tags: string[]
  // ): Promise<void> => {
  //   if (!userId) {
  //     toast.error("User not authenticated");
  //     return;
  //   }

  //   try {
  //     const { data, error } = await supabase
  //       .from("notes")
  //       .insert([
  //         {
  //           user_id: userId,
  //           title: title,
  //           content: content,
  //           tags: tags,
  //         },
  //       ])
  //       .select()
  //       .single();

  //     if (error) throw error;

  //     const newNote: Note = {
  //       id: data.id,
  //       title: data.title,
  //       content: data.content,
  //       created_at: new Date(data.created_at),
  //       tags: data.tags || [],
  //     };

  //     setNotes((prev) => [newNote, ...prev]);
  //     toast.success("Note saved successfully!");
  //   } catch (error) {
  //     console.error("Error saving note:", error);
  //     toast.error("Failed to save note");
  //   }
  // };

  // const createSharedLink = async (content: string): Promise<string> => {
  //   if (!userId) {
  //     throw new Error("User not authenticated");
  //   }

  //   const shareId = Math.random().toString(36).substr(2, 9);
  //   const shareUrl = `https://pasteboard.app/share/${shareId}`;
  //   const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  //   const { data, error } = await supabase
  //     .from("shared_links")
  //     .insert([
  //       {
  //         user_id: userId,
  //         share_id: shareId,
  //         url: shareUrl,
  //         content: content,
  //         expires_at: expiresAt.toISOString(),
  //       },
  //     ])
  //     .select()
  //     .single();

  //   if (error) throw error;

  //   const newSharedLink: ShareableLink = {
  //     id: data.id,
  //     share_id: data.share_id,
  //     url: data.url,
  //     content: data.content,
  //     expires_at: new Date(data.expires_at),
  //     views: data.views,
  //   };

  //   setSharedLinks((prev) => [newSharedLink, ...prev]);
  //   return shareUrl;
  // };

  // Core Clipboard Functions
  const handleCopy = async (): Promise<void> => {
    if (!clipboardContent.trim()) {
      toast.error("No content to copy");
      return;
    }

    try {
      // First copy to system clipboard
      await navigator.clipboard.writeText(clipboardContent);
      setCopySuccess(true);

      console.log("Content copied to clipboard, now saving to database...");

      // Then save to Supabase
      const saved = await saveClipboardEntry(clipboardContent, selectedType);

      if (saved) {
        toast.success("Copied and saved to history!");
      } else {
        toast.success("Copied to clipboard (but not saved to history)");
      }

      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardContent(text);
      setPasteSuccess(true);
      setTimeout(() => setPasteSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
      toast.error("Failed to paste from clipboard");
    }
  };

  const handleClear = (): void => {
    setClipboardContent("");
  };

  const detectContentType = (
    content: string
  ): "text" | "code" | "url" | "other" => {
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
  };

  // Quick Actions Functions
  // const handleShareLink = async (): Promise<void> => {
  //   if (!clipboardContent.trim()) {
  //     toast.error("No content to share");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const shareUrl = await createSharedLink(clipboardContent);
  //     setShareableLink(shareUrl);
  //     setShowShareDialog(true);
  //   } catch (error) {
  //     console.error("Error in handleShareLink:", error);
  //     toast.error("Failed to create shareable link");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleQuickNote = (): void => {
  //   if (!clipboardContent.trim()) {
  //     toast.error("No content to save as note");
  //     return;
  //   }
  //   setNoteTitle(
  //     clipboardContent.substring(0, 50) +
  //       (clipboardContent.length > 50 ? "..." : "")
  //   );
  //   setShowNoteDialog(true);
  // };

  // const handleSaveNote = async (): Promise<void> => {
  //   if (!noteTitle.trim()) return;

  //   const tags = noteTags
  //     .split(",")
  //     .map((tag) => tag.trim())
  //     .filter((tag) => tag.length > 0);

  //   await saveNote(noteTitle, clipboardContent, tags);
  //   setShowNoteDialog(false);
  //   setNoteTitle("");
  //   setNoteTags("");
  // };

  const handleSearch = (): void => {
    setShowSearchDialog(true);
  };

  const searchResults = clipboardHistory.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // const copyShareableLink = async (): Promise<void> => {
  //   try {
  //     await navigator.clipboard.writeText(shareableLink);
  //     toast.success("Link copied to clipboard!");
  //   } catch (error) {
  //     console.error("Failed to copy link:", error);
  //   }
  // };

  return (
    <>
      {/* Main Card */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            {/* <span
              className={`h-3 w-3 rounded-full ${
                isLive ? "bg-blue-500 animate-pulse" : "bg-gray-400"
              }`}
            /> */}
            Active Clipboard
          </CardTitle>
          {/* <Badge className="text-sm" variant={isLive ? "default" : "outline"}>
            {isLive ? "Live" : "Offline"}
          </Badge> */}
        </CardHeader>

        <CardContent className="flex flex-col space-y-6 h-full">
          {/* Content Type Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Content Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {contentTypes.map((type) => {
                const IconComponent = type.icon;
                const isSelected = selectedType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${
                        isSelected ? "text-blue-500" : type.color
                      }`}
                    />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            placeholder="Your clipboard content will appear here..."
            className="resize-none h-32 text-base"
            value={clipboardContent}
            onChange={(e) => setClipboardContent(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 h-12"
              onClick={handleCopy}
              disabled={!clipboardContent.trim() || !userId}
            >
              {copySuccess ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <Clipboard className="h-5 w-5 mr-2" />
              )}
              {copySuccess ? "Copied!" : "Copy"}
            </Button>

            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handlePaste}
            >
              {pasteSuccess ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <Copy className="h-5 w-5 mr-2" />
              )}
              {pasteSuccess ? "Pasted!" : "Paste"}
            </Button>

            <Button
              variant="outline"
              className="text-red-500 border-red-300 hover:bg-red-50 h-12 px-6"
              onClick={handleClear}
              disabled={!clipboardContent.trim()}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="mt-auto">
            <Card
              className="p-4 flex flex-col items-center gap-0 justify-center text-center hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 border hover:border-pink-200"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 mb-2 text-pink-500" />
              <span className="text-sm font-medium">Search</span>
              <span className="text-xs text-gray-500 mt-1">
                Find in history
              </span>
            </Card>
          </div>
          {/* <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="">
              <Card
                className="p-6 flex flex-col items-center justify-center text-center hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 border-2 hover:border-blue-200"
                onClick={handleShareLink}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
                ) : (
                  <Link className="h-6 w-6 text-blue-500 mb-3" />
                )}
                <span className="font-medium">Share Link</span>
                <span className="text-xs text-gray-500 mt-1">
                  Create shareable URL
                </span>
              </Card>

              <Card
                className="p-6 flex flex-col items-center justify-center text-center hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 border-2 hover:border-purple-200"
                onClick={handleQuickNote}
              >
                <FileText className="h-6 w-6 mb-3 text-purple-500" />
                <span className="font-medium">Quick Note</span>
                <span className="text-xs text-gray-500 mt-1">Save as note</span>
              </Card>

              <Card
                className="p-6  flex flex-col items-center justify-center text-center hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 border-2 hover:border-pink-200"
                onClick={handleSearch}
              >
                <Search className="h-6 w-6 mb-3 text-pink-500" />
                <span className="font-medium">Search</span>
                <span className="text-xs text-gray-500 mt-1">
                  Find in history
                </span>
              </Card>
            </div>
          </div> */}
        </CardContent>
      </Card>

      {/* Modal Overlay with Blur Effect */}
      {showSearchDialog && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Share Dialog */}
          {/* {showShareDialog && (
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-lg">
                  Shareable Link Created
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowShareDialog(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-gray-600">
                  Your content has been packaged into a secure link that expires
                  in 24 hours.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <Button size="sm" onClick={copyShareableLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Link expires in 24 hours • 0 views
                </div>
              </CardContent>
            </Card>
          )} */}

          {/* Note Dialog */}
          {/* {showNoteDialog && (
            <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-lg">Save as Note</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNoteDialog(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Note Title
                  </label>
                  <input
                    type="text"
                    placeholder="Enter note title..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="work, code, important..."
                    value={noteTags}
                    onChange={(e) => setNoteTags(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Content Preview
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm max-h-20 overflow-y-auto">
                    {clipboardContent || "No content"}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNoteDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveNote}
                    disabled={!noteTitle.trim()}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          )} */}

          {/* Search Dialog */}
          {showSearchDialog && (
            <Card className="w-full max-w-md max-h-96 shadow-2xl animate-in zoom-in-95 duration-200">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <CardTitle className="text-lg">
                  Search Clipboard History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearchDialog(false)}
                  className="hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <input
                  type="text"
                  placeholder="Search your clipboard history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        setClipboardContent(item.content);
                        setSelectedType(item.content_type);
                        setShowSearchDialog(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const typeConfig = contentTypes.find(
                            (t) => t.value === item.content_type
                          );
                          const IconComponent = typeConfig?.icon || Type;
                          return (
                            <IconComponent
                              className={`h-4 w-4 ${
                                typeConfig?.color || "text-gray-500"
                              }`}
                            />
                          );
                        })()}
                        <Badge variant="outline" className="text-xs">
                          {item.content_type}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium truncate">
                        {item.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.created_at.toLocaleString()} • {item.device_name}
                      </div>
                    </div>
                  ))}
                  {searchQuery && searchResults.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <div>No results found</div>
                      <div className="text-xs">Try a different search term</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default ActiveClipBoard;
