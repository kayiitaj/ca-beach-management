import { readJSON, writeJSON } from '../utils/geojsonUtils';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BeachScore {
  id: string;
  name: string;
  county: string;
  region: string;
  score: number;
}

interface ResearchedBeach {
  id: string;
  managementType: 'state' | 'county' | 'city' | 'federal' | 'special-district';
  accountableEntity: string;
  managingEntity: string;
  contractedManager?: string;
  lifeguardService?: string;
  managerContact: {
    department: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  dataStatus: 'complete' | 'partial';
  notes?: string;
}

function inferManagementFromName(name: string, county: string): Partial<ResearchedBeach> {
  const nameLower = name.toLowerCase();

  // State Parks/Beaches
  if (nameLower.includes('state beach') || nameLower.includes('state park')) {
    return {
      managementType: 'state',
      accountableEntity: 'State of California',
      managingEntity: 'California State Parks',
      lifeguardService: 'California State Parks Lifeguards',
      managerContact: {
        department: 'State Parks District Office',
        website: 'https://www.parks.ca.gov',
      },
      dataStatus: 'partial',
    };
  }

  // Federal (National Parks, Presidio, Golden Gate NRA)
  if (
    nameLower.includes('national') ||
    nameLower.includes('presidio') ||
    nameLower.includes('golden gate') ||
    nameLower.includes('angel island')
  ) {
    return {
      managementType: 'federal',
      accountableEntity: 'U.S. Federal Government',
      managingEntity: 'National Park Service',
      lifeguardService: 'National Park Service Rangers',
      managerContact: {
        department: 'Golden Gate National Recreation Area',
        phone: '(415) 561-4700',
        website: 'https://www.nps.gov/goga',
      },
      dataStatus: 'partial',
    };
  }

  // City/Municipal
  if (
    nameLower.includes('municipal') ||
    nameLower.includes('city beach') ||
    nameLower.includes('wharf') ||
    nameLower.includes('pier') ||
    nameLower.includes('embarcadero') ||
    nameLower.includes('main beach')
  ) {
    const cityName = getCityFromCounty(county);
    return {
      managementType: 'city',
      accountableEntity: `City of ${cityName}`,
      managingEntity: `${cityName} Parks & Recreation`,
      lifeguardService: `${cityName} Lifeguard Services`,
      managerContact: {
        department: 'Parks and Recreation Department',
        website: `https://www.${cityName.toLowerCase().replace(/\s+/g, '')}.gov`,
      },
      dataStatus: 'partial',
    };
  }

  // County (default for unmatched)
  return {
    managementType: 'county',
    accountableEntity: `County of ${county}`,
    managingEntity: `${county} County Parks and Recreation`,
    lifeguardService: `${county} County Lifeguards`,
    managerContact: {
      department: 'Department of Parks and Recreation',
      website: `https://www.${county.toLowerCase().replace(/\s+/g, '')}county.gov`,
    },
    dataStatus: 'partial',
  };
}

function getCityFromCounty(county: string): string {
  const cityMap: Record<string, string> = {
    'San Francisco': 'San Francisco',
    'Santa Cruz': 'Santa Cruz',
    'Monterey': 'Monterey',
    'San Diego': 'San Diego',
    'Los Angeles': 'Los Angeles',
    'Orange': 'Newport Beach',
    'Santa Barbara': 'Santa Barbara',
    'Ventura': 'Ventura',
    'San Mateo': 'Pacifica',
    'Marin': 'Sausalito',
    'Sonoma': 'Bodega Bay',
    'Mendocino': 'Mendocino',
    'Humboldt': 'Eureka',
  };

  return cityMap[county] || county;
}

async function autoResearch() {
  console.log('Auto-researching top 50 beaches using heuristics...\n');

  const top50Path = path.join(__dirname, 'top50beaches.json');
  const top50: BeachScore[] = await readJSON(top50Path);

  console.log(`✓ Loaded ${top50.length} priority beaches\n`);

  const researched: ResearchedBeach[] = top50.map((beach) => {
    const inferred = inferManagementFromName(beach.name, beach.county);

    const result: ResearchedBeach = {
      id: beach.id,
      managementType: inferred.managementType!,
      accountableEntity: inferred.accountableEntity!,
      managingEntity: inferred.managingEntity!,
      lifeguardService: inferred.lifeguardService,
      contractedManager: inferred.contractedManager,
      managerContact: inferred.managerContact!,
      dataStatus: 'partial',
      notes: 'Auto-generated management data based on naming heuristics. Manual verification recommended.',
    };

    console.log(`✓ ${beach.name} → ${inferred.managementType}`);

    return result;
  });

  const outputPath = path.join(__dirname, 'researched-beaches.json');
  await writeJSON(outputPath, researched);

  console.log(`\n✓ Saved ${researched.length} researched beaches to ${outputPath}`);

  // Summary
  const typeCount = researched.reduce((acc, b) => {
    acc[b.managementType] = (acc[b.managementType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nManagement type distribution:');
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
}

autoResearch();
