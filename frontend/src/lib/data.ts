import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface CrimeRecord {
  year: number;
  month: number;
  city: string;
  state: string;
  crime_type: string;
  crime_counts: number;
  latitude: number;
  longitude: number;
}

export interface CityTrendData {
  name: string;
  crimes: number;
}

export interface PoliceStation {
  id: number;
  name: string;
  address: string;
  distance: string;
  phone: string;
  open: boolean;
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string | number;
  x: number;
  y: number;
  lat: number;
  lng: number;
  type: string;
  severity: string;
  details: string;
  description?: string;
  imageUrl?: string;
  trueHits?: number;
  falseHits?: number;
  allTypes?: string[];
  categoryCounts?: Record<string, number>;
  timestamp?: number;
  isLive?: boolean;
}

export interface PredictData {
  month: string;
  pred: number;
}

export interface ChartData {
  month: string;
  crimes: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

let cachedData: CrimeRecord[] | null = null;
let loadError: string | null = null;

export function getCrimeData(): CrimeRecord[] {
  if (cachedData) return cachedData;
  
  try {
    const filePath = path.join(process.cwd(), 'Data', 'india_city_crime_dataset_2015_2024_synthetic.csv');
    
    if (!fs.existsSync(filePath)) {
      loadError = `CSV file not found at: ${filePath}`;
      console.error(loadError);
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    if (!fileContent || fileContent.length === 0) {
      loadError = "CSV file is empty";
      console.error(loadError);
      return [];
    }
    
    const parsed = Papa.parse(fileContent, { header: true, dynamicTyping: true, skipEmptyLines: true });
    
    if (!parsed.data || parsed.data.length === 0) {
      loadError = "CSV parsed but contains no data";
      console.error(loadError);
      return [];
    }
    
    cachedData = parsed.data as CrimeRecord[];
    loadError = null;
    console.log(`Successfully loaded ${cachedData.length} crime records`);
    return cachedData;
  } catch (error) {
    loadError = `Error reading crime data CSV: ${error instanceof Error ? error.message : String(error)}`;
    console.error(loadError);
    return [];
  }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getAvailableYears() {
  const data = getCrimeData();
  return Array.from(new Set(data.map(d => d.year))).sort((a,b) => b - a);
}

export function getDashboardData(cityName?: string, year: number = 2024) {
  const data = getCrimeData();
  
  const filteredData = cityName && cityName !== "All Locations" 
    ? data.filter(d => d.city.toLowerCase() === cityName.toLowerCase()) 
    : data;

  const yearData = filteredData.filter(d => d.year === year);
  
  const trendMap = new Map<number, number>();
  let totalCrimes = 0;
  const categoryMap = new Map<string, number>();

  yearData.forEach(row => {
    trendMap.set(row.month, (trendMap.get(row.month) || 0) + row.crime_counts);
    totalCrimes += row.crime_counts;
    categoryMap.set(row.crime_type, (categoryMap.get(row.crime_type) || 0) + row.crime_counts);
  });

  const trendData = Array.from(trendMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, crimes]) => ({
      month: MONTH_NAMES[month - 1] || month.toString(),
      crimes
    }));

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const activeZones = new Set(yearData.map(d => d.city)).size;
  const categoryTotal = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);

  return {
    trendData,
    categoryData,
    categoryTotal,
    stats: {
      totalCrimes: totalCrimes.toLocaleString(),
      riskLevel: totalCrimes > 100000 ? "High" : totalCrimes > 50000 ? "Moderate" : "Low",
      mostCommon: categoryData.length > 0 ? categoryData[0].name : "Unknown",
      activeZones: activeZones.toString()
    }
  };
}

export function getAllCities() {
  const data = getCrimeData();
  return Array.from(new Set(data.map(d => d.city))).sort();
}

export function getCityTrendData(cityName: string, year: number = 2024, crimeType: string = "Total"): CityTrendData[] {
  const data = getCrimeData();
  const lowerCity = cityName.toLowerCase();
  let cityData = data.filter(d => d.city.toLowerCase() === lowerCity && d.year === year);
  
  if (crimeType !== "Total") {
     const normalizedType = crimeType.toLowerCase().replace(/ /g, '_');
     cityData = cityData.filter(d => d.crime_type.toLowerCase() === normalizedType);
  }

  const trendMap = new Map<number, number>();
  cityData.forEach((row) => {
    trendMap.set(row.month, (trendMap.get(row.month) || 0) + row.crime_counts);
  });
  
  return Array.from(trendMap.entries())
    .sort((a,b) => a[0] - b[0])
    .map(([month, crimes]) => ({
      name: MONTH_NAMES[month-1],
      crimes
    }));
}

