import { Feature, Polygon, FeatureCollection } from 'geojson';
import { readGeoJSON, writeGeoJSON, writeJSON } from '../utils/geojsonUtils.js';
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

interface BeachScore {
  id: string;
  name: string;
  county: string;
  region: string;
  score: number;
  scoringDetails: {
    population: number;
    facilities: number;
    accessibility: number;
    landmarks: number;
    countyRepresentation: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// Major California cities coordinates for proximity scoring
const MAJOR_CITIES = [
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
  { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'San Jose', lat: 37.3382, lng: -121.8863 },
  { name: 'Santa Barbara', lat: 34.4208, lng: -119.6982 },
  { name: 'Santa Cruz', lat: 36.9741, lng: -122.0308 },
  { name: 'Monterey', lat: 36.6002, lng: -121.8947 },
];

// Landmark keywords that indicate popular beaches
const LANDMARK_KEYWORDS = [
  'state park',
  'state beach',
  'pier',
  'boardwalk',
  'main beach',
  'downtown',
  'municipal',
  'city beach',
  'golden gate',
  'la jolla',
  'crystal cove',
  'malibu',
  'venice',
  'santa monica',
  'huntington',
];

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scorePopulationProximity(lat: number, lng: number): number {
  const minDistance = Math.min(
    ...MAJOR_CITIES.map((city) => calculateDistance(lat, lng, city.lat, city.lng))
  );

  // Closer = higher score, max 20 points
  if (minDistance < 10) return 20;
  if (minDistance < 25) return 15;
  if (minDistance < 50) return 10;
  if (minDistance < 100) return 5;
  return 0;
}

function scoreBeach(
  beach: Feature<Polygon, BeachProperties>,
  countyBeachCounts: Record<string, number>
): BeachScore {
  const { name, facilities, accessibility, coordinates, county } = beach.properties;
  let score = 0;
  const scoringDetails = {
    population: 0,
    facilities: 0,
    accessibility: 0,
    landmarks: 0,
    countyRepresentation: 0,
  };

  // Population proximity (max 20 points)
  const populationScore = scorePopulationProximity(coordinates.latitude, coordinates.longitude);
  score += populationScore;
  scoringDetails.population = populationScore;

  // Facilities count (5 points per facility)
  const facilitiesCount = facilities?.length || 0;
  const facilitiesScore = facilitiesCount * 5;
  score += facilitiesScore;
  scoringDetails.facilities = facilitiesScore;

  // Accessibility features
  let accessibilityScore = 0;
  if (accessibility?.wheelchairAccessible) accessibilityScore += 10;
  if (accessibility?.dogFriendly) accessibilityScore += 5;
  if (accessibility?.parkingAvailable) accessibilityScore += 5;
  score += accessibilityScore;
  scoringDetails.accessibility = accessibilityScore;

  // Known landmarks (15 points)
  const nameLower = name.toLowerCase();
  const hasLandmark = LANDMARK_KEYWORDS.some((keyword) => nameLower.includes(keyword));
  const landmarkScore = hasLandmark ? 15 : 0;
  score += landmarkScore;
  scoringDetails.landmarks = landmarkScore;

  // County representation bonus (favor underrepresented counties)
  const countyCount = countyBeachCounts[county] || 0;
  const countyScore = countyCount < 10 ? 10 : countyCount < 50 ? 5 : 0;
  score += countyScore;
  scoringDetails.countyRepresentation = countyScore;

  return {
    id: beach.properties.id,
    name: beach.properties.name,
    county: beach.properties.county,
    region: beach.properties.region,
    score,
    scoringDetails,
    coordinates: beach.properties.coordinates,
  };
}

async function selectTop50() {
  console.log('Selecting top 50 beaches for manual research...\n');

  try {
    const inputPath = path.join(__dirname, '../transformed-data/beaches-with-polygons.geojson');
    const beachData: FeatureCollection<Polygon, BeachProperties> = await readGeoJSON(inputPath);

    console.log(`✓ Loaded ${beachData.features.length} beaches`);

    // Count beaches per county
    const countyBeachCounts = beachData.features.reduce((acc, feature) => {
      const county = feature.properties.county;
      acc[county] = (acc[county] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Score all beaches
    const scoredBeaches = beachData.features.map((beach) => scoreBeach(beach, countyBeachCounts));

    // Sort by score (highest first)
    scoredBeaches.sort((a, b) => b.score - a.score);

    // Select top 50
    const top50 = scoredBeaches.slice(0, 50);

    // Save top 50 list
    const outputPath = path.join(__dirname, 'top50beaches.json');
    await writeJSON(outputPath, top50);

    console.log(`✓ Selected top 50 beaches`);
    console.log(`✓ Saved to ${outputPath}\n`);

    // Update the GeoJSON with research priorities
    const updatedFeatures = beachData.features.map((feature) => {
      const top50Index = top50.findIndex((b) => b.id === feature.properties.id);

      if (top50Index !== -1) {
        feature.properties.researchPriority = top50Index + 1;
        feature.properties.dataStatus = 'partial'; // Mark for research
      }

      return feature;
    });

    const updatedGeoJSON: FeatureCollection<Polygon, BeachProperties> = {
      type: 'FeatureCollection',
      features: updatedFeatures,
    };

    const updatedOutputPath = path.join(__dirname, '../transformed-data/beaches-with-polygons.geojson');
    await writeGeoJSON(updatedOutputPath, updatedGeoJSON);

    console.log('✓ Updated GeoJSON with research priorities\n');

    // Display top 10
    console.log('Top 10 beaches:');
    top50.slice(0, 10).forEach((beach, index) => {
      console.log(`${index + 1}. ${beach.name} (${beach.county}) - Score: ${beach.score}`);
      console.log(`   ${JSON.stringify(beach.scoringDetails)}`);
    });

    // Distribution by region
    const regionCounts = top50.reduce((acc, beach) => {
      acc[beach.region] = (acc[beach.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nTop 50 distribution by region:');
    console.log(`  North: ${regionCounts.north || 0}`);
    console.log(`  Central: ${regionCounts.central || 0}`);
    console.log(`  South: ${regionCounts.south || 0}`);

    // Distribution by county
    const countyDistribution = top50.reduce((acc, beach) => {
      acc[beach.county] = (acc[beach.county] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nTop 50 distribution by county:');
    Object.entries(countyDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([county, count]) => {
        console.log(`  ${county}: ${count}`);
      });

  } catch (error) {
    console.error('Failed to select top 50:', error);
    throw error;
  }
}

selectTop50();
