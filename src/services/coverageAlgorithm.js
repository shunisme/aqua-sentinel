/**
 * Greedy Maximum Coverage Location Algorithm for Township Parcel Hubs
 *
 * Models the facility placement problem (MCLP):
 * Given N residential building footprints and M candidate hub locations,
 * greedily select K hubs (1 to 8) to maximize total homes within walking reach.
 *
 * Walking Distance Model:
 * Uses Haversine distance with an urban detour multiplier (default 1.30x)
 * to estimate street walking distance without requiring full network graph evaluation.
 * A home is covered if: haversineDistance * detourFactor <= maxWalkingDistanceMeters (250m)
 */

export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 16 Realistically placed candidate hubs across Elmina Valley precinct
// Positioned at key street corners, guardhouses, park entryways, and community junctions
export const ELMINA_CANDIDATE_HUBS = [
  { id: 'cand-1', name: 'Elmina Valley 1 Guardhouse Entrance', lat: 3.1878, lon: 101.5280, type: 'Security Gate / Mail Kiosk' },
  { id: 'cand-2', name: 'Jalan EV 1/4 Community Park Corner', lat: 3.1895, lon: 101.5265, type: 'Linear Park Junction' },
  { id: 'cand-3', name: 'Elmina Valley 2 Main Entrance', lat: 3.1845, lon: 101.5225, type: 'Security Gate' },
  { id: 'cand-4', name: 'Jalan Rebung Surau & Community Square', lat: 3.1820, lon: 101.5268, type: 'Community Centre' },
  { id: 'cand-5', name: 'Elmina Central Park Promenade East', lat: 3.1860, lon: 101.5250, type: 'Public Park Pavilion' },
  { id: 'cand-6', name: 'Jalan EV 2/8 Cul-de-Sac Junction', lat: 3.1832, lon: 101.5205, type: 'Residential Loop' },
  { id: 'cand-7', name: 'Jalan Rebung 3 West Gate', lat: 3.1805, lon: 101.5245, type: 'Sub-precinct Gate' },
  { id: 'cand-8', name: 'Elmina Valley 3 North Gateway', lat: 3.1915, lon: 101.5255, type: 'Precinct Boulevard' },
  { id: 'cand-9', name: 'Jalan EV 1/12 Green Corridor', lat: 3.1885, lon: 101.5298, type: 'Pedestrian Link' },
  { id: 'cand-10', name: 'Elmina Central Park Bridge West', lat: 3.1848, lon: 101.5240, type: 'Bridge Landing' },
  { id: 'cand-11', name: 'Jalan EV 2/15 Hillside Turn', lat: 3.1862, lon: 101.5195, type: 'Neighborhood Kiosk' },
  { id: 'cand-12', name: 'Jalan Rebung 1 Commercial Shophouses', lat: 3.1810, lon: 101.5290, type: 'Convenience Retail' },
  { id: 'cand-13', name: 'Elmina Valley East Bus/Shuttle Stop', lat: 3.1890, lon: 101.5310, type: 'Transit Node' },
  { id: 'cand-14', name: 'Persiaran Elmina Valley Roundabout Link', lat: 3.1835, lon: 101.5285, type: 'Main Artery' },
  { id: 'cand-15', name: 'Jalan EV 1/8 Pocket Park', lat: 3.1870, lon: 101.5270, type: 'Pocket Park' },
  { id: 'cand-16', name: 'Jalan EV 2/4 Play Park', lat: 3.1852, lon: 101.5210, type: 'Playground Node' }
];

/**
 * Runs the Greedy Maximum Coverage algorithm
 *
 * @param {Array} homes - Array of residential building features with properties.center [lat, lon]
 * @param {Array} candidates - Candidate hub locations
 * @param {number} k - Number of hubs to place (1 to 8)
 * @param {number} maxWalkingDistanceMeters - Target walking limit (default 250m)
 * @param {number} detourFactor - Straight-line to street detour multiplier (default 1.30)
 */
export function runGreedyCoverage({
  homes = [],
  candidates = ELMINA_CANDIDATE_HUBS,
  k = 3,
  maxWalkingDistanceMeters = 250,
  detourFactor = 1.30
}) {
  if (!homes || homes.length === 0) {
    return {
      selectedHubs: [],
      coveredHomeIds: new Set(),
      coveragePercent: 0,
      totalHomes: 0
    };
  }

  // Equivalent straight-line radius in meters
  const maxStraightDistance = maxWalkingDistanceMeters / detourFactor;

  // Precompute coverage sets for each candidate
  // candidateCoverageMap[candidateId] = Set(homeId)
  const candidateCoverageMap = new Map();

  candidates.forEach(cand => {
    const coveredSet = new Set();
    homes.forEach(home => {
      const [hLat, hLon] = home.properties.center;
      const dist = haversineDistanceMeters(cand.lat, cand.lon, hLat, hLon);
      if (dist <= maxStraightDistance) {
        coveredSet.add(home.id || home.properties.id);
      }
    });
    candidateCoverageMap.set(cand.id, coveredSet);
  });

  const selectedHubs = [];
  const coveredHomeIds = new Set();
  const remainingCandidates = [...candidates];

  const targetCount = Math.min(k, candidates.length);

  for (let step = 1; step <= targetCount; step++) {
    let bestCandidate = null;
    let bestMarginalSet = new Set();
    let bestMarginalCount = -1;

    for (const cand of remainingCandidates) {
      const coveredByCand = candidateCoverageMap.get(cand.id);
      // Count newly covered homes
      const marginalSet = new Set();
      coveredByCand.forEach(homeId => {
        if (!coveredHomeIds.has(homeId)) {
          marginalSet.add(homeId);
        }
      });

      if (marginalSet.size > bestMarginalCount) {
        bestMarginalCount = marginalSet.size;
        bestMarginalSet = marginalSet;
        bestCandidate = cand;
      }
    }

    if (!bestCandidate) break;

    // Add newly covered homes
    bestMarginalSet.forEach(id => coveredHomeIds.add(id));

    // Remove from remaining
    const candIndex = remainingCandidates.findIndex(c => c.id === bestCandidate.id);
    if (candIndex !== -1) {
      remainingCandidates.splice(candIndex, 1);
    }

    selectedHubs.push({
      ...bestCandidate,
      order: step,
      marginalCoveredHomes: bestMarginalSet.size,
      totalCoveredHomes: coveredHomeIds.size,
      cumulativeCoveragePercent: ((coveredHomeIds.size / homes.length) * 100).toFixed(1),
      straightRadiusMeters: Math.round(maxStraightDistance),
      walkingThresholdMeters: maxWalkingDistanceMeters
    });
  }

  const coveragePercent = ((coveredHomeIds.size / homes.length) * 100).toFixed(1);

  return {
    selectedHubs,
    coveredHomeIds,
    coveragePercent: parseFloat(coveragePercent),
    totalHomes: homes.length,
    straightRadiusMeters: Math.round(maxStraightDistance)
  };
}
