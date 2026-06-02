import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Home,
  UserCheck,
  LogOutIcon,
  Brain,
  Bell,
  BotMessageSquare,
  MessageCircle,
  Target,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useAlerts } from "@/contexts/AlertContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const location = useLocation();
  const { alerts, newAlertSignal } = useAlerts();

  const [showBanner, setShowBanner] = React.useState(false);

  const { employeeData } = useAdmin();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!employeeData || !employeeData.empId) {
      navigate("/");
    }
  }, [employeeData, navigate]);


  React.useEffect(() => {
    if (newAlertSignal > 0) {
      setShowBanner(true);

      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [newAlertSignal]);

  const getTabVariant = (path) =>
    location.pathname.startsWith(path) ? "default" : "ghost";
  const getTabVariant1 = (path) =>
    location.pathname === path ? "default" : "ghost";
  const navItems = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: Home,
      variant: getTabVariant1("/admin"),
    },
    {
      to: "/admin/active",
      label: "Active Web Chat",
      icon: UserCheck,
      variant: getTabVariant("/admin/active"),
    },
    {
      to: "/admin/users",
      label: "Web Chat",
      icon: BotMessageSquare,
      variant: getTabVariant("/admin/users"),
    },
    {
      to: "/admin/kb",
      label: "Knowledge Base",
      icon: Brain,
      variant: getTabVariant("/admin/kb"),
    },
    {
      to: "/admin/whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      variant: getTabVariant("/admin/whatsapp"),
    },
    {
      to: "/admin/leads",
      label: "Leads",
      icon: Target,
      variant: getTabVariant("/admin/leads"),
    },
    {
      to: "/admin/products",
      label: "Products",
      icon: Package,
      variant: getTabVariant("/admin/products"),
    },
  ];

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
          {navItems.map(({ to, label, icon: Icon, variant }) => (
            <Link key={to} to={to} className="group relative">
              <Button variant={variant} size="icon" aria-label={label}>
                <Icon className="w-5 h-5" />
              </Button>
              <span className="pointer-events-none absolute left-12 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Alerts Button In Sidebar */}
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
              You have <span className="font-semibold">{alerts.length}</span>{" "}
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
