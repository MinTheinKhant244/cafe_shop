import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// Fetch all inventory items
export const fetchAllInventory = createAsyncThunk(
  "inventory/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch inventory");
    }
  }
);

// Fetch low stock items
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

// Search inventory
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

// Add Stock (Purchase)
export const addStock = createAsyncThunk(
  "inventory/addStock",
  async ({ id, quantity, price, invoiceNo, notes }, thunkAPI) => {
    try {
      const response = await api.post(`/inventory/${id}/add-stock`, null, {
        params: { quantity, price, invoiceNo, notes }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to add stock");
    }
  }
);

// Remove Stock (Usage, Wastage, Return)
export const removeStock = createAsyncThunk(
  "inventory/removeStock",
  async ({ id, quantity, transactionType, referenceId, notes }, thunkAPI) => {
    try {
      const response = await api.post(`/inventory/${id}/remove-stock`, null, {
        params: { quantity, transactionType, referenceId, notes }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to remove stock");
    }
  }
);

// Adjust Stock
export const adjustStock = createAsyncThunk(
  "inventory/adjustStock",
  async ({ id, newQuantity, reason }, thunkAPI) => {
    try {
      const response = await api.put(`/inventory/${id}/adjust-stock`, null, {
        params: { newQuantity, reason }
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to adjust stock");
    }
  }
);

// Get Transaction History
export const getTransactionHistory = createAsyncThunk(
  "inventory/getTransactionHistory",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/${id}/transactions`);
      return { id, transactions: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch transactions");
    }
  }
);

// Get Price History
export const getPriceHistory = createAsyncThunk(
  "inventory/getPriceHistory",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/${id}/price-history`);
      return { id, priceHistory: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch price history");
    }
  }
);

// Get Average Purchase Price
export const getAveragePurchasePrice = createAsyncThunk(
  "inventory/getAveragePrice",
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/inventory/${id}/average-price`);
      return { id, averagePrice: response.data.averagePrice };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to get average price");
    }
  }
);

// Get Total Stock Value
export const getTotalStockValue = createAsyncThunk(
  "inventory/getTotalValue",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/inventory/total-value");
      return response.data.totalValue;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to get total value");
    }
  }
);

// Update stock (legacy - keep for compatibility)
export const updateStock = createAsyncThunk(
  "inventory/updateStock",
  async ({ id, quantity }, thunkAPI) => {
    try {
      const response = await api.patch(`/inventory/${id}/stock?quantity=${quantity}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to update stock");
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
    transactions: {},
    priceHistory: {},
    averagePrices: {},
    totalStockValue: 0,
    selectedInventory: null
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
      state.transactions = {};
      state.priceHistory = {};
      state.averagePrices = {};
      state.totalStockValue = 0;
    },
    setSelectedInventory: (state, action) => {
      state.selectedInventory = action.payload;
    },
    clearTransactions: (state, action) => {
      if (action.payload) {
        delete state.transactions[action.payload];
      } else {
        state.transactions = {};
      }
    }
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
        state.list = action.payload;
        state.error = null;
      })
      .addCase(fetchAllInventory.rejected, (state, action) => {
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
        state.lowStockItems = action.payload;
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
        state.searchResults = action.payload;
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
        state.list.push(action.payload);
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
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
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
      
      // Add Stock
      .addCase(addStock.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(addStock.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload.inventory?.id);
        if (index !== -1) state.list[index] = action.payload.inventory;
        state.error = null;
      })
      .addCase(addStock.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Remove Stock
      .addCase(removeStock.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(removeStock.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload.inventory?.id);
        if (index !== -1) state.list[index] = action.payload.inventory;
        state.error = null;
      })
      .addCase(removeStock.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Adjust Stock
      .addCase(adjustStock.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(adjustStock.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
        state.error = null;
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Update Stock (legacy)
      .addCase(updateStock.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.list.findIndex(item => item.id === action.payload.inventory?.id);
        if (index !== -1) state.list[index] = action.payload.inventory;
        state.error = null;
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Get Transaction History
      .addCase(getTransactionHistory.fulfilled, (state, action) => {
        state.transactions[action.payload.id] = action.payload.transactions;
      })
      
      // Get Price History
      .addCase(getPriceHistory.fulfilled, (state, action) => {
        state.priceHistory[action.payload.id] = action.payload.priceHistory;
      })
      
      // Get Average Price
      .addCase(getAveragePurchasePrice.fulfilled, (state, action) => {
        state.averagePrices[action.payload.id] = action.payload.averagePrice;
      })
      
      // Get Total Stock Value
      .addCase(getTotalStockValue.fulfilled, (state, action) => {
        state.totalStockValue = action.payload;
      });
  },
});

export const { clearError, resetInventory, setSelectedInventory, clearTransactions } = inventorySlice.actions;
export default inventorySlice.reducer;