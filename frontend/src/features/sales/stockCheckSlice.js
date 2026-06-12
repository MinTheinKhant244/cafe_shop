import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// Check stock for all items in cart
export const checkCartStock = createAsyncThunk(
  "stockCheck/checkCartStock",
  async (cartItems, { rejectWithValue }) => {
    try {
      const ingredientMap = new Map();
      const productIssues = new Map();
      
      for (const item of cartItems) {
        const recipeResponse = await api.get(`/recipes/product/${item.id}`);
        const recipes = recipeResponse.data;
        
        for (const recipe of recipes) {
          const ingredientId = recipe.inventory?.id;
          const ingredientName = recipe.inventory?.name;
          const requiredQty = (recipe.quantity || 0) * item.quantity;
          const availableQty = recipe.inventory?.quantity || 0;
          const unit = recipe.inventory?.unit || "unit";
          
          if (!ingredientId) continue;
          
          if (!ingredientMap.has(ingredientId)) {
            ingredientMap.set(ingredientId, {
              id: ingredientId,
              name: ingredientName,
              required: 0,
              available: availableQty,
              unit: unit,
              products: []
            });
          }
          
          const ingredient = ingredientMap.get(ingredientId);
          ingredient.required += requiredQty;
          ingredient.products.push({
            productId: item.id,
            productName: item.name,
            cartQuantity: item.quantity,
            recipeQuantity: recipe.quantity,
            requiredForThis: requiredQty
          });
        }
      }
      
      const insufficientIngredients = [];
      
      for (const [id, data] of ingredientMap) {
        if (data.required > data.available) {
          insufficientIngredients.push({
            ...data,
            shortfall: data.required - data.available
          });
          
          for (const product of data.products) {
            if (!productIssues.has(product.productId)) {
              productIssues.set(product.productId, {
                productId: product.productId,
                productName: product.productName,
                issues: []
              });
            }
            productIssues.get(product.productId).issues.push({
              ingredientName: data.name,
              shortfall: data.required - data.available,
              required: data.required,
              available: data.available,
              unit: data.unit
            });
          }
        }
      }
      
      return {
        available: insufficientIngredients.length === 0,
        insufficient: insufficientIngredients,
        allIngredients: Array.from(ingredientMap.values()),
        productIssues: Array.from(productIssues.values()),
        summary: {
          totalIngredients: ingredientMap.size,
          insufficientCount: insufficientIngredients.length,
          totalShortfall: insufficientIngredients.reduce((sum, i) => sum + i.shortfall, 0)
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Stock check failed");
    }
  }
);

// Check if adding a specific product is allowed
export const checkAddProductStock = createAsyncThunk(
  "stockCheck/checkAddProductStock",
  async ({ product, currentCartItems }, { rejectWithValue }) => {
    try {
      const newCartItems = [...currentCartItems];
      const existingIndex = newCartItems.findIndex(item => item.id === product.id);
      
      if (existingIndex !== -1) {
        newCartItems[existingIndex] = {
          ...newCartItems[existingIndex],
          quantity: newCartItems[existingIndex].quantity + 1
        };
      } else {
        newCartItems.push({
          id: product.id,
          name: product.name,
          quantity: 1
        });
      }
      
      const ingredientMap = new Map();
      const productIssues = new Map();
      
      for (const item of newCartItems) {
        const recipeResponse = await api.get(`/recipes/product/${item.id}`);
        const recipes = recipeResponse.data;
        
        for (const recipe of recipes) {
          const ingredientId = recipe.inventory?.id;
          const ingredientName = recipe.inventory?.name;
          const requiredQty = (recipe.quantity || 0) * item.quantity;
          const availableQty = recipe.inventory?.quantity || 0;
          const unit = recipe.inventory?.unit || "unit";
          
          if (!ingredientId) continue;
          
          if (!ingredientMap.has(ingredientId)) {
            ingredientMap.set(ingredientId, {
              id: ingredientId,
              name: ingredientName,
              required: 0,
              available: availableQty,
              unit: unit,
              products: []
            });
          }
          
          const ingredient = ingredientMap.get(ingredientId);
          ingredient.required += requiredQty;
          ingredient.products.push({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            requiredForThis: requiredQty
          });
        }
      }
      
      let canAdd = true;
      const insufficientIngredients = [];
      
      for (const [id, data] of ingredientMap) {
        if (data.required > data.available) {
          canAdd = false;
          insufficientIngredients.push({
            ...data,
            shortfall: data.required - data.available
          });
          
          for (const productData of data.products) {
            if (!productIssues.has(productData.productId)) {
              productIssues.set(productData.productId, {
                productId: productData.productId,
                productName: productData.productName,
                issues: []
              });
            }
            productIssues.get(productData.productId).issues.push({
              ingredientName: data.name,
              shortfall: data.required - data.available,
              required: data.required,
              available: data.available,
              unit: data.unit
            });
          }
        }
      }
      
      let maxAllowedForProduct = 0;
      if (canAdd) {
        let low = 1;
        let high = 100;
        
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const testCartItems = [...currentCartItems];
          const existingIdx = testCartItems.findIndex(i => i.id === product.id);
          
          if (existingIdx !== -1) {
            testCartItems[existingIdx] = {
              ...testCartItems[existingIdx],
              quantity: testCartItems[existingIdx].quantity + mid
            };
          } else {
            testCartItems.push({
              id: product.id,
              name: product.name,
              quantity: mid
            });
          }
          
          const testMap = new Map();
          let testPass = true;
          
          for (const item of testCartItems) {
            const recipeResponse = await api.get(`/recipes/product/${item.id}`);
            const recipes = recipeResponse.data;
            
            for (const recipe of recipes) {
              const ingredientId = recipe.inventory?.id;
              const requiredQty = (recipe.quantity || 0) * item.quantity;
              const availableQty = recipe.inventory?.quantity || 0;
              
              if (!ingredientId) continue;
              
              const currentRequired = testMap.get(ingredientId) || 0;
              if (currentRequired + requiredQty > availableQty) {
                testPass = false;
                break;
              }
              testMap.set(ingredientId, currentRequired + requiredQty);
            }
            if (!testPass) break;
          }
          
          if (testPass) {
            maxAllowedForProduct = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
      }
      
      const currentQuantity = currentCartItems.find(i => i.id === product.id)?.quantity || 0;
      
      return {
        productId: product.id,
        productName: product.name,
        canAdd: canAdd && (maxAllowedForProduct > currentQuantity),
        maxAllowedQuantity: maxAllowedForProduct,
        currentQuantity: currentQuantity,
        insufficientIngredients: insufficientIngredients,
        productIssues: Array.from(productIssues.values()),
        isOutOfStock: maxAllowedForProduct === 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to check stock");
    }
  }
);

// Get max quantity for a single product
export const getProductMaxQuantity = createAsyncThunk(
  "stockCheck/getProductMaxQuantity",
  async (product, { rejectWithValue }) => {
    try {
      let low = 1;
      let high = 100;
      let maxQty = 0;
      
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        try {
          const response = await api.post("/orders/check-stock", {
            items: [{
              product: { id: product.id, name: product.name },
              quantity: mid
            }]
          });
          
          if (response.data.available) {
            maxQty = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        } catch {
          high = mid - 1;
        }
      }
      
      return {
        productId: product.id,
        maxQuantity: maxQty,
        isOutOfStock: maxQty === 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to get max quantity");
    }
  }
);

// Get cart-wide stock information
export const getCartWideStockInfo = createAsyncThunk(
  "stockCheck/getCartWideStockInfo",
  async (cartItems, { rejectWithValue }) => {
    try {
      if (!cartItems || cartItems.length === 0) {
        return {
          available: true,
          insufficientCount: 0,
          productIssues: [],
          summary: {
            totalIngredients: 0,
            insufficientCount: 0,
            totalShortfall: 0
          }
        };
      }
      
      const ingredientMap = new Map();
      const productIssues = new Map();
      
      for (const item of cartItems) {
        const recipeResponse = await api.get(`/recipes/product/${item.id}`);
        const recipes = recipeResponse.data;
        
        for (const recipe of recipes) {
          const ingredientId = recipe.inventory?.id;
          const ingredientName = recipe.inventory?.name;
          const requiredQty = (recipe.quantity || 0) * item.quantity;
          const availableQty = recipe.inventory?.quantity || 0;
          const unit = recipe.inventory?.unit || "unit";
          
          if (!ingredientId) continue;
          
          if (!ingredientMap.has(ingredientId)) {
            ingredientMap.set(ingredientId, {
              id: ingredientId,
              name: ingredientName,
              required: 0,
              available: availableQty,
              unit: unit,
              products: []
            });
          }
          
          const ingredient = ingredientMap.get(ingredientId);
          ingredient.required += requiredQty;
          ingredient.products.push({
            productId: item.id,
            productName: item.name,
            cartQuantity: item.quantity,
            requiredForThis: requiredQty
          });
        }
      }
      
      const insufficientIngredients = [];
      
      for (const [id, data] of ingredientMap) {
        if (data.required > data.available) {
          insufficientIngredients.push({
            ...data,
            shortfall: data.required - data.available
          });
          
          for (const product of data.products) {
            if (!productIssues.has(product.productId)) {
              productIssues.set(product.productId, {
                productId: product.productId,
                productName: product.productName,
                issues: []
              });
            }
            productIssues.get(product.productId).issues.push({
              ingredientName: data.name,
              shortfall: data.required - data.available,
              required: data.required,
              available: data.available,
              unit: data.unit
            });
          }
        }
      }
      
      return {
        available: insufficientIngredients.length === 0,
        insufficientCount: insufficientIngredients.length,
        productIssues: Array.from(productIssues.values()),
        summary: {
          totalIngredients: ingredientMap.size,
          insufficientCount: insufficientIngredients.length,
          totalShortfall: insufficientIngredients.reduce((sum, i) => sum + i.shortfall, 0)
        }
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to get cart stock info");
    }
  }
);

// Refresh all product cards
export const refreshAllProductCards = createAsyncThunk(
  "stockCheck/refreshAllProductCards",
  async (cartItems, { dispatch }) => {
    if (cartItems && cartItems.length > 0) {
      await dispatch(getCartWideStockInfo(cartItems));
      await dispatch(checkCartStock(cartItems));
    }
    return { refreshed: true };
  }
);

const stockCheckSlice = createSlice({
  name: "stockCheck",
  initialState: {
    checking: false,
    lastResult: null,
    error: null,
    lastCheckTime: null,
    productLimits: {},
    cartWideInfo: null,
    refreshVersion: 0
  },
  reducers: {
    clearStockCheck: (state) => {
      state.lastResult = null;
      state.error = null;
      state.cartWideInfo = null;
    },
    clearProductLimit: (state, action) => {
      delete state.productLimits[action.payload];
    },
    clearAllProductLimits: (state) => {
      state.productLimits = {};
    },
    updateProductLimit: (state, action) => {
      const { productId, maxQuantity } = action.payload;
      if (maxQuantity !== undefined) {
        state.productLimits[productId] = maxQuantity;
      }
    },
    setCartWideInfo: (state, action) => {
      state.cartWideInfo = action.payload;
    },
    incrementRefreshVersion: (state) => {
      state.refreshVersion += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkCartStock.pending, (state) => {
        state.checking = true;
        state.error = null;
      })
      .addCase(checkCartStock.fulfilled, (state, action) => {
        state.checking = false;
        state.lastResult = action.payload;
        state.cartWideInfo = {
          available: action.payload.available,
          insufficientCount: action.payload.insufficient?.length || 0,
          productIssues: action.payload.productIssues || []
        };
        state.lastCheckTime = new Date().toISOString();
        state.refreshVersion += 1;
      })
      .addCase(checkCartStock.rejected, (state, action) => {
        state.checking = false;
        state.error = action.payload;
        state.cartWideInfo = null;
      })
      .addCase(getProductMaxQuantity.fulfilled, (state, action) => {
        state.productLimits[action.payload.productId] = action.payload.maxQuantity;
      })
      .addCase(getProductMaxQuantity.rejected, (state, action) => {
        console.error("Failed to get product max quantity:", action.payload);
      })
      .addCase(getCartWideStockInfo.pending, (state) => {
        state.checking = true;
      })
      .addCase(getCartWideStockInfo.fulfilled, (state, action) => {
        state.checking = false;
        state.cartWideInfo = action.payload;
        state.refreshVersion += 1;
      })
      .addCase(getCartWideStockInfo.rejected, (state, action) => {
        state.checking = false;
        state.error = action.payload;
      })
      .addCase(refreshAllProductCards.fulfilled, (state) => {
        state.refreshVersion += 1;
      });
  }
});

export const { 
  clearStockCheck, 
  clearProductLimit, 
  clearAllProductLimits, 
  updateProductLimit,
  setCartWideInfo,
  incrementRefreshVersion
} = stockCheckSlice.actions;

export default stockCheckSlice.reducer;