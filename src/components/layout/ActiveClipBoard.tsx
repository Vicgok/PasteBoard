import React, { useState, useEffect } from "react";
import {
  Clipboard,
  Trash2,
  FileText,
  Search,
  Link,
  Copy,
  Check,
  X,
  Save,
} from "lucide-react";
import { Button } from "../shadcn_ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn_ui/card";
import { Textarea } from "../shadcn_ui/textarea";
import { Badge } from "../shadcn_ui/badge";
import { toast } from "sonner";

interface ClipboardItem {
  id: string;
  content: string;
  timestamp: Date;
  device: string;
  type: "text" | "code" | "url" | "other";
}

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  tags: string[];
}

interface ShareableLink {
  id: string;
  url: string;
  content: string;
  expiresAt: Date;
  views: number;
}

const ActiveClipBoard: React.FC = () => {
  // State Management
  const [clipboardContent, setClipboardContent] = useState<string>("");
  const [isLive, setIsLive] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [pasteSuccess, setPasteSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Quick Actions State
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [showNoteDialog, setShowNoteDialog] = useState<boolean>(false);
  const [showSearchDialog, setShowSearchDialog] = useState<boolean>(false);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Mock Data (In real app, this would come from API/Context)
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([
    {
      id: "1",
      content: 'console.log("Hello World");',
      timestamp: new Date(Date.now() - 3600000),
      device: "MacBook Pro",
      type: "code",
    },
    {
      id: "2",
      content: "https://github.com/pasteboard/app",
      timestamp: new Date(Date.now() - 7200000),
      device: "iPhone 15",
      type: "url",
    },
  ]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedLinks, setSharedLinks] = useState<ShareableLink[]>([]);

  // Simulate real-time clipboard sync
  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate receiving clipboard content from other devices
        // In real implementation, this would be WebSocket/Server-Sent Events
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // Core Clipboard Functions
  const handleCopy = async (): Promise<void> => {
    if (!clipboardContent.trim()) return;

    try {
      await navigator.clipboard.writeText(clipboardContent);
      setCopySuccess(true);

      // Add to clipboard history
      const newItem: ClipboardItem = {
        id: Date.now().toString(),
        content: clipboardContent,
        timestamp: new Date(),
        device: "Current Device",
        type: detectContentType(clipboardContent),
      };
      setClipboardHistory((prev) => [newItem, ...prev.slice(0, 49)]); // Keep last 50 items

      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
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
      content.includes("const ")
    )
      return "code";
    return "text";
  };

  // Quick Actions Functions
  const handleShareLink = async (): Promise<void> => {
    if (!clipboardContent.trim()) {
      toast.error("No content to share", {
        position: "top-center",
        richColors: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to create shareable link
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const linkId = Math.random().toString(36).substr(2, 9);
      const shareUrl = `https://pasteboard.app/share/${linkId}`;

      const newSharedLink: ShareableLink = {
        id: linkId,
        url: shareUrl,
        content: clipboardContent,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        views: 0,
      };

      setSharedLinks((prev) => [newSharedLink, ...prev]);
      setShareableLink(shareUrl);
      setShowShareDialog(true);
    } catch (error) {
      console.log("error in handleShareLink=>", error);
      toast.error("Failed to create shareable link", {
        position: "top-center",
        richColors: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNote = (): void => {
    if (!clipboardContent.trim()) {
      toast.error("No content to save as note", {
        position: "top-center",
        richColors: true,
      });
      return;
    }
    setNoteTitle(
      clipboardContent.substring(0, 50) +
        (clipboardContent.length > 50 ? "..." : "")
    );
    setShowNoteDialog(true);
  };

  const handleSaveNote = (): void => {
    if (!noteTitle.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteTitle,
      content: clipboardContent,
      timestamp: new Date(),
      tags: [],
    };

    setNotes((prev) => [newNote, ...prev]);
    setShowNoteDialog(false);
    setNoteTitle("");
    alert("Note saved successfully!");
  };

  const handleSearch = (): void => {
    setShowSearchDialog(true);
  };

  const searchResults = clipboardHistory.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyShareableLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      toast.success("Link copied to clipboard!", {
        position: "top-center",
        richColors: true,
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  return (
    <>
      {/* Main Card */}
      <Card className="shadow-lg rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span
              className={`h-3 w-3 rounded-full ${
                isLive ? "bg-blue-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            Active Clipboard
          </CardTitle>
          <Badge className="text-sm" variant={isLive ? "default" : "outline"}>
            {isLive ? "Live" : "Offline"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
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
              disabled={!clipboardContent.trim()}
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
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-4">
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
                className="p-6 flex flex-col items-center justify-center text-center hover:shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 border-2 hover:border-pink-200"
                onClick={handleSearch}
              >
                <Search className="h-6 w-6 mb-3 text-pink-500" />
                <span className="font-medium">Search</span>
                <span className="text-xs text-gray-500 mt-1">
                  Find in history
                </span>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Overlay with Blur Effect */}
      {(showShareDialog || showNoteDialog || showSearchDialog) && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Share Dialog */}
          {showShareDialog && (
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
          )}

          {/* Note Dialog */}
          {showNoteDialog && (
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
          )}

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
                        setShowSearchDialog(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="text-sm font-medium truncate">
                        {item.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.timestamp.toLocaleString()} • {item.device}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.type}
                      </Badge>
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
