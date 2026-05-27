import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Keyboard,
  Clock,
  MapPin,
  Palette,
  Bell,
  MessageSquare,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAlerts } from "@/contexts/AlertContext";
import { API_DASHBOARD_BASE } from "@/lib/api";

const API_BASE = API_DASHBOARD_BASE;
const COLORS = [
  "red",
  "blue",
  "green",
  "grey",
  "gray",
  "black",
  "white",
  "pink",
  "beige",
  "ivory",
  "brown",
  "gold",
  "yellow",
  "orange",
  "purple",
  "cream",
  "natural",
];
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "want",
  "need",
  "show",
  "please",
  "rug",
  "rugs",
  "carpet",
  "jaipur",
  "price",
  "hello",
  "hi",
  "you",
  "can",
  "are",
  "any",
  "all",
  "like",
  "more",
]);

const mostCommon = (counter, fallback = "N/A") => {
  const entries = Object.entries(counter);
  if (!entries.length) return fallback;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
};

const inferLocationFromPhone = (phone = "") => {
  const value = String(phone).replace(/\D/g, "");
  if (value.startsWith("91")) return "India";
  if (value.startsWith("1")) return "US/Canada";
  if (value.startsWith("44")) return "United Kingdom";
  if (value.startsWith("971")) return "UAE";
  if (value.startsWith("61")) return "Australia";
  return "";
};

