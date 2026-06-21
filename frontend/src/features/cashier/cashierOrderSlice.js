// features/cashier/orders/cashierOrderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../app/api";

// ============================================
// HELPER: Get Date Range - Return YYYY-MM-DD format
// ============================================
const getDateRange = (dateRange) => {
  const today = new Date();
  let startDate, endDate;
  
  switch (dateRange) {
    case "TODAY":
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case "YESTERDAY":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = new Date(yesterday);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(yesterday);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case "THIS_WEEK":
      const weekStart = new Date(today);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);
      startDate = weekStart;
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    case "THIS_MONTH":
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      startDate = monthStart;
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
      
    default:
      return null;
  }
  
  // Return YYYY-MM-DD format only
  return { 
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

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
      
      if (filters.dateRange && filters.dateRange !== "ALL") {
        const dateRange = getDateRange(filters.dateRange);
        if (dateRange) {
          params.append("startDate", dateRange.startDate);
          params.append("endDate", dateRange.endDate);
        }
      }
      
      if (filters.search) {
        params.append("search", filters.search);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/orders/cashier/orders?${queryString}` : "/orders/cashier/orders";
      
      console.log("📡 API Request URL:", url);
      console.log("📡 Filters:", filters);
      
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
// HELPER: Calculate Summary from Orders
// ✅ FIXED: Revenue and Total Orders based on filtered orders
// ============================================
const calculateSummaryFromOrders = (orders) => {
  if (!orders || orders.length === 0) {
    return {
      pendingOrders: 0,
      preparingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      pendingPaymentOrders: 0,
      todayRevenue: 0,
      totalOrdersToday: 0
    };
  }

  // ✅ Status counts from filtered orders
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const preparingOrders = orders.filter(o => o.status === "PREPARING").length;
  const completedOrders = orders.filter(o => o.status === "COMPLETED").length;
  const cancelledOrders = orders.filter(o => o.status === "CANCELLED").length;
  const pendingPaymentOrders = orders.filter(o => o.paymentStatus === "PENDING" && o.status !== "CANCELLED").length;
  
  // ✅ FIXED: Revenue from filtered orders (not just today)
  const revenue = orders
    .filter(o => o.status === "COMPLETED" || o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // ✅ FIXED: Total orders from filtered orders (not just today)
  const totalOrders = orders.length;

  console.log("📊 Calculated Summary:", {
    totalOrders,
    pendingOrders,
    preparingOrders,
    completedOrders,
    cancelledOrders,
    pendingPaymentOrders,
    revenue
  });

  return {
    pendingOrders,
    preparingOrders,
    completedOrders,
    cancelledOrders,
    pendingPaymentOrders,
    todayRevenue: revenue,        // ✅ Filter ပေါ်မူတည်ပြီး
    totalOrdersToday: totalOrders // ✅ Filter ပေါ်မူတည်ပြီး
  };
};

// ============================================
// FETCH ORDER BY ID
// ============================================
export const fetchOrderById = createAsyncThunk(
  "cashierOrders/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${id}`);
      console.log("📦 Order detail response:", response.data);
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
// UPDATE PAYMENT STATUS
// ============================================
export const updatePaymentStatus = createAsyncThunk(
  "orders/updatePayment",
  async ({ id, paymentMethod, paymentStatus }, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (paymentMethod) params.append("paymentMethod", paymentMethod);
      if (paymentStatus) params.append("paymentStatus", paymentStatus);
      
      const response = await api.patch(
        `/orders/cashier/payment/${id}?${params.toString()}`, 
        null
      );
      
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Payment processing failed"
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
// PROCESS FULL PAYMENT
// ============================================
// export const processPayment = createAsyncThunk(
//   "cashierOrders/processPayment",
//   async ({ id, paymentMethod, cashReceived }, { rejectWithValue }) => {
//     try {
//       const params = new URLSearchParams();
//       if (paymentMethod) params.append("paymentMethod", paymentMethod);
//       if (cashReceived) params.append("cashReceived", cashReceived);
      
//       const queryString = params.toString();
//       const url = queryString 
//         ? `/orders/cashier/payment/process/${id}?${queryString}`
//         : `/orders/cashier/payment/process/${id}`;
      
//       const response = await api.post(url);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(
//         error.response?.data?.message || "Payment processing failed"
//       );
//     }
//   }
// );

// ============================================
// FETCH PENDING PAYMENT ORDERS
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
// ADD ITEM TO ORDER
// ============================================
export const addItemToOrder = createAsyncThunk(
  "cashierOrders/addItem",
  async ({ orderId, productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/orders/${orderId}/items`, {
        productId,
        quantity: quantity 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add item to order"
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
    pendingPayments: [],
    revenue: null,
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
        // ✅ Auto-calculate summary from orders
        state.summary = calculateSummaryFromOrders(state.orders);
      })
      .addCase(fetchCashierOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.orders = [];
        state.summary = calculateSummaryFromOrders([]);
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
          // ✅ Recalculate summary
          state.summary = calculateSummaryFromOrders(state.orders);
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
          // ✅ Recalculate summary
          state.summary = calculateSummaryFromOrders(state.orders);
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
          // ✅ Recalculate summary
          state.summary = calculateSummaryFromOrders(state.orders);
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      // ===== PROCESS PAYMENT =====
      // .addCase(processPayment.pending, (state) => {
      //   state.actionLoading = true;
      //   state.error = null;
      // })
      // .addCase(processPayment.fulfilled, (state, action) => {
      //   state.actionLoading = false;
      //   const updatedOrder = action.payload;
      //   if (updatedOrder) {
      //     const index = state.orders.findIndex(o => o.id === updatedOrder.id);
      //     if (index !== -1) {
      //       state.orders[index] = updatedOrder;
      //     }
      //     if (state.selectedOrder?.id === updatedOrder.id) {
      //       state.selectedOrder = updatedOrder;
      //     }
      //     // ✅ Recalculate summary
      //     state.summary = calculateSummaryFromOrders(state.orders);
      //   }
      // })
      // .addCase(processPayment.rejected, (state, action) => {
      //   state.actionLoading = false;
      //   state.error = action.payload;
      // })
      
      // ===== FETCH PENDING PAYMENTS =====
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

      .addCase(addItemToOrder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(addItemToOrder.fulfilled, (state, action) => {
        state.actionLoading = false;
      })
      .addCase(addItemToOrder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
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