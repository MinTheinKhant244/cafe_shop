// features/dashboard/dashboardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// ============================================================
// FETCH DASHBOARD SUMMARY
// ============================================================
export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      console.log("📡 Fetching dashboard summary...");
      const response = await api.get("/dashboard/summary");
      console.log("📡 Dashboard data received:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Dashboard fetch error:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch dashboard data"
      );
    }
  }
);

// ============================================================
// FETCH TODAY STATS
// ============================================================
export const fetchTodayStats = createAsyncThunk(
  "dashboard/fetchToday",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/today");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch today stats"
      );
    }
  }
);

// ============================================================
// FETCH WEEKLY STATS
// ============================================================
export const fetchWeeklyStats = createAsyncThunk(
  "dashboard/fetchWeekly",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/weekly");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch weekly stats"
      );
    }
  }
);

// ============================================================
// FETCH MONTHLY STATS
// ============================================================
export const fetchMonthlyStats = createAsyncThunk(
  "dashboard/fetchMonthly",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/monthly");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch monthly stats"
      );
    }
  }
);

// ============================================================
// FETCH OVERALL STATS
// ============================================================
export const fetchOverallStats = createAsyncThunk(
  "dashboard/fetchOverall",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/overall");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch overall stats"
      );
    }
  }
);

// ============================================================
// FETCH RECENT ORDERS
// ============================================================
export const fetchRecentOrders = createAsyncThunk(
  "dashboard/fetchRecentOrders",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await api.get(`/dashboard/recent-orders?limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch recent orders"
      );
    }
  }
);

// ============================================================
// FETCH TOP PRODUCTS
// ============================================================
export const fetchTopProducts = createAsyncThunk(
  "dashboard/fetchTopProducts",
  async ({ limit = 5, days = 30 } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get(`/dashboard/top-products?limit=${limit}&days=${days}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch top products"
      );
    }
  }
);

