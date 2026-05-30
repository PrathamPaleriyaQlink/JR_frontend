import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  UserCheck,
  Bot,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Paperclip,
  Globe,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAdmin } from "@/contexts/AdminContext";
import { API_WEB_BASE, WS_BASE } from "@/lib/api";

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

export default function AdminActiveUsers() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [isAi, setIsAi] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const adminSocket = useRef(null);
  const agentSocket = useRef(null);
  const chatEndRef = useRef(null);

  const [userTyping, setUserTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  const [hasHandshaked, setHasHandshaked] = useState(false);
  const [uplaodImgLoading, setUploadImgLoading] = useState(false);

  const { employeeData } = useAdmin();

  // Admin WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/admin`);

    ws.onopen = () => {
      console.log("Admin WebSocket connected ✅");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "active_users") {
          setActiveUsers(msg.data || []);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log("Admin WebSocket closed ❌");
      setIsConnected(false);
    };

    adminSocket.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleUserClick = (user) => {
    // Close previous agent socket if exists
    if (
      agentSocket.current &&
      agentSocket.current.readyState === WebSocket.OPEN
    ) {
      agentSocket.current.close();
    }

    setSelectedUser(user.session_id);
    setLoadingHistory(true);
    setChatHistory([]);

    // Fetch full user details by session ID
    fetch(`${API_BASE}/users/${user.session_id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user details");
        return res.json();
      })
      .then((data) => {
        // Extract required details
        const chatHistoryData = (data.chat_history || []).filter(
          (msg) => msg.type !== "client_info"
        );

        setSelectedUserInfo({
          session_id: data.session_id,
          country_code: data.country_code || "unknown",
          is_ai: data.is_ai ?? true,
          user_name: data.user_name || "Unknown",
          chat_history_length: chatHistoryData.length,
          created_at: data.created_at?.$date || null,
          updated_at: data.updated_at?.$date || null,
          visitor_insights: data.visitor_insights || {},
        });

        setChatHistory(chatHistoryData);
        setIsAi(data.is_ai ?? true);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setChatHistory([]);
        setSelectedUserInfo(null);
      })
      .finally(() => setLoadingHistory(false));

    // Agent WebSocket connection
    const ws = new WebSocket(`${WS_BASE}/agent/${user.session_id}/${employeeData.empId}`);

    ws.onopen = () => {
      console.log(`Agent WebSocket connected for ${user.session_id}`);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        setAgentTyping(false);
        setBotTyping(false);
        setUserTyping(false);

        if (parsed.type === "typing") {
          if (parsed.from === "user") {
            setUserTyping(parsed.is_typing);
          } else if (parsed.from === "assistant") {
            setBotTyping(parsed.is_typing);
          } else {
            setAgentTyping(parsed.is_typing);
          }
          return;
        }

        if (parsed.type === "message") {
          let parsedMessage = {
            role: parsed.from,
            content: parsed.content,
          };
          setChatHistory((prev) => [
            ...prev,
            {
              ...parsedMessage,
              timestamp: parsed.timestamp || new Date().toISOString(),
            },
          ]);
          setLoadingReply(false);
          return;
        }
      } catch (err) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: event.data,
            timestamp: new Date().toISOString(),
          },
        ]);
        setLoadingReply(false);
      }
    };

    ws.onerror = (error) => {
      console.error("Agent WebSocket error:", error);
      setLoadingReply(false);
    };

    ws.onclose = () => {
      console.log(`Agent WebSocket closed for ${user.session_id}`);
    };

    agentSocket.current = ws;
  };

  const sendMessage = () => {
    if (isAi) {
      alert("Turn off AI mode to start sending messages.");
      return;
    }

    // 🔥 FIRST message → do handshake
    if (!hasHandshaked) {
      agentSocket.current.send(
        JSON.stringify({
          type: "handshake",
          name: employeeData.empName,
        })
      );
      setHasHandshaked(true);
    }

    if (
      !agentSocket.current ||
      agentSocket.current.readyState !== WebSocket.OPEN
    ) {
      console.error("WebSocket is not connected");
      return;
    }

    if (message.trim() === "") return;

    const payload = {
      role: "agent",
      content: message,
    };

    try {
      agentSocket.current.send(
        JSON.stringify({
          type: "message",
          from: "agent",
          content: message,
        })
      );
      setChatHistory((prev) => [...prev, payload]);
      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setLoadingReply(false);
    }
  };

  const toggleAiMode = async () => {
    if (!selectedUser) return;

    const prev = isAi;
    setIsAi(!isAi);

    try {
      const res = await fetch(`${API_BASE}/toggle/${selectedUser}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setIsAi(data.is_ai);

      if (selectedUserInfo) {
        setSelectedUserInfo((prev) => ({ ...prev, is_ai: data.is_ai }));
      }

      // 🔥 When AI turns OFF → allow handshake again
      if (!data.is_ai) setHasHandshaked(false);
    } catch (err) {
      setIsAi(prev);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (
        agentSocket.current &&
        agentSocket.current.readyState === WebSocket.OPEN
      ) {
        agentSocket.current.close();
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (
      !agentSocket.current ||
      agentSocket.current.readyState !== WebSocket.OPEN
    )
      return;

    if (value.trim() === "") {
      // Input is empty → stop typing
      agentSocket.current.send(
        JSON.stringify({
          type: "typing",
          from: "agent",
          is_typing: false,
        })
      );
      return;
    }

    agentSocket.current.send(
      JSON.stringify({
        type: "typing",
        from: "agent",
        is_typing: true,
      })
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadImgLoading(true);
    
    // 🔥 FIRST message → do handshake
    if (!hasHandshaked) {
      agentSocket.current.send(
        JSON.stringify({
          type: "handshake",
          name: "test_name",
        })
      );
      setHasHandshaked(true);
    }

    agentSocket.current.send(
      JSON.stringify({
        type: "typing",
        from: "agent",
        is_typing: true,
      })
    );

    try {
      const res = await fetch(
        `${API_BASE}/get-upload-url?filename=${encodeURIComponent(
          file.name
        )}&email=${selectedUser}`
      );
      const { upload_url, final_url } = await res.json();

      const upload = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!upload.ok) throw new Error("Upload failed");

      // ❗ ONLY CHECK WS STATUS — NO message.trim()
      if (
        !agentSocket.current ||
        agentSocket.current.readyState !== WebSocket.OPEN
      ) {
        console.log("WS not ready");
        return;
      }

      // 🔥 SEND IMAGE MESSAGE
      agentSocket.current.send(
        JSON.stringify({
          type: "message",
          from: "agent",
          content: `![image](${final_url})`,
        })
      );

      // UI MESSAGE
      setChatHistory((prev) => [
        ...prev,
        {
          role: "agent",
          content: `![image](${final_url})`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploadImgLoading(false);

      // 👇 IMPORTANT FIX
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-1 h-screen relative">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-0" : "w-72"
        } border-r bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm uppercase tracking-wide">
                  Active Users
                </h2>
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={isConnected ? "Connected" : "Disconnected"}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeUsers.length}{" "}
                {activeUsers.length === 1 ? "user" : "users"} online
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {activeUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 text-muted-foreground text-sm">
              {isConnected ? (
                <>
                  <UserCheck className="w-8 h-8 mb-2 opacity-50" />
                  <p>No active users</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                  <p>Connecting...</p>
                </>
              )}
            </div>
          ) : (
            activeUsers.map((user) => (
              <div
                key={user.session_id}
                className={`cursor-pointer border-b border-black/10 py-1 transition-all duration-300 
                hover:bg-primary/10  ${
                  selectedUser === user.session_id
                    ? "bg-muted/50 border-l-4 border-l-primary"
                    : ""
                }`}
                onClick={() => handleUserClick(user)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        selectedUser === user.session_id
                          ? "bg-primary"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="text-sm font-medium truncate">
                      {user.session_id}
                    </span>
                  </div>
                  {user.country_code && (
                    <p className="text-xs text-muted-foreground mt-1 ml-4">
                      +{user.country_code}
                    </p>
                  )}
                </CardContent>
              </div>
            ))
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
      <div className="flex-1 flex flex-col bg-background overflow-hidden">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4 bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {selectedUser.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold truncate">{selectedUser}</h2>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowUserInfo(true)}
                      className="h-6 w-6 flex-shrink-0"
                    >
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedUserInfo?.country_code &&
                    selectedUserInfo.country_code !== "unknown"
                      ? `Country: +${selectedUserInfo.country_code}`
                      : "Active now"}
                  </p>
                  {selectedUserInfo?.visitor_insights?.current_page && (
                    <p className="text-xs text-muted-foreground truncate max-w-[360px]">
                      Viewing: {shortUrl(selectedUserInfo.visitor_insights.current_page)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {loadingReply ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <Switch checked={isAi} onCheckedChange={toggleAiMode} />
                )}
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Bot className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isAi ? "AI Mode" : "Manual"}
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-muted-foreground text-sm">
                      Loading chat history...
                    </p>
                  </div>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Send className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start the conversation by sending a message
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "agent" || msg.role === "assistant"
                          ? "justify-end"
                          : "justify-start"
                      } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      style={{ animationDelay: `${Math.min(i * 50, 500)}ms` }}
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
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />

                  {botTyping && (
                    <div className="flex justify-end">
                      <div className="px-4 py-3 rounded-2xl bg-gray-400 border shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}

                  {agentTyping && (
                    <div className="flex justify-end">
                      <div className="px-4 py-3 rounded-2xl bg-yellow-400 border shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-yellow-600/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-yellow-600/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-yellow-600/50 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}

                  {userTyping && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3 rounded-2xl bg-muted border shadow-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t p-4 text-center bg-card shadow-lg">
              {isAi && (
                <p className="text-xs text-red-500 mb-2">
                  Turn off AI mode to start sending messages.
                </p>
              )}
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  onChange={(e) => {
                    if (!isAi) handleInputChange(e); // 🔥 disable typing when AI ON
                  }}
                  disabled={loadingReply || isAi}
                  className="flex-1"
                />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uplaodImgLoading || isAi}
                    id="imageInput"
                    onChange={handleImageUpload}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={uplaodImgLoading || isAi}
                    onClick={() =>
                      document.getElementById("imageInput").click()
                    }
                  >
                    {uplaodImgLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Paperclip />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={sendMessage}
                  size="icon"
                  className="shadow-md flex-shrink-0"
                  disabled={loadingReply || !message.trim() || isAi}
                >
                  {loadingReply ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No conversation selected
              </h3>
              <p className="text-muted-foreground text-sm">
                Select an active user from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User Info Dialog */}
      <Dialog open={showUserInfo} onOpenChange={setShowUserInfo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUserInfo && (
            <div className="space-y-3">
              {selectedUserInfo.visitor_insights && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Globe className="h-4 w-4" />
                    Visitor Insights
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Current Page:</span>
                    <span className="text-sm col-span-2 break-all">
                      {shortUrl(selectedUserInfo.visitor_insights.current_page)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm col-span-2">
                      {[
                        selectedUserInfo.visitor_insights.city,
                        selectedUserInfo.visitor_insights.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">IP Address:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserInfo.visitor_insights.ip_address || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Visitor Type:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserInfo.visitor_insights.visitor_type || "Unknown"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Visits / Chats:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserInfo.visitor_insights.visit_count || 1} visit,{" "}
                      {selectedUserInfo.visitor_insights.chat_count || 1} chat
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Source:</span>
                    <span className="text-sm col-span-2">
                      {selectedUserInfo.visitor_insights.traffic_source || "Direct"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm col-span-2">
                      {formatDuration(
                        selectedUserInfo.visitor_insights.chat_duration_seconds
                      )}
                    </span>
                  </div>
                  {Array.isArray(
                    selectedUserInfo.visitor_insights.browsing_history
                  ) &&
                    selectedUserInfo.visitor_insights.browsing_history.length > 0 && (
                      <div className="pt-2">
                        <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                          <History className="h-4 w-4" />
                          Browsing History
                        </div>
                        <div className="max-h-28 space-y-1 overflow-y-auto text-xs">
                          {selectedUserInfo.visitor_insights.browsing_history
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
                <span className="text-sm font-medium">Session ID:</span>
                <span className="text-sm font-mono col-span-2 break-all">
                  {selectedUserInfo.session_id}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Country Code:</span>
                <span className="text-sm col-span-2">
                  {selectedUserInfo.country_code !== "unknown"
                    ? `+${selectedUserInfo.country_code}`
                    : "Unknown"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">AI Mode:</span>
                <span className="text-sm col-span-2">
                  {selectedUserInfo.is_ai ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Messages:</span>
                <span className="text-sm col-span-2">{chatHistory.length}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowUserInfo(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
