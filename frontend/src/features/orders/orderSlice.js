import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// =====================
// FETCH ALL ORDERS
// =====================
export const fetchAllOrders = createAsyncThunk(
  "orders/fetchAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/orders/all");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// =====================
// CREATE ORDER
// =====================
export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, thunkAPI) => {
    try {
      const response = await api.post("/orders/create", orderData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

// =====================
// UPDATE ORDER STATUS
// =====================
export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await api.patch(
        `/orders/status/${id}`,
        null,
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

// =====================
// UPDATE PAYMENT STATUS
// =====================
export const updatePaymentStatus = createAsyncThunk(
  "orders/updatePayment",
  async ({ id, paymentStatus }, thunkAPI) => {
    try {
      const response = await api.patch(
        `/orders/payment/${id}`,
        null,
        { params: { paymentStatus } }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to update payment"
      );
    }
  }
);

// =====================
// SLICE
// =====================
const orderSlice = createSlice({
  name: "orders",
  initialState: {
    list: [],
    loading: false,
    actionLoading: false,
    error: null
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    }
  },

  extraReducers: (builder) => {
    builder

      // ================= FETCH =================
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= CREATE =================
      .addCase(createOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= STATUS =================
      .addCase(updateOrderStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.list.findIndex(
          (o) => o.id === action.payload.id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // ================= PAYMENT =================
      .addCase(updatePaymentStatus.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.actionLoading = false;

        const index = state.list.findIndex(
          (o) => o.id === action.payload.id
        );

        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError } = orderSlice.actions;
export default orderSlice.reducer;