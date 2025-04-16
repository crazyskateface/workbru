import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import HomeView from './components/home/HomeView';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import PlacesList from './components/admin/PlacesList';
import PlaceEdit from './components/admin/PlaceEdit';
import PlaceView from './components/admin/PlaceView';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import PasswordReset from './components/auth/PasswordReset';
import PasswordResetConfirm from './components/auth/PasswordResetConfirm';
import SessionManager from './components/auth/SessionManager';

import './App.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeView />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    path: "/password-reset",
    element: <PasswordReset />
  },
  {
    path: "/password-reset-confirm",
    element: <PasswordResetConfirm />
  },
  {
    path: "/sessions",
    element: <SessionManager />
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: "places",
        element: <PlacesList />
      },
      {
        path: "places/new",
        element: <PlaceEdit />
      },
      {
        path: "places/:id",
        element: <PlaceView />
      },
      {
        path: "places/:id/edit",
        element: <PlaceEdit />
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" />
  }
])

function App() {
  return <RouterProvider router={router} />;
}

export default App
