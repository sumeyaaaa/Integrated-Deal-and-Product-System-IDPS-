import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  api,
  ChemicalType,
  ChemicalTypeListResponse,
  ChemicalTypeCreate,
  ChemicalTypeUpdate,
  fetchChemicalTypes,
  createChemicalType,
  updateChemicalType,
  deleteChemicalType,
} from "../../services/api";
import {
  FlaskConical,
  Search,
  Plus,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Edit2,
  Trash2,
} from "lucide-react";

export function ChemicalsPage() {
  const [chemicals, setChemicals] = useState<ChemicalType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<ChemicalTypeCreate>({
    name: "",
    category: "",
    hs_code: "",
    applications: [],
  });
  const [newApplication, setNewApplication] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ChemicalTypeUpdate>({});
  const [updating, setUpdating] = useState(false);
  const [newEditApplication, setNewEditApplication] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadChemicals() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChemicalTypes({ limit, offset });
      setChemicals(res.chemicals);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load chemicals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChemicals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await fetchChemicalTypes({ limit, offset: 0 });
      // Client-side filtering for now (backend search can be added later)
      const filtered = res.chemicals.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.category?.toLowerCase().includes(search.toLowerCase()) ||
          c.hs_code?.toLowerCase().includes(search.toLowerCase())
      );
      setChemicals(filtered);
      setTotal(filtered.length);
      setOffset(0);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? err?.message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleAddApplication() {
    if (newApplication.trim() && !formData.applications?.includes(newApplication.trim())) {
      setFormData({
        ...formData,
        applications: [...(formData.applications || []), newApplication.trim()],
      });
      setNewApplication("");
    }
  }

  function handleRemoveApplication(app: string) {
    setFormData({
      ...formData,
      applications: formData.applications?.filter((a) => a !== app) || [],
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Chemical name is required");
      return;
    }

    try {
      setCreating(true);
      await createChemicalType(formData);
      setShowCreateForm(false);
      setFormData({ name: "", category: "", hs_code: "", applications: [] });
      await loadChemicals();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to create chemical");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(chemical: ChemicalType) {
    setEditingId(chemical.id);
    setEditData({
      name: chemical.name,
      category: chemical.category || "",
      hs_code: chemical.hs_code || "",
      applications: chemical.applications || [],
    });
    setNewEditApplication("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditData({});
    setNewEditApplication("");
  }

  function handleAddEditApplication() {
    if (
      newEditApplication.trim() &&
      !editData.applications?.includes(newEditApplication.trim())
    ) {
      setEditData({
        ...editData,
        applications: [...(editData.applications || []), newEditApplication.trim()],
      });
      setNewEditApplication("");
    }
  }

  function handleRemoveEditApplication(app: string) {
    setEditData({
      ...editData,
      applications: editData.applications?.filter((a) => a !== app) || [],
    });
  }

  async function handleUpdate(id: string) {
    try {
      setUpdating(true);
      await updateChemicalType(id, editData);
      setEditingId(null);
      setEditData({});
      await loadChemicals();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to update chemical");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this chemical? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteChemicalType(id);
      await loadChemicals();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to delete chemical");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 text-slate-900">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-50 shadow-lg">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Link
                  to="/pms"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Link>
                <p className="inline-flex items-center text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                  PMS · Chemical Master Data
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 flex items-center gap-3">
                <FlaskConical className="text-blue-400" size={32} />
                Chemical Master Data
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Manage chemical properties, specifications & classifications. Track HS codes,
                applications, and technical specifications.
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0"
            >
              <Plus size={20} />
              {showCreateForm ? "Cancel" : "Add Chemical"}
            </button>
          </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Chemical</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Chemical Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Cement, Admixtures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">HS Code</label>
                  <input
                    type="text"
                    value={formData.hs_code || ""}
                    onChange={(e) => setFormData({ ...formData, hs_code: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Harmonized System code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Applications
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newApplication}
                    onChange={(e) => setNewApplication(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddApplication();
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add application"
                  />
                  <button
                    type="button"
                    onClick={handleAddApplication}
                    className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.applications && formData.applications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.applications.map((app, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                      >
                        {app}
                        <button
                          type="button"
                          onClick={() => handleRemoveApplication(app)}
                          className="hover:text-blue-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Chemical"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: "", category: "", hs_code: "", applications: [] });
                  }}
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, or HS code..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadChemicals();
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {loading && chemicals.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : chemicals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No chemicals found</p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? "Try a different search term" : "Create your first chemical to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold">{chemicals.length}</span> of{" "}
                <span className="font-semibold">{total}</span> chemicals
              </p>
            </div>

            {/* Chemical List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chemicals.map((chemical) => (
                <div
                  key={chemical.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  {editingId === chemical.id ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editData.name || ""}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Category
                          </label>
                          <input
                            type="text"
                            value={editData.category || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, category: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            HS Code
                          </label>
                          <input
                            type="text"
                            value={editData.hs_code || ""}
                            onChange={(e) =>
                              setEditData({ ...editData, hs_code: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Applications
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newEditApplication}
                            onChange={(e) => setNewEditApplication(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddEditApplication();
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Add application"
                          />
                          <button
                            type="button"
                            onClick={handleAddEditApplication}
                            className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm"
                          >
                            Add
                          </button>
                        </div>
                        {editData.applications && editData.applications.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editData.applications.map((app, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs"
                              >
                                {app}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditApplication(app)}
                                  className="hover:text-blue-900"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(chemical.id)}
                          disabled={updating || !editData.name?.trim()}
                          className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {updating ? (
                            <>
                              <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-slate-900">{chemical.name}</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(chemical)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(chemical.id)}
                            disabled={deletingId === chemical.id}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === chemical.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {chemical.category && (
                          <div>
                            <span className="text-slate-500">Category:</span>{" "}
                            <span className="font-medium text-slate-700">{chemical.category}</span>
                          </div>
                        )}
                        {chemical.hs_code && (
                          <div>
                            <span className="text-slate-500">HS Code:</span>{" "}
                            <span className="font-medium text-slate-700">{chemical.hs_code}</span>
                          </div>
                        )}
                        {chemical.applications && chemical.applications.length > 0 && (
                          <div>
                            <span className="text-slate-500">Applications:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {chemical.applications.slice(0, 3).map((app, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
                                >
                                  {app}
                                </span>
                              ))}
                              {chemical.applications.length > 3 && (
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                                  +{chemical.applications.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
