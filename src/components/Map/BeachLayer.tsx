import { GeoJSON, useMap } from 'react-leaflet';
import { useState, useEffect, useMemo } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Layer, PathOptions } from 'leaflet';
import type { Feature, Geometry } from 'geojson';
import { MANAGEMENT_COLORS, DEFAULT_STYLE, HIGHLIGHT_STYLE } from '../../utils/mapConfig';
import type { BeachesGeoJSON, BeachProperties } from '../../types/beach.types';
import BeachPopup from './BeachPopup';

interface BeachLayerProps {
  data: BeachesGeoJSON;
}

function shouldShowAtZoom(zoom: number, beach: BeachProperties): boolean {
  // Top 50 priority beaches always visible
  if (beach.researchPriority && beach.researchPriority <= 50) {
    return true;
  }

  // Zoom 6-8: Show only fully researched beaches
  if (zoom < 9) {
    return beach.dataStatus === 'complete';
  }

  // Zoom 9-11: Show complete and partial beaches
  if (zoom < 12) {
    return beach.dataStatus !== 'api-only';
  }

  // Zoom 12+: Show all beaches
  return true;
}

export default function BeachLayer({ data }: BeachLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handleZoom = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map]);

  // Filter features based on current zoom level
  const filteredFeatures = useMemo(() => {
    return data.features.filter((feature) =>
      shouldShowAtZoom(zoom, feature.properties)
    );
  }, [data.features, zoom]);

  const filteredData: BeachesGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredFeatures,
  }), [filteredFeatures]);
  const getFeatureStyle = (feature?: Feature<Geometry, any>): PathOptions => {
    if (!feature || !feature.properties) {
      return {
        ...DEFAULT_STYLE,
        fillColor: '#808080',
      };
    }

    const props = feature.properties as BeachProperties;
    const fillColor = props.managementType ? MANAGEMENT_COLORS[props.managementType] : '#808080';
    return {
      ...DEFAULT_STYLE,
      fillColor,
    };
  };

  const onEachFeature = (feature: Feature<Geometry, any>, layer: Layer) => {
    if (!feature.properties) return;

    const props = feature.properties as BeachProperties;

    // Add hover effects and cursor
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        const fillColor = props.managementType ? MANAGEMENT_COLORS[props.managementType] : '#808080';
        target.setStyle({
          ...HIGHLIGHT_STYLE,
          fillColor,
          cursor: 'pointer',
        });
        target.bringToFront();
        // Change cursor
        const container = target._map?.getContainer();
        if (container) {
          container.style.cursor = 'pointer';
        }
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(getFeatureStyle(feature));
        // Reset cursor
        const container = target._map?.getContainer();
        if (container) {
          container.style.cursor = '';
        }
      },
    });

    // Bind popup with beach information
    const popupContent = document.createElement('div');
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(popupContent);
      root.render(<BeachPopup beach={props} />);
    });

    layer.bindPopup(popupContent, {
      maxWidth: 400,
      className: 'beach-popup-container',
    });
  };

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={50}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
    >
      <GeoJSON
        data={filteredData}
        style={getFeatureStyle}
        onEachFeature={onEachFeature}
      />
    </MarkerClusterGroup>
  );
}
