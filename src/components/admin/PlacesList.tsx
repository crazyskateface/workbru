import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getAllPlaces, deletePlace } from '../../services/workbru-backend';
import { Place } from '../../models/place';

const PlacesList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data: places, isLoading, error } = useQuery({
        queryKey: ['admin-places'],
        queryFn: getAllPlaces
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-places'] });
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this place?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredPlaces = places?.filter(place => 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="places-list">
            <div className="list-header">
                <h2>Places</h2>
                <Link to="/admin/places/new" className="btn btn-primary">Add new Place</Link>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search places..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <p>Loading places...</p>
            ) : error ? (
                <p>Error loading places: {error instanceof Error ? error.message: 'Unknown error'}</p>
            ) : (

            
            <table className="places-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Wi-Fi</th>
                        <th>Coffee</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPlaces?.length ? (
                        filteredPlaces.map((place) => (
                            <tr key={place.id}>
                                <td>{place.name}</td>
                                <td>{place.address}</td>
                                <td>{place.amenities.wifi ? 'Yes':'No'}</td>
                                <td>{place.amenities.coffee ? 'Yes' : 'No'}</td>
                                <td>
                                    <div className="action-buttons">
                                        <Link to={`/admin/places/${place.id}`} className="btn btn-sm">View</Link>
                                        <Link to={`/admin/palces/${place.id}/edit`} className="btn btn-sm">Edit</Link>
                                        <button 
                                            className="btn btn-sm btn-danger"
                                            onClick={() => place.id && handleDelete(place.id)}
                                            disabled={deleteMutation.isPending}
                                        >
                                            {deleteMutation.isPending ? 'Deleting...': 'Delete'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5}>No places found</td>
                        </tr>
                    )}
                </tbody>
            </table>
            )}

        </div>
    );
};

export default PlacesList;