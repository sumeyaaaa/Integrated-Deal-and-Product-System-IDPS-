import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Customer, CustomerListResponse } from "../../services/api";
import { Search, Users, Calendar, X } from "lucide-react";

// Sales stage definitions (Brian Tracy 7-stage process)
const SALES_STAGES: Record<string, { name: string; color: string; bgColor: string }> = {
  "1": { name: "Prospecting", color: "text-slate-600", bgColor: "bg-slate-100" },
  "2": { name: "Rapport", color: "text-blue-600", bgColor: "bg-blue-100" },
  "3": { name: "Needs Analysis", color: "text-cyan-600", bgColor: "bg-cyan-100" },
  "4": { name: "Presenting Solution", color: "text-indigo-600", bgColor: "bg-indigo-100" },
  "5": { name: "Handling Objections", color: "text-purple-600", bgColor: "bg-purple-100" },
  "6": { name: "Closing", color: "text-emerald-600", bgColor: "bg-emerald-100" },
  "7": { name: "Follow-up & Cross-sell", color: "text-green-600", bgColor: "bg-green-100" },
};

function getSalesStageBadge(stage: string | null | undefined) {
  if (!stage || !SALES_STAGES[stage]) {
    return null;
  }
  const stageInfo = SALES_STAGES[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageInfo.color} ${stageInfo.bgColor} border border-current/20`}
      title={`Stage ${stage}: ${stageInfo.name}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {stage} - {stageInfo.name}
    </span>
  );
}

export function CustomerListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Calculate date 15 days ago as default
  useEffect(() => {
    const today = new Date();
    const fifteenDaysAgo = new Date(today);
    fifteenDaysAgo.setDate(today.getDate() - 15);
    setStartDate(fifteenDaysAgo.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  }, []);

  async function fetchCustomers(query?: string, dateStart?: string, dateEnd?: string) {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = { limit: 50, offset: 0 };
      if (query && query.trim().length > 0) {
        params.q = query.trim();
      }
      if (dateStart) {
        params.start_date = dateStart;
      }
      if (dateEnd) {
        params.end_date = dateEnd;
      }

      const res = await api.get<CustomerListResponse>("/crm/customers", {
        params,
      });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (startDate || endDate) {
      fetchCustomers(search, startDate, endDate);
    } else {
      fetchCustomers(search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchCustomers(search, startDate, endDate);
  }

  function clearDateFilter() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header strip */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-50 shadow-md">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex items-center text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                CRM · Customer Directory
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
                  Customers
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 border border-slate-700">
                  <Users size={14} className="text-emerald-400" />
                  {total} total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Browse and search customers. For full management (add / edit / delete),
                use the{" "}
                <Link
                  to="/crm/customers/manage"
                  className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  Manage Customers
                </Link>{" "}
                workspace.
              </p>
            </div>

            {/* Search and date filter */}
            <div className="w-full md:w-auto space-y-2">
              <form
                onSubmit={handleSearchSubmit}
                className="w-full md:w-[360px] lg:w-[420px]"
              >
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by customer name..."
                    className="w-full rounded-full border border-slate-600 bg-slate-900/70 pl-9 pr-28 py-2.5 text-sm text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/40 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>
              
              {/* Date filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar size={16} className="text-slate-400" />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70"
                  />
                  {(startDate || endDate) && (
                    <button
                      onClick={clearDateFilter}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800/70 transition-colors"
                      title="Clear date filter"
                    >
                      <X size={14} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 sm:px-6 py-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-slate-500">
                Showing {customers.length} of {total} customers
              </p>
              {(search.trim() || startDate || endDate) && (
                <p className="text-[11px] text-slate-400">
                  {search.trim() && (
                    <>Filtered by name: <span className="font-mono">{search.trim()}</span></>
                  )}
                  {(startDate || endDate) && (
                    <>
                      {search.trim() && " • "}
                      Filtered by interactions:{" "}
                      {startDate && endDate
                        ? `${startDate} to ${endDate}`
                        : startDate
                        ? `from ${startDate}`
                        : `until ${endDate}`}
                    </>
                  )}
                </p>
              )}
            </div>
            <Link
              to="/crm/customers/manage"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Open Manage Customers
            </Link>
          </div>

          {loading && (
            <div className="px-6 py-4 text-sm text-slate-500">
              Loading customers...
            </div>
          )}

          {!loading && customers.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-slate-500">
              No customers found. Try adjusting your search or{" "}
              <Link
                to="/crm/customers/manage"
                className="font-semibold text-blue-600 hover:text-blue-500"
              >
                add a new customer
              </Link>
              .
            </div>
          ) : (
            <div className="px-3 sm:px-4 pb-4">
              <div className="hidden md:block">
                {/* Table view on desktop */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 shadow-sm">
                  <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Display ID
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Sales Stage
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                        Created
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                    <tbody>
                      {customers.map((c, idx) => (
                        <tr
                          key={c.customer_id}
                          className={`transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                          } hover:bg-blue-50/60`}
                        >
                          <td className="px-3 py-2 align-middle">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-700 border border-slate-200 shadow-sm">
                              {c.display_id ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 align-middle text-sm font-medium text-slate-900">
                            <div className="flex flex-col">
                              <span>{c.customer_name}</span>
                              <span className="text-[11px] text-slate-400">
                                {c.created_at
                                  ? new Date(c.created_at).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-middle">
                            {getSalesStageBadge(c.sales_stage) || (
                              <span className="text-[11px] text-slate-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-slate-500">
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            <Link
                              to={`/crm/customers/${c.customer_id}`}
                              className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/40 hover:bg-blue-400 hover:shadow-blue-500/60 transition-colors"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card view on mobile */}
              <div className="grid gap-3 md:hidden pt-3">
                {customers.map((c) => (
                  <div
                    key={c.customer_id}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm shadow-slate-200/70 hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {c.customer_name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 border border-slate-200 font-mono">
                            ID: {c.display_id ?? "—"}
                          </span>
                          {getSalesStageBadge(c.sales_stage)}
                          <span>
                            Created:{" "}
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/crm/customers/${c.customer_id}`}
                        className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-blue-500/40 hover:bg-blue-400 hover:shadow-blue-500/60 transition-colors"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
