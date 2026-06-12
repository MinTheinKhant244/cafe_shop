import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// 1. Fetch Cart
export const fetchCart = createAsyncThunk("cart/fetch", async (userId, thunkAPI) => {
  try {
    const response = await api.get(`/api/cart/${userId}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch cart");
  }
});

// 2. Add to Cart (Backend)
export const addToCartBackend = createAsyncThunk("cart/addBackend", async ({ userId, productId, quantity }, thunkAPI) => {
  try {
    await api.post(`/api/cart/${userId}/add`, null, {
      params: { productId, quantity }
    });
    return { productId, quantity };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || "Insufficient stock or error occurred");
  }
});

// 3. Clear Cart (Backend)
export const clearCartBackend = createAsyncThunk("cart/clearBackend", async (userId, thunkAPI) => {
  try {
    await api.delete(`/api/cart/${userId}/clear`);
    return userId;
  } catch (error) {
    return thunkAPI.rejectWithValue("Failed to clear cart");
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    totalAmount: 0,
    loading: false,
    error: null,
    refreshVersion: 0
  },
  reducers: {
    // Local cart actions (for POS without backend)
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      if (existingItem) {
        const maxAllowed = product.maxAllowedQuantity || 99;
        if (existingItem.quantity + 1 <= maxAllowed) {
          existingItem.quantity += 1;
        } else {
          return;
        }
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxAllowed: product.maxAllowedQuantity || 99,
          unit: product.unit,
          image: product.image,
          currentStock: product.currentStock
        });
      }
      
      // Recalculate total
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      
      state.refreshVersion += 1;
    },
    
    updateCartItemLimit: (state, action) => {
      const { productId, maxAllowed } = action.payload;
      const item = state.items.find(item => item.id === productId);
      if (item) {
        item.maxAllowed = maxAllowed;
        if (item.quantity > maxAllowed) {
          item.quantity = maxAllowed;
          state.totalAmount = state.items.reduce(
            (sum, item) => sum + (item.price * item.quantity), 0
          );
        }
      }
      state.refreshVersion += 1;
    },
    
    updateItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item && quantity > 0) {
        const maxAllowed = item.maxAllowed || 99;
        if (quantity <= maxAllowed) {
          item.quantity = quantity;
        } else {
          item.quantity = maxAllowed;
        }
      }
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.refreshVersion += 1;
    },
    
    removeCartItem: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.refreshVersion += 1;
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.refreshVersion += 1;
    },
    
    setCartItems: (state, action) => {
      state.items = action.payload;
      state.totalAmount = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );
      state.refreshVersion += 1;
    },
    
    // Manual update for stock adjustment
    updateCartItemStock: (state, action) => {
      const { productId, currentStock, maxAllowed } = action.payload;
      const item = state.items.find(item => item.id === productId);
      if (item) {
        if (currentStock !== undefined) item.currentStock = currentStock;
        if (maxAllowed !== undefined) {
          item.maxAllowed = maxAllowed;
          if (item.quantity > maxAllowed) {
            item.quantity = maxAllowed;
            state.totalAmount = state.items.reduce(
              (sum, item) => sum + (item.price * item.quantity), 0
            );
          }
        }
        state.refreshVersion += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = (action.payload.cartItems || []).map(item => ({
          id: item.productId,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
          maxAllowed: item.maxAllowed || 99,
          unit: item.unit,
          image: item.image,
          currentStock: item.currentStock || 0
        }));
        state.totalAmount = state.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        state.error = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.items = [];
        state.totalAmount = 0;
      })
      
      // Add to Cart (Backend)
      .addCase(addToCartBackend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartBackend.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, quantity } = action.payload;
        const existingItem = state.items.find(item => item.id === productId);
        if (existingItem) {
          existingItem.quantity = quantity;
        }
        state.totalAmount = state.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 0
        );
        state.refreshVersion += 1;
        state.error = null;
      })
      .addCase(addToCartBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Clear Cart (Backend)
      .addCase(clearCartBackend.pending, (state) => {
        state.loading = true;
      })
      .addCase(clearCartBackend.fulfilled, (state) => {
        state.items = [];
        state.totalAmount = 0;
        state.refreshVersion += 1;
        state.loading = false;
        state.error = null;
      })
      .addCase(clearCartBackend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const { 
  addToCart, 
  updateCartItemLimit, 
  updateItemQuantity,      
  removeCartItem,          
  clearCart,               
  setCartItems,
  updateCartItemStock
} = cartSlice.actions;

export const updateQuantity = updateItemQuantity;
export const removeFromCart = removeCartItem;

export default cartSlice.reducer;