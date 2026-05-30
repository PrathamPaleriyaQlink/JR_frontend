import React, { useState, useEffect, useRef } from "react";
import {
  UserCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  History,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_WEB_BASE } from "@/lib/api";

const API_BASE = API_WEB_BASE;

const formatDuration = (seconds = 0) => {
  const value = Number(seconds) || 0;
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${minutes}m ${remaining}s` : `${minutes}m`;
};

const shortUrl = (url = "") => {
  if (!url) return "Unknown";
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
};

export default function AdminAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [downloadingSessionId, setDownloadingSessionId] = useState(null);
  const [downloadingAllUsers, setDownloadingAllUsers] = useState(false);
  const chatEndRef = useRef(null);

  const normalizeTimestamp = (timestamp) => {
    if (!timestamp) return "";
    if (typeof timestamp === "string") return timestamp;
    if (timestamp?.$date) return timestamp.$date;
    return "";
  };

  const toCsvCell = (value) => {
    const text = String(value ?? "").replace(/"/g, '""');
    return `"${text}"`;
  };

  const sanitizeFileName = (value) => {
    return String(value || "chat")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 120);
  };

  const createChatPdfAndDownload = (userData) => {
    const sessionId = userData?.session_id || "unknown_session";
    const userName = userData?.user_name || "Unknown User";
    const chatHistory = Array.isArray(userData?.chat_history)
      ? userData.chat_history
      : [];

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const marginY = 42;
    const lineHeight = 16;
    const maxTextWidth = pageWidth - marginX * 2;
    let cursorY = marginY;

    const ensureSpace = (requiredHeight = lineHeight) => {
      if (cursorY + requiredHeight <= pageHeight - marginY) return;
      doc.addPage();
      cursorY = marginY;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Chat History", marginX, cursorY);
    cursorY += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const metaLines = [
      `User: ${userName}`,
      `Session ID: ${sessionId}`,
      `Total Messages: ${chatHistory.length}`,
      `Generated: ${new Date().toLocaleString()}`,
    ];

    metaLines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, marginX, cursorY);
      cursorY += lineHeight;
    });

    cursorY += 10;

    if (chatHistory.length === 0) {
      ensureSpace(lineHeight);
      doc.text("No messages found.", marginX, cursorY);
    } else {
      chatHistory.forEach((msg, index) => {
        const role = msg?.role || "unknown";
        const timestamp = normalizeTimestamp(msg?.timestamp);
        const content = String(msg?.content || "").replace(/\s+/g, " ").trim();
        const header = `${index + 1}. ${role}${timestamp ? ` | ${timestamp}` : ""}`;

        doc.setFont("helvetica", "bold");
        ensureSpace(lineHeight);
        doc.text(header, marginX, cursorY);
        cursorY += lineHeight;

        doc.setFont("helvetica", "normal");
        const contentLines = doc.splitTextToSize(content || "(empty)", maxTextWidth);
        contentLines.forEach((line) => {
          ensureSpace(lineHeight);
          doc.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });

        cursorY += 8;
      });
    }

    const safeSessionId = sanitizeFileName(sessionId) || "chat";
    doc.save(`${safeSessionId}_chat_history.pdf`);
  };

  const fetchUserDataBySessionId = async (sessionId) => {
    const res = await fetch(`${API_BASE}/users/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error("Failed to fetch user for PDF");
    return res.json();
  };

  const downloadUserChatPdf = async (userLike) => {
    const sessionId = userLike?.session_id;
    if (!sessionId) return;

    setDownloadingSessionId(sessionId);
    try {
      const userData = await fetchUserDataBySessionId(sessionId);
      createChatPdfAndDownload(userData);
    } catch (err) {
      console.error("Error downloading PDF", err);
    } finally {
      setDownloadingSessionId(null);
    }
  };

  const downloadAllUsersChatsCsv = async () => {
    if (downloadingAllUsers || loadingUsers || !allUsers.length) return;

    setDownloadingAllUsers(true);
    try {
      const rows = ["username,email_or_session_id,timestamp,role,content"];

      for (const user of allUsers) {
        if (!user?.session_id) continue;
        try {
          const userData = await fetchUserDataBySessionId(user.session_id);
          const userName = userData?.user_name || "Unknown User";
          const emailOrSession = userData?.session_id || user?.session_id || "";
          const chatHistory = Array.isArray(userData?.chat_history)
            ? userData.chat_history
            : [];

          if (chatHistory.length === 0) {
            rows.push(
              [
                toCsvCell(userName),
                toCsvCell(emailOrSession),
                toCsvCell(""),
                toCsvCell(""),
                toCsvCell(""),
              ].join(",")
            );
            continue;
          }

          chatHistory.forEach((msg, index) => {
            const timestamp = normalizeTimestamp(msg?.timestamp);
            const role = msg?.role || "";
            const content = msg?.content || "";
            rows.push(
              [
                toCsvCell(index === 0 ? userName : ""),
                toCsvCell(index === 0 ? emailOrSession : ""),
                toCsvCell(timestamp),
                toCsvCell(role),
                toCsvCell(content),
              ].join(",")
            );
          });
        } catch (err) {
          console.error(`Failed to include user in CSV ${user.session_id}`, err);
        }
      }

      const csvContent = rows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `all_users_chat_history_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAllUsers(false);
    }
  };

  useEffect(() => {
    setLoadingUsers(true);
    fetch(`${API_BASE}/users`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllUsers(data);
        else if (Array.isArray(data.users)) setAllUsers(data.users);
        else setAllUsers([]);
      })
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    setLoadingUserData(true);
    setSelectedUserData(null);

    fetch(`${API_BASE}/users/${encodeURIComponent(selectedUser.session_id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) setSelectedUserData(data);
        else setSelectedUserData(null);
      })
      .catch(console.error)
      .finally(() => setLoadingUserData(false));
  }, [selectedUser]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  useEffect(() => {
    if (selectedUserData?.chat_history) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUserData]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex flex-1 h-screen relative">
      {/* Users Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-0" : "w-72"
        } border-r bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="font-semibold text-sm uppercase tracking-wide">
                All Users
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {loadingUsers
                  ? "Loading..."
                  : `${allUsers.length} ${
                      allUsers.length === 1 ? "user" : "users"
                    }`}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={downloadAllUsersChatsCsv}
              disabled={downloadingAllUsers || loadingUsers || allUsers.length === 0}
            >
              {downloadingAllUsers ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Download className="w-3 h-3 mr-1" />
              )}
              Download
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Fetching users...</p>
            </div>
          ) : Array.isArray(allUsers) && allUsers.length > 0 ? (
            allUsers.map((user) => (
              <div
                key={user.session_id}
                className={`cursor-pointer border-b border-black/10 py-2 transition-all duration-300 
                hover:bg-primary/10 
                ${
                  selectedUser?.session_id === user.session_id
                    ? "bg-muted/50 border-l-4 border-l-primary"
                    : ""
                }`}
                onClick={() => handleUserClick(user)}
              >
                <CardContent className="px-3 py-2">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">
                      {(user.user_name
                        ? user.user_name.charAt(0).toUpperCase() + user.user_name.slice(1)
                        : user.session_id.split("@")[0]
                      )}
                    </div>
                    <div>
                      <span
                        className="text-xs text-gray-500 font-mono truncate max-w-[220px] block"
                        title={user.session_id}
                      >
                        {user.session_id}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadUserChatPdf(user);
                      }}
                      disabled={downloadingSessionId === user.session_id}
                    >
                      {downloadingSessionId === user.session_id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-3 h-3 mr-1" />
                      )}
                      Download
                    </Button>
                  </div>
                </CardContent>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={toggleSidebar}
        className="absolute left-0 top-30 z-10 bg-card border border-l-0 rounded-r-lg p-2 hover:bg-muted/50 transition-all duration-200 shadow-md"
        style={{
          transform: sidebarCollapsed ? "translateX(0)" : "translateX(288px)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background p-6 overflow-hidden">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No user selected</h3>
              <p className="text-muted-foreground text-sm">
                Select a user from the sidebar to view chat history
              </p>
            </div>
          </div>
        ) : loadingUserData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading user data...
              </p>
            </div>
          </div>
        ) : selectedUserData ? (
          <>
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg">
                    {selectedUserData.user_name || "Unknown User"}
                  </h2>
                  <p className="text-sm text-muted-foreground font-mono">
                    {selectedUserData.session_id}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserInfo(true)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadUserChatPdf(selectedUserData)}
                  disabled={downloadingSessionId === selectedUserData.session_id}
                >
                  {downloadingSessionId === selectedUserData.session_id ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-1" />
                  )}
                  Download
                </Button>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span>
                  AI Mode:{" "}
                  <span className="font-medium">
                    {selectedUserData.is_ai ? "On" : "Off"}
                  </span>
                </span>
                <span>
                  Created:{" "}
                  <span className="font-medium">
                    {new Date(
                      selectedUserData.created_at.$date ||
                        selectedUserData.created_at
                    ).toLocaleString()}
                  </span>
                </span>
                <span>
                  Messages:{" "}
                  <span className="font-medium">
                    {selectedUserData.chat_history.length}
                  </span>
                </span>
              </div>
              {selectedUserData.visitor_insights?.current_page && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Current page:{" "}
                  <span className="font-medium">
                    {shortUrl(selectedUserData.visitor_insights.current_page)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-34 space-y-4 w-full">
              {selectedUserData.chat_history.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    No messages yet
                  </p>
                </div>
              ) : (
                selectedUserData.chat_history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "agent" || msg.role === "assistant"
                        ? "justify-end"
                        : "justify-start"
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl max-w-[70%] shadow-sm transition-all duration-200 hover:shadow-md ${
                        msg.role === "agent"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : msg.role === "assistant"
                          ? "bg-gray-500 text-white rounded-br-sm"
                          : "bg-card border rounded-bl-sm"
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {msg.timestamp && (
                        <p
                          className={`text-xs mt-1 ${
                            msg.role === "agent" || msg.role === "assistant"
                              ? "text-white/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {new Date(
                            msg.timestamp.$date || msg.timestamp
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Failed to load user data</p>
            </div>
          </div>
        )}
      </div>

      {/* User Info Dialog */}
      {selectedUserData && (
        <Dialog open={showUserInfo} onOpenChange={setShowUserInfo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedUserData.visitor_insights && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    Visitor Insights
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Current Page:</span>
                    <span className="text-sm col-span-2 break-all">
                      {shortUrl(selectedUserData.visitor_insights.current_page)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm col-span-2">
                      {[
                        selectedUserData.visitor_insights.city,
                        selectedUserData.visitor_insights.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">IP Address:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserData.visitor_insights.ip_address || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Visitor Type:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserData.visitor_insights.visitor_type || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Visits / Chats:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserData.visitor_insights.visit_count || 1} visit,{" "}
                      {selectedUserData.visitor_insights.chat_count || 1} chat
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Source:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserData.visitor_insights.traffic_source || "Direct"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm col-span-2">
                      {formatDuration(
                        selectedUserData.visitor_insights.chat_duration_seconds
                      )}
                    </span>
                  </div>
                  {Array.isArray(
                    selectedUserData.visitor_insights.browsing_history
                  ) &&
                    selectedUserData.visitor_insights.browsing_history.length > 0 && (
                      <div className="pt-2">
                        <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                          <History className="h-4 w-4" />
                          Browsing History
                        </div>
                        <div className="max-h-28 space-y-1 overflow-y-auto text-xs">
                          {selectedUserData.visitor_insights.browsing_history
                            .slice(-5)
                            .reverse()
                            .map((item, index) => (
                              <div key={index} className="rounded border bg-background p-2">
                                <div className="break-all font-medium">
                                  {shortUrl(item.page)}
                                </div>
                                <div className="text-muted-foreground">
                                  {item.traffic_source || "Direct"}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">User Name:</span>
                <span className="text-sm col-span-2">
                  {selectedUserData.user_name || "Unknown User"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Session ID:</span>
                <span className="text-sm font-mono col-span-2 break-all">
                  {selectedUserData.session_id}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">AI Mode:</span>
                <span className="text-sm col-span-2">
                  {selectedUserData.is_ai ? "On" : "Off"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Created:</span>
                <span className="text-sm col-span-2">
                  {new Date(
                    selectedUserData.created_at.$date ||
                      selectedUserData.created_at
                  ).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Messages:</span>
                <span className="text-sm col-span-2">
                  {selectedUserData.chat_history.length}
                </span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowUserInfo(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
