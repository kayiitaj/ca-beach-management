import { Feature, Polygon, FeatureCollection } from 'geojson';
import { readGeoJSON } from '../utils/geojsonUtils.js';
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
  managementType?: 'state' | 'county' | 'city' | 'special-district' | 'federal';
  accountableEntity?: string;
  managingEntity?: string;
  managerContact?: {
    department?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  researchPriority?: number;
  [key: string]: any;
}

interface ValidationResult {
  beachId: string;
  beachName: string;
  errors: string[];
  warnings: string[];
}

function validateBeachData(beach: Feature<Polygon, BeachProperties>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const props = beach.properties;

  // Required fields
  if (!props.id) errors.push('Missing ID');
  if (!props.name) errors.push('Missing name');
  if (!props.county) errors.push('Missing county');
  if (!props.region) errors.push('Missing region');
  if (!props.dataStatus) errors.push('Missing dataStatus');
  if (!props.lastUpdated) errors.push('Missing lastUpdated');

  // Coordinate validation
  if (props.coordinates) {
    const { latitude, longitude } = props.coordinates;
    if (latitude < 32 || latitude > 42) {
      errors.push(`Latitude ${latitude} out of California range (32-42°N)`);
    }
    if (longitude < -125 || longitude > -114) {
      errors.push(`Longitude ${longitude} out of California range (-125 to -114°W)`);
    }
  } else {
    errors.push('Missing coordinates');
  }

  // Geometry validation
  if (!beach.geometry || beach.geometry.type !== 'Polygon') {
    errors.push('Invalid or missing polygon geometry');
  }

  // Region validation
  if (props.region && !['north', 'central', 'south'].includes(props.region)) {
    errors.push(`Invalid region: ${props.region}`);
  }

  // Data completeness for priority beaches
  if (props.researchPriority && props.researchPriority <= 50) {
    if (props.dataStatus === 'api-only') {
      warnings.push('Priority beach still marked as api-only (should be researched)');
    }

    if (!props.managementType) {
      warnings.push('Priority beach missing managementType');
    }

    if (!props.accountableEntity) {
      warnings.push('Priority beach missing accountableEntity');
    }

    if (!props.managingEntity) {
      warnings.push('Priority beach missing managingEntity');
    }

    if (!props.managerContact || !props.managerContact.phone) {
      warnings.push('Priority beach missing contact phone');
    }

    if (!props.managerContact || !props.managerContact.website) {
      warnings.push('Priority beach missing contact website');
    }
  }

  // Data status consistency
  if (props.dataStatus === 'complete') {
    if (!props.managementType) {
      errors.push('Beach marked complete but missing managementType');
    }
    if (!props.accountableEntity) {
      errors.push('Beach marked complete but missing accountableEntity');
    }
    if (!props.managingEntity) {
      errors.push('Beach marked complete but missing managingEntity');
    }
  }

  return {
    beachId: props.id,
    beachName: props.name,
    errors,
    warnings,
  };
}

async function validateData() {
  console.log('Validating beach data...\n');

  try {
    const inputPath = path.join(__dirname, '../../public/beaches.geojson');
    const beachData: FeatureCollection<Polygon, BeachProperties> = await readGeoJSON(inputPath);

    console.log(`✓ Loaded ${beachData.features.length} beaches\n`);

    const results = beachData.features.map(validateBeachData);

    const beachesWithErrors = results.filter((r) => r.errors.length > 0);
    const beachesWithWarnings = results.filter((r) => r.warnings.length > 0);

    console.log('VALIDATION RESULTS');
    console.log('==================\n');

    if (beachesWithErrors.length === 0) {
      console.log('✓ No errors found!');
    } else {
      console.log(`✗ Found ${beachesWithErrors.length} beaches with errors:\n`);
      beachesWithErrors.forEach((result) => {
        console.log(`${result.beachName} (${result.beachId}):`);
        result.errors.forEach((error) => console.log(`  ERROR: ${error}`));
        console.log('');
      });
    }

    if (beachesWithWarnings.length === 0) {
      console.log('\n✓ No warnings!');
    } else {
      console.log(`\n⚠ Found ${beachesWithWarnings.length} beaches with warnings:\n`);
      beachesWithWarnings.slice(0, 10).forEach((result) => {
        console.log(`${result.beachName} (${result.beachId}):`);
        result.warnings.forEach((warning) => console.log(`  WARNING: ${warning}`));
        console.log('');
      });

      if (beachesWithWarnings.length > 10) {
        console.log(`... and ${beachesWithWarnings.length - 10} more beaches with warnings\n`);
      }
    }

    // Summary statistics
    console.log('\nSUMMARY');
    console.log('=======');
    console.log(`Total beaches: ${beachData.features.length}`);
    console.log(`Beaches with errors: ${beachesWithErrors.length}`);
    console.log(`Beaches with warnings: ${beachesWithWarnings.length}`);
    console.log(`Valid beaches: ${results.length - beachesWithErrors.length}`);

    // Data completeness stats
    const stats = {
      complete: beachData.features.filter((f) => f.properties.dataStatus === 'complete').length,
      partial: beachData.features.filter((f) => f.properties.dataStatus === 'partial').length,
      apiOnly: beachData.features.filter((f) => f.properties.dataStatus === 'api-only').length,
    };

    console.log('\nData completeness:');
    console.log(`  Complete: ${stats.complete}`);
    console.log(`  Partial: ${stats.partial}`);
    console.log(`  API only: ${stats.apiOnly}`);

    // Exit with error code if there are errors
    if (beachesWithErrors.length > 0) {
      console.log('\n✗ Validation failed');
      process.exit(1);
    } else {
      console.log('\n✓ Validation passed');
    }

  } catch (error) {
    console.error('Failed to validate data:', error);
    throw error;
  }
}

validateData();
