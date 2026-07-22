import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MessageSquare, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAlerts } from "@/contexts/AlertContext";
import { Button } from "@/components/ui/button";

const looksLikeWhatsAppPhone = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return false;
  // Web sessions are UUIDs (contain hyphens + hex letters)
  if (raw.includes("-") && raw.length >= 32) return false;
  if (/[a-f]/i.test(raw) && raw.includes("-")) return false;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return false;
  // Pure phone / E.164 — not a UUID digit soup
  return /^\+?\d[\d\s-]*$/.test(raw) || digits === raw.replace(/\D/g, "");
};

const resolveAlertChannel = (alert) => {
  const explicit = String(alert?.channel || "").toLowerCase();
  if (explicit === "whatsapp" || explicit === "web") return explicit;
  return looksLikeWhatsAppPhone(alert?.session_id) ? "whatsapp" : "web";
};

const AdminAlerts = () => {
  const { alerts, deleteAlert } = useAlerts();
  const navigate = useNavigate();

  const goToChat = async (alert) => {
    const sid = (alert.session_id || "").trim();
    const channel = resolveAlertChannel(alert);

    if (channel === "whatsapp") {
      const phone = String(sid).replace(/\D/g, "");
      navigate(`/admin/whatsapp?phone=${encodeURIComponent(phone || sid)}`);
    } else {
      navigate(`/admin/active?session=${encodeURIComponent(sid)}`);
    }
    await deleteAlert(alert._id);
  };
  const formatTime = (createdAt) => {
    if (!createdAt) return "Unknown";
    return new Date(createdAt * 1000).toLocaleString();
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Active Alerts</h2>
          <p className="text-sm text-muted-foreground">
            Rug specialist requests from web and WhatsApp.
          </p>
        </div>
        {alerts.length > 0 && (
          <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
            {alerts.length} active
          </div>
        )}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Alert</TableHead>
              <TableHead className="w-[12%]">Channel</TableHead>
              <TableHead className="w-[18%]">Session</TableHead>
              <TableHead className="w-[10%]">Queue</TableHead>
              <TableHead className="w-[12%]">Time</TableHead>
              <TableHead className="text-center w-[8%]">Chat</TableHead>
              <TableHead className="text-center w-[5%]">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert._id}>
                <TableCell className="font-medium">
                  {alert.alert}
                  {alert.callback_phone ? (
                    <div className="mt-1 text-xs font-normal text-muted-foreground">
                      Callback: {alert.callback_phone}
                    </div>
                  ) : null}
                </TableCell>

                <TableCell className="text-muted-foreground capitalize">
                  {resolveAlertChannel(alert)}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {alert.session_id}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  #{alert.queue_position || "-"}
                  {alert.eta_minutes ? ` / ${alert.eta_minutes} min` : ""}
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {formatTime(alert.created_at)}
                </TableCell>

                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => goToChat(alert)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Go To Chat
                  </Button>
                </TableCell>

                <TableCell className="text-center">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteAlert(alert._id)}
                    aria-label="Dismiss alert"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAlerts;
