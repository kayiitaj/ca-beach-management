import { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function readGeoJSON<G extends Geometry = Geometry, P extends GeoJsonProperties = GeoJsonProperties>(
  filePath: string
): Promise<FeatureCollection<G, P>> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeGeoJSON<G extends Geometry = Geometry, P extends GeoJsonProperties = GeoJsonProperties>(
  filePath: string,
  data: FeatureCollection<G, P>
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJSON<T>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function determineRegion(county: string): 'north' | 'central' | 'south' {
  const countyLower = county.toLowerCase();

  // North: Del Norte, Humboldt, Mendocino, Sonoma, Marin, San Francisco
  if ([
    'del norte',
    'humboldt',
    'mendocino',
    'sonoma',
    'marin',
    'san francisco',
  ].some((c) => countyLower.includes(c))) {
    return 'north';
  }

  // Central: San Mateo, Santa Cruz, Monterey, San Luis Obispo
  if ([
    'san mateo',
    'santa cruz',
    'monterey',
    'san luis obispo',
  ].some((c) => countyLower.includes(c))) {
    return 'central';
  }

  // South: Santa Barbara, Ventura, Los Angeles, Orange, San Diego
  return 'south';
}
