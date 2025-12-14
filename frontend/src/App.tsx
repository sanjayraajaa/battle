
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Timesheet from './pages/Timesheet';


import { SidebarLayout } from './components/Sidebar';
import { Toaster } from "@/components/ui/sonner"
import './App.css';

const PrivateRoute = () => {
  const { currentUser, isLoading } = useFrappeAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render child routes inside Sidebar Layout
  return (
    <SidebarLayout>
      <Outlet />
    </SidebarLayout>
  );
};

const PublicRoute = () => {
  const { currentUser, isLoading } = useFrappeAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  // If logged in, redirect to dashboard
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  const basename = import.meta.env.DEV ? '/assets/battle/frontend' : '/battle';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Private Routes (Wrapped in Sidebar) */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/timesheet" element={<Timesheet />} />

        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
