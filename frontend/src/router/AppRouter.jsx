import { Routes, Route } from "react-router-dom"

import { Navigate } from "react-router-dom"
import Login from "../pages/Login"
import Dashboard from "../pages/admin/Dashboard"
import CashierHome from "../pages/cashier/CashierHome.jsx"
import ProtectedRoute from "../components/ProtectedRoute"

function AppRouter() {
  return (
    <Routes>

       {/* redirect root */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="ADMIN">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cashier"
        element={
          <ProtectedRoute role="CASHIER">
            <CashierHome />
          </ProtectedRoute>
        }
      />

    </Routes>
  )
}

export default AppRouter