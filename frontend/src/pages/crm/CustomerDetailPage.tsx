import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  api,
  Customer,
  Interaction,
  InteractionListResponse,
  CustomerChatRequest,
  InteractionUpdate,
} from "../../services/api";
import { ChevronDown, ChevronUp, Edit2, Trash2, X, Save, Calendar, Paperclip } from "lucide-react";

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Date filtering
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Interaction expansion and editing state
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set());
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [editResponse, setEditResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Calculate date 15 days ago as default
  useEffect(() => {
    const today = new Date();
    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(today.getDate() - 15);
    setStartDate(fifteenDaysAgo.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  async function fetchCustomerAndInteractions() {
    if (!customerId) return;
    try {
      setLoading(true);
      setError(null);

      const interactionParams: Record<string, string | number> = { limit: 50, offset: 0 };
      if (startDate) {
        interactionParams.start_date = startDate;
      }
      if (endDate) {
        interactionParams.end_date = endDate;
      }

      const [customerRes, interactionsRes] = await Promise.all([
        api.get<Customer>(`/crm/customers/${customerId}`),
        api.get<InteractionListResponse>(
          `/crm/customers/${customerId}/interactions`,
          { params: interactionParams }
        ),
      ]);

      setCustomer(customerRes.data);
      setInteractions(interactionsRes.data.interactions);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomerAndInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, startDate, endDate]);

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !chatInput.trim()) return;

    try {
      setChatLoading(true);
      setUploadingFile(selectedFile !== null);
      setChatError(null);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("input_text", chatInput.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const res = await api.post<Interaction>(
        `/crm/customers/${customerId}/chat`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setInteractions((prev) => [res.data, ...prev]);
      setChatInput("");
      setSelectedFile(null);
    } catch (err: any) {
      console.error(err);
      setChatError(err?.response?.data?.detail ?? err?.message ?? "Chat failed");
    } finally {
      setChatLoading(false);
      setUploadingFile(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        return;
      }
      setSelectedFile(file);
    }
  }

  function toggleInteraction(id: string) {
    setExpandedInteractions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function startEdit(interaction: Interaction) {
    setEditingInteraction(interaction.id);
    setEditInput(interaction.input_text || "");
    setEditResponse(interaction.ai_response || "");
  }

  function cancelEdit() {
    setEditingInteraction(null);
    setEditInput("");
    setEditResponse("");
  }

  async function saveEdit(interactionId: string) {
    try {
      setSaving(true);
      const update: InteractionUpdate = {
        input_text: editInput || null,
        ai_response: editResponse || null,
      };

      const res = await api.put<Interaction>(`/crm/interactions/${interactionId}`, update);
      
      setInteractions((prev) =>
        prev.map((it) => (it.id === interactionId ? res.data : it))
      );
      cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(interactionId: string) {
    if (!confirm("Are you sure you want to delete this interaction?")) return;

    try {
      setDeleting(interactionId);
      await api.delete(`/crm/interactions/${interactionId}`);
      setInteractions((prev) => prev.filter((it) => it.id !== interactionId));
      setExpandedInteractions((prev) => {
        const next = new Set(prev);
        next.delete(interactionId);
        return next;
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to delete interaction");
    } finally {
      setDeleting(null);
    }
  }

  function getPreview(text: string | null | undefined, maxLength: number = 150): string {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 text-sm shadow-md">
          Loading customer interactions...
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 rounded-2xl border border-rose-200 bg-white shadow-lg p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-rose-600">
            {error ?? "Customer not found"}
          </h2>
          <p className="text-sm text-slate-600">
            The requested customer could not be loaded. It may have been deleted or the link is invalid.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/crm/customers"
              className="inline-flex items-center px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
            >
              ← Back to customers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Subtle gradient header background */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-50 shadow-md">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-7 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <p className="inline-flex items-center text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
              CRM · Customer Interactions
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
              Customer Interactions & History
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="font-medium">{customer.customer_name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3 py-1 border border-slate-700/60">
                <span className="text-xs text-slate-400">Display ID</span>
                <span className="font-mono text-xs text-slate-100">
                  {customer.display_id ?? "—"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-end">
            {interactions.some(
              (it) =>
                it.ai_response &&
                (it.input_text?.toLowerCase().includes("profile") ||
                  it.input_text?.toLowerCase().includes("system:"))
            ) && (
              <Link
                to={`/crm/customers/${customerId}/profile`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow"
              >
                View AI Profile
              </Link>
            )}
            <Link
              to="/crm/customers/manage"
              className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Manage Customers
            </Link>
            <Link
              to="/crm/customers"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-900 transition-colors"
            >
              Back to list
            </Link>
          </div>
        </div>
        </main>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.4fr)]">
          {/* AI Assistant Card */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl" />
            </div>
            <div className="relative p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    AI Assistant
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 max-w-md">
                    Ask about this customer, deals, or product fit. Each answer is
                    stored as an interaction and can be edited later.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 border border-emerald-500/30">
                  Live · Gemini
                </span>
              </div>

              <form onSubmit={handleChatSubmit} className="space-y-3">
                <div className="relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the assistant to suggest next steps, qualify the opportunity, or propose a product mix..."
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 resize-y"
                  />
                </div>
                
                {/* File upload */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <Paperclip size={14} />
                    Attach file (PDF, Word, Excel, etc.)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.xlsx,.xls,.txt,.doc"
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {selectedFile ? selectedFile.name : "Choose file..."}
                    </label>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-500 hover:bg-slate-50 transition-colors"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-[11px] text-slate-500">
                      File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("customer-interactions");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    View previous interactions ↓
                  </button>
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadingFile ? "Uploading & Analyzing..." : chatLoading ? "Thinking..." : "Send to AI"}
                  </button>
                </div>
              </form>

              {chatError && (
                <div className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                  {chatError}
                </div>
              )}
            </div>
          </section>

          {/* Interactions Card */}
          <section
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
            id="customer-interactions"
          >
            <div className="border-b border-slate-200 px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Interactions & History
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All conversations, AI recommendations, and linked products.
                  </p>
                </div>
                <span className="text-[11px] text-slate-500">
                  {interactions.length} interaction
                  {interactions.length === 1 ? "" : "s"}
                </span>
              </div>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar size={14} className="text-slate-400" />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Clear date filter"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {interactions.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No interactions yet. Ask the AI assistant a question to create the
                  first interaction.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {interactions.map((it) => {
                    const isExpanded = expandedInteractions.has(it.id);
                    const isEditing = editingInteraction === it.id;
                    const isDeleting = deleting === it.id;

                    return (
                      <div
                        key={it.id}
                        className={`rounded-xl border ${
                          isExpanded
                            ? "border-slate-700 bg-slate-900/80"
                            : "border-slate-800 bg-slate-950/60"
                        } shadow-sm shadow-black/40 transition-all`}
                        style={{ opacity: isDeleting ? 0.5 : 1 }}
                      >
                        {/* Card Header */}
                        <div
                          className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer hover:bg-slate-900/80"
                          onClick={() => !isEditing && toggleInteraction(it.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[11px] font-medium text-slate-400">
                                {it.created_at
                                  ? new Date(it.created_at).toLocaleString()
                                  : "—"}
                              </span>
                              {it.tds_id && (
                                <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300 border border-blue-500/30">
                                  Linked product
                                </span>
                              )}
                              {it.file_url && (
                                <a
                                  href={it.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Paperclip size={10} />
                                  Attached file
                                </a>
                              )}
                            </div>
                            {it.input_text && (
                              <div className="text-xs sm:text-sm font-medium text-slate-100 truncate">
                                {isExpanded
                                  ? it.input_text
                                  : getPreview(it.input_text)}
                              </div>
                            )}
                            {it.ai_response && !isExpanded && (
                              <div className="mt-0.5 text-[11px] text-slate-400 italic line-clamp-2">
                                AI: {getPreview(it.ai_response, 100)}
                              </div>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-1 ml-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isEditing && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(it);
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-1.5 text-slate-300 hover:bg-slate-800 hover:text-slate-50 transition-colors"
                                  title="Edit interaction"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(it.id);
                                  }}
                                  disabled={isDeleting}
                                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/60 p-1.5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/60 hover:text-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  title="Delete interaction"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {!isEditing && (
                              <span className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded view */}
                        {isExpanded && !isEditing && (
                          <div className="px-4 pb-4 pt-1 space-y-4">
                            {it.input_text && (
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  Your Question / Input
                                </div>
                                <div className="rounded-lg bg-slate-900/80 border border-slate-700/70 px-3 py-2.5 text-xs sm:text-sm text-slate-100 whitespace-pre-wrap">
                                  {it.input_text}
                                </div>
                              </div>
                            )}
                            {it.ai_response && (
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  AI Recommendation
                                </div>
                                <div className="rounded-lg bg-blue-500/5 border border-blue-500/40 px-3.5 py-3 text-xs sm:text-sm text-slate-50 whitespace-pre-wrap">
                                  {it.ai_response}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Edit mode */}
                        {isEditing && (
                          <div className="px-4 pb-4 pt-2 space-y-4 bg-slate-950/80 border-t border-slate-800">
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                Your Input
                              </label>
                              <textarea
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="w-full min-h-[90px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                                placeholder="Enter your question or input..."
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                AI Response
                              </label>
                              <textarea
                                value={editResponse}
                                onChange={(e) => setEditResponse(e.target.value)}
                                className="w-full min-h-[160px] rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                                placeholder="Enter or refine the AI response..."
                              />
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                <X size={14} />
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEdit(it.id)}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                              >
                                <Save size={14} />
                                {saving ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}