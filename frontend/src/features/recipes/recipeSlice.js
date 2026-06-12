import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// Fetch all recipes
export const fetchAllRecipes = createAsyncThunk(
  "recipes/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/recipes");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch recipes");
    }
  }
);

// Fetch recipes by product ID
export const fetchRecipesByProduct = createAsyncThunk(
  "recipes/fetchByProduct",
  async (productId, thunkAPI) => {
    try {
      const response = await api.get(`/recipes/product/${productId}`);
      return { productId, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch product recipes");
    }
  }
);

// Fetch recipes by inventory ID
export const fetchRecipesByInventory = createAsyncThunk(
  "recipes/fetchByInventory",
  async (inventoryId, thunkAPI) => {
    try {
      const response = await api.get(`/recipes/inventory/${inventoryId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch inventory recipes");
    }
  }
);

// Add new recipe
export const addRecipe = createAsyncThunk(
  "recipes/add",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/recipes", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to add recipe");
    }
  }
);

// Update recipe
export const updateRecipe = createAsyncThunk(
  "recipes/update",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await api.put(`/recipes/${id}`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to update recipe");
    }
  }
);

// Delete recipe
export const deleteRecipe = createAsyncThunk(
  "recipes/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/recipes/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to delete recipe");
    }
  }
);

// Delete all recipes by product
export const deleteRecipesByProduct = createAsyncThunk(
  "recipes/deleteByProduct",
  async (productId, thunkAPI) => {
    try {
      await api.delete(`/recipes/product/${productId}`);
      return productId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to delete product recipes");
    }
  }
);

// Check if ingredient exists
export const checkIngredientExists = createAsyncThunk(
  "recipes/checkIngredient",
  async ({ productId, inventoryId }, thunkAPI) => {
    try {
      const response = await api.get(`/recipes/check?productId=${productId}&inventoryId=${inventoryId}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to check ingredient");
    }
  }
);

// ✅ NEW: Get recipe cost details from backend
export const fetchRecipeCostDetails = createAsyncThunk(
  "recipes/fetchCostDetails",
  async (productId, thunkAPI) => {
    try {
      const response = await api.get(`/recipes/product/${productId}/cost-details`);
      return { productId, costDetails: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch cost details");
    }
  }
);

// ✅ NEW: Get total recipe cost
export const fetchRecipeCost = createAsyncThunk(
  "recipes/fetchCost",
  async (productId, thunkAPI) => {
    try {
      const response = await api.get(`/recipes/product/${productId}/cost`);
      return { productId, totalCost: response.data.totalCost };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch recipe cost");
    }
  }
);

const recipeSlice = createSlice({
  name: "recipes",
  initialState: {
    list: [],
    currentProductRecipes: [],
    loading: false,
    error: null,
    operationLoading: false,
    selectedRecipe: null,
    ingredientExists: false,
    costDetails: null,        // ✅ New state for cost details
    totalCost: null,          // ✅ New state for total cost
    loadingCost: false        // ✅ New state for cost loading
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetRecipes: (state) => {
      state.list = [];
      state.currentProductRecipes = [];
      state.error = null;
      state.loading = false;
      state.operationLoading = false;
      state.costDetails = null;
      state.totalCost = null;
    },
    setSelectedRecipe: (state, action) => {
      state.selectedRecipe = action.payload;
    },
    clearCurrentProductRecipes: (state) => {
      state.currentProductRecipes = [];
    },
    clearIngredientExists: (state) => {
      state.ingredientExists = false;
    },
    clearCostDetails: (state) => {
      state.costDetails = null;
      state.totalCost = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllRecipes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.error = null;
      })
      .addCase(fetchAllRecipes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch By Product
      .addCase(fetchRecipesByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipesByProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProductRecipes = action.payload.data;
        state.error = null;
      })
      .addCase(fetchRecipesByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Recipe
      .addCase(addRecipe.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(addRecipe.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list.push(action.payload);
        state.currentProductRecipes.push(action.payload);
        state.error = null;
      })
      .addCase(addRecipe.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Update Recipe
      .addCase(updateRecipe.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        
        const productIndex = state.currentProductRecipes.findIndex(item => item.id === action.payload.id);
        if (productIndex !== -1) state.currentProductRecipes[productIndex] = action.payload;
        
        state.error = null;
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Delete Recipe
      .addCase(deleteRecipe.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list = state.list.filter(item => item.id !== action.payload);
        state.currentProductRecipes = state.currentProductRecipes.filter(item => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteRecipe.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Delete By Product
      .addCase(deleteRecipesByProduct.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deleteRecipesByProduct.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list = state.list.filter(item => item.product?.id !== action.payload);
        state.currentProductRecipes = [];
        state.error = null;
      })
      .addCase(deleteRecipesByProduct.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Check Ingredient Exists
      .addCase(checkIngredientExists.fulfilled, (state, action) => {
        state.ingredientExists = action.payload.exists;
      })
      
      // ✅ Fetch Recipe Cost Details
      .addCase(fetchRecipeCostDetails.pending, (state) => {
        state.loadingCost = true;
        state.error = null;
      })
      .addCase(fetchRecipeCostDetails.fulfilled, (state, action) => {
        state.loadingCost = false;
        state.costDetails = action.payload.costDetails;
        state.totalCost = action.payload.costDetails.totalCost;
        state.error = null;
      })
      .addCase(fetchRecipeCostDetails.rejected, (state, action) => {
        state.loadingCost = false;
        state.error = action.payload;
      })
      
      // ✅ Fetch Recipe Cost
      .addCase(fetchRecipeCost.fulfilled, (state, action) => {
        state.totalCost = action.payload.totalCost;
      });
  },
});

export const { 
  clearError, 
  resetRecipes, 
  setSelectedRecipe, 
  clearCurrentProductRecipes, 
  clearIngredientExists,
  clearCostDetails 
} = recipeSlice.actions;

export default recipeSlice.reducer;