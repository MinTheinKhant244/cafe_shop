import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

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

export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, thunkAPI) => {
    try {
      const response = await api.post("/orders/create", orderData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.stockIssues) {
        return thunkAPI.rejectWithValue({
          message: "Insufficient stock",
          stockIssues: errorData.stockIssues
        });
      }
      return thunkAPI.rejectWithValue(
        errorData?.message || "Failed to create order"
      );
    }
  }
);

export const deductStockForOrder = createAsyncThunk(
  "orders/deductStock",
  async (orderId, thunkAPI) => {
    try {
      const response = await api.post(`/order/${orderId}/deduct`);
      return { orderId, message: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.error || "Failed to deduct stock for order"
      );
    }
  }
);

export const checkStockBeforeOrder = createAsyncThunk(
  "orders/checkStock",
  async (items, thunkAPI) => {
    try {
      const response = await api.post("/orders/check-stock", { items });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to check stock"
      );
    }
  }
);

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

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    list: [],
    loading: false,
    actionLoading: false,
    error: null,
    stockCheck: { loading: false, issues: [], available: true },
    orderDeductionStatus: {}  // ⭐ NEW: Track deduction status by orderId
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearStockIssues: (state) => {
      state.stockCheck = { loading: false, issues: [], available: true };
    },
    clearOrderDeductionStatus: (state, action) => {  // ⭐ NEW: Clear deduction status
      if (action.payload) {
        delete state.orderDeductionStatus[action.payload];
      } else {
        state.orderDeductionStatus = {};
      }
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

      // ================= CHECK STOCK =================
      .addCase(checkStockBeforeOrder.pending, (state) => {
        state.stockCheck.loading = true;
      })
      .addCase(checkStockBeforeOrder.fulfilled, (state, action) => {
        state.stockCheck.loading = false;
        state.stockCheck.available = action.payload.available;
        state.stockCheck.issues = action.payload.issues || [];
      })
      .addCase(checkStockBeforeOrder.rejected, (state, action) => {
        state.stockCheck.loading = false;
        state.stockCheck.available = false;
        state.stockCheck.issues = [];
        state.error = action.payload;
      })

      // ================= CREATE =================
      .addCase(createOrder.pending, (state) => {
        state.actionLoading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.list.unshift(action.payload);
        state.stockCheck = { loading: false, issues: [], available: true };
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.payload;
        if (action.payload?.stockIssues) {
          state.stockCheck = {
            loading: false,
            available: false,
            issues: action.payload.stockIssues
          };
        }
      })

      // ================= DEDUCT STOCK (NEW) =================
      .addCase(deductStockForOrder.pending, (state, action) => {
        state.orderDeductionStatus[action.meta.arg] = { status: 'loading', message: null };
      })
      .addCase(deductStockForOrder.fulfilled, (state, action) => {
        state.orderDeductionStatus[action.payload.orderId] = {
          status: 'succeeded',
          message: action.payload.message
        };
      })
      .addCase(deductStockForOrder.rejected, (state, action) => {
        if (action.meta.arg) {
          state.orderDeductionStatus[action.meta.arg] = {
            status: 'failed',
            message: action.payload
          };
        }
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

export const { clearOrderError, clearStockIssues, clearOrderDeductionStatus } = orderSlice.actions;
export default orderSlice.reducer;