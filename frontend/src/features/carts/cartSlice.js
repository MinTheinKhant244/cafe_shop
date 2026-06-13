// features/carts/cartSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// ============ Session Storage Helpers ============
const CART_KEY = "pos_cart_session";

const getCartFromSession = () => {
  try {
    const cart = sessionStorage.getItem(CART_KEY);
    if (cart) {
      const parsed = JSON.parse(cart);
      // Check if cart is expired (30 minutes)
      if (parsed.lastUpdated && (Date.now() - parsed.lastUpdated) > 30 * 60 * 1000) {
        clearCartSession();
        return getEmptyCart();
      }
      return parsed;
    }
    return getEmptyCart();
  } catch (error) {
    console.error("Failed to get cart from session:", error);
    return getEmptyCart();
  }
};

const getEmptyCart = () => ({
  items: [],
  totalAmount: 0,
  tableId: null,
  createdAt: Date.now(),
  lastUpdated: Date.now(),
  orderNote: "",
  refreshVersion: 0,
  stockStatus: {},
  loading: false,
  error: null
});

const saveCartToSession = (state) => {
  try {
    const toSave = {
      items: state.items,
      totalAmount: state.totalAmount,
      tableId: state.tableId,
      orderNote: state.orderNote,
      lastUpdated: Date.now(),
      stockStatus: state.stockStatus
    };
    sessionStorage.setItem(CART_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Failed to save cart to session:", error);
  }
};

const clearCartSession = () => {
  sessionStorage.removeItem(CART_KEY);
};

const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// ============ Helper to get cart items for API ============
const getCartItemsForAPI = (items) => {
  return items.map(item => ({
    productId: item.id,
    quantity: item.quantity
  }));
};

// ============ Async Thunks for Stock Validation ============

// 🔥 Get single product stock status with cart items
export const getProductStockStatus = createAsyncThunk(
  "cart/getProductStockStatus",
  async ({ productId }, { getState, rejectWithValue }) => {
    const state = getState();
    const { items } = state.cart;
    const cartItems = getCartItemsForAPI(items);
    
    try {
      const response = await api.post(`/product-stock/${productId}/calculate`, {
        cartItems: cartItems
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to get stock status");
    }
  }
);

// 🔥 Get multiple products stock status with cart items
export const getMultipleProductsStock = createAsyncThunk(
  "cart/getMultipleProductsStock",
  async ({ productIds }, { getState, rejectWithValue }) => {
    const state = getState();
    const { items } = state.cart;
    const cartItems = getCartItemsForAPI(items);
    
    if (!productIds || productIds.length === 0) {
      return {};
    }
    
    try {
      const response = await api.post("/product-stock/batch/calculate", {
        productIds: productIds,
        cartItems: cartItems
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to get batch stock");
    }
  }
);

// 🔥 Get stock for ALL products currently in cart
export const getAllCartProductsStock = createAsyncThunk(
  "cart/getAllCartProductsStock",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { items } = state.cart;
    
    if (items.length === 0) {
      return {};
    }
    
    const productIds = items.map(i => i.id);
    const cartItems = getCartItemsForAPI(items);
    
    try {
      const response = await api.post("/product-stock/batch/calculate", {
        productIds: productIds,
        cartItems: cartItems
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Failed to get cart stock");
    }
  }
);

// 🔥 Validate all cart items stock before order
export const validateCartStock = createAsyncThunk(
  "cart/validateCartStock",
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const { items } = state.cart;
    
    if (items.length === 0) {
      return { isValid: true, stockMap: {}, invalidItems: [], message: null };
    }
    
    const productIds = items.map(i => i.id);
    const cartItems = getCartItemsForAPI(items);
    
    try {
      const response = await api.post("/product-stock/batch/calculate", {
        productIds: productIds,
        cartItems: cartItems
      });
      
      const stockMap = response.data;
      let isValid = true;
      const invalidItems = [];
      
      items.forEach(item => {
        const stock = stockMap[item.id];
        if (stock && item.quantity > stock.availableQuantity) {
          isValid = false;
          invalidItems.push({
            ...item,
            availableQuantity: stock.availableQuantity,
            isOutOfStock: stock.isOutOfStock,
            warningMessage: stock.warningMessage
          });
        }
      });
      
      return {
        isValid,
        stockMap,
        invalidItems,
        message: invalidItems.length > 0 
          ? `Stock insufficient: ${invalidItems.map(i => i.name).join(", ")}`
          : null
      };
      
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Stock validation failed");
    }
  }
);

// 🔥 Check single product availability
export const checkProductAvailability = createAsyncThunk(
  "cart/checkProductAvailability",
  async ({ productId, requestedQuantity }, { getState, rejectWithValue }) => {
    const state = getState();
    const { items } = state.cart;
    const cartItems = getCartItemsForAPI(items);
    
    try {
      const response = await api.post(`/product-stock/${productId}/check`, {
        quantity: requestedQuantity,
        cartItems: cartItems
      });
      return {
        productId,
        requestedQuantity,
        isAvailable: response.data.available
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Availability check failed");
    }
  }
);

// ============ Slice ============
const cartSlice = createSlice({
  name: "cart",
  initialState: getCartFromSession(),
  reducers: {
    // Add item to cart (Local only)
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.items.find(item => item.id === product.id);
      
      // Get stock status from state
      const stockStatus = state.stockStatus[product.id];
      const maxStock = stockStatus?.availableQuantity ?? product.currentStock ?? 999;
      
      if (existingItem) {
        if (existingItem.quantity + 1 > maxStock) {
          state.error = stockStatus?.warningMessage || `Only ${maxStock} ${product.name} available`;
          return;
        }
        existingItem.quantity += 1;
      } else {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
          category: product.category?.name,
          unit: product.unit,
          currentStock: maxStock,
          note: "",
          priceAtTime: product.price
        });
      }
      
      state.totalAmount = calculateTotal(state.items);
      state.refreshVersion += 1;
      state.error = null;
      saveCartToSession(state);
    },
    
    // Update item quantity
    updateItemQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        const stockStatus = state.stockStatus[id];
        const maxStock = stockStatus?.availableQuantity ?? item.currentStock ?? 999;
        const newQty = Math.min(quantity, maxStock);
        
        if (newQty <= 0) {
          state.items = state.items.filter(i => i.id !== id);
        } else {
          item.quantity = newQty;
        }
        
        state.totalAmount = calculateTotal(state.items);
        state.refreshVersion += 1;
        saveCartToSession(state);
      }
    },
    
    // Remove item from cart
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalAmount = calculateTotal(state.items);
      state.refreshVersion += 1;
      saveCartToSession(state);
    },
    
    // Update item note
    updateItemNote: (state, action) => {
      const { id, note } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.note = note;
        saveCartToSession(state);
      }
    },
    
    // Update order note
    updateOrderNote: (state, action) => {
      state.orderNote = action.payload;
      saveCartToSession(state);
    },
    
    // Set table ID
    setTableId: (state, action) => {
      state.tableId = action.payload;
      saveCartToSession(state);
    },
    
    // Clear entire cart
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.tableId = null;
      state.orderNote = "";
      state.error = null;
      state.stockStatus = {};
      state.refreshVersion += 1;
      clearCartSession();
    },
    
    // Reload cart from session storage
    reloadCart: (state) => {
      const saved = getCartFromSession();
      state.items = saved.items;
      state.totalAmount = saved.totalAmount;
      state.tableId = saved.tableId;
      state.orderNote = saved.orderNote;
      state.stockStatus = saved.stockStatus || {};
      state.refreshVersion = saved.refreshVersion;
      state.error = null;
    },
    
    // Set error message
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    // Update stock status for a product
    updateProductStockStatus: (state, action) => {
      const { productId, stockData } = action.payload;
      state.stockStatus[productId] = {
        availableQuantity: stockData.availableQuantity,
        maxPossibleQuantity: stockData.maxPossibleQuantity,
        isLimitedByInventory: stockData.isLimitedByInventory,
        isOutOfStock: stockData.isOutOfStock,
        isLowStock: stockData.isLowStock,
        ingredientLimits: stockData.ingredientLimits,
        warningMessage: stockData.warningMessage
      };
      
      // Update item's current stock
      const item = state.items.find(i => i.id === productId);
      if (item) {
        item.currentStock = stockData.availableQuantity;
        
        // Reduce quantity if exceeds available stock
        if (item.quantity > stockData.availableQuantity) {
          item.quantity = stockData.availableQuantity;
          state.totalAmount = calculateTotal(state.items);
        }
      }
      
      saveCartToSession(state);
    },
    
    // Update multiple products stock status
    updateMultipleProductsStock: (state, action) => {
      const stockMap = action.payload;
      let hasChanges = false;
      
      Object.keys(stockMap).forEach(productId => {
        const stockData = stockMap[productId];
        if (stockData) {
          state.stockStatus[productId] = {
            availableQuantity: stockData.availableQuantity,
            maxPossibleQuantity: stockData.maxPossibleQuantity,
            isLimitedByInventory: stockData.isLimitedByInventory,
            isOutOfStock: stockData.isOutOfStock,
            isLowStock: stockData.isLowStock,
            ingredientLimits: stockData.ingredientLimits,
            warningMessage: stockData.warningMessage
          };
          
          // Update item's current stock
          const item = state.items.find(i => i.id === parseInt(productId));
          if (item) {
            item.currentStock = stockData.availableQuantity;
            
            if (item.quantity > stockData.availableQuantity) {
              item.quantity = stockData.availableQuantity;
              hasChanges = true;
            }
          }
        }
      });
      
      if (hasChanges) {
        state.totalAmount = calculateTotal(state.items);
      }
      
      saveCartToSession(state);
    }
  },
  extraReducers: (builder) => {
    builder
      // Get single product stock status
      .addCase(getProductStockStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductStockStatus.fulfilled, (state, action) => {
        state.loading = false;
        const stockData = action.payload;
        if (stockData && stockData.productId) {
          state.stockStatus[stockData.productId] = {
            availableQuantity: stockData.availableQuantity,
            maxPossibleQuantity: stockData.maxPossibleQuantity,
            isLimitedByInventory: stockData.isLimitedByInventory,
            isOutOfStock: stockData.isOutOfStock,
            isLowStock: stockData.isLowStock,
            ingredientLimits: stockData.ingredientLimits,
            warningMessage: stockData.warningMessage
          };
          
          // Update item in cart if exists
          const item = state.items.find(i => i.id === stockData.productId);
          if (item) {
            item.currentStock = stockData.availableQuantity;
            if (item.quantity > stockData.availableQuantity) {
              item.quantity = stockData.availableQuantity;
              state.totalAmount = calculateTotal(state.items);
            }
          }
          
          saveCartToSession(state);
        }
        state.error = null;
      })
      .addCase(getProductStockStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get multiple products stock status
      .addCase(getMultipleProductsStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMultipleProductsStock.fulfilled, (state, action) => {
        state.loading = false;
        const stockMap = action.payload;
        let hasChanges = false;
        
        Object.keys(stockMap).forEach(productId => {
          const stockData = stockMap[productId];
          if (stockData) {
            state.stockStatus[productId] = {
              availableQuantity: stockData.availableQuantity,
              maxPossibleQuantity: stockData.maxPossibleQuantity,
              isLimitedByInventory: stockData.isLimitedByInventory,
              isOutOfStock: stockData.isOutOfStock,
              isLowStock: stockData.isLowStock,
              ingredientLimits: stockData.ingredientLimits,
              warningMessage: stockData.warningMessage
            };
            
            const item = state.items.find(i => i.id === parseInt(productId));
            if (item) {
              item.currentStock = stockData.availableQuantity;
              if (item.quantity > stockData.availableQuantity) {
                item.quantity = stockData.availableQuantity;
                hasChanges = true;
              }
            }
          }
        });
        
        if (hasChanges) {
          state.totalAmount = calculateTotal(state.items);
        }
        
        saveCartToSession(state);
        state.error = null;
      })
      .addCase(getMultipleProductsStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get all cart products stock
      .addCase(getAllCartProductsStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCartProductsStock.fulfilled, (state, action) => {
        state.loading = false;
        const stockMap = action.payload;
        let hasChanges = false;
        
        Object.keys(stockMap).forEach(productId => {
          const stockData = stockMap[productId];
          if (stockData) {
            state.stockStatus[productId] = {
              availableQuantity: stockData.availableQuantity,
              maxPossibleQuantity: stockData.maxPossibleQuantity,
              isLimitedByInventory: stockData.isLimitedByInventory,
              isOutOfStock: stockData.isOutOfStock,
              isLowStock: stockData.isLowStock,
              ingredientLimits: stockData.ingredientLimits,
              warningMessage: stockData.warningMessage
            };
            
            const item = state.items.find(i => i.id === parseInt(productId));
            if (item) {
              item.currentStock = stockData.availableQuantity;
              if (item.quantity > stockData.availableQuantity) {
                item.quantity = stockData.availableQuantity;
                hasChanges = true;
              }
            }
          }
        });
        
        if (hasChanges) {
          state.totalAmount = calculateTotal(state.items);
        }
        
        saveCartToSession(state);
        state.error = null;
      })
      .addCase(getAllCartProductsStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Validate cart stock
      .addCase(validateCartStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCartStock.fulfilled, (state, action) => {
        state.loading = false;
        const { isValid, stockMap, invalidItems, message } = action.payload;
        
        // Update stock status for all products
        if (stockMap) {
          Object.keys(stockMap).forEach(productId => {
            const stockData = stockMap[productId];
            if (stockData) {
              state.stockStatus[productId] = {
                availableQuantity: stockData.availableQuantity,
                maxPossibleQuantity: stockData.maxPossibleQuantity,
                isLimitedByInventory: stockData.isLimitedByInventory,
                isOutOfStock: stockData.isOutOfStock,
                isLowStock: stockData.isLowStock,
                ingredientLimits: stockData.ingredientLimits,
                warningMessage: stockData.warningMessage
              };
            }
          });
        }
        
        // Update cart items that have stock issues
        if (invalidItems && invalidItems.length > 0) {
          invalidItems.forEach(invalid => {
            const item = state.items.find(i => i.id === invalid.id);
            if (item) {
              item.quantity = invalid.availableQuantity;
              item.currentStock = invalid.availableQuantity;
            }
          });
          state.totalAmount = calculateTotal(state.items);
          state.error = message;
        }
        
        state.validationResult = { isValid, invalidItems, message };
        saveCartToSession(state);
      })
      .addCase(validateCartStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Check product availability
      .addCase(checkProductAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkProductAvailability.fulfilled, (state, action) => {
        state.loading = false;
        const { productId, requestedQuantity, isAvailable } = action.payload;
        state.availability = state.availability || {};
        state.availability[productId] = {
          available: isAvailable,
          requestedQuantity: requestedQuantity,
          checkedAt: Date.now()
        };
        state.error = null;
      })
      .addCase(checkProductAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  addToCart,
  updateItemQuantity,
  removeFromCart,
  updateItemNote,
  updateOrderNote,
  setTableId,
  clearCart,
  reloadCart,
  setError,
  clearError,
  setLoading,
  updateProductStockStatus,
  updateMultipleProductsStock
} = cartSlice.actions;

// For backward compatibility
export const addToCartLocal = addToCart;
export const updateItemQuantityLocal = updateItemQuantity;
export const removeCartItemLocal = removeFromCart;
export const clearCartLocal = clearCart;

// Selectors
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalAmount;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectProductStock = (state, productId) => state.cart.stockStatus[productId];
export const selectIsProductOutOfStock = (state, productId) => {
  const stock = state.cart.stockStatus[productId];
  return stock?.isOutOfStock ?? false;
};
export const selectIsProductLowStock = (state, productId) => {
  const stock = state.cart.stockStatus[productId];
  return stock?.isLowStock ?? false;
};

export default cartSlice.reducer;