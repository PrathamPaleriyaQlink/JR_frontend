import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function KBLayout() {
  const location = useLocation();

  const tabs = [
    { label: "Prompt", path: "/admin/kb" },
    { label: "Self Learned KB", path: "/admin/kb/self" },
    { label: "Knowledge Base", path: "/admin/kb/kb" },
    { label: "Search KB", path: "/admin/kb/search" },
  ];

  const getVariant = (path) =>
    location.pathname === path ? "default" : "ghost";

  return (
    <div className="flex flex-col h-full w-full">
      {/* Top Navbar */}
      <div className="w-full border-b bg-card px-4 py-3 flex justify-end gap-4 sticky top-0 z-10">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path} className="">
            <Button variant={getVariant(tab.path)} className="px-6 w-full">
              {tab.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
