import { Feature, Point, Polygon, FeatureCollection } from 'geojson';
import * as turf from '@turf/turf';
import { readGeoJSON, writeGeoJSON } from '../utils/geojsonUtils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  researchPriority?: number;
}

function generateBeachPolygon(lng: number, lat: number, radiusMeters = 100): Polygon {
  const point = turf.point([lng, lat]);
  const buffered = turf.buffer(point, radiusMeters, { units: 'meters' });

  if (!buffered || buffered.geometry.type !== 'Polygon') {
    throw new Error(`Failed to create polygon for coordinates [${lng}, ${lat}]`);
  }

  // Simplify polygon to reduce file size (4-6 points for a circle is sufficient)
  const simplified = turf.simplify(buffered, { tolerance: 0.00005, highQuality: false });

  return simplified.geometry as Polygon;
}

async function generatePolygons() {
  console.log('Generating circular buffer polygons...\n');

  try {
    const inputPath = path.join(__dirname, '../transformed-data/api-beaches.geojson');
    const pointData: FeatureCollection<Point, BeachProperties> = await readGeoJSON(inputPath);

    console.log(`✓ Loaded ${pointData.features.length} beach points`);

    const polygonFeatures: Feature<Polygon, BeachProperties>[] = pointData.features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      // Use slightly larger radius for priority beaches (if set)
      const radiusMeters = feature.properties.researchPriority && feature.properties.researchPriority <= 50 ? 150 : 100;

      const polygon = generateBeachPolygon(lng, lat, radiusMeters);

      return {
        type: 'Feature',
        geometry: polygon,
        properties: feature.properties,
      };
    });

    const polygonGeoJSON: FeatureCollection<Polygon, BeachProperties> = {
      type: 'FeatureCollection',
      features: polygonFeatures,
    };

    const outputPath = path.join(__dirname, '../transformed-data/beaches-with-polygons.geojson');
    await writeGeoJSON(outputPath, polygonGeoJSON);

    console.log(`✓ Generated ${polygonFeatures.length} polygons`);
    console.log(`✓ Saved to ${outputPath}`);

    // Calculate average polygon complexity
    const avgPoints = polygonFeatures.reduce((sum, f) => {
      return sum + (f.geometry.coordinates[0]?.length || 0);
    }, 0) / polygonFeatures.length;

    console.log(`\nAverage points per polygon: ${avgPoints.toFixed(1)}`);
    console.log('Sample polygon:');
    console.log(JSON.stringify(polygonFeatures[0], null, 2));

  } catch (error) {
    console.error('Failed to generate polygons:', error);
    throw error;
  }
}

generatePolygons();
