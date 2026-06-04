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

const AdminAlerts = () => {
  const { alerts, deleteAlert } = useAlerts();
  const navigate = useNavigate();

  const normalizePhoneSession = (value) => {
    const raw = String(value || "").trim();
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 10 ? digits : "";
  };

  const goToChat = async (alert) => {
    const sid = (alert.session_id || "").trim();
    const whatsappPhone = normalizePhoneSession(sid);

    if (whatsappPhone) {
      navigate(`/admin/whatsapp?phone=${encodeURIComponent(whatsappPhone)}`);
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
              <TableHead className="w-[55%]">Alert</TableHead>
              <TableHead className="w-[20%]">Session</TableHead>
              <TableHead className="w-[12%]">Queue</TableHead>
              <TableHead className="w-[15%]">Time</TableHead>
              <TableHead className="text-center w-[8%]">Chat</TableHead>
              <TableHead className="text-center w-[5%]">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert._id}>
                <TableCell className="font-medium">
                  {alert.alert}
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
                  <button
                    onClick={() => deleteAlert(alert._id)}
                    className="p-2 rounded-lg hover:bg-red-100 transition"
                  >
                    <X className="h-5 w-5 text-red-500" />
                  </button>
                </TableCell>
              </TableRow>
            ))}

            {alerts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No active alerts
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminAlerts;
