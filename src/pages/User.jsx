import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  Globe,
  Loader2,
  UserStarIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ThemeToggle from "@/components/ThemeToggle";

const WS_BASE = "wss://api.vultr3.qlink.in/ws";
const API_BASE = "https://api.vultr3.qlink.in/api/web";

export default function UserPage() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  // NEW STATES - NOT STORED ANYWHERE
  const [showUserDialog, setShowUserDialog] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const wsRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleUserSubmit = () => {
    if (!userName.trim() || !userEmail.trim()) {
      return;
    }

    // basic email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert("Please enter a valid email");
      return;
    }

    setUserEmail(userEmail.toLowerCase())
    setSessionId(userEmail);
    setShowUserDialog(false);
  };

  useEffect(() => {
    if (showUserDialog) return;

    // const newSession = crypto.randomUUID();
    // setSessionId(newSession);
  }, [showUserDialog]);

  useEffect(() => {
    if (showUserDialog) return;

    fetch("https://ipwho.is/")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setCountryCode(data.calling_code);
          setCountryFlag(data.flag?.emoji || "🌍");
        }
      })
      .catch(() => {});
  }, [showUserDialog]);

  useEffect(() => {
    if (!sessionId) return;
    setLoadingHistory(true);

    fetch(`${API_BASE}/chat_history/${userEmail}`)
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
      .catch((err) => console.error(err))
      .finally(() => setLoadingHistory(false));
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !countryCode || showUserDialog) return;

    const ws = new WebSocket(`${WS_BASE}/user/${userEmail}/${countryCode}`);
    wsRef.current = ws;

    ws.onopen = () => console.log("WebSocket connected ✅");
    ws.onmessage = (e) => {
      setBotTyping(false);
      let data = e.data;
      const parsed = JSON.parse(data);

      setAgentTyping(false);
      setBotTyping(false);

      if (parsed.type === "typing") {
        if (parsed.from === "assistant") {
          setBotTyping(parsed.is_typing);
        } else if (parsed.from === "agent") {
          setAgentTyping(parsed.is_typing);
        }

        return;
      }

      if (parsed.type === "handshake" && parsed.from === "agent") {
        const text = `Agent **${parsed.agent_name}** (ID: ${parsed.emp_id}) joined the chat`;
        addMessage({ role: "system", content: text });
        return;
      }

      if (parsed.type === "message") {
        addMessage({ role: parsed.from, content: parsed.content });
        return;
      }
    };
    ws.onclose = () => console.log("WebSocket closed ❌");

    return () => ws.close();
  }, [sessionId, countryCode, showUserDialog]);

  const addMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      },
    ]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  const sendMessage = () => {
    if (
      !message.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    )
      return;

    wsRef.current.send(
      JSON.stringify({
        type: "message",
        from: "user",
        content: message,
      })
    );

    addMessage({ role: "user", content: message });
    setMessage("");
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (value.trim() === "") {
      wsRef.current.send(
        JSON.stringify({
          type: "typing",
          from: "user",
          is_typing: false,
        })
      );
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        from: "user",
        is_typing: true,
      })
    );
  };

  const roleStyles = {
    user: "bg-primary text-primary-foreground rounded-br-sm",
    assistant: "bg-muted border rounded-bl-sm prose prose-sm dark:prose-invert",
    agent: "bg-gray-500 text-white rounded-bl-sm",
    system: "text-center text-xs text-muted-foreground",
  };

  return (
    <div className="relative">
      {/* BLUR EVERYTHING WHEN DIALOG OPEN */}
      <div className={`${showUserDialog ? "blur-sm pointer-events-none" : ""}`}>
        <div className="flex flex-col h-screen bg-background text-foreground">
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-card shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>

              <div>
                <h2 className="font-semibold text-sm">{userName}</h2>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {sessionId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />

              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
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

              <ThemeToggle />

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

          {/* CHAT BODY */}
          <div className="flex-1 overflow-y-auto p-6 bg-muted/30">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
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
                {messages.map((msg, i) => {
                  // 🔥 SYSTEM MESSAGE (center info bubble)
                  if (msg.role === "system") {
                    return (
                      <div key={i} className="flex justify-center my-4">
                        <div className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground border shadow-sm text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    );
                  }

                  // 🔥 NORMAL MESSAGES
                  return (
                    <div
                      key={i}
                      className={`flex items-end gap-2 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role !== "user" && (
                        <div className="w-10 h-10 flex-shrink-0">
                          {msg.role === "assistant" ? (
                            <img
                              src="/ai_avatar.webp"
                              alt="assistant"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white">
                              <UserStarIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl max-w-[75%] shadow-sm ${
                          roleStyles[msg.role] || "bg-card border"
                        }`}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {msg.role === "user" && (
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {botTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl bg-muted border shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}

                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl bg-gray-400 border shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* CHAT INPUT */}
          <div className="border-t p-4 bg-card shadow-lg">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1"
              />
              <Button onClick={sendMessage} size="icon" className="shadow-md">
                {botTyping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCKING DIALOG */}
      {showUserDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl p-6 border">
            <h2 className="text-lg font-semibold mb-4 text-center">
              Enter Details
            </h2>

            <div className="space-y-3">
              <Input
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
              <Input
                placeholder="Your Email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            <Button className="w-full mt-4" onClick={handleUserSubmit}>
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
