import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Edit2, X, Check } from "lucide-react";

const API_BASE = "https://api.vultr3.qlink.in/api/web";

export default function SystemPrompt() {
  const [prompt, setPrompt] = useState({
    system_identity: "",
    system_conversation_style: "",
    system_product_display_format: "",
    system_others: "",
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState({
    system_identity: false,
    system_conversation_style: false,
    system_product_display_format: false,
    system_others: false,
  });
  const [draft, setDraft] = useState({ ...prompt });

  const fetchPrompt = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/system/prompt`);
      const data = await res.json();
      setPrompt(data || {});
      setDraft(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompt();
  }, []);

  const handleSave = async (field) => {
    if (!draft[field] && field !== "system_identity") {
      alert("This field cannot be empty.");
      return;
    }
    setSaving((prev) => ({ ...prev, [field]: true }));
    try {
      await fetch(`${API_BASE}/system/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft }),
      });
      setPrompt(draft);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleCancel = (field) => {
    setDraft((prev) => ({ ...prev, [field]: prompt[field] }));
  };

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const renderSection = (label, field, warning) => (
    <div className="p-4 border-b border-gray-200 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm">{label}</h3>
        {editMode && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCancel(field)}
              disabled={saving[field]}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(field)}
              disabled={saving[field]}
            >
              {saving[field] ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        )}
      </div>
      <Textarea
        value={editMode ? draft[field] : prompt[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        readOnly={!editMode}
        className={`min-h-[80px] ${!editMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
      />
      {warning && (
        <div className="flex items-center gap-2 text-white bg-yellow-500 px-5 py-2 text-sm mt-1 rounded-md">
          <AlertTriangle className="w-4 h-4" />
          {warning}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-6 bg-background min-h-screen  mx-auto">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold tracking-tight">
            System Prompt Configuration
          </h2>
          <Button
            variant={editMode ? "destructive" : "default"}
            onClick={() => setEditMode((prev) => !prev)}
          >
            {editMode ? "Exit Edit Mode" : <><Edit2 className="w-4 h-4 mr-1" /> Edit</>}
          </Button>
        </div>
        <p className="text-sm w-[50%] text-muted-foreground">
          This page allows you to configure the AI chat agent’s response behavior. 
          You can edit how the chat agent will respond, its tone, and the way it displays product information.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading system prompt...
        </div>
      ) : (
        <>
          {renderSection("System Identity", "system_identity")}
          {renderSection("Conversation Style", "system_conversation_style")}
          {renderSection(
            "Product Display Format",
            "system_product_display_format",
            "Warning: Changing this can alter how the bot displays products."
          )}
          {renderSection("Other Notes", "system_others")}
        </>
      )}
    </div>
  );
}
