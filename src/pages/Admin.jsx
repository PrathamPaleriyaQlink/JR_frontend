import React, { useState, useEffect, useRef } from "react";
import { Home, Users, UserCheck, Send, Bot, ArrowLeft } from "lucide-react";
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

const WS_BASE = "wss://api.vultr3.qlink.in/ws";
const API_BASE = "https://api.vultr3.qlink.in";

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("active");
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [isAi, setIsAi] = useState(true);

  const adminSocket = useRef(null);
  const agentSocket = useRef(null);
  const chatEndRef = useRef(null);

  // Connect Admin WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/admin`);
    ws.onopen = () => console.log("Admin WebSocket connected ✅");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "active_users") setActiveUsers(msg.data);
      } catch {}
    };
    ws.onclose = () => console.log("Admin WebSocket closed ❌");
    adminSocket.current = ws;
    return () => ws.close();
  }, []);

  // Handle user selection
  const handleUserClick = (user) => {
    setSelectedUser(user.session_id);
    setSelectedUserInfo({
      session_id: user.session_id,
      country_code: user.country_code || "unknown",
      is_ai: user.is_ai ?? true,
      chat_history_length: user.chat_history?.length || 0,
    });
    setShowUserInfo(true);

    // Fetch chat history
    fetch(`${API_BASE}/chat_history/${user.session_id}`)
      .then((res) => res.json())
      .then((data) => setChatHistory(data.chat_history || []))
      .catch((err) => console.error(err));

    // Connect agent WebSocket
    const ws = new WebSocket(`${WS_BASE}/agent/${user.session_id}`);
    ws.onmessage = (event) => {
      let content = event.data;
      try {
        const parsed = JSON.parse(event.data);
        content = parsed.content ?? event.data;
      } catch {}
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content, timestamp: new Date() },
      ]);
    };
    agentSocket.current = ws;

    return () => ws.close();
  };

  const sendMessage = () => {
    if (agentSocket.current && message.trim() !== "") {
      agentSocket.current.send(message);
      setChatHistory((prev) => [
        ...prev,
        { role: "agent", content: message, timestamp: new Date() },
      ]);
      setMessage("");
    }
  };

  const toggleAI = async () => {
    const res = await fetch(`${API_BASE}/toggle/${selectedUser}`, {
      method: "POST",
    });
    const data = await res.json();
    setIsAi(data.is_ai);
  };

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-20 bg-card border-r flex flex-col items-center py-6">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md mb-2">
            <span className="text-primary-foreground font-bold text-lg">JR</span>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">JaipurRugs</div>
        </div>
        <div className="flex-1 flex flex-col items-center space-y-4">
          <Button
            variant={selectedTab === "home" ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedTab("home")}
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTab === "active" ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedTab("active")}
          >
            <UserCheck className="w-5 h-5" />
          </Button>
          <Button
            variant={selectedTab === "users" ? "default" : "ghost"}
            size="icon"
            onClick={() => setSelectedTab("users")}
          >
            <Users className="w-5 h-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => (window.location.href = "/")}
          title="Back to Landing Page"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Active Users Sidebar */}
      {selectedTab === "active" && (
        <div className="w-72 border-r bg-card overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm uppercase tracking-wide">Active Users</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {activeUsers.length} {activeUsers.length === 1 ? "user" : "users"} online
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {activeUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No active users
              </div>
            ) : (
              activeUsers.map((user) => (
                <Card
                  key={user.session_id}
                  className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedUser === user.session_id
                      ? "bg-muted shadow-md"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => handleUserClick(user)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedUser === user.session_id ? "bg-primary" : "bg-green-500"
                        }`}
                      />
                      <span className="text-sm font-medium truncate">{user.session_id}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-center border-b px-6 py-4 bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {selectedUser.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold">{selectedUser}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedUserInfo?.country_code
                      ? `Country: +${selectedUserInfo.country_code}`
                      : "Active now"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-muted px-4 py-2 rounded-lg border">
                <Bot className={`w-4 h-4 ${isAi ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{isAi ? "AI Mode" : "Manual"}</span>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
              {chatHistory.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Send className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">No messages yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "agent" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-[70%] shadow-sm ${
                          msg.role === "agent"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.timestamp && (
                          <p
                            className={`text-xs mt-1 ${
                              msg.role === "agent"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t p-4 bg-card shadow-lg">
              <div className="max-w-4xl mx-auto flex items-center gap-3">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} size="icon" className="shadow-md">
                  <Send className="w-4 h-4" />
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
              <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
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
            <DialogTitle>User Info</DialogTitle>
          </DialogHeader>
          {selectedUserInfo && (
            <div className="space-y-2">
              <p>
                <strong>Session ID:</strong> {selectedUserInfo.session_id}
              </p>
              <p>
                <strong>Country Code:</strong> {selectedUserInfo.country_code}
              </p>
              <p>
                <strong>AI Mode:</strong> {selectedUserInfo.is_ai ? "On" : "Off"}
              </p>
              <p>
                <strong>Chat History Length:</strong>{" "}
                {selectedUserInfo.chat_history_length}
              </p>
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
