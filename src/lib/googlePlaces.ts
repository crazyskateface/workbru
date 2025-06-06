import { supabase } from './supabase';
import { Workspace } from '../types';

// Mock data for development
const mockWorkspaces: Workspace[] = [
  {
    id: '1',
    name: 'Urban Brew',
    description: 'Trendy coffee shop with fast WiFi and plenty of outlets.',
    address: '123 Main St, San Francisco, CA 94105',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    amenities: {
      wifi: true,
      coffee: true,
      outlets: true,
      seating: true,
      food: true,
      meetingRooms: false,
    },
    attributes: {
      parking: 'street',
      capacity: 'medium',
      noiseLevel: 'moderate',
      seatingComfort: 4,
      rating: 4.5,
      openLate: true,
      coffeeRating: 5,
    },
    openingHours: [
      { day: 'Monday', open: '07:00', close: '22:00' },
      { day: 'Tuesday', open: '07:00', close: '22:00' },
      { day: 'Wednesday', open: '07:00', close: '22:00' },
      { day: 'Thursday', open: '07:00', close: '22:00' },
      { day: 'Friday', open: '07:00', close: '23:00' },
      { day: 'Saturday', open: '08:00', close: '23:00' },
      { day: 'Sunday', open: '08:00', close: '21:00' },
    ],
    photos: [
      'https://images.pexels.com/photos/1813466/pexels-photo-1813466.jpeg',
      'https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg',
    ],
    isPublic: true,
  },
  {
    id: '2',
    name: 'The Productive Space',
    description: 'Modern coworking space with private meeting rooms and ergonomic furniture.',
    address: '456 Market St, San Francisco, CA 94105',
    location: {
      latitude: 37.7739,
      longitude: -122.4312,
    },
    amenities: {
      wifi: true,
      coffee: true,
      outlets: true,
      seating: true,
      food: false,
      meetingRooms: true,
    },
    attributes: {
      parking: 'lot',
      capacity: 'large',
      noiseLevel: 'quiet',
      seatingComfort: 5,
      rating: 4.8,
      openLate: false,
      coffeeRating: 3,
    },
    openingHours: [
      { day: 'Monday', open: '08:00', close: '20:00' },
      { day: 'Tuesday', open: '08:00', close: '20:00' },
      { day: 'Wednesday', open: '08:00', close: '20:00' },
      { day: 'Thursday', open: '08:00', close: '20:00' },
      { day: 'Friday', open: '08:00', close: '18:00' },
      { day: 'Saturday', open: '09:00', close: '16:00' },
      { day: 'Sunday', open: 'Closed', close: 'Closed' },
    ],
    photos: [
      'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg',
      'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
    ],
    isPublic: true,
  },
  {
    id: '3',
    name: 'Library Lounge',
    description: 'Quiet study space with free WiFi and comfortable seating.',
    address: '789 Howard St, San Francisco, CA 94105',
    location: {
      latitude: 37.7835,
      longitude: -122.4246,
    },
    amenities: {
      wifi: true,
      coffee: false,
      outlets: true,
      seating: true,
      food: false,
      meetingRooms: false,
    },
    attributes: {
      parking: 'street',
      capacity: 'medium',
      noiseLevel: 'quiet',
      seatingComfort: 3,
      rating: 4.0,
      openLate: false,
      coffeeRating: 0,
    },
    openingHours: [
      { day: 'Monday', open: '09:00', close: '18:00' },
      { day: 'Tuesday', open: '09:00', close: '18:00' },
      { day: 'Wednesday', open: '09:00', close: '18:00' },
      { day: 'Thursday', open: '09:00', close: '18:00' },
      { day: 'Friday', open: '09:00', close: '18:00' },
      { day: 'Saturday', open: '10:00', close: '16:00' },
      { day: 'Sunday', open: 'Closed', close: 'Closed' },
    ],
    photos: [
      'https://images.pexels.com/photos/3075517/pexels-photo-3075517.jpeg',
    ],
    isPublic: true,
  }
];

export async function fetchNearbyWorkspaces(
  latitude: number,
  longitude: number,
  radius: number = 5000
): Promise<Workspace[]> {
  try {
    const { data, error } = await supabase.rpc('get_nearby_workspaces', {
      lat: latitude,
      lng: longitude,
      radius_km: radius / 1000
    });

    if (error) throw error;

    // Transform location data from GeoJSON to our format
    return data.map((workspace: any) => ({
      ...workspace,
      location: {
        latitude: workspace.location.coordinates[1],
        longitude: workspace.location.coordinates[0]
      }
    }));
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return mockWorkspaces;
  }
}

export async function fetchWorkspaceDetails(id: string): Promise<Workspace | null> {
  try {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Parse location from GeoJSON format
    const locationObj = JSON.parse(data.location);
    return {
      ...data,
      location: {
        latitude: locationObj.coordinates[1],
        longitude: locationObj.coordinates[0]
      }
    };
  } catch (error) {
    console.error('Error fetching workspace details:', error);
    return mockWorkspaces.find(w => w.id === id) || null;
  }
}

export async function searchWorkspaces(query: string): Promise<Workspace[]> {
  // In a real app, this would search using the Google Places API
  // For MVP, filter mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const results = mockWorkspaces.filter(w => 
        w.name.toLowerCase().includes(query.toLowerCase()) || 
        w.description?.toLowerCase().includes(query.toLowerCase())
      );
      resolve(results);
    }, 300);
  });
}