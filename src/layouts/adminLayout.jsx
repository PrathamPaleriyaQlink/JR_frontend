import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Users, UserCheck, ArrowLeft, HomeIcon, LogOutIcon, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const location = useLocation();

  const getTabVariant = (path) => (location.pathname.startsWith(path) ? "default" : "ghost");
  const getTabVariant1 = (path) => (location.pathname === path ? "default" : "ghost");

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-20 bg-card border-r flex flex-col items-center py-6">
        <div className="mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md mb-2">
            <span className="text-primary-foreground font-bold text-lg">JR</span>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">JaipurRugs</div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4">
          <Link to="/admin">
            <Button variant={getTabVariant1("/admin")} size="icon">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/admin/active">
            <Button variant={getTabVariant("/admin/active")} size="icon">
              <UserCheck className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/admin/users">
            <Button variant={getTabVariant("/admin/users")} size="icon">
              <Users className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/admin/kb">
            <Button variant={getTabVariant("/admin/kb")} size="icon">
              <Brain className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => (window.location.href = "/")}
          title="Back to Landing Page"
        >
          <LogOutIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
