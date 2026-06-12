import { createSlice } from "@reduxjs/toolkit";

const loadCartFromStorage = () => {
  const saved = localStorage.getItem("pos_cart");
  return saved ? JSON.parse(saved) : { items: [], totalAmount: 0, version: 0 };
};

const saveCartToStorage = (state) => {
  localStorage.setItem("pos_cart", JSON.stringify({ 
    items: state.items, 
    totalAmount: state.totalAmount,
    version: state.version
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
      const maxAllowed = product.maxAllowedQuantity;
      
      // Don't add if maxAllowed is 0
      if (maxAllowed !== undefined && maxAllowed <= 0) {
        return;
      }
      
      const existing = state.items.find(item => item.id === product.id);
      
      if (existing) {
        // Check if adding one more would exceed max
        if (maxAllowed !== undefined && existing.quantity + 1 > maxAllowed) {
          return;
        }
        existing.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          maxAllowed: maxAllowed
        });
      }
      state.totalAmount = calculateTotal(state.items);
      state.version += 1;
      saveCartToStorage(state);
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => i.id === id);
      if (item) {
        // Check max limit
        if (item.maxAllowed !== undefined && quantity > item.maxAllowed) {
          return;
        }
        
        if (quantity <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = quantity;
        }
      }
      state.totalAmount = calculateTotal(state.items);
      state.version += 1;
      saveCartToStorage(state);
    },
    
    removeFromCart: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
      state.totalAmount = calculateTotal(state.items);
      state.version += 1;
      saveCartToStorage(state);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.version += 1;
      localStorage.removeItem("pos_cart");
    },
    
    updateCartItemLimit: (state, action) => {
      const { productId, maxAllowed } = action.payload;
      const item = state.items.find(i => i.id === productId);
      if (item) {
        item.maxAllowed = maxAllowed;
        // Adjust quantity if it exceeds new limit
        if (item.quantity > maxAllowed && maxAllowed > 0) {
          item.quantity = maxAllowed;
        } else if (maxAllowed <= 0) {
          // Remove item if maxAllowed is 0
          state.items = state.items.filter(i => i.id !== productId);
        }
      }
      state.totalAmount = calculateTotal(state.items);
      state.version += 1;
      saveCartToStorage(state);
    }
  },
});

export const { 
  addToCart, 
  updateQuantity, 
  removeFromCart, 
  clearCart, 
  updateCartItemLimit 
} = cartSlice.actions;

export default cartSlice.reducer;