// ============================================================
// FETCH SALES TREND
// ============================================================
export const fetchSalesTrend = createAsyncThunk(
  "dashboard/fetchSalesTrend",
  async (days = 7, { rejectWithValue }) => {
    try {
      const response = await api.get(`/dashboard/sales-trend?days=${days}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch sales trend"
      );
    }
  }
);

// ============================================================
// FETCH LOW STOCK ITEMS
// ============================================================
export const fetchLowStockItems = createAsyncThunk(
  "dashboard/fetchLowStock",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/dashboard/low-stock");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch low stock items"
      );
    }
  }
);

// ============================================================
// SLICE
// ============================================================
const dashboardSlice = createSlice({
  name: "dashboard",
  
  initialState: {
    // Complete dashboard
    summary: {
      todayStats: null,
      weeklyStats: null,
      monthlyStats: null,
      overallStats: null,
      recentOrders: [],
      topProducts: [],
      salesTrend: [],
      lowStockItems: [],
      lowStockCount: 0
    },
    
    // Individual stats
    todayStats: null,
    weeklyStats: null,
    monthlyStats: null,
    overallStats: null,
    recentOrders: [],
    topProducts: [],
    salesTrend: [],
    lowStockItems: [],
    
    // Loading states
    loading: false,
    loadingToday: false,
    loadingWeekly: false,
    loadingMonthly: false,
    loadingOverall: false,
    loadingRecentOrders: false,
    loadingTopProducts: false,
    loadingSalesTrend: false,
    loadingLowStock: false,
    
    // Error states
    error: null,
    errorToday: null,
    errorWeekly: null,
    errorMonthly: null,
    errorOverall: null,
    errorRecentOrders: null,
    errorTopProducts: null,
    errorSalesTrend: null,
    errorLowStock: null,
    
    // Last updated
    lastUpdated: null
  },
  
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.errorToday = null;
      state.errorWeekly = null;
      state.errorMonthly = null;
      state.errorOverall = null;
      state.errorRecentOrders = null;
      state.errorTopProducts = null;
      state.errorSalesTrend = null;
      state.errorLowStock = null;
    },
    resetDashboard: (state) => {
      state.summary = {
        todayStats: null,
        weeklyStats: null,
        monthlyStats: null,
        overallStats: null,
        recentOrders: [],
        topProducts: [],
        salesTrend: [],
        lowStockItems: [],
        lowStockCount: 0
      };
      state.todayStats = null;
      state.weeklyStats = null;
      state.monthlyStats = null;
      state.overallStats = null;
      state.recentOrders = [];
      state.topProducts = [];
      state.salesTrend = [];
      state.lowStockItems = [];
      state.lastUpdated = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // ============================================================
      // FETCH DASHBOARD SUMMARY
      // ============================================================
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.lastUpdated = new Date().toISOString();
        
        // Also populate individual stats
        state.todayStats = action.payload.todayStats;
        state.weeklyStats = action.payload.weeklyStats;
        state.monthlyStats = action.payload.monthlyStats;
        state.overallStats = action.payload.overallStats;
        state.recentOrders = action.payload.recentOrders || [];
        state.topProducts = action.payload.topProducts || [];
        state.salesTrend = action.payload.salesTrend || [];
        state.lowStockItems = action.payload.lowStockItems || [];
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================
      // FETCH TODAY STATS
      // ============================================================
      .addCase(fetchTodayStats.pending, (state) => {
        state.loadingToday = true;
        state.errorToday = null;
      })
      .addCase(fetchTodayStats.fulfilled, (state, action) => {
        state.loadingToday = false;
        state.todayStats = action.payload;
        state.summary.todayStats = action.payload;
      })
      .addCase(fetchTodayStats.rejected, (state, action) => {
        state.loadingToday = false;
        state.errorToday = action.payload;
      })
      
      // ============================================================
      // FETCH WEEKLY STATS
      // ============================================================
      .addCase(fetchWeeklyStats.pending, (state) => {
        state.loadingWeekly = true;
        state.errorWeekly = null;
      })
      .addCase(fetchWeeklyStats.fulfilled, (state, action) => {
        state.loadingWeekly = false;
        state.weeklyStats = action.payload;
        state.summary.weeklyStats = action.payload;
      })
      .addCase(fetchWeeklyStats.rejected, (state, action) => {
        state.loadingWeekly = false;
        state.errorWeekly = action.payload;
      })
      
      // ============================================================
      // FETCH MONTHLY STATS
      // ============================================================
      .addCase(fetchMonthlyStats.pending, (state) => {
        state.loadingMonthly = true;
        state.errorMonthly = null;
      })
      .addCase(fetchMonthlyStats.fulfilled, (state, action) => {
        state.loadingMonthly = false;
        state.monthlyStats = action.payload;
        state.summary.monthlyStats = action.payload;
      })
      .addCase(fetchMonthlyStats.rejected, (state, action) => {
        state.loadingMonthly = false;
        state.errorMonthly = action.payload;
      })
      
      // ============================================================
      // FETCH OVERALL STATS
      // ============================================================
      .addCase(fetchOverallStats.pending, (state) => {
        state.loadingOverall = true;
        state.errorOverall = null;
      })
      .addCase(fetchOverallStats.fulfilled, (state, action) => {
        state.loadingOverall = false;
        state.overallStats = action.payload;
        state.summary.overallStats = action.payload;
      })
      .addCase(fetchOverallStats.rejected, (state, action) => {
        state.loadingOverall = false;
        state.errorOverall = action.payload;
      })
      
      // ============================================================
      // FETCH RECENT ORDERS
      // ============================================================
      .addCase(fetchRecentOrders.pending, (state) => {
        state.loadingRecentOrders = true;
        state.errorRecentOrders = null;
      })
      .addCase(fetchRecentOrders.fulfilled, (state, action) => {
        state.loadingRecentOrders = false;
        state.recentOrders = action.payload;
        state.summary.recentOrders = action.payload;
      })
      .addCase(fetchRecentOrders.rejected, (state, action) => {
        state.loadingRecentOrders = false;
        state.errorRecentOrders = action.payload;
      })
      
      // ============================================================
      // FETCH TOP PRODUCTS
      // ============================================================
      .addCase(fetchTopProducts.pending, (state) => {
        state.loadingTopProducts = true;
        state.errorTopProducts = null;
      })
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.loadingTopProducts = false;
        state.topProducts = action.payload;
        state.summary.topProducts = action.payload;
      })
      .addCase(fetchTopProducts.rejected, (state, action) => {
        state.loadingTopProducts = false;
        state.errorTopProducts = action.payload;
      })
      
      // ============================================================
      // FETCH SALES TREND
      // ============================================================
      .addCase(fetchSalesTrend.pending, (state) => {
        state.loadingSalesTrend = true;
        state.errorSalesTrend = null;
      })
      .addCase(fetchSalesTrend.fulfilled, (state, action) => {
        state.loadingSalesTrend = false;
        state.salesTrend = action.payload;
        state.summary.salesTrend = action.payload;
      })
      .addCase(fetchSalesTrend.rejected, (state, action) => {
        state.loadingSalesTrend = false;
        state.errorSalesTrend = action.payload;
      })
      
      // ============================================================
      // FETCH LOW STOCK ITEMS
      // ============================================================
      .addCase(fetchLowStockItems.pending, (state) => {
        state.loadingLowStock = true;
        state.errorLowStock = null;
      })
      .addCase(fetchLowStockItems.fulfilled, (state, action) => {
        state.loadingLowStock = false;
        state.lowStockItems = action.payload;
        state.summary.lowStockItems = action.payload;
        state.summary.lowStockCount = action.payload?.length || 0;
      })
      .addCase(fetchLowStockItems.rejected, (state, action) => {
        state.loadingLowStock = false;
        state.errorLowStock = action.payload;
      });
  }
});

// ============================================================
// EXPORT ACTIONS
// ============================================================
export const {
  clearDashboardError,
  clearAllErrors,
  resetDashboard
} = dashboardSlice.actions;

// ============================================================
// SELECTORS
// ============================================================
export const selectDashboardSummary = (state) => state.dashboard?.summary;
export const selectTodayStats = (state) => state.dashboard?.todayStats;
export const selectWeeklyStats = (state) => state.dashboard?.weeklyStats;
export const selectMonthlyStats = (state) => state.dashboard?.monthlyStats;
export const selectOverallStats = (state) => state.dashboard?.overallStats;
export const selectRecentOrders = (state) => state.dashboard?.recentOrders;
export const selectTopProducts = (state) => state.dashboard?.topProducts;
export const selectSalesTrend = (state) => state.dashboard?.salesTrend;
export const selectLowStockItems = (state) => state.dashboard?.lowStockItems;
export const selectLowStockCount = (state) => state.dashboard?.summary?.lowStockCount || 0;
export const selectDashboardLoading = (state) => state.dashboard?.loading;
export const selectDashboardError = (state) => state.dashboard?.error;
export const selectDashboardLastUpdated = (state) => state.dashboard?.lastUpdated;

export default dashboardSlice.reducer;