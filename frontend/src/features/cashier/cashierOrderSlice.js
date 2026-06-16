// features/cashier/orders/cashierOrderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// ============================================
// FETCH ORDERS WITH FILTERS
// ============================================
export const fetchCashierOrders = createAsyncThunk(
  "cashierOrders/fetchAll",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== "ALL") {
        params.append("status", filters.status);
      }
      if (filters.orderSource && filters.orderSource !== "ALL") {
        params.append("orderSource", filters.orderSource);
      }
      if (filters.search) {
        params.append("search", filters.search);
      }
      if (filters.dateRange && filters.dateRange !== "ALL") {
        params.append("dateRange", filters.dateRange);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/orders/cashier/orders?${queryString}` : "/orders/cashier/orders";
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// ============================================
// FETCH ORDER SUMMARY
// ============================================
export const fetchOrderSummary = createAsyncThunk(
  "cashierOrders/fetchSummary",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/orders/cashier/summary");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch summary"
      );
    }
  }
);

// ============================================
// FETCH ORDER BY ID
// ============================================
export const fetchOrderById = createAsyncThunk(
  "cashierOrders/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order"
      );
    }
  }
);

// ============================================
// UPDATE ORDER STATUS
// ============================================
export const updateOrderStatus = createAsyncThunk(
  "cashierOrders/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/orders/cashier/status/${id}?status=${status}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

// ============================================
// UPDATE PAYMENT STATUS (Single API call)
// ============================================
export const updatePaymentStatus = createAsyncThunk(
  "cashierOrders/updatePayment",
  async ({ id, paymentStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/orders/cashier/payment/${id}?paymentStatus=${paymentStatus}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update payment"
      );
    }
  }
);

// ============================================
// CANCEL ORDER
// ============================================
export const cancelOrder = createAsyncThunk(
  "cashierOrders/cancel",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/orders/cashier/cancel/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to cancel order"
      );
    }
  }
);

// ============================================
// 🆕 PROCESS FULL PAYMENT (Payment + Complete)
// ============================================
export const processPayment = createAsyncThunk(
  "cashierOrders/processPayment",
  async ({ id, paymentMethod, cashReceived }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (paymentMethod) params.append("paymentMethod", paymentMethod);
      if (cashReceived) params.append("cashReceived", cashReceived);
      
      const queryString = params.toString();
      const url = queryString 
        ? `/orders/cashier/payment/process/${id}?${queryString}`
        : `/orders/cashier/payment/process/${id}`;
      
      const response = await api.post(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Payment processing failed"
      );
    }
  }
);

// ============================================
// 🆕 FETCH PENDING PAYMENT ORDERS
// ============================================
export const fetchPendingPayments = createAsyncThunk(
  "cashierOrders/fetchPendingPayments",
  async (orderSource = null, { rejectWithValue }) => {
    try {
      const url = orderSource 
        ? `/orders/cashier/pending-payments?orderSource=${orderSource}`
        : "/orders/cashier/pending-payments";
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending payments"
      );
    }
  }
);

// ============================================
// 🆕 FETCH TODAY'S REVENUE
// ============================================
export const fetchTodayRevenue = createAsyncThunk(
  "cashierOrders/fetchTodayRevenue",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/orders/cashier/today-revenue");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch revenue"
      );
    }
  }
);

// ============================================
// SLICE
// ============================================
const cashierOrderSlice = createSlice({
  name: "cashierOrders",
  
  initialState: {
    orders: [],
    selectedOrder: null,
    pendingPayments: [],        // 🆕
    revenue: null,              // 🆕
    summary: {
      pendingOrders: 0,
      preparingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingPaymentOrders: 0,
      todayRevenue: 0,
      totalOrdersToday: 0
    },
    loading: false,
    actionLoading: false,
    error: null,
    filters: {
      status: "ALL",
      orderSource: "ALL",
      search: "",
      dateRange: "TODAY"
    }
  },
  
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedOrder: (state) => {
      state.selectedOrder = null;
    },
    clearPendingPayments: (state) => {
      state.pendingPayments = [];
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        status: "ALL",
        orderSource: "ALL",
        search: "",
        dateRange: "TODAY"
      };
    }
  },
  
  extraReducers: (builder) => {
    builder
      // ===== FETCH ORDERS =====
      .addCase(fetchCashierOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashierOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchCashierOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orders = [];
      })
      
      // ===== FETCH SUMMARY =====
      .addCase(fetchOrderSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderSummary.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload || {};
        state.summary = {
          pendingOrders: data.pendingOrders || 0,
          preparingOrders: data.preparingOrders || 0,
          completedOrders: data.completedOrders || 0,
          cancelledOrders: data.cancelledOrders || 0,
          pendingPaymentOrders: data.pendingPaymentOrders || 0,
          todayRevenue: data.todayRevenue || 0,
          totalOrdersToday: data.totalOrdersToday || 0
        };
      })
      .addCase(fetchOrderSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ===== FETCH BY ID =====
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedOrder = null;
      })
      
      // ===== UPDATE STATUS =====
      .addCase(updateOrderStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedOrder = action.payload;
        if (updatedOrder) {
          const index = state.orders.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            state.orders[index] = updatedOrder;
          }
          if (state.selectedOrder?.id === updatedOrder.id) {
            state.selectedOrder = updatedOrder;
          }
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // ===== UPDATE PAYMENT =====
      .addCase(updatePaymentStatus.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedOrder = action.payload;
        if (updatedOrder) {
          const index = state.orders.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            state.orders[index] = updatedOrder;
          }
          if (state.selectedOrder?.id === updatedOrder.id) {
            state.selectedOrder = updatedOrder;
          }
        }
      })
      .addCase(updatePaymentStatus.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // ===== CANCEL ORDER =====
      .addCase(cancelOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedOrder = action.payload;
        if (updatedOrder) {
          const index = state.orders.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            state.orders[index] = updatedOrder;
          }
          if (state.selectedOrder?.id === updatedOrder.id) {
            state.selectedOrder = updatedOrder;
          }
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // ===== PROCESS PAYMENT =====
      .addCase(processPayment.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.actionLoading = false;
        const updatedOrder = action.payload;
        if (updatedOrder) {
          const index = state.orders.findIndex(o => o.id === updatedOrder.id);
          if (index !== -1) {
            state.orders[index] = updatedOrder;
          }
          if (state.selectedOrder?.id === updatedOrder.id) {
            state.selectedOrder = updatedOrder;
          }
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // ===== 🆕 FETCH PENDING PAYMENTS =====
      .addCase(fetchPendingPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingPayments = action.payload || [];
      })
      .addCase(fetchPendingPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.pendingPayments = [];
      })
      
      // ===== 🆕 FETCH TODAY'S REVENUE =====
      .addCase(fetchTodayRevenue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodayRevenue.fulfilled, (state, action) => {
        state.loading = false;
        state.revenue = action.payload;
      })
      .addCase(fetchTodayRevenue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.revenue = null;
      });
  }
});

export const {
  clearError,
  clearSelectedOrder,
  clearPendingPayments,
  setFilters,
  resetFilters
} = cashierOrderSlice.actions;

export default cashierOrderSlice.reducer;