import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlaceById, createPlace, updatePlace } from '../../services/workbru-backend';
import { Place, PlaceSchema } from '../../models/place';
import { z } from 'zod';

const PlaceEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEditMode = !!id; // Check if we are in edit mode based on the presence of an ID

    //initial form state
    const [formData, setFormData] = useState<Partial<Place>>({
        name: '',
        description: '',
        address: '',
        location: {
            latitude: 0,
            longitude: 0,
        },
        amenities: {
            wifi: false,
            coffee: false,
            food: false,
            outlets: false,
            seating: false,
            meetingRooms: false
        },
        attributes: {
            parking: 'none',
            noiseLevel: 'moderate',
            capacity: 'small',
            seatingComfort: 3,
            openLate: false,
            coffeeRating: 3
        }
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    //fetch existing place data if in edit mode
    const {data: placeData, isLoading: isLoadingPlace } = useQuery({
        queryKey: ['place', id],
        queryFn: () => getPlaceById(id as string),
        enabled: isEditMode
    })

    //update form data when place data is loaded
    useEffect(() => {
        if (placeData) {
            setFormData(placeData)
        }
    }, [placeData]);

    //create mutation
    const createMutation = useMutation({
        mutationFn: createPlace,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-places']});
            navigate('/admin/places');
        }
    });

    //update mutation
    const updateMutation = useMutation({
        mutationFn: (data: Partial<Place>) => updatePlace(id as string, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-places']});
            queryClient.invalidateQueries({ queryKey: ['place', id]});
            navigate('/admin/places');
        }
    });

    //handle change for form inputs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const isNumber = type === 'number';
        
        // Convert value based on input type
        const processedValue = isCheckbox 
            ? (e.target as HTMLInputElement).checked 
            : isNumber 
                ? parseFloat(value) 
                : value;
        
        setFormData(prev => {
            // For nested properties (e.g., "location.latitude")
            if (name.includes('.')) {
                const [parent, child] = name.split('.');
                const parentKey = parent as keyof typeof prev;
                
                return {
                    ...prev,
                    [parent]: {
                        ...(prev[parentKey] as Record<string, any> || {}),
                        [child]: processedValue
                    }
                };
            }
            
            // For top-level properties
            return {
                ...prev,
                [name]: processedValue
            };
        });
    };

    //validate form data
    const validateForm = () => {
        try {   
            // use Zod to validate, but exclude if for new places
            if (isEditMode) {
                PlaceSchema.parse(formData)
            } else {
                PlaceSchema.omit({ id: true }).parse(formData);
            }
            setErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: Record<string, string> = {};
                error.errors.forEach(err => {
                    const path = err.path.join('.');
                    newErrors[path] = err.message;
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    //handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        if (isEditMode) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData as Omit<Place, 'id'>);
        }
    };

    if (isEditMode && isLoadingPlace) {
        return <div>Loading place data...</div>
    }

    return (
        <div className="place-form-container">
            <h2>{isEditMode ? 'Edit Place' : 'Add New Place'}</h2>

            <form onSubmit={handleSubmit} className="place-form">
                <div className="form-section">
                    <h3>Place Information</h3>

                    <div className="form-group">
                        <label htmlFor="name">Name*</label>
                        <input 
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleChange}
                            required 
                        />
                        {errors.name && <div className="error">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea 
                            id="description"
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address*</label>
                        <input 
                            id="address"
                            name="address"
                            type="text"
                            value={formData.address || ''}
                            onChange={handleChange}
                            required 
                        />
                        {errors.address && <div className="error">{errors.address}</div>}
                    </div>
                </div>

                <div className="form-section">
                    <h3>Location</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="location.latitude">Latitude*</label>
                            <input 
                                id="location.latitude"
                                name="location.latitude"
                                type="number"
                                step="any"
                                value={formData.location?.latitude || 0}
                                onChange={handleChange}
                                required 
                            />
                            {errors['location.latitude'] && <div className="error">{errors['location.latitude']}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="location.longitude">Longitude*</label>
                            <input 
                                id="location.longitude"
                                name="location.longitude"
                                type="number"
                                step="any"
                                value={formData.location?.longitude || 0}
                                onChange={handleChange}
                                required 
                            />
                            {errors['location.longitude'] && <div className="error">{errors['location.longitude']}</div>}
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Amenities</h3>

                    <div className="form-row checkbox-group">
                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.wifi"
                                    checked={formData.amenities?.wifi || false}
                                    onChange={handleChange}
                                />
                                Wi-Fi
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.coffee"
                                    checked={formData.amenities?.coffee || false}
                                    onChange={handleChange}
                                />
                                Coffee
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.outlets"
                                    checked={formData.amenities?.outlets || false}
                                    onChange={handleChange}
                                />
                                Outlets
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.seating"
                                    checked={formData.amenities?.seating || false }
                                    onChange={handleChange}
                                />
                                Seating
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.food"
                                    checked={formData.amenities?.food || false }
                                    onChange={handleChange}
                                />
                                Food
                            </label>
                        </div>

                        <div className="form-group">
                            <label>
                                <input 
                                    type="checkbox"
                                    name="amenities.meetingRooms"
                                    checked={formData.amenities?.meetingRooms || false }
                                    onChange={handleChange}
                                />
                                Meeting Rooms
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-secion">
                    <h3>Attributes</h3>

                    <div className="form-group">
                        <label htmlFor="attributes.parking">Parking</label>
                        <select 
                            id="attirbutes.parking"
                            name="attributes.parking"
                            value={formData.attributes?.parking || 'none'}
                            onChange={handleChange}
                        >
                            <option value="none">None</option>
                            <option value="street">Street</option>
                            <option value="lot">Lot</option>
                            <option value="garage">Garage</option>
                            <option value="valet">Valet</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="attributes.capacity">Capacity</label>
                        <select 
                            id="attributes.capacity"
                            name="attributes.capacity"
                            value={formData.attributes?.capacity || 'small'}
                            onChange={handleChange}
                        >
                            <option value="extra-small">Extra Small (1-10)</option>
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>

                    <div className="form-group">
                    <label htmlFor="attributes.noiseLevel">Noise Level</label>
                        <select 
                            id="attributes.noiseLevel"
                            name="attributes.noiseLevel"
                            value={formData.attributes?.noiseLevel || 'small'}
                            onChange={handleChange}
                        >
                            <option value="quiet">Quiet</option>
                            <option value="moderate">Moderate</option>
                            <option value="loud">Loud</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="attributes.seatingComfort">Seating Comfort (1-5)</label>
                            <input 
                                id="attributes.seatingComfort"
                                name="attributes.seatingComfort"
                                type="number"
                                min="1"
                                max="5"
                                value={formData.attributes?.seatingComfort || 3}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="attributes.coffeeRating">Coffee Rating (1-5)</label>
                            <input 
                                id="attributes.coffeeRating"
                                name="attributes.coffeeRating"
                                type="number"
                                min="1"
                                max="5"
                                value={formData.attributes?.coffeeRating || 3}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <input 
                                type="checkbox"
                                name="attributes.openLate"
                                checked={formData.attributes?.openLate || false}
                                onChange={handleChange}
                            />
                            Open Late
                        </label>
                    </div>
                </div>

                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => navigate('/admin/places')}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {createMutation.isPending || updateMutation.isPending
                            ? 'Saving...'
                            : isEditMode ? 'Update Place' : 'Create Place'
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PlaceEdit;