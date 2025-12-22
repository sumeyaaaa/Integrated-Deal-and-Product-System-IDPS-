import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Customer, Interaction } from "../../services/api";

interface CustomerFormState {
  customer_name: string;
  display_id?: string;
}

export function AddCustomerPage() {
  const [form, setForm] = useState<CustomerFormState>({
    customer_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<Customer | null>(null);
  const [buildingProfile, setBuildingProfile] = useState(false);
  const [profileResult, setProfileResult] = useState<Customer | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      setError("Customer name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const payload: CustomerFormState = {
        customer_name: form.customer_name.trim(),
        display_id: form.display_id?.trim() || undefined,
      };

      const res = await api.post<Customer>("/crm/customers", payload);
      const created = res.data;
      setCreatedCustomer(created);
      setSuccess("Customer created successfully! You can now build an AI profile.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Failed to create customer.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildProfile() {
    if (!createdCustomer) return;

    try {
      setBuildingProfile(true);
      setProfileError(null);
      setProfileResult(null);

      const res = await api.post<Customer>(
        `/crm/customers/${createdCustomer.customer_id}/build-profile`
      );
      setProfileResult(res.data);
      setSuccess("Profile built successfully! The profile has been saved as an interaction.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ??
        err?.message ??
        "Failed to build profile.";
      setProfileError(msg);
    } finally {
      setBuildingProfile(false);
    }
  }

  function handleViewCustomer() {
    if (createdCustomer) {
      navigate(`/crm/customers/${createdCustomer.customer_id}`);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Add New Customer</h2>
          <p className="page-subtitle">
            Create a customer record that you can later manage with the AI
            assistant and interaction history.
          </p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="info-banner">{success}</div>}
      {profileError && <div className="error-banner">{profileError}</div>}

      {!createdCustomer ? (
        <section className="card">
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="customer_name">Customer name</label>
              <input
                id="customer_name"
                type="text"
                value={form.customer_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, customer_name: e.target.value }))
                }
                placeholder="e.g. Sika Abyssinia Chemicals PLC"
              />
            </div>

            <div className="form-field">
              <label htmlFor="display_id">
                Display ID{" "}
                <span className="muted">
                  (optional – will auto-generate if left blank)
                </span>
              </label>
              <input
                id="display_id"
                type="text"
                value={form.display_id ?? ""}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, display_id: e.target.value }))
                }
                placeholder="e.g. LC-2025-CUST-0001"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create customer"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          {/* Customer Created Successfully */}
          <section className="card">
            <h3>Customer Created</h3>
            <div style={{ marginBottom: "1rem" }}>
              <p>
                <strong>Name:</strong> {createdCustomer.customer_name}
              </p>
              <p>
                <strong>Display ID:</strong> {createdCustomer.display_id || "—"}
              </p>
            </div>

            <div className="form-actions" style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={handleBuildProfile}
                disabled={buildingProfile || !!profileResult}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: buildingProfile ? "#94a3b8" : "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: buildingProfile || profileResult ? "not-allowed" : "pointer",
                }}
              >
                {buildingProfile ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "16px",
                        height: "16px",
                        border: "2px solid white",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Building Profile...
                  </span>
                ) : profileResult ? (
                  "✓ Profile Built"
                ) : (
                  "Build Profile"
                )}
              </button>

              <button
                type="button"
                onClick={handleViewCustomer}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#2563eb",
                  border: "2px solid #2563eb",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                View Customer Details
              </button>
            </div>
          </section>

          {/* Profile Results */}
          {profileResult && (
            <section className="card">
              <h3>AI Profile Generated</h3>
              <p className="section-description">
                The profile has been saved as an interaction. You can view it in the
                customer's interaction history.
              </p>

              {/* Strategic-Fit Matrix Scores */}
              {profileResult.product_alignment_scores &&
                Object.keys(profileResult.product_alignment_scores).length > 0 && (
                  <div style={{ marginTop: "1.5rem" }}>
                    <h4 style={{ marginBottom: "0.75rem", fontSize: "1.1rem" }}>
                      Strategic-Fit Matrix
                    </h4>
                    <p className="section-description" style={{ marginBottom: "1rem" }}>
                      Product alignment scores (0 = No Fit, 1 = Low, 2 = Moderate, 3 = High Fit)
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "0.75rem",
                      }}
                    >
                      {Object.entries(profileResult.product_alignment_scores).map(
                        ([category, score]) => (
                          <div
                            key={category}
                            style={{
                              padding: "0.75rem",
                              backgroundColor: "#f9fafb",
                              borderRadius: "0.5rem",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "#6b7280",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {category}
                            </div>
                            <div
                              style={{
                                fontSize: "1.5rem",
                                fontWeight: "bold",
                                color:
                                  score === 3
                                    ? "#10b981"
                                    : score === 2
                                    ? "#3b82f6"
                                    : score === 1
                                    ? "#f59e0b"
                                    : "#6b7280",
                              }}
                            >
                              {score}/3
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="form-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => navigate(`/crm/customers/${createdCustomer.customer_id}/profile`)}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  View Full Profile
                </button>
                <button
                  type="button"
                  onClick={handleViewCustomer}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: "transparent",
                    color: "#2563eb",
                    border: "2px solid #2563eb",
                    borderRadius: "0.5rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  View Customer Details
                </button>
              </div>
            </section>
          )}
        </>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


