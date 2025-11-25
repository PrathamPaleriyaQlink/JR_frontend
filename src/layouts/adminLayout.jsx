import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Users, UserCheck, LogOutIcon, Brain, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAlerts } from "@/contexts/AlertContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const { alerts } = useAlerts();

  const [showBanner, setShowBanner] = React.useState(false);

  const { employeeData } = useAdmin();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!employeeData || !employeeData.empId) {
      navigate("/");
    }
  }, [employeeData, navigate]);


  React.useEffect(() => {
    if (alerts.length > 0) {
      setShowBanner(true);

      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [alerts]);

  const getTabVariant = (path) =>
    location.pathname.startsWith(path) ? "default" : "ghost";
  const getTabVariant1 = (path) =>
    location.pathname === path ? "default" : "ghost";

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-20 bg-card border-r flex flex-col items-center py-6 gap-3">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md mb-2">
            <span className="text-primary-foreground font-bold text-lg">
              JR
            </span>
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            JaipurRugs
          </div>
        </div>

        {/* Sidebar Nav */}
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

        {/* 🔔 Alerts Button In Sidebar */}
        <Link to="/admin/alerts" className="relative">
          <Button
            variant={getTabVariant("/admin/alerts")}
            className={"bg-red-100 hover:bg-red-200 cursor-pointer"}
            size="icon"
          >
            <Bell className="w-7 h-7 text-red-800" />
          </Button>

          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
              {alerts.length}
            </span>
          )}
        </Link>

        <ThemeToggle />

        <Button
          variant="outline"
          size="icon"
          onClick={() => (window.location.href = "/")}
        >
          <LogOutIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Auto-Hiding Notification Banner */}
        {showBanner && alerts.length > 0 && (
          <div className="w-full bg-red-100 border-b border-red-300 text-red-800 px-6 py-3 flex items-center justify-between text-sm">
            <div className="font-medium">
              🔔 You have <span className="font-semibold">{alerts.length}</span>{" "}
              active alerts.
            </div>

            <Link
              to="/admin/alerts"
              className="text-xs font-semibold bg-white rounded-full px-3 py-1 transition"
            >
              View Alerts
            </Link>
          </div>
        )}

        <Outlet />
      </div>
    </div>
  );
}
