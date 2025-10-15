import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const WS_BASE = "wss://api.vultr3.qlink.in/ws";
const API_BASE = "https://api.vultr3.qlink.in";

export default function UserPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- Create or get existing session ID ---
  useEffect(() => {
    let storedId = localStorage.getItem("session_id");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("session_id", storedId);
    }
    setSessionId(storedId);
  }, []);

  // --- Fetch past chat history ---
  useEffect(() => {
    if (!sessionId) return;

    fetch(`${API_BASE}/chat_history/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.chat_history) {
          const history = data.chat_history.map((msg) => ({
            sender: msg.role === "user" ? "user" : "bot",
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(history);
        }
      })
      .catch((err) => console.error(err));
  }, [sessionId]);

  // --- Connect WebSocket automatically ---
  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_BASE}/user/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("User WebSocket connected ✅");
    ws.onmessage = (e) => {
      const data = e.data;
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: data, timestamp: new Date() },
      ]);
    };
    ws.onclose = () => console.log("User WebSocket closed ❌");

    return () => ws.close();
  }, [sessionId]);

  // --- Auto-scroll to bottom on new message ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send message handler ---
  const sendMessage = () => {
    if (message.trim() === "") return;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
      setMessages((prev) => [
        ...prev,
        { sender: "user", content: message, timestamp: new Date() },
      ]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Session ID</h2>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {sessionId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>

          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg border">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Say hi to start the conversation ✨
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t p-4 bg-card shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
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
    </div>
  );
}
