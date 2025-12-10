"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import dynamic from "next/dynamic";

// Import Leaflet CSS
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet components (client-side only)
// Also fix default marker icon issue
const MapContainer = dynamic(
  () =>
    import("react-leaflet").then(async (mod) => {
      if (typeof window !== "undefined") {
        const L = await import("leaflet");
        // Fix for default marker icon in webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }
      return mod.MapContainer;
    }),
  { ssr: false }
);

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});

export interface VenueData {
  venueName: string;
  address: string;
  lat: number;
  lng: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface VenuePickerProps {
  value: VenueData | null;
  onChange: (venue: VenueData | null) => void;
  placeholder?: string;
}

export function VenuePicker({ value, onChange, placeholder = "Search for a venue..." }: VenuePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search venues using Nominatim API
  const searchVenues = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Superteam-Study-Workshop-Manager/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: NominatimResult[] = await response.json();
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching venues:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchVenues(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchVenues]);

  // Format address from Nominatim result
  const formatAddress = (result: NominatimResult): string => {
    if (result.address) {
      const parts: string[] = [];
      if (result.address.house_number && result.address.road) {
        parts.push(`${result.address.house_number} ${result.address.road}`);
      } else if (result.address.road) {
        parts.push(result.address.road);
      }
      if (result.address.city) parts.push(result.address.city);
      if (result.address.state) parts.push(result.address.state);
      if (result.address.country) parts.push(result.address.country);
      return parts.join(", ");
    }
    // Fallback to display_name, but shorten it
    const parts = result.display_name.split(",");
    return parts.slice(0, 3).join(", ");
  };

  // Handle venue selection
  const handleSelectVenue = (result: NominatimResult) => {
    const venue: VenueData = {
      venueName: result.display_name.split(",")[0] || result.display_name,
      address: formatAddress(result),
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };

    onChange(venue);
    setSearchQuery("");
    setShowDropdown(false);
    setResults([]);
  };

  // Handle venue removal
  const handleRemoveVenue = () => {
    onChange(null);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Search Input */}
      {!value && (
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-9"
              onFocus={() => {
                if (results.length > 0) setShowDropdown(true);
              }}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && results.length > 0 && (
            <Card className="absolute z-50 w-full mt-1 border shadow-lg">
              <div className="max-h-60 overflow-y-auto">
                {results.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelectVenue(result)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {result.display_name.split(",")[0]}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {formatAddress(result)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Selected Venue Card */}
      {value && (
        <Card className="p-4 bg-muted/30 border-2">
          <div className="space-y-3">
            {/* Header with venue name and remove button */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base line-clamp-2">{value.venueName}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{value.address}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveVenue}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Mini Map Preview */}
            <div className="relative h-[160px] rounded-lg overflow-hidden border border-border">
              <MapContainer
                key={`${value.lat}-${value.lng}`}
                center={[value.lat, value.lng]}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                className="rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[value.lat, value.lng]} />
              </MapContainer>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
