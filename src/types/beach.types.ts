import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

export interface BeachProperties {
  // Core identification (required)
  id: string;
  name: string;

  // Location (required)
  county: string;
  region: 'north' | 'central' | 'south';
  coordinates: {
    latitude: number;
    longitude: number;
  };

  // Data completeness tracking (required)
  dataStatus: 'complete' | 'partial' | 'api-only';
  lastUpdated: string; // ISO 8601 date

  // Management data (optional - may be incomplete for api-only beaches)
  managementType?: 'state' | 'county' | 'city' | 'special-district' | 'federal';
  accountableEntity?: string; // Who is ultimately accountable (state, county, or city)
  managingEntity?: string; // Current managing organization
  contractedManager?: string; // If management is contracted to another organization
  lifeguardService?: string; // Organization providing lifeguard services
  managerContact?: {
    department?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };

  // Facilities and accessibility (optional)
  facilities?: string[];
  accessibility?: {
    dogFriendly?: boolean;
    wheelchairAccessible?: boolean;
    parkingAvailable?: boolean;
  };

  // Metadata (optional)
  researchPriority?: number; // 1-50 for top beaches
  apiSourceId?: string; // Original ID from YourCoast API
  notes?: string;
}

export type BeachFeature = Feature<Polygon | MultiPolygon, BeachProperties>;

export type BeachesGeoJSON = FeatureCollection<Polygon | MultiPolygon, BeachProperties>;
