// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import productReducer from "../features/products/productSlice";
import authReducer from "../features/auth/authSlice";
import userReducer from "../features/users/userSlice";
import orderReducer from "../features/orders/orderSlice";
import dashboardReducer from "../features/dashboard/DashboardSlice"
import tableReducer from "../features/tables/tableSlice"
import categoryReducer from "../features/categories/categorySlice"
import uiReducer from './uiSlice';
import cartReducer from "../features/carts/cartSlice";
import inventoryReducer from "../features/inventory/inventorySlice"
import recipeReducer from "../features/recipes/recipeSlice"


const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        users: userReducer,
        categories: categoryReducer,
        products: productReducer,
        orders: orderReducer,
        tables: tableReducer,
        dashboard: dashboardReducer,
        cart: cartReducer,  // ⭐ ဒီလိုင်းထည့်ပါ
        inventory: inventoryReducer,
        recipes: recipeReducer,
    }
})

export default store