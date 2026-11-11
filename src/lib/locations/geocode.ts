import "server-only";

export type GeocodedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId: string | null;
};

function validCoordinate(value: number) {
  return Number.isFinite(value) && Math.abs(value) <= 180;
}

export function extractCoordinates(value: string | null | undefined) {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Keep the original value when a user pasted an incomplete encoded URL.
  }
  const patterns = [
    /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /^\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*$/,
  ];
  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (Math.abs(latitude) <= 90 && validCoordinate(longitude)) return { latitude, longitude };
  }
  return null;
}

export async function reverseGeocodeLocation(locationUrl: string | null | undefined) {
  const coordinates = extractCoordinates(locationUrl);
  const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY?.trim();
  if (!coordinates || !apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${coordinates.latitude},${coordinates.longitude}`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("language", "ar");
  url.searchParams.set("region", "eg");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const result = (await response.json()) as {
      status?: string;
      results?: Array<{ formatted_address?: string; place_id?: string }>;
    };
    const first = result.status === "OK" ? result.results?.[0] : null;
    if (!first?.formatted_address) return null;
    return {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      formattedAddress: first.formatted_address,
      placeId: first.place_id ?? null,
    } satisfies GeocodedLocation;
  } catch {
    return null;
  }
}
