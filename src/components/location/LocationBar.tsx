import { useState } from "react";
import { MapPin, LocateFixed, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POPULAR_CITIES, useUserLocation } from "@/hooks/useUserLocation";
import { cn } from "@/lib/utils";

export function LocationBar({ className }: { className?: string }) {
  const { location, status, requestLocation, setManualLocation, clearLocation, askedBefore } =
    useUserLocation();
  const [manual, setManual] = useState("");

  const denied = status === "denied" || status === "unavailable";

  return (
    <div
      className={cn(
        "surface-panel fade-in-up flex flex-wrap items-center gap-3 p-4",
        className,
      )}
    >
      <MapPin className="h-4 w-4 shrink-0 text-gold-deep" />

      {location ? (
        <>
          <p className="text-sm">
            Showing vehicles near{" "}
            <span className="font-semibold">
              {location.city}
              {location.state ? `, ${location.state}` : ""}
            </span>
          </p>
          <Button variant="ghost" size="sm" className="gap-1" onClick={clearLocation}>
            <X className="h-3.5 w-3.5" /> Change
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {denied
              ? "Location access unavailable — pick your city manually."
              : "Set your location to see vehicles and sellers near you."}
          </p>

          {!denied && !askedBefore && (
            <Button size="sm" onClick={requestLocation} disabled={status === "locating"}>
              {status === "locating" ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
              )}
              {status === "locating" ? "Detecting…" : "Use my location"}
            </Button>
          )}

          <div className="flex items-center gap-2">
            <Select onValueChange={(v) => setManualLocation(v)}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="h-9 w-[150px]"
              placeholder="Other city…"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manual.trim()) setManualLocation(manual.trim());
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