export function getMapData() {
  const data = getCrimeData();
  const recentData = data.filter(d => d.year === 2024 && d.month === 12);
  
  const cityMap = new Map<string, { 
    id: string; 
    city: string; 
    state: string; 
    lat: number; 
    lng: number; 
    totalCrimes: number; 
    mainType: string; 
    maxCount: number;
    categoryCounts: Record<string, number>;
  }>();
  
  recentData.forEach(row => {
    if (!cityMap.has(row.city)) {
      cityMap.set(row.city, {
        id: row.city,
        city: row.city,
        state: row.state,
        lat: row.latitude,
        lng: row.longitude,
        totalCrimes: 0,
        maxCount: -1,
        mainType: '',
        categoryCounts: {}
      });
    }
    const city = cityMap.get(row.city)!;
    city.totalCrimes += row.crime_counts;
    const typeLabel = row.crime_type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    city.categoryCounts[typeLabel] = (city.categoryCounts[typeLabel] || 0) + row.crime_counts;
    
    if (row.crime_counts > city.maxCount) {
       city.maxCount = row.crime_counts;
       city.mainType = row.crime_type;
    }
  });

  return Array.from(cityMap.values()).map(city => {
    let severity = 'low';
    if (city.totalCrimes > 2000) severity = 'critical';
    else if (city.totalCrimes > 1000) severity = 'high';
    else if (city.totalCrimes > 500) severity = 'medium';
    
    return {
      id: city.city,
      x: 0, // Not used in Leaflet
      y: 0,
      lat: city.lat,
      lng: city.lng,
      type: city.mainType.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      severity: severity,
      details: `${city.city}, ${city.state}. Total recent reported crimes: ${city.totalCrimes}.`,
      allTypes: Object.keys(city.categoryCounts),
      categoryCounts: city.categoryCounts
    };
  });
}

export function getPredictData(cityName?: string) {
  const data = getCrimeData();
  const lowerCity = cityName?.toLowerCase();
  
  const filtered = lowerCity 
    ? data.filter(d => d.city.toLowerCase() === lowerCity)
    : data;

  const mapData = new Map<number, number>();
  const categoryMap = new Map<string, number>();
  
  filtered.filter(d => d.year === 2024).forEach(row => {
      mapData.set(row.month, (mapData.get(row.month) || 0) + row.crime_counts);
      categoryMap.set(row.crime_type, (categoryMap.get(row.crime_type) || 0) + row.crime_counts);
  });
  
  const futureData = [];
  const historicalAvg = Array.from(mapData.values()).reduce((a, b) => a + b, 0) / Math.max(1, mapData.size);
  
  for(let i=1; i<=6; i++) {
     const predicted = Math.floor(historicalAvg * (1 + (Math.random() * 0.2 - 0.1)));
     futureData.push({
         month: MONTH_NAMES[(11 + i) % 12],
         pred: predicted
     });
  }

  const likelyCrimes = Array.from(categoryMap.entries())
    .sort((a,b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  return { 
    futureData, 
    likelyCrimes: likelyCrimes.length > 0 ? likelyCrimes : ["Theft", "Robbery", "Cyber Crime"],
    avgCount: Math.round(historicalAvg)
  };
}

export function getPoliceData(userLat?: number, userLng?: number): PoliceStation[] {
  const data = getCrimeData();
  const cities = new Map<string, { city: string; lat: number; lng: number; state: string; distance?: number }>();
  
  data.forEach(row => {
    if (!cities.has(row.city)) {
       cities.set(row.city, { city: row.city, lat: row.latitude, lng: row.longitude, state: row.state });
    }
  });

  const cityArr = Array.from(cities.values());
  
  if (userLat && userLng) {
    cityArr.forEach(c => {
       c.distance = Math.sqrt(Math.pow(c.lat - userLat, 2) + Math.pow(c.lng - userLng, 2)) * 111;
    });
    cityArr.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  return cityArr.slice(0, 3).map((c, i) => ({
     id: i+1,
     name: `${c.city} Police Headquarters`,
     address: `Main District, ${c.state}`,
     distance: c.distance ? `${c.distance.toFixed(1)} km` : `${(Math.random() * 5 + 1).toFixed(1)} km`,
     phone: `100 / ${Math.floor(Math.random()*900+100)}-010${i}`,
     lat: c.lat,
     lng: c.lng,
     open: true
  }));
}

export function getSafetyData(cityName: string, year: number = 2024) {
  const data = getCrimeData();
  const lowerCity = cityName.toLowerCase();
  const cityData = data.filter(d => d.city.toLowerCase() === lowerCity && d.year === year);
  
  if (cityData.length === 0) return null;

  const total = cityData.reduce((acc, curr) => acc + curr.crime_counts, 0);
  const types = new Map<string, number>();
  cityData.forEach(d => {
    types.set(d.crime_type, (types.get(d.crime_type) || 0) + d.crime_counts);
  });

  const allCrimes = Array.from(types.entries())
    .sort((a,b) => b[1] - a[1])
    .map(([type, count]) => ({
       type: type.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
       count
    }));

  const score = Math.max(10, Math.min(95, 100 - (total / Math.max(1, cityData.length) * 5)));

  return {
    name: cityData[0].city,
    crimes: allCrimes,
    riskLevel: score < 40 ? "High" : score < 70 ? "Moderate" : "Low",
    score: Math.round(score),
    lat: cityData[0].latitude,
    lng: cityData[0].longitude
  };
}
