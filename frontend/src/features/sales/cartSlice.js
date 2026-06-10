// src/features/cart/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const loadCartFromStorage = () => {
  const saved = localStorage.getItem("pos_cart");
  return saved ? JSON.parse(saved) : { items: [], totalAmount: 0 };
};

const saveCartToStorage = (state) => {
  localStorage.setItem("pos_cart", JSON.stringify({ 
    items: state.items, 
    totalAmount: state.totalAmount 
  }));
};

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const cartSlice = createSlice({
  name: "cart",
  initialState: loadCartFromStorage(),
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.items.find(item => item.id === product.id);
      
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        });
      }
      state.totalAmount = calculateTotal(state.items);
      saveCartToStorage(state);
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      state.totalAmount = calculateTotal(state.items);
      saveCartToStorage(state);
    },
    
    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      state.totalAmount = calculateTotal(state.items);
      saveCartToStorage(state);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      localStorage.removeItem("pos_cart");
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;