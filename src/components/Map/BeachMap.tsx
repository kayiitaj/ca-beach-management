import { MapContainer, TileLayer } from 'react-leaflet';
import { useState, useEffect } from 'react';
import { MAP_CONFIG, TILE_LAYER } from '../../utils/mapConfig';
import type { BeachesGeoJSON } from '../../types/beach.types';
import BeachLayer from './BeachLayer';
import Legend from './Legend';
import 'leaflet/dist/leaflet.css';
import './BeachMap.css';

export default function BeachMap() {
  const [beachData, setBeachData] = useState<BeachesGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load GeoJSON data via fetch from public directory
    fetch(`${import.meta.env.BASE_URL}beaches.geojson`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: BeachesGeoJSON) => {
        console.log('Loaded beach data:', data);
        if (data && data.features && Array.isArray(data.features)) {
          setBeachData(data);
        } else {
          console.error('Invalid beach data format:', data);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading beach data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner" />
        <p>Loading California beaches...</p>
      </div>
    );
  }

  if (!beachData || !beachData.features || beachData.features.length === 0) {
    return (
      <div className="map-error">
        <p>No beach data available. Please check the console for details.</p>
      </div>
    );
  }

  return (
    <div className="beach-map-container">
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        className="beach-map"
      >
        <TileLayer
          url={TILE_LAYER.url}
          attribution={TILE_LAYER.attribution}
        />
        <BeachLayer data={beachData} />
        <Legend />
      </MapContainer>
    </div>
  );
}
