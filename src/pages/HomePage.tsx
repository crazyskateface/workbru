import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Coffee, Power, Users, Clock, Search, List, MapIcon, Filter, Star, MapPin, ChevronRight, Crosshair } from 'lucide-react';
import GoogleMapReact from 'google-map-react';
import { fetchNearbyWorkspaces } from '../lib/googlePlaces';
import { Workspace, FilterOptions, MapPosition } from '../types';

// Define default map options
const defaultMapOptions = {
  fullscreenControl: false,
  zoomControl: true,
  clickableIcons: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

interface MarkerProps {
  lat: number;
  lng: number;
  workspace: Workspace;
  isSelected: boolean;
  isCoffeeShop?: boolean;
  onClick?: () => void;
}

const Marker: React.FC<MarkerProps> = ({ workspace, isSelected, isCoffeeShop, onClick }) => (
  <div 
    className={`absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-300 ${isSelected ? 'z-10' : ''}`}
    onClick={onClick}
  >
    {isCoffeeShop ? (
      <img 
        src="/574fab03-08d5-4e82-bcc5-a23023adfed3.png" 
        alt="Coffee Shop"
        className={`w-10 h-12 transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
      />
    ) : (
      <>
        <div className={`flex items-center justify-center w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full shadow-lg ${isSelected ? 'bg-primary-700 dark:bg-primary-600 scale-110' : ''}`}>
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <div className="w-4 h-4 bg-primary-600 dark:bg-primary-500 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
      </>
    )}
    {isSelected && (
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64">
        <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden">
          {workspace.photos && workspace.photos.length > 0 && (
            <img 
              src={workspace.photos[0]} 
              alt={workspace.name} 
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{workspace.name}</h3>
              {workspace.attributes.rating && (
                <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                    {workspace.attributes.rating}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{workspace.address}</p>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {workspace.amenities.wifi && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  WiFi
                </span>
              )}
              {workspace.amenities.coffee && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                  <Coffee className="h-3 w-3 mr-1" />
                  Coffee
                </span>
              )}
              {workspace.attributes.openLate && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Open Late
                </span>
              )}
            </div>
            
            <Link
              to={`/workspace/${workspace.id}`}
              className="mt-3 flex items-center justify-center w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded transition-colors duration-200"
            >
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    )}
  </div>
);

const HomePage: React.FC = () => {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapPosition, setMapPosition] = useState<MapPosition>(() => {
    const saved = localStorage.getItem('mapPosition');
    return saved ? JSON.parse(saved) : {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 13
    };
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [filters, setFilters] = useState<FilterOptions>({
    wifi: false,
    coffee: false,
    outlets: false,
    seating: false,
    food: false,
    meetingRooms: false,
    openLate: false,
  });

  const mapRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);

  // Get user's location on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          
          // Only set map position if there's no saved position
          if (!localStorage.getItem('mapPosition')) {
            setMapPosition({
              center: location,
              zoom: 13
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Load workspaces based on map position
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const spaces = await fetchNearbyWorkspaces(
          mapPosition.center.lat,
          mapPosition.center.lng,
          5000 // 5km radius
        );
        setWorkspaces(spaces);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, [mapPosition.center]);

  // Save map position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mapPosition', JSON.stringify(mapPosition));
  }, [mapPosition]);

  // Reset selected workspace when view changes
  useEffect(() => {
    setSelectedWorkspace(null);
  }, [view]);

  const filteredWorkspaces = workspaces.filter(workspace => {
    if (searchQuery && !workspace.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filters.wifi && !workspace.amenities.wifi) return false;
    if (filters.coffee && !workspace.amenities.coffee) return false;
    if (filters.outlets && !workspace.amenities.outlets) return false;
    if (filters.seating && !workspace.amenities.seating) return false;
    if (filters.food && !workspace.amenities.food) return false;
    if (filters.meetingRooms && !workspace.amenities.meetingRooms) return false;
    if (filters.openLate && !workspace.attributes.openLate) return false;
    return true;
  });

  const handleGoogleMapError = (error: Error) => {
    console.error('Google Maps Error:', error);
    setMapError('Failed to load Google Maps. Please check your API key configuration.');
    setMapReady(false);
  };

  const handleApiLoaded = ({ map, maps }: { map: any; maps: any }) => {
    mapRef.current = map;
    mapsRef.current = maps;
    setMapReady(true);

    // Add bounds_changed event listener
    map.addListener('bounds_changed', () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      setMapPosition({
        center: { lat: center.lat(), lng: center.lng() },
        zoom
      });
    });
  };

  const handleMarkerClick = (workspaceId: string) => {
    if (!mapReady) return;
    
    setSelectedWorkspace(workspaceId);
    
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace?.location && mapRef.current && mapsRef.current) {
      // Create a new LatLng object
      const position = new mapsRef.current.LatLng(
        workspace.location.latitude,
        workspace.location.longitude
      );

      // Pan to the marker position
      mapRef.current.panTo(position);
      
      // Zoom in slightly
      mapRef.current.setZoom(15);
    }
  };

  const handleGoToUserLocation = () => {
    if (!userLocation || !mapRef.current) return;
    
    mapRef.current.panTo(userLocation);
    mapRef.current.setZoom(14);
  };

  const renderMap = () => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-dark-input">
          <p className="text-red-600 dark:text-red-400">Google Maps API key is missing.</p>
        </div>
      );
    }

    return (
      <GoogleMapReact
        key={view} // Add key prop to force remount when view changes
        bootstrapURLKeys={{ 
          key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          libraries: ['places']
        }}
        center={mapPosition.center}
        zoom={mapPosition.zoom}
        onError={handleGoogleMapError}
        options={defaultMapOptions}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={handleApiLoaded}
      >
        {mapReady && filteredWorkspaces
          .filter(workspace => 
            workspace.location && 
            typeof workspace.location.latitude === 'number' && 
            typeof workspace.location.longitude === 'number' && 
            !isNaN(workspace.location.latitude) && 
            !isNaN(workspace.location.longitude)
          )
          .map((workspace) => (
            <Marker
              key={workspace.id}
              lat={workspace.location.latitude}
              lng={workspace.location.longitude}
              workspace={workspace}
              isSelected={workspace.id === selectedWorkspace}
              isCoffeeShop={workspace.amenities.coffee}
              onClick={() => handleMarkerClick(workspace.id!)}
            />
          ))}
      </GoogleMapReact>
    );
  };

  return (
    <div className="h-screen flex flex-col relative">
      {/* Search bar and view toggles - Always visible */}
      <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border py-2 px-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow max-w-2xl">
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 ${
              showFilters 
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                : 'bg-white dark:bg-dark-input hover:bg-gray-50 dark:hover:bg-dark-border text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>

          {userLocation && (
            <button
              onClick={handleGoToUserLocation}
              className="px-4 py-2 bg-white dark:bg-dark-input hover:bg-gray-50 dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center gap-2"
              title="Go to my location"
            >
              <Crosshair className="h-5 w-5" />
              <span className="hidden sm:inline">My Location</span>
            </button>
          )}
          
          <div className="flex rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 flex items-center ${
                view === 'map'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-white dark:bg-dark-input text-gray-500 dark:text-gray-400'
              }`}
            >
              <MapIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 flex items-center ${
                view === 'list'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'bg-white dark:bg-dark-input text-gray-500 dark:text-gray-400'
              }`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              const Icon = {
                wifi: Wifi,
                coffee: Coffee,
                outlets: Power,
                seating: Users,
                food: Coffee,
                meetingRooms: Users,
                openLate: Clock
              }[key];
              
              return (
                <button
                  key={key}
                  onClick={() => setFilters(f => ({ ...f, [key]: !f[key as keyof FilterOptions] }))}
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors duration-200 ${
                    value
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800'
                      : 'bg-white dark:bg-dark-input text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 mr-1.5" />}
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Map view */}
      {view === 'map' ? (
        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-dark-input">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : mapError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-dark-input">
              <p className="text-red-600 dark:text-red-400">{mapError}</p>
            </div>
          ) : (
            <div className="absolute inset-0">
              {renderMap()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  to={`/workspace/${workspace.id}`}
                  className="bg-white dark:bg-dark-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="relative h-48">
                    <img
                      src={workspace.photos?.[0] || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'}
                      alt={workspace.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                    {workspace.attributes.rating && (
                      <div className="absolute top-4 right-4 bg-white dark:bg-dark-card rounded-full px-2 py-1 flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{workspace.attributes.rating}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{workspace.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{workspace.address}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {workspace.amenities.wifi && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                          <Wifi className="h-4 w-4 mr-1" />
                          WiFi
                        </span>
                      )}
                      {workspace.amenities.coffee && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                          <Coffee className="h-4 w-4 mr-1" />
                          Coffee
                        </span>
                      )}
                      {workspace.attributes.openLate && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Open Late
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;