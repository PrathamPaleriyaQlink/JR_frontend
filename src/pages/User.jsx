import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, ArrowLeft, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const WS_BASE = "wss://api.vultr3.qlink.in/ws";
const API_BASE = "https://api.vultr3.qlink.in";

export default function UserPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");

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

  // --- Fetch country info dynamically ---
  useEffect(() => {
    fetch("https://ipwho.is/")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setCountryCode(data.calling_code);
          setCountryFlag(data.flag?.emoji || "🌍");
        }
      })
      .catch((err) => console.error("IP fetch error:", err));
  }, []);

  // --- Fetch chat history ---
  useEffect(() => {
    if (!sessionId) return;

    fetch(`${API_BASE}/chat_history/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.chat_history) {
          const history = data.chat_history.map((msg) => ({
            role: msg.role || "assistant",
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(history);
        }
      })
      .catch((err) => console.error(err));
  }, [sessionId]);

  // --- WebSocket connection ---
  useEffect(() => {
    if (!sessionId || !countryCode) return;

    const ws = new WebSocket(`${WS_BASE}/user/${sessionId}/${countryCode}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("WebSocket connected ✅");

    ws.onmessage = (e) => {
      let data = e.data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.role && parsed.content) {
          addMessage(parsed);
          return;
        }
      } catch {
        addMessage({ role: "assistant", content: data });
      }
    };

    ws.onclose = () => console.log("WebSocket closed ❌");

    return () => ws.close();
  }, [sessionId, countryCode]);

  const addMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date() },
    ]);
  };

  // --- Auto scroll ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Send message ---
  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)
      return;

    wsRef.current.send(message); // send raw text
    addMessage({ role: "user", content: message });
    setMessage("");
  };

  const roleStyles = {
    user: "bg-primary text-primary-foreground rounded-br-sm",
    assistant: "bg-muted border rounded-bl-sm",
    agent: "bg-orange-500 text-white rounded-bl-sm",
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

        {/* Country Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <Select value={countryCode} onValueChange={(val) => setCountryCode(val)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="91">🇮🇳 +91</SelectItem>
              <SelectItem value="1">🇺🇸 +1</SelectItem>
              <SelectItem value="44">🇬🇧 +44</SelectItem>
              <SelectItem value="61">🇦🇺 +61</SelectItem>
              <SelectItem value="971">🇦🇪 +971</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm">{countryFlag}</span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
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
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${
                    roleStyles[msg.role] || "bg-card border"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === "user"
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
