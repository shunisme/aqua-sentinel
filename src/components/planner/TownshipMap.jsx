import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Info } from 'lucide-react';

export default function TownshipMap({
  homesGeoJson,
  selectedHubs = [],
  allCandidates = [],
  coveredHomeIds = new Set(),
  straightRadiusMeters = 192
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const hubLayersRef = useRef([]);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered on Elmina Valley, Shah Alam
    const map = L.map(mapContainerRef.current, {
      center: [3.1855, 101.5245],
      zoom: 16,
      zoomControl: true,
      attributionControl: true
    });

    // CartoDB Positron base tiles for architectural clarity
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Building Footprints
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !homesGeoJson) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(homesGeoJson, {
      style: (feature) => {
        const id = feature.id || feature.properties.id;
        const isCovered = coveredHomeIds.has(id);

        return {
          color: isCovered ? '#059669' : '#64748B',
          weight: 1,
          opacity: 0.9,
          fillColor: isCovered ? '#10B981' : '#CBD5E1',
          fillOpacity: isCovered ? 0.75 : 0.4
        };
      },
      onEachFeature: (feature, layer) => {
        const id = feature.id || feature.properties.id;
        const isCovered = coveredHomeIds.has(id);
        const bType = feature.properties.building || 'Terrace House';

        layer.bindPopup(`
          <div class="text-xs p-1">
            <p class="font-bold text-slate-900">Residential Footprint #${id}</p>
            <p class="text-slate-600">Type: <span class="capitalize">${bType}</span></p>
            <div class="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold text-[10px] ${
              isCovered ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }">
              ${isCovered ? '✓ Covered (≤ 250m walk)' : '✗ Uncovered'}
            </div>
          </div>
        `);
      }
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;
  }, [homesGeoJson, coveredHomeIds]);

  // Update Hubs & Coverage Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous hub markers and circles
    hubLayersRef.current.forEach(layer => map.removeLayer(layer));
    hubLayersRef.current = [];

    const selectedIds = new Set(selectedHubs.map(h => h.id));

    // 1. Render Unselected Candidates (subtle dots)
    allCandidates.forEach(cand => {
      if (selectedIds.has(cand.id)) return;

      const candIcon = L.divIcon({
        className: 'hub-pin-icon',
        html: `<div class="candidate-pin-badge" title="${cand.name}">•</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([cand.lat, cand.lon], { icon: candIcon })
        .bindTooltip(`Candidate: ${cand.name}`, { direction: 'top' })
        .addTo(map);

      hubLayersRef.current.push(marker);
    });

    // 2. Render Selected Hubs with Radius
    selectedHubs.forEach(hub => {
      // 250m walking radius circle (~192m straight-line buffer)
      const circle = L.circle([hub.lat, hub.lon], {
        radius: straightRadiusMeters,
        color: '#D9222A',
        weight: 1.5,
        dashArray: '4, 4',
        fillColor: '#D9222A',
        fillOpacity: 0.12
      }).addTo(map);

      const hubIcon = L.divIcon({
        className: 'hub-pin-icon',
        html: `<div class="hub-pin-badge" title="${hub.name}">${hub.order}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([hub.lat, hub.lon], { icon: hubIcon })
        .bindPopup(`
          <div class="text-xs p-1">
            <div class="flex items-center gap-1 font-bold text-red-600">
              <span>Hub #${hub.order}</span>
              <span class="text-slate-400">|</span>
              <span class="text-slate-900">${hub.name}</span>
            </div>
            <p class="text-slate-500 mt-0.5">Facility: ${hub.type}</p>
            <div class="mt-2 text-[11px] bg-slate-50 p-1.5 rounded border border-slate-200 space-y-0.5">
              <div>Marginal Homes Added: <strong>+${hub.marginalCoveredHomes}</strong></div>
              <div>Cumulative Homes: <strong>${hub.totalCoveredHomes}</strong> (${hub.cumulativeCoveragePercent}%)</div>
              <div>Walking Buffer: <strong>250 m</strong> (~${straightRadiusMeters}m straight)</div>
            </div>
          </div>
        `)
        .addTo(map);

      hubLayersRef.current.push(circle);
      hubLayersRef.current.push(marker);
    });
  }, [selectedHubs, allCandidates, straightRadiusMeters]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Map Header with Legend */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            City of Elmina (Elmina Valley Precinct)
            <span className="text-xs font-normal text-slate-500">OpenStreetMap Footprints</span>
          </h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span className="text-slate-700 font-medium">Covered Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-300 inline-block"></span>
            <span className="text-slate-600">Uncovered Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center">1</span>
            <span className="text-slate-700 font-medium">Selected Hub</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-red-500 bg-red-100 inline-block"></span>
            <span className="text-slate-600">250m Walk Radius</span>
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative flex-1 min-h-[460px] w-full">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Engineering Limitation Notice */}
      <div className="px-4 py-2 bg-amber-50/80 border-t border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong className="font-semibold">Algorithmic Limitation:</strong> Building geometry sourced directly from OpenStreetMap (ODbL). Coverage buffer models a 250m pedestrian threshold using a 1.30x street detour factor on building centroids. It does not account for physical perimeter fences, gated guarded boundaries, or elevation grade.
        </p>
      </div>
    </div>
  );
}
