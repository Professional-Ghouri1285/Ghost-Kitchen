import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Hubs from './pages/Hubs';
import Brands from './pages/Brands';
import Inventory from './pages/Inventory';
import Allocations from './pages/Allocations';
import MenuItems from './pages/MenuItems';
import Orders from './pages/Orders';
import Couriers from './pages/Couriers';
import Deliveries from './pages/Deliveries';
import Payouts from './pages/Payouts';
import Reports from './pages/Reports';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/hubs" element={<ProtectedRoute roles={['admin']}><Layout><Hubs /></Layout></ProtectedRoute>} />
      <Route path="/brands" element={<ProtectedRoute roles={['admin']}><Layout><Brands /></Layout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute roles={['admin', 'kitchen_staff']}><Layout><Inventory /></Layout></ProtectedRoute>} />
      <Route path="/allocations" element={<ProtectedRoute roles={['admin', 'kitchen_staff']}><Layout><Allocations /></Layout></ProtectedRoute>} />
      <Route path="/menu-items" element={<ProtectedRoute roles={['admin', 'kitchen_staff']}><Layout><MenuItems /></Layout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute roles={['admin', 'kitchen_staff']}><Layout><Orders /></Layout></ProtectedRoute>} />
      <Route path="/couriers" element={<ProtectedRoute roles={['admin']}><Layout><Couriers /></Layout></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute roles={['admin']}><Layout><Deliveries /></Layout></ProtectedRoute>} />
      <Route path="/payouts" element={<ProtectedRoute roles={['admin']}><Layout><Payouts /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute roles={['admin']}><Layout><Reports /></Layout></ProtectedRoute>} />

      <Route path="/my-deliveries" element={<ProtectedRoute roles={['courier']}><Layout><Deliveries /></Layout></ProtectedRoute>} />
      <Route path="/my-payouts" element={<ProtectedRoute roles={['courier']}><Layout><Payouts /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
