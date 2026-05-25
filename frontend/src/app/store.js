import { configureStore } from "@reduxjs/toolkit";
import productReducer from "../features/products/productSlice";
import authReducer from "../features/auth/authSlice";

const store=configureStore({
    reducer:{
        auth:authReducer,
        products: productReducer,
    }
})
export default store

