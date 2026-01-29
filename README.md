# California Beach Management Interactive Map

An interactive web application displaying California beaches with management jurisdiction boundaries, managing entities, and contact information.

![Status](https://img.shields.io/badge/status-MVP%20Complete-success)
![React](https://img.shields.io/badge/react-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.9.3-blue)
![Leaflet](https://img.shields.io/badge/leaflet-1.9.4-green)

## Features

- 🗺️ **Interactive Map** - Leaflet-powered map centered on California coastline
- 🏖️ **Beach Boundaries** - Precise polygon boundaries for each beach management area
- 🎨 **Color-Coded** - Visual distinction by management type (State, County, City, Federal, Special District)
- 📋 **Detailed Information** - Click any beach to view managing entity and contact details
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🎯 **Legend** - Clear visual guide to management types

## Current Dataset

**8 Sample Beaches** representing different management types and regions:
- Santa Monica State Beach (State)
- Main Beach - Laguna Beach (City)
- La Jolla Shores (County)
- Crystal Cove State Park (State)
- Santa Cruz Main Beach (City)
- Carmel Beach (City)
- Baker Beach (Federal - NPS)
- Zuma Beach (County)

**Target:** 400+ beaches covering entire California coastline

## Technology Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Mapping Library:** Leaflet 1.9 + react-leaflet 4.2
- **Base Map Tiles:** OpenStreetMap (free, no API key required)
- **Data Format:** GeoJSON (FeatureCollection)
- **Architecture:** Static frontend-only (no backend required)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ca-beach-management

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5174/`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
ca-beach-management/
├── public/
│   └── beaches.geojson          # Beach data (GeoJSON format)
├── src/
│   ├── components/
│   │   └── Map/
│   │       ├── BeachMap.tsx     # Main map container
│   │       ├── BeachLayer.tsx   # GeoJSON layer with interactions
│   │       ├── BeachPopup.tsx   # Info popup component
│   │       └── Legend.tsx       # Management type legend
│   ├── types/
│   │   └── beach.types.ts       # TypeScript type definitions
│   ├── utils/
│   │   └── mapConfig.ts         # Map configuration & colors
│   ├── data/
│   │   └── beaches.geojson      # Beach data (source)
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Application entry point
└── package.json
```

## Adding More Beaches

### Data Collection Sources

1. **California State Parks GIS Portal**
   - https://data.ca.gov
   - Search: "state parks boundaries"

2. **California Coastal Commission**
   - https://www.coastal.ca.gov/access/
   - Beach access database with managing entities

3. **NOAA Digital Coast**
   - https://coast.noaa.gov/dataviewer/
   - Coastal boundaries and shoreline data

4. **County GIS Portals**
   - LA County: https://egis-lacounty.hub.arcgis.com/
   - San Diego: https://sdgis-sandag.opendata.arcgis.com/
   - Orange County: https://ocgis-ocpw.opendata.arcgis.com/

### Data Processing Workflow

1. **Download GIS Data** (Shapefiles, KML, or GeoJSON)
2. **Convert to GeoJSON** using QGIS (free tool):
   - Ensure WGS84 coordinate system (EPSG:4326)
   - Create polygon boundaries
   - Export as FeatureCollection
3. **Research Contact Info** from agency websites
4. **Add to beaches.geojson** following the structure below

### GeoJSON Structure

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-118.5006, 34.0195],
        [-118.4990, 34.0195],
        [-118.4990, 33.9920],
        [-118.5006, 33.9920],
        [-118.5006, 34.0195]
      ]
    ]
  },
  "properties": {
    "id": "unique-beach-id",
    "name": "Beach Name",
    "managementType": "state|county|city|federal|special-district",
    "managingEntity": "Managing Organization Name",
    "managerContact": {
      "department": "Department Name",
      "phone": "(123) 456-7890",
      "email": "contact@example.gov",
      "website": "https://www.example.gov",
      "address": "123 Main St, City, CA 12345"
    },
    "county": "County Name",
    "region": "north|central|south",
    "facilities": ["parking", "restrooms", "lifeguards"],
    "notes": "Additional information"
  }
}
```

## Color Scheme

| Management Type | Color | Hex Code |
|-----------------|-------|----------|
| State | Green | #2E7D32 |
| County | Blue | #1976D2 |
| City | Orange | #F57C00 |
| Federal | Purple | #7B1FA2 |
| Special District | Yellow | #FBC02D |

## Development Commands

```bash
npm run dev      # Start dev server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npx tsc --noEmit # Type check without building
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Considerations

Current MVP with 8 beaches has excellent performance. For larger datasets (400+ beaches):

- **Split by Region:** Divide GeoJSON into north/central/south
- **Simplify Geometries:** Reduce coordinate precision for faster rendering
- **Viewport Filtering:** Only render beaches in current map view
- **Code Splitting:** Lazy load regional data as needed

## Testing

See [TESTING.md](TESTING.md) for comprehensive test results and manual testing checklist.

## Contributing

When adding beaches:
1. Verify boundary accuracy against official sources
2. Include complete contact information with working links
3. Follow existing naming conventions
4. Test locally before committing

## Data Attribution

Beach data compiled from:
- California Coastal Commission
- California State Parks
- County GIS Portals
- NOAA Digital Coast

Base map tiles: © OpenStreetMap contributors

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.
