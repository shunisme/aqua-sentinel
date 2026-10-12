import React, { useState, useEffect } from 'react';
import TownshipMap from './TownshipMap';
import HubCoverageControls from './HubCoverageControls';
import UsageMetricsPanel from './UsageMetricsPanel';
import { runGreedyCoverage, ELMINA_CANDIDATE_HUBS } from '../../services/coverageAlgorithm';
import { Loader2 } from 'lucide-react';

export default function PlannerView() {
  const [homesGeoJson, setHomesGeoJson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Optimization Parameters
  const [hubCount, setHubCount] = useState(4);
  const [costPerHub, setCostPerHub] = useState(12000); // RM 12k per 4-compartment hub
  const [detourFactor] = useState(1.30); // 1.30x walking detour factor

  // Load OSM Building Footprints
  useEffect(() => {
    fetch('/data/elmina_precinct_buildings.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load Elmina OSM GeoJSON data');
        return res.json();
      })
      .then((data) => {
        setHomesGeoJson(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Compute Greedy Coverage whenever hubCount or homes change
  const coverageResult = React.useMemo(() => {
    if (!homesGeoJson || !homesGeoJson.features) {
      return {
        selectedHubs: [],
        coveredHomeIds: new Set(),
        coveragePercent: 0,
        totalHomes: 0,
        straightRadiusMeters: 192
      };
    }

    return runGreedyCoverage({
      homes: homesGeoJson.features,
      candidates: ELMINA_CANDIDATE_HUBS,
      k: hubCount,
      maxWalkingDistanceMeters: 250,
      detourFactor: detourFactor
    });
  }, [homesGeoJson, hubCount, detourFactor]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <p className="text-sm font-medium">Loading OpenStreetMap building footprints for City of Elmina...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-200">
        <h3 className="font-bold">Error Loading Map Data</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Context */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Developer Planning Dashboard: Parcel Hub Coverage
          </h2>
          <p className="text-xs text-slate-500">
            Township: <span className="font-semibold text-slate-700">City of Elmina (Elmina Valley)</span> | Data Source: <span className="font-semibold text-slate-700">OpenStreetMap Building Polygons</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono text-slate-700">
            Walking Threshold: <strong>250 m</strong> (~3 min walk)
          </span>
          <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono text-slate-700">
            Detour Factor: <strong>1.30x</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Map on Left (7 cols), Controls on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 h-[580px]">
          <TownshipMap
            homesGeoJson={homesGeoJson}
            selectedHubs={coverageResult.selectedHubs}
            allCandidates={ELMINA_CANDIDATE_HUBS}
            coveredHomeIds={coverageResult.coveredHomeIds}
            straightRadiusMeters={coverageResult.straightRadiusMeters}
          />
        </div>

        <div className="lg:col-span-5">
          <HubCoverageControls
            hubCount={hubCount}
            setHubCount={setHubCount}
            coveragePercent={coverageResult.coveragePercent}
            coveredCount={coverageResult.coveredHomeIds.size}
            totalHomes={coverageResult.totalHomes}
            costPerHub={costPerHub}
            setCostPerHub={setCostPerHub}
            selectedHubs={coverageResult.selectedHubs}
          />
        </div>
      </div>

      {/* Bottom Row: Simulated Usage & Carbon Impact Metrics */}
      <UsageMetricsPanel
        coveredCount={coverageResult.coveredHomeIds.size}
        hubCount={hubCount}
      />
    </div>
  );
}
