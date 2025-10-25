import React, { useState, useEffect, useRef } from "react";
import {
  UserCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
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

const API_BASE = "https://api.vultr3.qlink.in/api/web";

export default function AdminAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const chatEndRef = useRef(null);

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

    fetch(`${API_BASE}/users/${selectedUser.session_id}`)
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
              <Card
                key={user.session_id}
                className={`mb-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/50 ${
                  selectedUser?.session_id === user.session_id
                    ? "ring-2 ring-primary bg-muted/50"
                    : ""
                }`}
                onClick={() => handleUserClick(user)}
              >
                <CardContent className="px-3 py-2">
                  <div className="flex flex-col items-start">
                    <div className="font-medium">
                      {user.user_name || "Unknown User"}
                    </div>
                    <div>
                      <span
                        className="text-xs text-gray-500 font-mono truncate max-w-[220px] block"
                        title={user.session_id}
                      >
                        {user.session_id}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
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
