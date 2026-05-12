import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  Phone,
  Search,
} from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = "https://jaipurrugs-whatsapp-backend.vercel.app/api";

export default function AdminWhatsApp() {
  const [conversations, setConversations] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const pollRef = useRef(null);

  const fetchConversations = () => {
    fetch(`${API_BASE}/conversations`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
      })
      .catch(console.error)
      .finally(() => setLoadingConversations(false));
  };

  const fetchMessages = (phone) => {
    setLoadingMessages(true);
    fetch(`${API_BASE}/conversations/${encodeURIComponent(phone)}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedPhone) return;
    fetchMessages(selectedPhone);

    pollRef.current = setInterval(() => {
      fetchMessages(selectedPhone);
      fetchConversations();
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, [selectedPhone]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConversation = (phone) => {
    setSelectedPhone(phone);
    setMessages([]);
  };

  const handleSend = async () => {
    const text = messageInput.trim();
    if (!text || !selectedPhone || sending) return;

    setSending(true);
    setMessageInput("");
    try {
      await fetch(`${API_BASE}/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedPhone, message: text }),
      });
      fetchMessages(selectedPhone);
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const [msgSearch, setMsgSearch] = useState("");

  const filteredMessages = msgSearch.trim()
    ? messages.filter((m) =>
        (m.content || "").toLowerCase().includes(msgSearch.trim().toLowerCase())
      )
    : messages;

  const selectedConv = conversations.find((c) => c.phone === selectedPhone);

  return (
    <div className="flex flex-1 h-screen relative">
      {/* Contacts Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? "w-0" : "w-72"
        } border-r bg-card overflow-hidden flex flex-col transition-all duration-300 ease-in-out`}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm uppercase tracking-wide">
            WhatsApp
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {loadingConversations
              ? "Loading..."
              : `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.phone}
                className={`cursor-pointer border-b border-black/10 py-2 transition-all duration-200 hover:bg-primary/10 ${
                  selectedPhone === conv.phone
                    ? "bg-muted/50 border-l-4 border-l-primary"
                    : ""
                }`}
                onClick={() => handleSelectConversation(conv.phone)}
              >
                <CardContent className="px-3 py-2">
                  <div className="flex flex-col items-start gap-0.5">
                    <div className="font-medium text-sm">
                      {conv.name || conv.phone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span className="font-mono">{conv.phone}</span>
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-1">
                        {conv.last_message}
                      </p>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${
                        conv.is_ai
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {conv.is_ai ? "AI" : "Agent"}
                    </span>
                  </div>
                </CardContent>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Toggle Sidebar */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
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
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <div className="text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
              <p className="text-muted-foreground text-sm">
                Select a conversation from the sidebar
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="border-b px-6 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-green-700" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-base truncate">
                  {selectedConv?.name || selectedPhone}
                </h2>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedPhone}
                </p>
              </div>
              <div className="relative ml-auto w-52">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  className="w-full pl-8 pr-3 py-2 text-xs border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search messages…"
                  value={msgSearch}
                  onChange={(e) => setMsgSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  {msgSearch.trim() ? "No messages match your search" : "No messages yet"}
                </div>
              ) : (
                filteredMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.direction === "outbound" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl max-w-[70%] shadow-sm text-sm ${
                        msg.direction === "outbound"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card border rounded-bl-sm"
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 rounded-lg border text-xs font-medium bg-white text-primary border-primary hover:bg-primary/10 transition-colors no-underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      {msg.timestamp && (
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.direction === "outbound"
                              ? "text-white/60"
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
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Send Message */}
            <div className="border-t px-6 py-3 flex items-end gap-3">
              <textarea
                className="flex-1 resize-none border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] max-h-32"
                placeholder="Type a message… (Enter to send)"
                rows={1}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button
                onClick={handleSend}
                disabled={!messageInput.trim() || sending}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
