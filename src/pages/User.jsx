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
  Paperclip,
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
import { API_WEB_BASE, WS_BASE } from "@/lib/api";

const API_BASE = API_WEB_BASE;

const SEARCH_LINK_RE = /\[([^\]]*(?:search|browse)[^\]]*)\]\((https?:\/\/[^)]+)\)/i;
const PLAIN_SEARCH_URL_RE = /https?:\/\/(?:www\.)?jaipurrugs\.com\/search\?[^\s)]+/i;
const SEARCH_PROMPT_LINE_RE = /(?:you can )?search more products here:\s*$/i;

function extractSearchCta(content) {
  const markdownMatch = SEARCH_LINK_RE.exec(content);
  if (markdownMatch) {
    const cleaned = content.replace(markdownMatch[0], "").replace(/\n{3,}/g, "\n\n").trim();
    return { text: cleaned, searchUrl: markdownMatch[2], searchLabel: markdownMatch[1] };
  }

  const plainMatch = PLAIN_SEARCH_URL_RE.exec(content);
  if (!plainMatch) return { text: content, searchUrl: null, searchLabel: null };

  const cleaned = content
    .replace(plainMatch[0], "")
    .split("\n")
    .map((line) => line.replace(SEARCH_PROMPT_LINE_RE, "").trimEnd())
    .filter((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text: cleaned, searchUrl: plainMatch[0], searchLabel: "Search More Rugs" };
}

const markdownComponents = {
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt || "chat image"}
      className="mt-2 w-full max-w-[420px] max-h-[420px] h-auto object-contain rounded-lg border"
      loading="lazy"
    />
  ),
   a: ({ href, children }) => {
    const label = Array.isArray(children) ? children.join("") : String(children || "");
    const isViewProduct = /view\s*product/i.test(label);
    const isSearchMore = /search\s*more/i.test(label);

    if (isViewProduct) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-black no-underline shadow transition hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {children}
        </a>
      );
    }

    if (isSearchMore) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md border border-amber-500 px-3 py-1.5 text-sm font-semibold text-amber-600 no-underline shadow transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {children}
        </a>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-500"
      >
        {children}
      </a>
    );
  },
};

export default function UserPage() {
  const isInIframe = window.self !== window.top;
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [countryFlag, setCountryFlag] = useState("🇮🇳");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [uplaodImgLoading, setUploadImgLoading] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

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

    const normalizedEmail = userEmail.trim().toLowerCase();
    setUserEmail(normalizedEmail);
    setSessionId(normalizedEmail);
    setShowUserDialog(false);
  };

  useEffect(() => {
    if (showUserDialog) return;

    // const newSession = crypto.randomUUID();
    // setSessionId(newSession);
  }, [showUserDialog]);

  useEffect(() => {
    if (!sessionId) return;
    setLoadingHistory(true);

    fetch(`${API_BASE}/chat_history/${encodeURIComponent(sessionId)}`)
      .then((res) => {
        if (res.status === 404) {
          return { chat_history: [] };
        }
        return res.json();
      })
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

    let reconnectTimer;
    let attempts = 0;
    let shouldReconnect = true;

    const connectSocket = () => {
      const ws = new WebSocket(`${WS_BASE}/user/${encodeURIComponent(sessionId)}/${countryCode}/${encodeURIComponent(userName)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempts = 0;
        setIsSocketConnected(true);
        console.log("WebSocket connected ✅");
      };

      ws.onerror = (error) => {
        setIsSocketConnected(false);
        console.error("WebSocket error:", error);
      };

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
        setAwaitingResponse(false);
        addMessage({ role: parsed.from, content: parsed.content });
        return;
      }
      };

      ws.onclose = () => {
        setIsSocketConnected(false);
        console.log("WebSocket closed ❌");

        if (!shouldReconnect) return;

        attempts += 1;
        const delay = Math.min(1500 * attempts, 5000);
        reconnectTimer = setTimeout(connectSocket, delay);
      };
    };

    connectSocket();

    return () => {
      shouldReconnect = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [sessionId, countryCode, showUserDialog, userName]);

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
  }, [messages, botTyping, awaitingResponse]);

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
    setAwaitingResponse(true);
    setMessage("");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log("WS not ready");
        return;
    }

    setUploadImgLoading(true);
    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        from: "user",
        is_typing: true,
      })
    );

    try {
      const res = await fetch(
        `${API_BASE}/get-upload-url?filename=${encodeURIComponent(
          file.name
        )}&email=${sessionId}`
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


      // 🔥 SEND IMAGE MESSAGE
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          from: "user",
          content: `![image](${final_url})`,
        })
      );

      // UI MESSAGE
      addMessage({ role: "user", content: `![image](${final_url})` });
      setAwaitingResponse(true);
    } catch (err) {
      console.error("Image upload error:", err);
    } finally {
      setUploadImgLoading(false);

      // 👇 IMPORTANT FIX
      e.target.value = "";
    }
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

              {!isInIframe && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Button>
              )}
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
                        <div className="w-10 h-10 shrink-0">
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
                        className={`px-4 py-3 rounded-2xl max-w-[85%] md:max-w-[75%] shadow-sm ${
                          roleStyles[msg.role] || "bg-card border"
                        }`}
                      >
                        {msg.role === "assistant" ? (() => {
                          const { text, searchUrl, searchLabel } = extractSearchCta(msg.content);
                          return (
                            <>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {text}
                              </ReactMarkdown>
                              {searchUrl && (
                                <div className="mt-3">
                                  <a
                                    href={searchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center rounded-md border border-amber-500 px-3 py-1.5 text-sm font-semibold text-amber-600 no-underline shadow transition hover:bg-amber-50"
                                  >
                                    {searchLabel}
                                  </a>
                                </div>
                              )}
                            </>
                          );
                        })() : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {(botTyping || awaitingResponse) && (
                  <div className="flex justify-start">
                    <img
                      src="/ai_avatar.webp"
                      alt="assistant"
                      className="w-10 h-10 rounded-full object-cover mr-2"
                    />
                    <div className="px-4 py-3 rounded-2xl bg-muted border shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}

                {agentTyping && (
                  <div className="flex justify-start">
                    <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center text-white mr-2">
                      <UserStarIcon className="w-5 h-5" />
                    </div>
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
              <div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="imageInput"
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => document.getElementById("imageInput").click()}
                  className="shadow-md"
                >
                  {uplaodImgLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip />
                  )}
                </Button>
              </div>
              <Button onClick={sendMessage} size="icon" className="shadow-md">
                {botTyping || awaitingResponse ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!isSocketConnected && (
              <p className="text-xs text-red-500 mt-2">Connecting to chat server...</p>
            )}
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
