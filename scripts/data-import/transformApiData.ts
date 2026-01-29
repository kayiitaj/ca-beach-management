import { Feature, Point, FeatureCollection } from 'geojson';
import { readJSON, writeGeoJSON, generateSlug, determineRegion } from '../utils/geojsonUtils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AccessLocation {
  ID: number;
  NameMobileWeb: string;
  LATITUDE: number;
  LONGITUDE: number;
  COUNTY?: string;
  DOG_FRIENDLY?: string;
  DSABLDACSS?: string;
  PARKING?: string;
  RESTROOMS?: string;
  CAMPGROUND?: string;
  FISHING?: string;
  BOATING?: string;
  VOLLEYBALL?: string;
  BIKE_PATH?: string;
  [key: string]: any;
}

interface BeachProperties {
  id: string;
  name: string;
  county: string;
  region: 'north' | 'central' | 'south';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  dataStatus: 'complete' | 'partial' | 'api-only';
  lastUpdated: string;
  facilities?: string[];
  accessibility?: {
    dogFriendly?: boolean;
    wheelchairAccessible?: boolean;
    parkingAvailable?: boolean;
  };
  apiSourceId?: string;
}

function parseFacilities(apiBeach: AccessLocation): string[] | undefined {
  const facilities: string[] = [];

  if (apiBeach.PARKING === 'Yes') facilities.push('parking');
  if (apiBeach.RESTROOMS === 'Yes') facilities.push('restrooms');
  if (apiBeach.CAMPGROUND === 'Yes') facilities.push('camping');
  if (apiBeach.FISHING === 'Yes') facilities.push('fishing');
  if (apiBeach.BOATING === 'Yes') facilities.push('boating');
  if (apiBeach.VOLLEYBALL === 'Yes') facilities.push('volleyball');
  if (apiBeach.BIKE_PATH === 'Yes') facilities.push('bike path');

  return facilities.length > 0 ? facilities : undefined;
}

function transformApiBeach(apiBeach: AccessLocation): Feature<Point, BeachProperties> {
  const county = apiBeach.COUNTY || 'Unknown';
  const facilities = parseFacilities(apiBeach);

  const properties: BeachProperties = {
    id: generateSlug(apiBeach.NameMobileWeb),
    name: apiBeach.NameMobileWeb,
    county,
    region: determineRegion(county),
    coordinates: {
      latitude: apiBeach.LATITUDE,
      longitude: apiBeach.LONGITUDE,
    },
    dataStatus: 'api-only',
    lastUpdated: new Date().toISOString(),
    apiSourceId: String(apiBeach.ID),
  };

  // Add facilities if present
  if (facilities && facilities.length > 0) {
    properties.facilities = facilities;
  }

  // Add accessibility info if present
  const hasAccessibilityData =
    apiBeach.DOG_FRIENDLY !== undefined ||
    apiBeach.DSABLDACSS !== undefined ||
    apiBeach.PARKING !== undefined;

  if (hasAccessibilityData) {
    properties.accessibility = {
      dogFriendly: apiBeach.DOG_FRIENDLY === 'Yes',
      wheelchairAccessible: apiBeach.DSABLDACSS === 'Yes',
      parkingAvailable: apiBeach.PARKING === 'Yes',
    };
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [apiBeach.LONGITUDE, apiBeach.LATITUDE],
    },
    properties,
  };
}

async function transformData() {
  console.log('Transforming API data to our schema...\n');

  try {
    const inputPath = path.join(__dirname, '../raw-data/access-locations.json');
    const apiBeaches: AccessLocation[] = await readJSON(inputPath);

    console.log(`✓ Loaded ${apiBeaches.length} locations`);

    // Filter for valid California beaches
    const validBeaches = apiBeaches.filter((beach) => {
      if (!beach.NameMobileWeb || !beach.LATITUDE || !beach.LONGITUDE) {
        console.warn(`Skipping invalid beach: ${beach.NameMobileWeb || 'unnamed'}`);
        return false;
      }

      // Check if coordinates are within California bounds
      const { LATITUDE: latitude, LONGITUDE: longitude } = beach;
      if (latitude < 32 || latitude > 42 || longitude < -125 || longitude > -114) {
        console.warn(`Skipping beach outside California: ${beach.NameMobileWeb}`);
        return false;
      }

      return true;
    });

    console.log(`✓ Filtered to ${validBeaches.length} valid California beaches`);

    // Transform to GeoJSON
    const features = validBeaches.map(transformApiBeach);

    const geoJSON: FeatureCollection<Point, BeachProperties> = {
      type: 'FeatureCollection',
      features,
    };

    const outputPath = path.join(__dirname, '../transformed-data/api-beaches.geojson');
    await writeGeoJSON(outputPath, geoJSON);

    console.log(`✓ Saved to ${outputPath}`);
    console.log('\nSample transformed beach:');
    console.log(JSON.stringify(features[0], null, 2));

    // Summary statistics
    const countiesCounts = features.reduce((acc, f) => {
      const county = f.properties.county;
      acc[county] = (acc[county] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nBeaches by county:');
    Object.entries(countiesCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([county, count]) => {
        console.log(`  ${county}: ${count}`);
      });

  } catch (error) {
    console.error('Failed to transform data:', error);
    throw error;
  }
}

transformData();
