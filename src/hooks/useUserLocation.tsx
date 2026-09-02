import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type UserLocation = {
  city: string;
  state?: string | null;
  source: "gps" | "manual";
};

type Status = "idle" | "locating" | "granted" | "denied" | "unavailable";

type Ctx = {
  location: UserLocation | null;
  status: Status;
  requestLocation: () => void;
  setManualLocation: (city: string, state?: string | null) => void;
  clearLocation: () => void;
  askedBefore: boolean;
};

const STORAGE_KEY = "caradda.location.v1";
const ASKED_KEY = "caradda.location.asked.v1";

const LocationContext = createContext<Ctx | null>(null);

export const POPULAR_CITIES = [
  "Kota",
  "Jaipur",
  "Delhi",
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Ahmedabad",
  "Indore",
  "Lucknow",
  "Kolkata",
];

/** Reverse geocode to city/state only — exact coordinates never leave the device. */
async function coordsToCity(lat: number, lon: number): Promise<UserLocation | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
    };
    const city = data.city || data.locality;
    if (!city) return null;
    return { city, state: data.principalSubdivision ?? null, source: "gps" };
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [askedBefore, setAskedBefore] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLocation(JSON.parse(raw) as UserLocation);
        setStatus("granted");
      }
      setAskedBefore(localStorage.getItem(ASKED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: UserLocation | null) => {
    setLocation(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    try {
      localStorage.setItem(ASKED_KEY, "1");
    } catch {
      /* ignore */
    }
    setAskedBefore(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resolved = await coordsToCity(pos.coords.latitude, pos.coords.longitude);
        if (resolved) {
          persist(resolved);
          setStatus("granted");
        } else {
          setStatus("unavailable");
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }, [persist]);

  const setManualLocation = useCallback(
    (city: string, state?: string | null) => {
      persist({ city, state: state ?? null, source: "manual" });
      setStatus("granted");
    },
    [persist],
  );

  const clearLocation = useCallback(() => {
    persist(null);
    setStatus("idle");
  }, [persist]);

  const value = useMemo<Ctx>(
    () => ({ location, status, requestLocation, setManualLocation, clearLocation, askedBefore }),
    [location, status, requestLocation, setManualLocation, clearLocation, askedBefore],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used within LocationProvider");
  return ctx;
}
