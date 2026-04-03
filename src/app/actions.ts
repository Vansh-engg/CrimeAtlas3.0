"use server"

import { 
  getDashboardData, 
  getMapData, 
  getPredictData, 
  getCityTrendData, 
  getPoliceData,
  getSafetyData,
  getAllCities,
  getAvailableYears,
  MapMarker,
  PredictData,
  CityTrendData,
  PoliceStation
} from '@/lib/data';

export async function fetchDashboardData(city?: string, year?: number) {
  return getDashboardData(city, year);
}

export async function fetchAllCities() {
  return getAllCities();
}

export async function fetchAvailableYears() {
  return getAvailableYears();
}

export async function fetchMapData(): Promise<MapMarker[]> {
  return getMapData();
}

export async function fetchPredictData(city?: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, year: 2025, month: 1, crime: "all" })
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.warn("Flask Prediction API is not reachable, using internal fallback.");
  }
  return getPredictData(city);
}

export async function fetchCityData(city: string, year?: number, crimeType?: string): Promise<any> {
  return getCityTrendData(city, year, crimeType);
}

export async function fetchPoliceData(lat?: number, lng?: number): Promise<PoliceStation[]> {
  return getPoliceData(lat, lng);
}

export async function fetchSafetyData(city: string, year?: number) {
  return getSafetyData(city, year);
}
