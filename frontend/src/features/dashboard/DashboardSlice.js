import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchAll", 
  async (_, { rejectWithValue }) => {
    try {
      const [summary, trend, popular] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/sales-trend?days=7"),
        api.get("/dashboard/popular-products")
      ]);
      
      return { 
        summary: summary.data, 
        trend: trend.data, 
        popular: popular.data 
      };
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: { totalRevenue: 0, totalOrders: 0, activeTables: 0, pendingOrders: 0 },
    trend: [],
    popular: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.trend = action.payload.trend;
        state.popular = action.payload.popular;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;