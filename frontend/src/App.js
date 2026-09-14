
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import TouristDashboard from "./pages/TouristDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import "./App.css";


// ==========================================
// PROTECTED ROUTE
// ==========================================

function ProtectedRoute({ children, role }) {

  const { user } = useAuth();


  // User is not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }


  // User does not have required role
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }


  return children;
}


// ==========================================
// APPLICATION ROUTES
// ==========================================

function AppRoutes() {

  return (

    <Routes>

      {/* ================================
          LOGIN
      ================================= */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* ================================
          REGISTER
      ================================= */}

      <Route
        path="/register"
        element={<Register />}
      />


      {/* ================================
          TOURIST DASHBOARD
      ================================= */}

      <Route
        path="/dashboard"
        element={

          <ProtectedRoute>

            <TouristDashboard />

          </ProtectedRoute>

        }
      />


      {/* ================================
          ADMIN DASHBOARD
      ================================= */}

      <Route
        path="/admin"
        element={

          <ProtectedRoute role="admin">

            <AdminDashboard />

          </ProtectedRoute>

        }
      />


      {/* ================================
          UNKNOWN ROUTE
      ================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>

  );
}


// ==========================================
// MAIN APPLICATION
// ==========================================

export default function App() {

  return (

    <AuthProvider>

      <BrowserRouter>

        <AppRoutes />

      </BrowserRouter>

    </AuthProvider>

  );
}

