import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Pencil, Trash2 } from "lucide-react";

const API_BASE = "https://api.vultr3.qlink.in/api/web";

const KBSearch = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editText, setEditText] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/kb/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);

    try {
      await fetch(`${API_BASE}/kb/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: editText, lable: selectedRecord.lable }),
      });

      setShowEditDialog(false);
      setSelectedRecord(null);
      setEditText("");

      handleSearch(); // refresh
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);

    try {
      await fetch(`${API_BASE}/kb/${selectedRecord.id}`, {
        method: "DELETE",
      });

      setShowDeleteDialog(false);
      setSelectedRecord(null);

      handleSearch(); // refresh
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-background min-h-screen">
      <h2 className="text-xl font-semibold tracking-tight">Search KB</h2>
      <p className="text-sm text-muted-foreground -mt-3">
        You can perform semantic search and update each record in the knowledge
        base.
      </p>

      <div className="flex gap-3">
        <Input
          placeholder="Search from KB..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </div>
          )}
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Searching...
        </div>
      ) : results.length === 0 ? null : (
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Search Results
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {results.map((rec) => (
                  <TableRow key={rec.id || rec.created_at}>
                    <TableCell>{rec.lable}</TableCell>

                    <TableCell className="text-sm max-w-[450px] truncate">
                      <Popover>
                        <PopoverTrigger asChild>
                          <div className="cursor-pointer truncate">
                            {rec.text}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-3 text-sm text-muted-foreground">
                          {rec.text}
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
                          setEditText(rec.text);
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
          </CardContent>
        </Card>
      )}

      {/* EDIT DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>

          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[120px]"
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

      {/* DELETE DIALOG */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            Are you sure you want to delete this record? This action cannot be undone.
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
};

export default KBSearch;
