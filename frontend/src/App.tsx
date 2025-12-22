import { Link, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { CRMHomePage } from "./pages/crm/CRMHomePage";
import { CustomerListPage } from "./pages/crm/CustomerListPage";
import { CustomerDetailPage } from "./pages/crm/CustomerDetailPage";
import { CustomerProfilePage } from "./pages/crm/CustomerProfilePage";
import { ManageCustomersPage } from "./pages/crm/ManageCustomersPage";
import { AddCustomerPage } from "./pages/crm/AddCustomerPage";
import { CreateQuotePage } from "./pages/crm/CreateQuotePage";
import { CRMDashboardPage } from "./pages/crm/CRMDashboardPage";
import { CRMReportsPage } from "./pages/crm/CRMReportsPage";
import { PMSHomePage } from "./pages/pms/PMSHomePage";

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">LeanChem Connect</h1>
          <nav className="app-nav">
            <Link to="/">Home</Link>
            <Link to="/crm">CRM</Link>
            <Link to="/pms">PMS</Link>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />

          {/* CRM routes */}
          <Route path="/crm" element={<CRMHomePage />} />
          <Route path="/crm/customers" element={<CustomerListPage />} />
          <Route path="/crm/customers/manage" element={<ManageCustomersPage />} />
          <Route path="/crm/customers/new" element={<AddCustomerPage />} />
          <Route
            path="/crm/customers/:customerId"
            element={<CustomerDetailPage />}
          />
          <Route
            path="/crm/customers/:customerId/profile"
            element={<CustomerProfilePage />}
          />
          <Route path="/crm/quotes/new" element={<CreateQuotePage />} />
          <Route path="/crm/dashboard" element={<CRMDashboardPage />} />
          <Route path="/crm/reports" element={<CRMReportsPage />} />

          {/* PMS placeholder */}
          <Route path="/pms" element={<PMSHomePage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}


