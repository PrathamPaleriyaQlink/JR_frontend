import React, { useState, useEffect, useRef } from "react";
import { UserCheck, Loader2 } from "lucide-react";
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

const API_BASE = "https://api.vultr3.qlink.in";

export default function AdminAllUsers() {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
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

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserInfo(true);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser]);

  return (
    <div className="flex flex-1 h-screen">
      {/* Users Sidebar */}
      <div className="w-72 border-r bg-card overflow-hidden flex flex-col">
        <div className="p-4 border-b">
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
                className="mb-2 cursor-pointer transition-all hover:shadow-md hover:bg-muted/50"
                onClick={() => handleUserClick(user)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium truncate">
                      {user.session_id}
                    </span>
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background p-6">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
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
        ) : (
          <>
            <h2 className="font-semibold mb-2">
              User: {selectedUser.session_id}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              AI Mode: {selectedUser.is_ai ? "On" : "Off"} | Created:{" "}
              {new Date(selectedUser.created_at.$date).toLocaleString()}
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 w-full">
              {selectedUser.chat_history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet</p>
              ) : (
                selectedUser.chat_history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "agent" || msg.role === "assistant"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl max-w-[70%] shadow-sm ${
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
                          {new Date(msg.timestamp.$date).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </>
        )}
      </div>

      {/* User Info Dialog */}
      {selectedUser && (
        <Dialog open={showUserInfo} onOpenChange={setShowUserInfo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>User Info</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p>
                <strong>Session ID:</strong> {selectedUser.session_id}
              </p>
              <p>
                <strong>AI Mode:</strong> {selectedUser.is_ai ? "On" : "Off"}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(selectedUser.created_at.$date).toLocaleString()}
              </p>
              <p>
                <strong>Chat History Length:</strong>{" "}
                {selectedUser.chat_history.length}
              </p>
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
