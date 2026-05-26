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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useAlerts } from "@/contexts/AlertContext";
import { API_WEB_BASE } from "@/lib/api";

const API_BASE = API_WEB_BASE;

export default function AdminHome() {
  const { alerts } = useAlerts();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = React.useState({
    overview: {
      active_users: 0,
      total_users: 0,
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
        const res = await fetch(`${API_BASE}/dashboard/insights`);
        if (!res.ok) throw new Error("Failed to fetch dashboard insights");

        const data = await res.json();
        if (isMounted) {
          setDashboardData({
            overview: {
              active_users: data?.overview?.active_users ?? 0,
              total_users: data?.overview?.total_users ?? 0,
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
