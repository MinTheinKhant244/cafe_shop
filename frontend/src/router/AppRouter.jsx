import { Routes, Route } from "react-router-dom"
import { Navigate } from "react-router-dom"
import Login from "../features/auth/Login.jsx"
import Dashboard from "../features/dashboard/Dashboard.jsx"
import MenuItem from "../features/products/MenuItem.jsx"
import Category from "../features/categories/Category.jsx"
import User from "../features/users/User.jsx"
import Order from "../features/orders/Order.jsx"
import Table from "../features/tables/Table.jsx"
import PosSales from "../features/sales/PosSales.jsx"
import ProtectedRoute from "../components/ProtectedRoute"

function AppRouter() {
  return (
    <Routes>
      {/* redirect root */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      {/* ⭐ POS Sales Route - ဒီနေရာမှာ ထည့်ပါ */}
      <Route
        path="/pos"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "CASHIER"]}>
            <PosSales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="ADMIN">
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/menu-items"
        element={
          <ProtectedRoute role="ADMIN">
            <MenuItem />
          </ProtectedRoute>
        }
      />

      <Route 
        path="/admin/categories" 
        element={
          <ProtectedRoute role="ADMIN">
            <Category />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/staffs" 
        element={
          <ProtectedRoute role="ADMIN">
            <User />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/tables" 
        element={
          <ProtectedRoute role="ADMIN">
            <Table />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "CASHIER"]}>
            <Order />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default AppRouter