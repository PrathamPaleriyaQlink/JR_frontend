import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

const API_BASE = "https://api.vultr3.qlink.in/api/web";

export default function KnowledgeBase() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [newRecord, setNewRecord] = useState("");
  const [editRecordText, setEditRecordText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

//   const fetchRecords = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`${API_BASE}/kb/all`);
//       const data = await res.json();
//       setRecords(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRecords();
//   }, []);

  const handleAdd = async () => {
    // setActionLoading(true);
    // try {
    //   await fetch(`${API_BASE}/kb/add`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ record: newRecord }),
    //   });
    //   setShowAddDialog(false);
    //   setNewRecord("");
    //   await fetchRecords();
    // } catch (err) {
    //   console.error(err);
    // } finally {
    //   setActionLoading(false);
    // }
  };

  const handleDelete = async () => {
    // setActionLoading(true);
    // try {
    //   await fetch(`${API_BASE}/kb/${selectedRecord.id}`, {
    //     method: "DELETE",
    //   });
    //   setShowDeleteDialog(false);
    //   setSelectedRecord(null);
    //   await fetchRecords();
    // } catch (err) {
    //   console.error(err);
    // } finally {
    //   setActionLoading(false);
    // }
  };

  const handleEdit = async () => {
    // if (!selectedRecord) return;
    // setActionLoading(true);
    // try {
    //   await fetch(`${API_BASE}/kb/${selectedRecord.id}`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ record: editRecordText }),
    //   });
    //   setShowEditDialog(false);
    //   setSelectedRecord(null);
    //   setEditRecordText("");
    //   await fetchRecords();
    // } catch (err) {
    //   console.error(err);
    // } finally {
    //   setActionLoading(false);
    // }
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Knowledge Base</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      </div>

      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            All Knowledge Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading records...
            </div>
          ) : records.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              No records found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="text-sm max-w-[500px] truncate">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="cursor-pointer truncate">
                            {rec.metadata}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-3 text-sm text-muted-foreground">
                          {rec.metadata}
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(rec.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setEditRecordText(rec.metadata);
                          setShowEditDialog(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRecord(rec);
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Record</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter record content..."
            value={newRecord}
            onChange={(e) => setNewRecord(e.target.value)}
          />
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!newRecord.trim() || actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editRecordText}
            onChange={(e) => setEditRecordText(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this record? This action cannot be
            undone.
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
