import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Boxes, Sparkles, Users } from "lucide-react";

export function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
      {/* Background orbs + grid (reuse CRM style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section className="px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-28 pb-10 sm:pb-14">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/40 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
              </span>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                LeanChem Connect · Unified AI workspace
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-5 sm:space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-tight">
                <span className="block">One home for</span>
                <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent animate-gradient">
                  CRM &amp; PMS
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-light">
                Manage customers, deals, products, and logistics from a single,
                AI-augmented control center built for LeanChem&apos;s real-world
                workflows.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/crm"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 group"
                >
                  Open CRM workspace
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/pms"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-slate-600 text-white font-bold text-lg transition-all duration-300 hover:border-slate-400 hover:bg-slate-800/30 backdrop-blur-sm"
                >
                  Preview PMS (coming soon)
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Dual workspace cards */}
        <section className="px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 lg:pb-28">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* CRM card */}
            <div className="crm-feature-card-enhanced group relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-black/40 rounded-2xl border border-slate-700/60 transition-all duration-500 group-hover:border-blue-500/60" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-7 sm:p-8 flex flex-col h-full gap-5">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      CRM Workspace
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 font-medium">
                      Customers · AI interactions · Quotes · Dashboards
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                  Track every customer conversation, capture AI-assisted notes,
                  generate quotation drafts, and see a clear picture of your
                  pipeline and priorities.
                </p>

                <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                  <li>Customer list &amp; rich interaction history</li>
                  <li>Per-customer AI copilot for deals and product fit</li>
                  <li>Quotation drafts aligned with LeanChem templates</li>
                  <li>CRM dashboard and reporting views</li>
                </ul>

                <div className="pt-2">
                  <Link
                    to="/crm"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold text-sm sm:text-base transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 group/btn"
                  >
                    Enter CRM
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>

            {/* PMS card */}
            <div className="crm-feature-card-enhanced group relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-slate-900/40 to-black/40 rounded-2xl border border-slate-700/60 transition-all duration-500 group-hover:border-emerald-500/60" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative p-7 sm:p-8 flex flex-col h-full gap-5">
                <div className="inline-flex items-center gap-3">
                  <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                    <Boxes className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      PMS Workspace
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-300 font-medium">
                      Coming soon · Products · TDS · Pricing · Logistics
                    </p>
                  </div>
                </div>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-light">
                  A dedicated space for LeanChem&apos;s product universe: SKUs,
                  technical datasheets, costing &amp; pricing, and logistics
                  flows—powered by the same AI stack.
                </p>

                <ul className="text-slate-300 text-sm space-y-2 list-disc list-inside">
                  <li>Central library of chemical SKUs and TDS</li>
                  <li>Pricing logic connected to deals and customers</li>
                  <li>Logistics and lead-time planning hooks</li>
                  <li>AI assistance for formulation &amp; troubleshooting</li>
                </ul>

                <div className="pt-2">
                  <Link
                    to="/pms"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-slate-600 text-white font-semibold text-sm sm:text-base transition-all duration-300 hover:border-slate-400 hover:bg-slate-800/40 backdrop-blur-sm"
                  >
                    Preview PMS layout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Simple bottom highlight */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <p className="text-slate-300 text-sm sm:text-base font-light">
                LeanChem Connect 
              </p>
            </div>
            <div className="flex gap-4 text-slate-400 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Customer-centric by design</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Ready for analytics</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
