import type { BeachProperties } from '../types/beach.types';

export const MANAGEMENT_COLORS: Record<BeachProperties['managementType'], string> = {
  state: '#2E7D32',        // Green
  county: '#1976D2',       // Blue
  city: '#F57C00',         // Orange
  federal: '#7B1FA2',      // Purple
  'special-district': '#FBC02D'  // Yellow
};

export const MAP_CONFIG = {
  center: [36.7783, -119.4179] as [number, number],
  zoom: 6,
  minZoom: 5,
  maxZoom: 18,
};

export const TILE_LAYER = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
};

export const DEFAULT_STYLE = {
  weight: 8,
  opacity: 1,
  color: '#000',
  fillOpacity: 0.7,
};

export const HIGHLIGHT_STYLE = {
  weight: 12,
  fillOpacity: 0.9,
};
