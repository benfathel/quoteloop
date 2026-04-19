"use client";

import { useState } from "react";

interface LocationData {
  type: "gps" | "manual";
  address?: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
}

interface LocationInputProps {
  onLocationChange: (location: LocationData | null) => void;
  value?: LocationData | null;
}

export default function LocationInput({ onLocationChange, value }: LocationInputProps) {
  const [mode, setMode] = useState<"none" | "gps" | "manual">(value?.type || "none");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [gpsAddress, setGpsAddress] = useState(value?.type === "gps" ? value.address || "" : "");
  const [manualAddress, setManualAddress] = useState(value?.type === "manual" ? value.address || "" : "");

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setGpsError("Your browser doesn't support location services.");
      return;
    }

    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;

        // Reverse geocode using Nominatim (free, no API key needed)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
            { headers: { "User-Agent": "QuoteLoop/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setGpsAddress(address);
            setMode("gps");
            onLocationChange({ type: "gps", address, lat: latitude, lng: longitude, mapUrl });
          } else {
            const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setGpsAddress(address);
            setMode("gps");
            onLocationChange({ type: "gps", address, lat: latitude, lng: longitude, mapUrl });
          }
        } catch {
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setGpsAddress(address);
          setMode("gps");
          onLocationChange({ type: "gps", address, lat: latitude, lng: longitude, mapUrl });
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location permission denied. Please enter your address manually."
            : "Unable to get your location. Please enter your address manually."
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleManualChange(address: string) {
    setManualAddress(address);
    if (address.trim()) {
      onLocationChange({ type: "manual", address: address.trim() });
    } else {
      onLocationChange(null);
    }
  }

  return (
    <div>
      {mode === "none" && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleUseLocation}
            disabled={gpsLoading}
            className="flex-1 bg-white/5 border border-dark-border rounded-btn px-4 py-3 text-sm text-txt-primary hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {gpsLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            )}
            Use my location
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="flex-1 bg-white/5 border border-dark-border rounded-btn px-4 py-3 text-sm text-txt-primary hover:bg-white/10 transition-all duration-200"
          >
            Enter address
          </button>
        </div>
      )}

      {gpsError && <p className="text-xs text-red-400 mt-2">{gpsError}</p>}

      {mode === "gps" && (
        <div className="bg-white/5 border border-dark-border rounded-lg px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-medium text-txt-secondary mb-1">Your location</p>
              <p className="text-sm text-txt-primary">{gpsAddress}</p>
            </div>
            <button
              type="button"
              onClick={() => { setMode("none"); setGpsAddress(""); onLocationChange(null); }}
              className="text-xs text-txt-secondary hover:text-txt-primary transition-colors mt-1"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => handleManualChange(e.target.value)}
            placeholder="e.g. 123 Main St, Springfield, IL"
            className="input-dark"
          />
          <button
            type="button"
            onClick={() => { setMode("none"); setManualAddress(""); onLocationChange(null); }}
            className="text-xs text-txt-secondary hover:text-txt-primary transition-colors mt-2"
          >
            Use GPS instead
          </button>
        </div>
      )}
    </div>
  );
}
