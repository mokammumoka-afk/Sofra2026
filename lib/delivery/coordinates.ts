export interface LatLng {
  lat: number;
  lng: number;
}

export interface CityCoordinateInfo {
  lat: number;
  lng: number;
  zoom: number;
  name: string;
}

export const LIBYAN_CITY_COORDINATES: Record<string, CityCoordinateInfo> = {
  'طرابلس': { lat: 32.8872, lng: 13.1913, zoom: 12.5, name: 'طرابلس' },
  'ضواحي طرابلس': { lat: 32.8220, lng: 13.1150, zoom: 11.5, name: 'ضواحي طرابلس' },
  'بنغازي': { lat: 32.1167, lng: 20.0667, zoom: 12.5, name: 'بنغازي' },
  'ضواحي بنغازي': { lat: 32.0750, lng: 20.1250, zoom: 11.5, name: 'ضواحي بنغازي' },
  'مصراتة': { lat: 32.3754, lng: 15.0925, zoom: 12.5, name: 'مصراتة' },
  'ضواحي مصراتة': { lat: 32.3500, lng: 15.1500, zoom: 11.5, name: 'ضواحي مصراتة' },
  'الزاوية': { lat: 32.7522, lng: 12.7278, zoom: 12.5, name: 'الزاوية' },
  'ضواحي الزاوية': { lat: 32.7300, lng: 12.7000, zoom: 11.5, name: 'ضواحي الزاوية' },
  'سبها': { lat: 27.0377, lng: 14.4283, zoom: 12.5, name: 'سبها' },
  'البيضاء': { lat: 32.7627, lng: 21.7551, zoom: 12.5, name: 'البيضاء' },
  'زليتن': { lat: 32.4674, lng: 14.5687, zoom: 12.5, name: 'زليتن' },
  'الخمس': { lat: 32.6486, lng: 14.2619, zoom: 12.5, name: 'الخمس' },
  'غريان': { lat: 32.1722, lng: 13.0203, zoom: 12.5, name: 'غريان' },
  'درنة': { lat: 32.7670, lng: 22.6367, zoom: 12.5, name: 'درنة' },
  'طبرق': { lat: 32.0836, lng: 23.9764, zoom: 12.5, name: 'طبرق' },
  'سرت': { lat: 31.2089, lng: 16.5887, zoom: 12.5, name: 'سرت' },
};

export const LIBYAN_DISTRICT_COORDINATES: Record<string, LatLng> = {
  // طرابلس
  'بن عاشور': { lat: 32.8805, lng: 13.2045 },
  'النوفليين': { lat: 32.8752, lng: 13.2180 },
  'حي الأندلس': { lat: 32.8885, lng: 13.1420 },
  'سوق الجمعة': { lat: 32.8720, lng: 13.2450 },
  'عين زارة': { lat: 32.8250, lng: 13.2400 },
  'أبو سليم': { lat: 32.8450, lng: 13.1680 },
  'الهضبة الخضراء': { lat: 32.8420, lng: 13.2010 },
  'صلاح الدين': { lat: 32.8120, lng: 13.1950 },
  'تاجوراء': { lat: 32.8780, lng: 13.3450 },
  'جنزور': { lat: 32.8220, lng: 13.0250 },
  'وسط المدينة': { lat: 32.8940, lng: 13.1810 },
  'السواني': { lat: 32.7300, lng: 13.0900 },
  'قصر بن غشير': { lat: 32.6850, lng: 13.1800 },
  'الكريمية': { lat: 32.7750, lng: 13.1350 },
  'وادي الربيع': { lat: 32.7600, lng: 13.2900 },
  'ورشفانة': { lat: 32.7100, lng: 13.0100 },

  // بنغازي
  'وسط البلاد': { lat: 32.1220, lng: 20.0620 },
  'طابلينو': { lat: 32.1020, lng: 20.0480 },
  'الفويهات': { lat: 32.1150, lng: 20.0820 },
  'البركة': { lat: 32.1080, lng: 20.0650 },
  'الهواري': { lat: 32.0650, lng: 20.0980 },
  'الليثي': { lat: 32.0950, lng: 20.1050 },
  'الحدائق': { lat: 32.1190, lng: 20.0750 },
  'شبنة': { lat: 32.1290, lng: 20.1150 },
  'القوارشة': { lat: 32.0450, lng: 20.0400 },
  'بوعطني': { lat: 32.0800, lng: 20.1400 },
  'سيدي خليفة': { lat: 32.2200, lng: 20.1700 },

  // مصراتة
  'الرويسات': { lat: 32.3810, lng: 15.0920 },
  'قصر أحمد': { lat: 32.3650, lng: 15.1950 },
  'الغيران': { lat: 32.3550, lng: 15.0750 },
  'رأس الطوبة': { lat: 32.3780, lng: 15.1150 },
  'الزروق': { lat: 32.3920, lng: 15.1050 },
  'سوق المقريف': { lat: 32.3760, lng: 15.0880 },

  // مدن أخرى
  'سبها وسط': { lat: 27.0377, lng: 14.4283 },
  'الزاوية وسط': { lat: 32.7522, lng: 12.7278 },
  'زليتن وسط': { lat: 32.4674, lng: 14.5687 },
  'الخمس وسط': { lat: 32.6486, lng: 14.2619 },
};

