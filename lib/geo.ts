/**
 * Calculate distance between two lat/lng coordinates using the Haversine formula.
 * @returns Distance in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Format a distance in km for display.
 * < 1 km → "350 m", >= 1 km → "1.2 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Geocode a city name using OpenStreetMap Nominatim (worldwide).
 * Free, no API key required, cached for 24h by Next.js.
 */
export async function geocodeCity(
  city: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: { "User-Agent": "FootMatch/1.0" },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.[0];
    if (!result?.lat || !result?.lon) return null;
    return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
  } catch {
    return null;
  }
}
