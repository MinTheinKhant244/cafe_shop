import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import productReducer from "../features/products/productSlice";
import authReducer from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
const store=configureStore({
    reducer:{
        user:userReducer,
        product:productReducer,
        auth:authReducer,
        cart:cartReducer
    }
})
export default store
