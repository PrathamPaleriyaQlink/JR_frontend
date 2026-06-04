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

const SEARCH_LINK_RE = /\[([^\]]*(?:search|browse|more rugs)[^\]]*)\]\((https?:\/\/[^)]+)\)/gi;
const PLAIN_SEARCH_URL_RE = /https?:\/\/(?:www\.)?jaipurrugs\.com\/(?:in\/)?search(?:\?[^\s)]+)?/gi;
const SEARCH_PROMPT_LINE_RE = /(?:you can )?(?:search|browse|show) more (?:products|rugs)(?: here)?:\s*$/i;
const JR_SEARCH_URL = "https://www.jaipurrugs.com/in/search";
const VISITOR_ID_KEY = "jr_visitor_id";
const VISIT_COUNT_KEY = "jr_visit_count";
const CHAT_COUNT_KEY = "jr_chat_count";
const COUNTRY_OPTIONS = {
  "91": { iso: "IN", flag: "🇮🇳", label: "IN +91" },
  "1": { iso: "US", flag: "🇺🇸", label: "US +1" },
  "44": { iso: "GB", flag: "🇬🇧", label: "UK +44" },
  "61": { iso: "AU", flag: "🇦🇺", label: "AU +61" },
  "971": { iso: "AE", flag: "🇦🇪", label: "AE +971" },
};
const GEO_COUNTRY_TO_DIAL_CODE = {
  IN: "91",
  US: "1",
  GB: "44",
  AU: "61",
  AE: "971",
};

function getOrCreateVisitorId() {
  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  localStorage.setItem(VISITOR_ID_KEY, id);
  return id;
}

function incrementLocalCount(key) {
  const next = Number(localStorage.getItem(key) || "0") + 1;
  localStorage.setItem(key, String(next));
  return next;
}

function getVisiblePageUrl() {
  if (window.self !== window.top && document.referrer) {
    return document.referrer;
  }
  return window.location.href;
}

function getTrafficSource(referrer) {
  const value = (referrer || "").toLowerCase();
  if (!value) return "Direct";
  if (value.includes("google.")) return "Google";
  if (value.includes("instagram.")) return "Instagram";
  if (value.includes("facebook.") || value.includes("fb.")) return "Facebook";
  if (value.includes("bing.")) return "Bing";
  if (value.includes("jaipurrugs.com")) return "Jaipur Rugs Website";
  return "Referral";
}

function getGeoUrl() {
  const params = new URLSearchParams(window.location.search);
  const geoIp = params.get("geo_ip") || params.get("ip");
  if (!geoIp) return `${API_BASE}/geo`;
  return `${API_BASE}/geo?ip=${encodeURIComponent(geoIp.trim())}`;
}

