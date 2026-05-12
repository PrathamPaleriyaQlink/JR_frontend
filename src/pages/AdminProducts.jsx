import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Package,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = "https://jaipurrugs-whatsapp-backend.vercel.app/api";
const PAGE_SIZE = 50;
const EMPTY_FORM = {
  name: "",
  type: "",
  category: "",
  price: "",
  buy_link: "",
  description: "",
  location: "",
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchProducts = useCallback(
    (p = page, q = search) => {
      setLoading(true);
      const params = new URLSearchParams({
        skip: p * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      if (q.trim()) params.set("q", q.trim());
      fetch(`${API_BASE}/products?${params}`)
        .then((r) => r.json())
        .then((data) => {
          setProducts(data?.data ?? data ?? []);
          setTotal(data?.meta?.total ?? (data?.data ?? data ?? []).length);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [page, search]
  );

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(0, search), 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts(page, search);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (product) => {
    if (product.source === "jaipur_rugs") return;
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      type: product.type || "",
      category: product.category || "",
      price: product.price || "",
      buy_link: product.buy_link || "",
      description: product.description || "",
      location: product.location || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));

      const url = editingId
        ? `${API_BASE}/products/${editingId}`
        : `${API_BASE}/products`;
      const method = editingId ? "PATCH" : "POST";
      await fetch(url, { method, body });
      setShowForm(false);
      fetchProducts(page, search);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
      setDeleteConfirm(null);
      fetchProducts(page, search);
    } catch (err) {
      console.error(err);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col h-screen p-6 bg-background gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="border rounded-xl bg-card p-5 shrink-0 grid grid-cols-2 gap-4">
          <h3 className="col-span-2 font-semibold text-sm">
            {editingId ? "Edit Product" : "Add Product"}
          </h3>
          {[
            { key: "name", label: "Name *", placeholder: "Product name" },
            { key: "type", label: "Type", placeholder: "e.g. Hand Knotted" },
            { key: "category", label: "Category / Collection", placeholder: "" },
            { key: "price", label: "Price", placeholder: "e.g. INR 19,950" },
            { key: "buy_link", label: "Buy Link", placeholder: "https://…" },
            { key: "location", label: "Location", placeholder: "" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <input
                className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="col-span-2 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Package className="w-10 h-10" />
            <p className="text-sm">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-card border rounded-xl overflow-hidden flex flex-col"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1 gap-1">
                  <p className="font-medium text-sm line-clamp-2">{p.name}</p>
                  {p.category && (
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  )}
                  {p.price && (
                    <p className="text-xs font-semibold text-primary">{p.price}</p>
                  )}
                  <div className="flex gap-1 mt-auto pt-2">
                    {p.buy_link && (
                      <a
                        href={p.buy_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </a>
                    )}
                    {p.source !== "jaipur_rugs" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(p.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between shrink-0 pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold mb-2">Delete product?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
