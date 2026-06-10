import { Routes, Route } from "react-router-dom"
import { Navigate } from "react-router-dom"
import Login from "../pages/Login"
import Dashboard from "../pages/admin/Dashboard"
import MenuItem from "../pages/admin/MenuItem"
import Category from "../pages/admin/Category.jsx"
import User from "../pages/admin/User.jsx"
import CashierHome from "../pages/cashier/CashierHome.jsx"
import Order from "../pages/Order.jsx"
import Table from "../pages/admin/table.jsx"
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
        path="/cashier"
        element={
          <ProtectedRoute role="CASHIER">
            <CashierHome />
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