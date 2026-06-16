// features/inventoryTransaction/inventoryTransactionSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// Stock In
export const stockIn = createAsyncThunk(
  "inventoryTransaction/stockIn",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/inventory-transactions/stock-in", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Stock in failed");
    }
  }
);

// Stock Out
export const stockOut = createAsyncThunk(
  "inventoryTransaction/stockOut",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/inventory-transactions/stock-out", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Stock out failed");
    }
  }
);

// Adjust Stock
export const adjustStock = createAsyncThunk(
  "inventoryTransaction/adjustStock",
  async (data, thunkAPI) => {
    try {
      const response = await api.post("/inventory-transactions/adjust", data);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Adjustment failed");
    }
  }
);

// Get Transactions by Inventory ID
export const getTxByInventory = createAsyncThunk(
  "inventoryTransaction/getByInventory",
  async (inventoryId, thunkAPI) => {
    try {
      const response = await api.get(`/inventory-transactions/inventory/${inventoryId}`);
      return { inventoryId, data: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch transactions");
    }
  }
);

// Get Transactions by Date Range
export const getTxByDateRange = createAsyncThunk(
  "inventoryTransaction/getByDateRange",
  async ({ start, end }, thunkAPI) => {
    try {
      const response = await api.get(`/inventory-transactions/date-range?start=${start}&end=${end}`);
      return response.data; 
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.error || "Failed to fetch by date range");
    }
  }
);

const inventoryTransactionSlice = createSlice({
  name: "inventoryTransaction",
  initialState: {
    transactions: [],
    currentInventoryTx: [],
    loading: false,
    error: null,
    operationLoading: false,
    totalStockIn: 0,
    totalStockOut: 0,
  },
  reducers: {
    clearTxError: (state) => {
      state.error = null;
    },
    resetTx: (state) => {
      state.transactions = [];
      state.currentInventoryTx = [];
      state.error = null;
      state.loading = false;
      state.operationLoading = false;
    },
    clearCurrentTx: (state) => {
      state.currentInventoryTx = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Stock In
      .addCase(stockIn.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(stockIn.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (action.payload) {
          state.transactions.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(stockIn.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Stock Out
      .addCase(stockOut.pending, (state) => {
        state.operationLoading = true;
        state.error = null;
      })
      .addCase(stockOut.fulfilled, (state, action) => {
        state.operationLoading = false;
        if (action.payload) {
          state.transactions.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(stockOut.rejected, (state, action) => {
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
        if (action.payload) {
          state.transactions.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(adjustStock.rejected, (state, action) => {
        state.operationLoading = false;
        state.error = action.payload;
      })
      
      // Get by Inventory
      .addCase(getTxByInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTxByInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.currentInventoryTx = Array.isArray(action.payload.data) ? action.payload.data : [];
        state.error = null;
      })
      .addCase(getTxByInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get by Date Range
      .addCase(getTxByDateRange.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTxByDateRange.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(getTxByDateRange.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearTxError, 
  resetTx, 
  clearCurrentTx 
} = inventoryTransactionSlice.actions;

export default inventoryTransactionSlice.reducer;

