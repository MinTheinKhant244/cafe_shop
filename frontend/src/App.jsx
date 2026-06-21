import { Routes, Route } from "react-router-dom"
import { Navigate } from "react-router-dom"
import Login from "./features/auth/Login.jsx"
import Dashboard from "./features/dashboard/Dashboard.jsx"
import MenuItem from "./features/products/MenuItem.jsx"
import Category from "./features/categories/Category.jsx"
import User from "./features/users/User.jsx"
import Order from "./features/orders/Order.jsx"
import Table from "./features/tables/Table.jsx"
import PosSales from "./features/sales/PosSales.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"
import Inventory from "./features/inventory/Inventory.jsx"
import Recipe from "./features/recipes/Recipe.jsx"
import InventoryTransaction from "./features/inventory/InventoryTransaction.jsx"
import CashierOrdersPage from "./features/cashier/CashierOrdersPage.jsx"
import CashierOrderDetail from "./features/cashier/CashierOrderDetail.jsx"

function App() {
  return (
    <Routes>
      {/* redirect root */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/pos"
        element={
          <ProtectedRoute role="CASHIER">
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
        path="/admin/recipes"
        element={
          <ProtectedRoute role="ADMIN">
            <Recipe />
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
        path="/tables" 
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "CASHIER"]}>
            <Table />
          </ProtectedRoute>
        } 
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute role="ADMIN">
            <Order />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/inventory"
        element={
          <ProtectedRoute role="ADMIN">
            <Inventory />
          </ProtectedRoute>
        }
      />

      <Route
        path="admin/invTransactions"
        element={
          <ProtectedRoute role="ADMIN">
            <InventoryTransaction />
          </ProtectedRoute>
        }
      />

      {/* Cashier Routes */}
        <Route path="/cashier/orders" element={
          <ProtectedRoute role="CASHIER">
            <CashierOrdersPage />
          </ProtectedRoute>
        } />
        
      <Route path="/cashier/orders/:id" element={<CashierOrderDetail />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App