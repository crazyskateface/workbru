export interface Workspace {
  id?: string;
  name: string;
  description?: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  geohash?: string;
  geohashPrefix?: string;
  distance?: number;
  amenities: {
    wifi: boolean;
    coffee: boolean;
    outlets: boolean;
    seating: boolean;
    food: boolean;
    meetingRooms: boolean;
  };
  attributes: {
    parking: 'none' | 'street' | 'lot';
    capacity?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large';
    noiseLevel?: 'quiet' | 'moderate' | 'loud';
    seatingComfort?: number; // 1-5
    rating?: number; // 0-5
    openLate: boolean;
    coffeeRating?: number; // 1-5
  };
  openingHours?: {
    day: string;
    open: string;
    close: string;
  }[];
  photos?: string[];
  googlePlaceId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isPublic: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'user' | 'admin';
  favorites?: string[];
  createdAt?: string;
  lastLogin?: string;
}

export interface FilterOptions {
  wifi?: boolean;
  coffee?: boolean;
  outlets?: boolean;
  seating?: boolean;
  food?: boolean;
  meetingRooms?: boolean;
  openLate?: boolean;
  parking?: 'any' | 'street' | 'lot';
  noiseLevel?: 'quiet' | 'moderate' | 'loud';
  minRating?: number;
  minCoffeeRating?: number;
  maxDistance?: number;
}

export interface MapPosition {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
}