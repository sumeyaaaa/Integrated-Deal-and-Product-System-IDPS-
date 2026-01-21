import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, Tds, ChemicalType, fetchTDS, fetchChemicalTypes } from "../../services/api";
import { Package, ChevronDown, ChevronRight, FlaskConical, FileText, ExternalLink } from "lucide-react";

interface BrandWithChemicals {
  brand: string;
  chemicals: {
    chemical: ChemicalType;
    tdsCount: number;
    tdsRecords: Tds[];
  }[];
  totalTdsCount: number;
}

export function PartnerChemicalsPage() {
  const [brandsData, setBrandsData] = useState<BrandWithChemicals[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedChemicals, setExpandedChemicals] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBrandsAndChemicals();
  }, []);

  async function loadBrandsAndChemicals() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all TDS records
      const tdsResponse = await fetchTDS({ limit: 1000 });
      const allTds = tdsResponse.tds;

      // Fetch all chemical types
      const chemicalsResponse = await fetchChemicalTypes({ limit: 1000 });
      const allChemicals = chemicalsResponse.chemicals;

      // Create a map of chemical_id -> ChemicalType
      const chemicalsMap = new Map<string, ChemicalType>();
      allChemicals.forEach((chem) => {
        if (chem.id) {
          chemicalsMap.set(chem.id, chem);
        }
      });

      // Group TDS by brand and chemical, storing actual TDS records
      const brandsMap = new Map<string, Map<string, { count: number; records: Tds[] }>>();

      allTds.forEach((tds) => {
        if (!tds.brand || !tds.chemical_type_id) return;

        const brand = tds.brand.trim();
        if (!brand) return;

        if (!brandsMap.has(brand)) {
          brandsMap.set(brand, new Map());
        }

        const brandChemicals = brandsMap.get(brand)!;
        if (!brandChemicals.has(tds.chemical_type_id)) {
          brandChemicals.set(tds.chemical_type_id, { count: 0, records: [] });
        }

        const chemicalData = brandChemicals.get(tds.chemical_type_id)!;
        chemicalData.count += 1;
        chemicalData.records.push(tds);
      });

      // Convert to array format
      const brandsArray: BrandWithChemicals[] = Array.from(brandsMap.entries())
        .map(([brand, chemicalDataMap]) => {
          const chemicals = Array.from(chemicalDataMap.entries())
            .map(([chemicalId, data]) => {
              const chemical = chemicalsMap.get(chemicalId);
              if (!chemical) return null;
              return { 
                chemical, 
                tdsCount: data.count,
                tdsRecords: data.records 
              };
            })
            .filter((item): item is { chemical: ChemicalType; tdsCount: number; tdsRecords: Tds[] } => item !== null)
            .sort((a, b) => a.chemical.category?.localeCompare(b.chemical.category || "") || 0);

          const totalTdsCount = Array.from(chemicalDataMap.values()).reduce((sum, data) => sum + data.count, 0);

          return {
            brand,
            chemicals,
            totalTdsCount,
          };
        })
        .filter((item) => item.chemicals.length > 0)
        .sort((a, b) => a.brand.localeCompare(b.brand));

      setBrandsData(brandsArray);
    } catch (err: any) {
      console.error("Error loading brands and chemicals:", err);
      setError(err?.message || "Failed to load brands and chemicals");
    } finally {
      setLoading(false);
    }
  }

  function toggleBrand(brand: string) {
    setExpandedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  }

  function toggleChemical(brand: string, chemicalId: string) {
    const key = `${brand}::${chemicalId}`;
    setExpandedChemicals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  function expandAll() {
    setExpandedBrands(new Set(brandsData.map((b) => b.brand)));
  }

  function collapseAll() {
    setExpandedBrands(new Set());
  }

  const filteredBrands = brandsData.filter((item) =>
    item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.chemicals.some((c) =>
      c.chemical.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chemical.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading brands and chemicals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadBrandsAndChemicals}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Partner Chemicals</h1>
              <p className="text-slate-600 mt-1">
                View brands and their associated chemicals from TDS data
              </p>
            </div>
            <Link
              to="/pms"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Back to PMS
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by brand or chemical..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Collapse All
              </button>
              <button
                onClick={loadBrandsAndChemicals}
                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Total Brands</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{filteredBrands.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Total Chemicals</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {filteredBrands.reduce((sum, brand) => sum + brand.chemicals.length, 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Total TDS Records</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {filteredBrands.reduce((sum, brand) => sum + brand.totalTdsCount, 0)}
            </div>
          </div>
        </div>

        {/* Brands List */}
        {filteredBrands.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">
              {searchQuery ? "No brands found matching your search." : "No brands found."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBrands.map((brandData) => {
              const isExpanded = expandedBrands.has(brandData.brand);
              return (
                <div
                  key={brandData.brand}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
                >
                  {/* Brand Header */}
                  <button
                    onClick={() => toggleBrand(brandData.brand)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-slate-900 text-lg">{brandData.brand}</div>
                          <div className="text-sm text-slate-600">
                            {brandData.chemicals.length} chemical{brandData.chemicals.length !== 1 ? "s" : ""} •{" "}
                            {brandData.totalTdsCount} TDS record{brandData.totalTdsCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Chemicals List */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50">
                      <div className="px-6 py-4">
                        <div className="space-y-3">
                          {brandData.chemicals.map((item) => {
                            const chemicalKey = `${brandData.brand}::${item.chemical.id}`;
                            const isChemicalExpanded = expandedChemicals.has(chemicalKey);
                            return (
                              <div
                                key={item.chemical.id}
                                className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                              >
                                <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                      <FlaskConical className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-slate-900">
                                        {item.chemical.name || item.chemical.category || "Unknown Chemical"}
                                      </div>
                                      {item.chemical.category && item.chemical.name && (
                                        <div className="text-sm text-slate-600">{item.chemical.category}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-sm text-slate-600">
                                      <span className="font-semibold text-slate-900">{item.tdsCount}</span> TDS
                                      {item.tdsCount !== 1 ? " records" : " record"}
                                    </div>
                                    <button
                                      onClick={() => toggleChemical(brandData.brand, item.chemical.id)}
                                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1"
                                    >
                                      {isChemicalExpanded ? (
                                        <>
                                          <ChevronDown className="w-4 h-4" />
                                          Hide TDS
                                        </>
                                      ) : (
                                        <>
                                          View TDS
                                          <ChevronRight className="w-4 h-4" />
                                        </>
                                      )}
                                    </button>
                                    <Link
                                      to={`/pms/tds?brand=${encodeURIComponent(brandData.brand)}&chemical_type_id=${item.chemical.id}`}
                                      className="text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-1"
                                      title="Open in TDS page"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </Link>
                                  </div>
                                </div>
                                
                                {/* TDS Records List */}
                                {isChemicalExpanded && (
                                  <div className="border-t border-slate-200 bg-slate-50">
                                    <div className="px-4 py-3">
                                      <div className="space-y-2">
                                        {item.tdsRecords.map((tds) => (
                                          <div
                                            key={tds.id}
                                            className="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
                                          >
                                            <div className="flex items-center gap-3">
                                              <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-emerald-600" />
                                              </div>
                                              <div>
                                                <div className="font-medium text-slate-900 text-sm">
                                                  {tds.grade || "No grade"}
                                                </div>
                                                {tds.owner && (
                                                  <div className="text-xs text-slate-600">{tds.owner}</div>
                                                )}
                                              </div>
                                            </div>
                                            <Link
                                              to={`/pms/tds?brand=${encodeURIComponent(brandData.brand)}&chemical_type_id=${item.chemical.id}`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                              }}
                                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                                            >
                                              View in TDS Page →
                                            </Link>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


