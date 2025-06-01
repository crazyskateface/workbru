import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Wifi, Coffee, Clock, ChevronRight, X } from 'lucide-react';
import { Workspace } from '../../types';

interface MarkerProps {
  lat: number;
  lng: number;
  workspace: Workspace;
  isSelected: boolean;
  onClick: () => void;
  onClose: () => void;
}

const Marker: React.FC<MarkerProps> = ({ workspace, isSelected, onClick, onClose }) => {
  const getMarkerImage = () => {
    // Check if it's a library first
    if (workspace.amenities.wifi && !workspace.amenities.coffee) {
      return "/marker-book.png";
    }
    // Then check if it's a coffee shop
    if (workspace.amenities.coffee) {
      return "/marker-coffee.png";
    }
    // Default workspace marker
    return "/marker-coffee.png";
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marker click when clicking info window
  };

  return (
    <div 
      className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-full transition-transform duration-200 ${isSelected ? 'z-10 scale-110' : ''}`}
      onClick={onClick}
    >
      <img 
        src={getMarkerImage()}
        alt={workspace.name}
        className="w-10 h-12"
      />
      {isSelected && (
        <div 
          className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-64"
          onClick={handleInfoClick}
        >
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={onClose}
                className="p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
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
};

export default Marker;