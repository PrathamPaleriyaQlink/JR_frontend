import React, { useState, useEffect } from "react";
import { Loader2, Phone, Search, RefreshCw, UserCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_DASHBOARD_BASE } from "@/lib/api";

const API_BASE = API_DASHBOARD_BASE;

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/leads`).then((r) => r.json()),
      fetch(`${API_BASE}/stats`).then((r) => r.json()),
    ])
      .then(([leadsData, statsData]) => {
        const arr = leadsData?.data ?? leadsData ?? [];
        setLeads(Array.isArray(arr) ? arr : []);
        setStats(statsData || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
    const id = setInterval(fetchLeads, 10000);
    return () => clearInterval(id);
  }, []);

  const filtered = leads.filter((lead) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (lead.name || "").toLowerCase().includes(q) ||
      (lead.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-screen p-6 bg-background gap-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0">
        {[
          { label: "Total Leads", value: stats.total_leads ?? leads.length },
          { label: "Total Messages", value: stats.total_messages ?? "—" },
          { label: "Inbound", value: stats.inbound_messages ?? "—" },
          { label: "Outbound", value: stats.outbound_messages ?? "—" },
        ].map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {s.label}
            </p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchLeads} title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border rounded-xl bg-card">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading leads…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <UserCheck2 className="w-10 h-10" />
            <p className="text-sm">No leads found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                {["Name", "Phone", "Status", "Location", "Created"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr
                  key={lead.id || i}
                  className="border-t hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {lead.name || "Unknown"}
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {lead.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        lead.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {lead.status === "active" ? "AI" : "Agent"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
