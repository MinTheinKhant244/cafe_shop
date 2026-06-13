// features/inventory/inventorySlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// Fetch all inventory items
export const fetchAllInventory = createAsyncThunk(
  "inventory/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory");
      return response.data; // Returns array directly
    } catch (error) {
      console.error("API Error:", error);
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch inventory");
    }
  }
);

// Fetch single inventory item by ID
export const fetchInventoryById = createAsyncThunk(
  "inventory/fetchById",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch inventory item");
    }
  }
);

// Get low stock items
export const fetchLowStock = createAsyncThunk(
  "inventory/fetchLowStock",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory/low-stock");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch low stock items");
    }
  }
);

// Search inventory by keyword
export const searchInventory = createAsyncThunk(
  "inventory/search",
  async (keyword, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/search?keyword=${keyword}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Search failed");
    }
  }
);

// Add new inventory item
export const addInventory = createAsyncThunk(
  "inventory/add",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/inventory", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to add inventory");
    }
  }
);

// Update inventory item
export const updateInventory = createAsyncThunk(
  "inventory/update",
  async ({ id, data }, thunkAPI) => {
    try {
      const response = await api.put(`/inventory/${id}`, data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to update inventory");
    }
  }
);

// Delete inventory item
export const deleteInventory = createAsyncThunk(
  "inventory/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/inventory/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to delete inventory");
    }
  }
);

// Get items below threshold
export const getBelowThreshold = createAsyncThunk(
  "inventory/getBelowThreshold",
  async (threshold, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/below-threshold/${threshold}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch items below threshold");
    }
  }
);

// Get total stock value
export const getTotalStockValue = createAsyncThunk(
  "inventory/getTotalValue",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory/total-value");
      return response.data.totalValue || response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to get total value");
    }
  }
);

// Check if name exists
export const checkNameExists = createAsyncThunk(
  "inventory/checkName",
  async (name, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/check-name?name=${name}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to check name");
    }
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    list: [],
    loading: false,
    error: null,
    operationLoading: false,
    lowStockItems: [],
    searchResults: [],
    totalStockValue: 0,
    selectedInventory: null,
    belowThresholdItems: [],
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetInventory: (state) => {
      state.list = [];
      state.error = null;
      state.loading = false;
      state.operationLoading = false;
      state.lowStockItems = [];
      state.searchResults = [];
      state.totalStockValue = 0;
      state.selectedInventory = null;
      state.belowThresholdItems = [];
    },
    setSelectedInventory: (state, action) => {
      state.selectedInventory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAllInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
        console.log("Inventory loaded:", state.list.length, "items");
      })
      .addCase(fetchAllInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.list = [];
      })
      
      // Fetch By ID
      .addCase(fetchInventoryById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedInventory = action.payload;
        state.error = null;
      })
      .addCase(fetchInventoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Low Stock
      .addCase(fetchLowStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLowStock.fulfilled, (state, action) => {
        state.loading = false;
        state.lowStockItems = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchLowStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Search
      .addCase(searchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(searchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add
      .addCase(addInventory.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(addInventory.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (action.payload) {
          state.list.push(action.payload);
        }
        state.error = null;
      })
      .addCase(addInventory.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Update
      .addCase(updateInventory.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload?.id);
        if (index !== -1 && action.payload) {
          state.list[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Delete
      .addCase(deleteInventory.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(deleteInventory.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.list = state.list.filter(item => item.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteInventory.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Get Below Threshold
      .addCase(getBelowThreshold.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBelowThreshold.fulfilled, (state, action) => {
        state.loading = false;
        state.belowThresholdItems = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(getBelowThreshold.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Total Stock Value
      .addCase(getTotalStockValue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTotalStockValue.fulfilled, (state, action) => {
        state.loading = false;
        state.totalStockValue = action.payload || 0;
        state.error = null;
      })
      .addCase(getTotalStockValue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Check Name Exists
      .addCase(checkNameExists.fulfilled, (state, action) => {
        // This doesn't modify state, just used for validation
      });
  },
});

export const { 
  clearError, 
  resetInventory, 
  setSelectedInventory 
} = inventorySlice.actions;

export default inventorySlice.reducer;