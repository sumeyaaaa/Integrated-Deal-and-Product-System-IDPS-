import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchProducts,
  createProduct,
  fetchTDS,
  LeanchemProduct,
  LeanchemProductCreate,
} from "../../services/api";
import {
  Building2,
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
} from "lucide-react";

export function ProductsPage() {
  const [products, setProducts] = useState<LeanchemProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Filters
  const [searchCategory, setSearchCategory] = useState("");
  const [searchProductType, setSearchProductType] = useState("");
  const [selectedTdsId, setSelectedTdsId] = useState<string>("");

  // TDS for dropdown
  const [tdsList, setTdsList] = useState<any[]>([]);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<LeanchemProductCreate>({
    tds_id: null,
    category: "",
    product_type: "",
  });

  async function loadTDS() {
    try {
      const res = await fetchTDS({ limit: 500 });
      setTdsList(res.tds);
    } catch (err) {
      console.error("Failed to load TDS:", err);
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProducts({
        limit,
        offset,
        category: searchCategory || undefined,
        product_type: searchProductType || undefined,
        tds_id: selectedTdsId || undefined,
      });
      setProducts(res.products);
      setTotal(res.total);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTDS();
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, searchCategory, searchProductType, selectedTdsId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      await createProduct({
        ...formData,
        tds_id: formData.tds_id || null,
      });
      setShowCreateForm(false);
      setFormData({
        tds_id: null,
        category: "",
        product_type: "",
      });
      await loadProducts();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to create product");
    } finally {
      setCreating(false);
    }
  }

  function clearFilters() {
    setSearchCategory("");
    setSearchProductType("");
    setSelectedTdsId("");
    setOffset(0);
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasFilters = searchCategory || searchProductType || selectedTdsId;

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
                  PMS · LeanChem Products
                </p>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 flex items-center gap-3">
                <Building2 className="text-indigo-400" size={32} />
                LeanChem Products
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Manage LeanChem proprietary product catalog. Track categories, product types, stock,
                and pricing.
              </p>
            </div>

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-1 active:translate-y-0"
            >
              <Plus size={20} />
              {showCreateForm ? "Cancel" : "Add Product"}
            </button>
          </div>
        </main>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Product</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">TDS</label>
                  <select
                    value={formData.tds_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tds_id: e.target.value || null,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select TDS...</option>
                    {tdsList.map((tds) => (
                      <option key={tds.id} value={tds.id}>
                        {tds.brand || "Unnamed"} {tds.grade ? `- ${tds.grade}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category || ""}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Cement, Admixtures"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product Type
                  </label>
                  <input
                    type="text"
                    value={formData.product_type || ""}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., Superplasticizer, Accelerator"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Product"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({
                      tds_id: null,
                      category: "",
                      product_type: "",
                    });
                  }}
                  className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => {
                  setSearchCategory(e.target.value);
                  setOffset(0);
                }}
                placeholder="Filter by category..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product Type</label>
              <input
                type="text"
                value={searchProductType}
                onChange={(e) => {
                  setSearchProductType(e.target.value);
                  setOffset(0);
                }}
                placeholder="Filter by product type..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">TDS</label>
              <select
                value={selectedTdsId}
                onChange={(e) => {
                  setSelectedTdsId(e.target.value);
                  setOffset(0);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All TDS</option>
                {tdsList.map((tds) => (
                  <option key={tds.id} value={tds.id}>
                    {tds.brand || "Unnamed"} {tds.grade ? `- ${tds.grade}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No products found</p>
            <p className="text-slate-500 text-sm mt-1">
              {hasFilters
                ? "Try adjusting your filters"
                : "Create your first product to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold">{products.length}</span> of{" "}
                <span className="font-semibold">{total}</span> products
              </p>
            </div>

            {/* Products List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const tds = tdsList.find((t) => t.id === product.tds_id);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900">
                        {product.product_type || product.category || "Unnamed Product"}
                      </h3>
                      <Building2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    </div>

                    <div className="space-y-2 text-sm">
                      {product.category && (
                        <div>
                          <span className="text-slate-500">Category:</span>{" "}
                          <span className="font-medium text-slate-700">{product.category}</span>
                        </div>
                      )}
                      {product.product_type && (
                        <div>
                          <span className="text-slate-500">Type:</span>{" "}
                          <span className="font-medium text-slate-700">{product.product_type}</span>
                        </div>
                      )}
                      {tds && (
                        <div>
                          <span className="text-slate-500">TDS:</span>{" "}
                          <span className="font-medium text-slate-700">
                            {tds.brand || "Unnamed"} {tds.grade ? `- ${tds.grade}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
