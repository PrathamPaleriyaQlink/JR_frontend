import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { X } from "lucide-react";
import { useAlerts } from "@/contexts/AlertContext";

const AdminAlerts = () => {
  const { alerts, deleteAlert } = useAlerts();

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Active Alerts</h2>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80%]">Alert</TableHead>
              <TableHead className="w-[15%]">Session</TableHead>
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
                  colSpan={3}
                  className="text-center py-10 text-muted-foreground"
                >
                  No active alerts 🎉
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
