import { supabase } from './supabase';
import { Workspace } from '../types';

const CACHE_KEY = 'workspaces_cache';
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

interface CacheEntry {
  timestamp: number;
  data: Workspace[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Check if coordinates are within cached bounds with some padding
const isWithinBounds = (lat: number, lng: number, bounds: CacheEntry['bounds']) => {
  const padding = 0.02; // About 2km padding
  return (
    lat >= bounds.south - padding &&
    lat <= bounds.north + padding &&
    lng >= bounds.west - padding &&
    lng <= bounds.east + padding
  );
};

// Get cached workspaces if they exist and are still valid
const getCachedWorkspaces = (lat: number, lng: number): Workspace[] | null => {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  const entry: CacheEntry = JSON.parse(cached);
  const now = Date.now();

  if (now - entry.timestamp > CACHE_DURATION) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }

  if (!isWithinBounds(lat, lng, entry.bounds)) {
    return null;
  }

  return entry.data;
};

// Save workspaces to cache
const cacheWorkspaces = (workspaces: Workspace[], bounds: CacheEntry['bounds']) => {
  const entry: CacheEntry = {
    timestamp: Date.now(),
    data: workspaces,
    bounds
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
};

// Extract coordinates from PostGIS POINT string
const extractCoordinates = (pointString: string) => {
  // PostGIS POINT format is 'POINT(longitude latitude)'
  const matches = pointString.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (!matches) {
    throw new Error('Invalid PostGIS POINT format');
  }
  return {
    longitude: parseFloat(matches[1]),
    latitude: parseFloat(matches[2])
  };
};

export async function getNearbyWorkspaces(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
  forceRefresh: boolean = false
): Promise<Workspace[]> {
  // Check cache first unless force refresh is requested
  if (!forceRefresh) {
    const cached = getCachedWorkspaces(latitude, longitude);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase.rpc('get_nearby_workspaces', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm
    });

    if (error) throw error;

    // Transform PostGIS POINT to lat/lng object
    const workspaces = data.map((workspace: any) => {
      const location = extractCoordinates(workspace.location);
      return {
        ...workspace,
        location
      };
    });

    // Cache the results with the current viewport bounds
    const bounds = {
      north: latitude + (radiusKm / 111), // rough conversion from km to degrees
      south: latitude - (radiusKm / 111),
      east: longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
      west: longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180)))
    };
    cacheWorkspaces(workspaces, bounds);

    return workspaces;
  } catch (error) {
    console.error('Error fetching nearby workspaces:', error);
    throw error;
  }
}