import { Feature, Polygon, FeatureCollection } from 'geojson';
import { readGeoJSON, writeGeoJSON } from '../utils/geojsonUtils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';

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
  managementType?: 'state' | 'county' | 'city' | 'special-district' | 'federal';
  accountableEntity?: string;
  managingEntity?: string;
  contractedManager?: string;
  lifeguardService?: string;
  managerContact?: {
    department?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  facilities?: string[];
  accessibility?: {
    dogFriendly?: boolean;
    wheelchairAccessible?: boolean;
    parkingAvailable?: boolean;
  };
  researchPriority?: number;
  apiSourceId?: string;
  notes?: string;
}

async function mergeDataSources() {
  console.log('Merging all data sources...\n');

  try {
    // Load API-sourced beaches with polygons
    const apiDataPath = path.join(__dirname, '../transformed-data/beaches-with-polygons.geojson');
    const apiData: FeatureCollection<Polygon, BeachProperties> = await readGeoJSON(apiDataPath);

    console.log(`✓ Loaded ${apiData.features.length} beaches from API data`);

    // Check if manually researched data exists
    const researchedDataPath = path.join(__dirname, '../research/researched-beaches.json');
    let researchedData: Partial<BeachProperties>[] = [];

    try {
      const content = await fs.readFile(researchedDataPath, 'utf-8');
      researchedData = JSON.parse(content);
      console.log(`✓ Loaded ${researchedData.length} manually researched beaches`);
    } catch (error) {
      console.log('! No manually researched data found (this is okay for initial run)');
      console.log(`  Create ${researchedDataPath} with an array of beach data to include manual research`);
    }

    // Merge researched data into API data
    const mergedFeatures = apiData.features.map((feature) => {
      const researchedBeach = researchedData.find((r) => r.id === feature.properties.id);

      if (researchedBeach) {
        // Merge researched data with API data
        feature.properties = {
          ...feature.properties,
          ...researchedBeach,
          dataStatus: 'complete',
          lastUpdated: new Date().toISOString(),
        };
      }

      return feature;
    });

    // Sort features by priority (priority beaches first, then alphabetically)
    mergedFeatures.sort((a, b) => {
      const aPriority = a.properties.researchPriority || 9999;
      const bPriority = b.properties.researchPriority || 9999;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return a.properties.name.localeCompare(b.properties.name);
    });

    const mergedGeoJSON: FeatureCollection<Polygon, BeachProperties> = {
      type: 'FeatureCollection',
      features: mergedFeatures,
    };

    // Save to public directory
    const outputPath = path.join(__dirname, '../../public/beaches.geojson');
    await writeGeoJSON(outputPath, mergedGeoJSON);

    console.log(`✓ Merged ${mergedFeatures.length} beaches`);
    console.log(`✓ Saved to ${outputPath}\n`);

    // Statistics
    const stats = {
      total: mergedFeatures.length,
      complete: mergedFeatures.filter((f) => f.properties.dataStatus === 'complete').length,
      partial: mergedFeatures.filter((f) => f.properties.dataStatus === 'partial').length,
      apiOnly: mergedFeatures.filter((f) => f.properties.dataStatus === 'api-only').length,
      priority: mergedFeatures.filter((f) => f.properties.researchPriority && f.properties.researchPriority <= 50).length,
    };

    console.log('Data completeness statistics:');
    console.log(`  Total beaches: ${stats.total}`);
    console.log(`  Fully researched: ${stats.complete}`);
    console.log(`  Partially researched: ${stats.partial}`);
    console.log(`  API data only: ${stats.apiOnly}`);
    console.log(`  Priority beaches (top 50): ${stats.priority}`);

    // Region distribution
    const regionStats = mergedFeatures.reduce((acc, f) => {
      const region = f.properties.region;
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nDistribution by region:');
    console.log(`  North: ${regionStats.north || 0}`);
    console.log(`  Central: ${regionStats.central || 0}`);
    console.log(`  South: ${regionStats.south || 0}`);

  } catch (error) {
    console.error('Failed to merge data sources:', error);
    throw error;
  }
}

mergeDataSources();