const buildFallbackInsights = async (conversations) => {
  const keywordCounter = {};
  const hourCounter = {};
  const locationCounter = {};
  const colorCounter = {};
  const histories = await Promise.all(
    conversations.slice(0, 50).map(async (conv) => {
      const res = await fetch(`${API_BASE}/conversations/${encodeURIComponent(conv.phone)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    })
  );

  conversations.forEach((conv) => {
    const location = inferLocationFromPhone(conv.phone);
    if (location) locationCounter[location] = (locationCounter[location] || 0) + 1;
  });

  histories.flat().forEach((message) => {
    const timestamp = message.timestamp ? new Date(message.timestamp) : null;
    if (timestamp && !Number.isNaN(timestamp.getTime())) {
      const hour = timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        hour12: true,
      });
      hourCounter[hour] = (hourCounter[hour] || 0) + 1;
    }

    const content = String(message.content || "").toLowerCase();
    COLORS.forEach((color) => {
      if (content.includes(color)) {
        const key = color === "gray" ? "grey" : color;
        colorCounter[key] = (colorCounter[key] || 0) + 1;
      }
    });

    if (message.direction !== "inbound") return;
    content
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
      .forEach((word) => {
        keywordCounter[word] = (keywordCounter[word] || 0) + 1;
      });
  });

  return {
    most_searched_keyword: mostCommon(keywordCounter),
    active_time: mostCommon(hourCounter),
    highest_traffic_location: mostCommon(locationCounter),
    highest_interested_color: mostCommon(colorCounter),
  };
};

export default function AdminHome() {
  const { alerts } = useAlerts();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = React.useState({
    overview: {
      active_users: 0,
      total_users: 0,
      total_leads: 0,
      total_messages: 0,
    },
    insights: {
      most_searched_keyword: "N/A",
      active_time: "N/A",
      highest_traffic_location: "N/A",
      highest_interested_color: "N/A",
    },
  });
  const [loadingDashboard, setLoadingDashboard] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        setLoadingDashboard(true);
        let res = await fetch(`${API_BASE}/dashboard/insights`);
        let data;
        if (res.ok) {
          data = await res.json();
        } else {
          res = await fetch(`${API_BASE}/stats`);
          if (!res.ok) throw new Error("Failed to fetch dashboard stats");
          const stats = await res.json();
          let activeUsers = 0;
          let insights = {};
          try {
            const conversationsRes = await fetch(`${API_BASE}/conversations`);
            const conversations = conversationsRes.ok
              ? await conversationsRes.json()
              : [];
            const activeCutoff = Date.now() - 30 * 60 * 1000;
            activeUsers = Array.isArray(conversations)
              ? conversations.filter((conv) => {
                  const lastMessageAt = conv.last_message_at
                    ? new Date(conv.last_message_at).getTime()
                    : 0;
                  return lastMessageAt >= activeCutoff;
                }).length
              : 0;
            insights = Array.isArray(conversations)
              ? await buildFallbackInsights(conversations)
              : {};
          } catch (err) {
            console.error("Error fetching fallback dashboard insights", err);
          }
          data = {
            overview: {
              active_users: activeUsers,
              total_users: stats.total_users ?? 0,
              total_leads: stats.total_leads ?? 0,
              total_messages: stats.total_messages ?? 0,
            },
            insights,
          };
        }
        if (isMounted) {
          setDashboardData({
            overview: {
              active_users: data?.overview?.active_users ?? 0,
              total_users: data?.overview?.total_users ?? 0,
              total_leads: data?.overview?.total_leads ?? 0,
              total_messages: data?.overview?.total_messages ?? 0,
            },
            insights: {
              most_searched_keyword: data?.insights?.most_searched_keyword || "N/A",
              active_time: data?.insights?.active_time || "N/A",
              highest_traffic_location: data?.insights?.highest_traffic_location || "N/A",
              highest_interested_color: data?.insights?.highest_interested_color || "N/A",
            },
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard insights", err);
      } finally {
        if (isMounted) setLoadingDashboard(false);
      }
    };

    fetchDashboardData();
    const intervalId = setInterval(fetchDashboardData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const mainCards = [
    {
      title: "Active Users",
      value: loadingDashboard
        ? "..."
        : dashboardData.overview.active_users.toLocaleString(),
      icon: <UserCheck className="h-5 w-5 text-blue-500" />,
      onClick: () => navigate("/admin/active"),
    },
    {
      title: "Total Users",
      value: loadingDashboard
        ? "..."
        : dashboardData.overview.total_users.toLocaleString(),
      icon: <Users className="h-5 w-5 text-green-500" />,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Total Leads",
      value: loadingDashboard
        ? "..."
        : dashboardData.overview.total_leads.toLocaleString(),
      icon: <Target className="h-5 w-5 text-orange-500" />,
      onClick: () => navigate("/admin/leads"),
    },
    {
      title: "Total Messages",
      value: loadingDashboard
        ? "..."
        : dashboardData.overview.total_messages.toLocaleString(),
      icon: <MessageSquare className="h-5 w-5 text-purple-500" />,
      onClick: () => navigate("/admin/whatsapp"),
    },
  ];

  const insightCards = [
    {
      title: "Most Searched Keyword",
      value: loadingDashboard
        ? "Loading..."
        : dashboardData.insights.most_searched_keyword,
      icon: <Keyboard className="h-5 w-5 text-yellow-500" />,
    },
    {
      title: "Active Time",
      value: loadingDashboard ? "Loading..." : dashboardData.insights.active_time,
      icon: <Clock className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Highest Traffic Location",
      value: loadingDashboard
        ? "Loading..."
        : dashboardData.insights.highest_traffic_location,
      icon: <MapPin className="h-5 w-5 text-red-500" />,
    },
    {
      title: "Highest Interested Color",
      value: loadingDashboard
        ? "Loading..."
        : dashboardData.insights.highest_interested_color,
      icon: <Palette className="h-5 w-5 text-pink-500" />,
    },
  ];

  return (
    <div className="flex-1 px-10 py-12 bg-gradient-to-b from-muted/40 to-muted/20 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight">
              JaipurRugs Admin Dashboard
            </h1>
          </div>

          {/* Bell Icon */}
          <button
            onClick={() => navigate("/admin/alerts")}
            className="relative p-3 rounded-xl bg-muted hover:bg-accent/20 transition-all border border-border"
          >
            <Bell className="h-6 w-6 text-foreground" />

            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                {alerts.length}
              </span>
            )}
          </button>
        </div>

        <Separator />

        {/* Main Cards */}
        <section>
          <h2 className="text-lg font-medium text-muted-foreground mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainCards.map((card, idx) => (
              <Card
                key={idx}
                onClick={card.onClick}
                className="group transition-all border border-border rounded-2xl hover:shadow-md hover:bg-accent/5 cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-semibold text-foreground">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Insights Section */}
        <section>
          <h2 className="text-lg font-medium text-muted-foreground mb-4">
            User Insights
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {insightCards.map((card, idx) => (
              <Card
                key={idx}
                className="transition-all border border-border rounded-2xl"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-muted">{card.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-medium text-foreground">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
