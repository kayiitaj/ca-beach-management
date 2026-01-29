import { ApiClient } from '../utils/apiClient.js';
import { writeJSON } from '../utils/geojsonUtils.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AccessLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  county?: string;
  facilities?: string[];
  accessibility?: {
    dogFriendly?: boolean;
    wheelchairAccessible?: boolean;
    parkingAvailable?: boolean;
  };
  [key: string]: any;
}

async function fetchAccessLocations() {
  console.log('Fetching California beach access locations from YourCoast API...\n');

  const apiClient = new ApiClient('https://api.coastal.ca.gov');

  try {
    const data = await apiClient.getWithRetry<AccessLocation[]>('/access/v1/locations');

    console.log(`✓ Fetched ${data.length} locations`);

    const outputPath = path.join(__dirname, '../raw-data/access-locations.json');
    await writeJSON(outputPath, data);

    console.log(`✓ Saved to ${outputPath}`);
    console.log('\nSample beach:');
    console.log(JSON.stringify(data[0], null, 2));

  } catch (error) {
    console.error('Failed to fetch access locations:', error);
    throw error;
  }
}

fetchAccessLocations();
