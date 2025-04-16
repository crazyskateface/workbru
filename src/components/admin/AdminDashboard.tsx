import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { getAllPlaces } from '../../services/workbru-backend';

const AdminDashboard = () => {
    const { data: places, isLoading, error } = useQuery({
        queryKey: ['admin-places'],
        queryFn: getAllPlaces
    });

    return (
        <div className="admin-dashboard">
            <h2>Dashboard</h2>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Places</h3>
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p>Error loading data</p>
                    ) : (
                        <p className="stat-number">{places?.length ||0}</p>
                    )}
                    <Link to="/admin/places" className="view-all">View All</Link>
                </div>

                {/* Add more stat cards as needed */}
            </div>

            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                    <Link to="/admin/places/new" className="btn btn-primary">
                        Add New Place
                    </Link>
                </div>
            </div>
        </div>

    );
};

export default AdminDashboard;