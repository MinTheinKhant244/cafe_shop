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
      // Stock error ကို သီးသန့် handle လုပ်ဖို့
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
    stockCheck: { loading: false, issues: [], available: true } // ⭐ Stock check state
  },

  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearStockIssues: (state) => {  // ⭐ Clear stock issues
      state.stockCheck = { loading: false, issues: [], available: true };
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
        state.stockCheck = { loading: false, issues: [], available: true }; // Reset stock check
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || action.payload;
        // ⭐ Stock issues ရှိရင် သိမ်းထားပါ
        if (action.payload?.stockIssues) {
          state.stockCheck = {
            loading: false,
            available: false,
            issues: action.payload.stockIssues
          };
        }
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

export const { clearOrderError, clearStockIssues } = orderSlice.actions;
export default orderSlice.reducer;