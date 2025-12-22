export function PMSHomePage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Product Management System (PMS)</h2>
          <p className="page-subtitle">
            Placeholder for product data, technical datasheets, pricing, and
            logistics workflows.
          </p>
        </div>
      </div>

      <section className="card">
        <p className="section-description">
          This space will mirror the CRM experience but focused on products:
        </p>
        <ul className="report-list">
          <li>Central library of LeanChem SKUs and technical data.</li>
          <li>Pricing and costing views linked to customers and deals.</li>
          <li>AI assistant for formulating, troubleshooting, and logistics Q&amp;A.</li>
        </ul>
        <p className="section-description">
          For now it&apos;s a simple placeholder so navigation feels complete.
        </p>
      </section>
    </div>
  );
}