/**
 * Resolves geographical coordinates from address string and city name.
 */
export function resolveLocationCoordinates(address: string, city: string = 'طرابلس', seedKey?: string): LatLng {
  const normAddress = (address || '').toLowerCase();
  const normCity = (city || 'طرابلس').trim();

  // 1. Try finding district match
  for (const [district, coords] of Object.entries(LIBYAN_DISTRICT_COORDINATES)) {
    if (normAddress.includes(district.toLowerCase())) {
      // Add slight micro-offset based on seed to avoid identical overlaps
      const offset = generateMicroOffset(seedKey || address);
      return {
        lat: coords.lat + offset.dLat,
        lng: coords.lng + offset.dLng,
      };
    }
  }

  // 2. Fallback to city center
  const cityInfo = LIBYAN_CITY_COORDINATES[normCity] || LIBYAN_CITY_COORDINATES['طرابلس'];
  const offset = generateMicroOffset(seedKey || address);
  return {
    lat: cityInfo.lat + offset.dLat * 2.5,
    lng: cityInfo.lng + offset.dLng * 2.5,
  };
}

/**
 * Generates small deterministic pseudo-random offset (-0.005 to +0.005 degrees ~ 500 meters)
 */
function generateMicroOffset(seed: string = ''): { dLat: number; dLng: number } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const factor1 = ((Math.abs(hash) % 1000) - 500) / 100000;
  const factor2 = ((Math.abs(hash >> 3) % 1000) - 500) / 100000;
  return { dLat: factor1, dLng: factor2 };
}

/**
 * Calculates straight line distance in Kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates bearing angle in degrees (0 - 360) between two coordinates
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Generates realistic street curved waypoints between pickup and delivery coordinates
 */
export function generateRouteWaypoints(
  start: LatLng,
  end: LatLng,
  pointsCount: number = 7
): LatLng[] {
  const waypoints: LatLng[] = [start];
  
  // Create realistic city grid / road curve bends
  for (let i = 1; i < pointsCount - 1; i++) {
    const fraction = i / (pointsCount - 1);
    const directLat = start.lat + (end.lat - start.lat) * fraction;
    const directLng = start.lng + (end.lng - start.lng) * fraction;

    // Perpendicular detour simulating streets
    const perpLat = -(end.lng - start.lng);
    const perpLng = end.lat - start.lat;
    const curveFactor = Math.sin(fraction * Math.PI) * (i % 2 === 0 ? 0.22 : -0.15);

    waypoints.push({
      lat: directLat + perpLat * curveFactor * 0.15,
      lng: directLng + perpLng * curveFactor * 0.15,
    });
  }

  waypoints.push(end);
  return waypoints;
}

/**
 * Calculates position along a multi-segment route given a progress fraction (0 to 1)
 */
export function getPositionAlongRoute(
  waypoints: LatLng[],
  progressFraction: number
): { position: LatLng; segmentIndex: number; heading: number } {
  if (!waypoints || waypoints.length === 0) {
    return { position: { lat: 32.8872, lng: 13.1913 }, segmentIndex: 0, heading: 0 };
  }
  if (waypoints.length === 1 || progressFraction <= 0) {
    return { position: waypoints[0], segmentIndex: 0, heading: 0 };
  }
  if (progressFraction >= 1) {
    const last = waypoints[waypoints.length - 1];
    const prev = waypoints[waypoints.length - 2] || last;
    return {
      position: last,
      segmentIndex: waypoints.length - 2,
      heading: calculateBearing(prev.lat, prev.lng, last.lat, last.lng),
    };
  }

  // Calculate cumulative segment lengths
  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = calculateDistanceKm(waypoints[i].lat, waypoints[i].lng, waypoints[i + 1].lat, waypoints[i + 1].lng);
    segmentLengths.push(dist);
    totalLength += dist;
  }

  if (totalLength === 0) {
    return { position: waypoints[0], segmentIndex: 0, heading: 0 };
  }

  const targetDist = totalLength * progressFraction;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (accumulated + segLen >= targetDist || i === segmentLengths.length - 1) {
      const segFraction = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const lat = p1.lat + (p2.lat - p1.lat) * segFraction;
      const lng = p1.lng + (p2.lng - p1.lng) * segFraction;
      const heading = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);
      return { position: { lat, lng }, segmentIndex: i, heading };
    }
    accumulated += segLen;
  }

  return { position: waypoints[waypoints.length - 1], segmentIndex: waypoints.length - 2, heading: 0 };
}