function extractSearchCta(content) {
  let searchUrl = null;
  let searchLabel = "Search More Rugs";
  let cleaned = content.replace(SEARCH_LINK_RE, (match, label, url) => {
    if (!searchUrl && /(?:\/search|\bsearch\b|\bbrowse\b|more rugs)/i.test(url + label)) {
      searchUrl = JR_SEARCH_URL;
      searchLabel = label.replace(/[^\w\s]/g, "").trim() || "Search More Rugs";
    }
    return "";
  });

  cleaned = cleaned
    .replace(PLAIN_SEARCH_URL_RE, (url) => {
      if (!searchUrl) searchUrl = JR_SEARCH_URL;
      return "";
    })
    .split("\n")
    .map((line) => line.replace(SEARCH_PROMPT_LINE_RE, "").trimEnd())
    .filter((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text: cleaned, searchUrl, searchLabel };
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
  const countryManuallySelectedRef = useRef(false);
  const visitorRef = useRef({
    visitorId: "",
    visitCount: 1,
    chatCount: Number(localStorage.getItem(CHAT_COUNT_KEY) || "0"),
    chatStartedAt: null,
  });

  useEffect(() => {
    visitorRef.current = {
      ...visitorRef.current,
      visitorId: getOrCreateVisitorId(),
      visitCount: incrementLocalCount(VISIT_COUNT_KEY),
    };
  }, []);

  useEffect(() => {
    fetch(getGeoUrl())
      .then((res) => res.json())
      .then((geo) => {
        const detectedCode = GEO_COUNTRY_TO_DIAL_CODE[(geo.country_code || "").toUpperCase()];
        if (!detectedCode || countryManuallySelectedRef.current) return;
        setCountryCode(detectedCode);
        setCountryFlag(COUNTRY_OPTIONS[detectedCode]?.flag || "🌐");
      })
      .catch((err) => console.error("Geo detection error:", err));
  }, []);

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
    visitorRef.current.chatStartedAt = new Date();
    visitorRef.current.chatCount = incrementLocalCount(CHAT_COUNT_KEY);
    setUserEmail(normalizedEmail);
    setSessionId(normalizedEmail);
    setShowUserDialog(false);
  };

  const sendVisitorInsights = (eventType = "page_view") => {
    if (!sessionId) return;

    const now = new Date();
    const chatStartedAt = visitorRef.current.chatStartedAt || now;
    const currentPage = getVisiblePageUrl();
    const referrer = document.referrer || "";

    fetch(`${API_BASE}/visitor-insights/${encodeURIComponent(sessionId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: eventType,
        visitor_id: visitorRef.current.visitorId,
        user_name: userName,
        current_page: currentPage,
        current_page_title: document.title || "",
        referrer,
        traffic_source: getTrafficSource(referrer),
        visit_count: visitorRef.current.visitCount,
        chat_count: visitorRef.current.chatCount || 1,
        chat_started_at: chatStartedAt.toISOString(),
        last_seen_at: now.toISOString(),
        chat_duration_seconds: Math.max(
          0,
          Math.round((now.getTime() - chatStartedAt.getTime()) / 1000)
        ),
        country_code: countryCode,
      }),
    }).catch((err) => console.error("Visitor insights error:", err));
  };

  useEffect(() => {
    if (showUserDialog) return;

    // const newSession = crypto.randomUUID();
    // setSessionId(newSession);
  }, [showUserDialog]);

  useEffect(() => {
    if (!sessionId) return;
    setLoadingHistory(true);
    sendVisitorInsights("chat_start");

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
    if (!sessionId || showUserDialog) return;
    const interval = setInterval(() => sendVisitorInsights("heartbeat"), 30000);
    const handleVisibility = () => sendVisitorInsights("visibility");
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleVisibility);
    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleVisibility);
    };
  }, [sessionId, showUserDialog, userName, countryCode]);

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

  const userAccentClass = "bg-[#C29C96] text-[#1b1413]";
  const userAccentHoverClass = "hover:bg-[#b78f89]";

  const roleStyles = {
    user: `${userAccentClass} rounded-br-sm`,
    assistant: "bg-muted border rounded-bl-sm prose prose-sm dark:prose-invert",
    agent: "bg-gray-500 text-white rounded-bl-sm",
    system: "text-center text-xs text-muted-foreground",
  };

  const handleCountryChange = (value) => {
    countryManuallySelectedRef.current = true;
    setCountryCode(value);
    setCountryFlag(COUNTRY_OPTIONS[value]?.flag || "🌐");
  };

  return (
    <div className="relative">
      {/* BLUR EVERYTHING WHEN DIALOG OPEN */}
      <div className={`${showUserDialog ? "blur-sm pointer-events-none" : ""}`}>
        <div className="flex flex-col h-screen bg-background text-foreground">
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-card shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${userAccentClass} rounded-full flex items-center justify-center`}>
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

              <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNTRY_OPTIONS).map(([value, option]) => (
                    <SelectItem key={value} value={value}>
                      {option.flag} +{value}
                    </SelectItem>
                  ))}
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
                  <div className="w-16 h-16 bg-[#C29C96]/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Bot className="w-8 h-8 text-[#C29C96]" />
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
                        <div className={`w-10 h-10 rounded-full ${userAccentClass} flex items-center justify-center shrink-0`}>
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
              <Button
                onClick={sendMessage}
                size="icon"
                className={`shadow-md ${userAccentClass} ${userAccentHoverClass}`}
              >
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

            <Button
              className={`w-full mt-4 ${userAccentClass} ${userAccentHoverClass}`}
              onClick={handleUserSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
