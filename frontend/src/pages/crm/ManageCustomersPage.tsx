import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Customer, CustomerListResponse, CustomerUpdate } from "../../services/api";
import { Plus, Edit2, Trash2, X, Save, Search, Sparkles } from "lucide-react";

// Sales stage definitions
const SALES_STAGES: { [key: string]: string } = {
  "1": "Prospecting",
  "2": "Rapport",
  "3": "Needs Analysis",
  "4": "Presenting Solution",
  "5": "Handling Objections",
  "6": "Closing",
  "7": "Follow-up & Cross-sell",
};

export function ManageCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Add customer state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newDisplayId, setNewDisplayId] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDisplayId, setEditDisplayId] = useState("");
  const [editSalesStage, setEditSalesStage] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Auto-fill sales stage state (per customer)
  const [autoFilling, setAutoFilling] = useState<string | null>(null);

  // Delete customer state
  const [deleting, setDeleting] = useState<string | null>(null);

  async function fetchCustomers(query?: string) {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number> = { limit: 50, offset: 0 };
      if (query && query.trim().length > 0) {
        params.q = query.trim();
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
    fetchCustomers();
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchCustomers(search);
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      setAdding(true);
      const res = await api.post<Customer>("/crm/customers", {
        customer_name: newCustomerName.trim(),
        display_id: newDisplayId.trim() || undefined,
      });

      setCustomers((prev) => [res.data, ...prev]);
      setTotal((prev) => prev + 1);
      setNewCustomerName("");
      setNewDisplayId("");
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to create customer");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(customer: Customer) {
    setEditingCustomer(customer.customer_id);
    setEditName(customer.customer_name);
    setEditDisplayId(customer.display_id || "");
    setEditSalesStage(customer.sales_stage || "1");
  }

  function cancelEdit() {
    setEditingCustomer(null);
    setEditName("");
    setEditDisplayId("");
    setEditSalesStage("1");
  }

  async function saveEdit(customerId: string) {
    try {
      setSaving(true);
      const update: CustomerUpdate = {
        customer_name: editName.trim() || undefined,
        display_id: editDisplayId.trim() || undefined,
        sales_stage: editSalesStage || undefined,
      };

      const res = await api.put<Customer>(`/crm/customers/${customerId}`, update);
      setCustomers((prev) =>
        prev.map((c) => (c.customer_id === customerId ? res.data : c))
      );
      cancelEdit();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }
  
  async function handleAutoFillSalesStage(customerId: string) {
    try {
      setAutoFilling(customerId);
      const res = await api.post<Customer>(`/crm/customers/${customerId}/auto-fill-sales-stage`);
      // Update the customer in the list
      setCustomers((prev) =>
        prev.map((c) => (c.customer_id === customerId ? res.data : c))
      );
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to auto-fill sales stage");
    } finally {
      setAutoFilling(null);
    }
  }

  async function handleDelete(customerId: string, customerName: string) {
    if (!confirm(`Are you sure you want to delete "${customerName}"? This will also delete all associated interactions.`)) {
      return;
    }

    try {
      setDeleting(customerId);
      await api.delete(`/crm/customers/${customerId}`);
      setCustomers((prev) => prev.filter((c) => c.customer_id !== customerId));
      setTotal((prev) => prev - 1);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.detail ?? err?.message ?? "Failed to delete customer");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Manage Customers</h2>
          <p className="page-subtitle">
            Add, edit, and delete customers. Search by customer name.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <Plus size={18} />
              Add Customer
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewCustomerName("");
                setNewDisplayId("");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <X size={18} />
              Cancel
            </button>
          )}
          <Link to="/crm">Back to CRM</Link>
        </div>
      </div>

      {/* Add Customer Form */}
      {showAddForm && (
        <section className="card" style={{ marginBottom: "2rem" }}>
          <h3>Add New Customer</h3>
          <form onSubmit={handleAddCustomer}>
            <div className="form-field">
              <label htmlFor="new_customer_name">Customer Name *</label>
              <input
                id="new_customer_name"
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Sika Abyssinia Chemicals PLC"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="new_display_id">
                Display ID{" "}
                <span className="muted">(optional – will auto-generate if left blank)</span>
              </label>
              <input
                id="new_display_id"
                type="text"
                value={newDisplayId}
                onChange={(e) => setNewDisplayId(e.target.value)}
                placeholder="e.g. LC-2025-CUST-0001"
              />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={adding || !newCustomerName.trim()}>
                {adding ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Search */}
      <section className="card" style={{ marginBottom: "2rem" }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <Search
              size={20}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name..."
              style={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                fontSize: "1rem",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#374151",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Search
          </button>
        </form>
      </section>

      {loading && <div className="info-banner">Loading customers...</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Customers List */}
      <section className="card">
        <div style={{ marginBottom: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
          Showing {customers.length} / {total} customers
        </div>
        {customers.length === 0 && !loading ? (
          <p className="muted">No customers found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {customers.map((customer) => {
              const isEditing = editingCustomer === customer.customer_id;
              const isDeleting = deleting === customer.customer_id;

              return (
                <div
                  key={customer.customer_id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    padding: "1.5rem",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    opacity: isDeleting ? 0.5 : 1,
                  }}
                >
                  {isEditing ? (
                    <div>
                      <div style={{ marginBottom: "1rem" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.5rem",
                            fontSize: "1rem",
                          }}
                          required
                        />
                      </div>
                      <div style={{ marginBottom: "1.5rem" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#374151",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Display ID
                        </label>
                        <input
                          type="text"
                          value={editDisplayId}
                          onChange={(e) => setEditDisplayId(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.5rem",
                            fontSize: "1rem",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          justifyContent: "flex-end",
                        }}
                      >
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={saving}
                          style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: "transparent",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.5rem",
                            color: "#374151",
                            fontWeight: "600",
                            cursor: saving ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <X size={18} />
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveEdit(customer.customer_id)}
                          disabled={saving || !editName.trim()}
                          style={{
                            padding: "0.75rem 1.5rem",
                            backgroundColor: saving ? "#94a3b8" : "#10b981",
                            border: "none",
                            borderRadius: "0.5rem",
                            color: "white",
                            fontWeight: "600",
                            cursor: saving ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Save size={18} />
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "1.125rem",
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: "0.25rem",
                          }}
                        >
                          {customer.customer_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Display ID: {customer.display_id ?? "—"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.875rem",
                            color: "#6b7280",
                            marginBottom: "0.5rem",
                          }}
                        >
                          Sales Stage:{" "}
                          <span style={{ fontWeight: "600", color: "#374151" }}>
                            {customer.sales_stage
                              ? `${customer.sales_stage} - ${SALES_STAGES[customer.sales_stage] || "Unknown"}`
                              : "Not set"}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                          }}
                        >
                          Created:{" "}
                          {customer.created_at
                            ? new Date(customer.created_at).toLocaleDateString()
                            : "—"}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        {!customer.sales_stage && (
                          <button
                            type="button"
                            onClick={() => handleAutoFillSalesStage(customer.customer_id)}
                            disabled={autoFilling === customer.customer_id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.5rem 1rem",
                              backgroundColor: "#10b981",
                              color: "white",
                              border: "none",
                              borderRadius: "0.5rem",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                              cursor: autoFilling === customer.customer_id ? "not-allowed" : "pointer",
                              opacity: autoFilling === customer.customer_id ? 0.6 : 1,
                            }}
                          >
                            <Sparkles size={14} />
                            {autoFilling === customer.customer_id ? "Analyzing..." : "Auto-Fill Stage"}
                          </button>
                        )}
                        <Link
                          to={`/crm/customers/${customer.customer_id}`}
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#2563eb",
                            color: "white",
                            borderRadius: "0.5rem",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            fontWeight: "600",
                          }}
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(customer)}
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "transparent",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            cursor: "pointer",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(customer.customer_id, customer.customer_name)
                          }
                          disabled={isDeleting}
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "transparent",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.5rem",
                            cursor: isDeleting ? "not-allowed" : "pointer",
                            color: "#ef4444",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

