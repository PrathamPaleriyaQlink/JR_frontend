import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Keyboard, Clock, MapPin, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export default function AdminHome() {
  const navigate = useNavigate();

  const mainCards = [
    {
      title: "Active Users",
      value: "124",
      icon: <UserCheck className="h-5 w-5 text-blue-500" />,
      onClick: () => navigate("/admin/active"),
    },
    {
      title: "Total Users",
      value: "1,024",
      icon: <Users className="h-5 w-5 text-green-500" />,
      onClick: () => navigate("/admin/users"),
    },
  ];

  const insightCards = [
    {
      title: "Most Searched Keyword",
      value: "Persian Rug",
      icon: <Keyboard className="h-5 w-5 text-yellow-500" />,
    },
    {
      title: "Active Time",
      value: "7 PM – 9 PM",
      icon: <Clock className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Highest Traffic Location",
      value: "India",
      icon: <MapPin className="h-5 w-5 text-red-500" />,
    },
    {
      title: "Highest Interested Color",
      value: "Beige",
      icon: <Palette className="h-5 w-5 text-pink-500" />,
    },
  ];

  return (
    <div className="flex-1 px-10 py-12 bg-gradient-to-b from-muted/40 to-muted/20 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col space-y-2 mb-4">
          <h1 className="text-4xl font-semibold text-foreground tracking-tight">
            Clara-JR Admin Dashboard
          </h1>
        </div>

        <Separator/>

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
