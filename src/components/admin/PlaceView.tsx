import { useParams, Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaceById, deletePlace } from '../../services/workbru-backend';

const PlaceView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: place, isLoading, error } = useQuery({
        queryKey: ['place', id],
        queryFn: () => getPlaceById(id as string),
        enabled: !!id
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-places']});
            navigate('/admin/places');
        }
    });

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this place?')) {
            deleteMutation.mutate(id as string);
        }
    }

    if (isLoading) {
        return <div>Loading place details...</div>
    }

    if (error) {
        return <div>Error loading place: {error instanceof Error? error.message: 'Unknown error'}</div>
    }

    if (!place) {
        return <div>Place not found</div>
    }

    
    return (
        <div className="place-view">
            <div className="view-header">
                <h2>{place.name}</h2>
                <div className="action-buttons">
                    <Link to={`/admin/places/${id}/edit`} className="btn btn-primary">Edit</Link>
                    <button 
                        className="btn btn-danger"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Deleting...': 'Delete'}
                    </button>
                </div>
            </div>

            <div className="place-details">
                <div className="detail-section">
                    <h3>Basic Information</h3>
                    <div className="detail-item">
                        <span className="label">Address:</span>
                        <span className="value">{place.address}</span>
                    </div>
                    {place.description && (
                        <div className="detail-item">
                            <span className="label">Description:</span>
                            <span className="value">{place.description}</span>
                        </div>
                    )}
                </div>
                
                <div className="detail-section">
                    <h3>Location</h3>
                    <div className="detail-item">
                        <span className="label">Coordinates:</span>
                        <span className="value">
                            {place.location.latitude}, {place.location.longitude}
                        </span>
                    </div>
                </div>
                
                <div className="detail-section">
                    <h3>Amenities</h3>
                    <ul className="amenities-list">
                        {Object.entries(place.amenities).map(([key, value]) => (
                            <li key={key} className={value ? 'available' : 'unavailable'}>
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: 
                                {value ? ' Available' : ' Not Available'}
                            </li>
                        ))}
                    </ul>
                </div>
                
                <div className="detail-section">
                    <h3>Attributes</h3>
                    <ul className="attributes-list">
                        {place.attributes.parking && (
                            <li>
                                <span className="label">Parking:</span>
                                <span className="value">
                                    {place.attributes.parking.charAt(0).toUpperCase() + place.attributes.parking.slice(1)}
                                </span>
                            </li>
                        )}
                        {place.attributes.capacity && (
                            <li>
                                <span className="label">Capacity:</span>
                                <span className="value">
                                    {place.attributes.capacity.charAt(0).toUpperCase() + 
                                     place.attributes.capacity.slice(1).replace('-', ' ')}
                                </span>
                            </li>
                        )}
                        <li>
                            <span className="label">Noise Level:</span>
                            <span className="value">
                                {place.attributes.noiseLevel.charAt(0).toUpperCase() + place.attributes.noiseLevel.slice(1)}
                            </span>
                        </li>
                        {place.attributes.seatingComfort && (
                            <li>
                                <span className="label">Seating Comfort:</span>
                                <span className="value">{place.attributes.seatingComfort}/5</span>
                            </li>
                        )}
                        {place.attributes.coffeeRating && (
                            <li>
                                <span className="label">Coffee Rating:</span>
                                <span className="value">{place.attributes.coffeeRating}/5</span>
                            </li>
                        )}
                        <li>
                            <span className="label">Open Late:</span>
                            <span className="value">{place.attributes.openLate ? 'Yes' : 'No'}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default PlaceView;