import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// 1. Fetch All Orders
export const fetchAllOrders = createAsyncThunk("orders/fetchAll", async (_, thunkAPI) => {
  try {
    const response = await api.get("/orders/all");
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
  }
});

// 2. Update Order Status
export const updateOrderStatus = createAsyncThunk("orders/updateStatus", async ({ id, status }, thunkAPI) => {
  try {
    const response = await api.patch(`/orders/update-status/${id}?status=${status}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update status");
  }
});

// 3. Update Payment Status (အရေးကြီး: ဤ function ကို ထည့်ပေးပါ)
export const updatePaymentStatus = createAsyncThunk("orders/updatePayment", async ({ id, paymentStatus }, thunkAPI) => {
  try {
    const response = await api.patch(`/orders/update-payment/${id}?paymentStatus=${paymentStatus}`);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Failed to update payment");
  }
});

const orderSlice = createSlice({
  name: "orders",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrders.pending, (state) => { state.loading = true; })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Status Update
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(o => o.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      })
      // Payment Update
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.list.findIndex(o => o.id === action.payload.id);
        if (index !== -1) state.list[index] = action.payload;
      });
  },
});

export default orderSlice.reducer;