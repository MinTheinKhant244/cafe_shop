// src/pages/cashier/CashierOrdersPage.jsx
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCashierOrders,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  setFilters,
  resetFilters,
  clearError
} from "./cashierOrderSlice";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import ReceiptPrinter from "../../features/orders/ReceiptPrinter";
import styles from "../../assets/css/cashierOrder.module.css";

function CashierOrdersPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  
  const { 
    orders, 
    loading, 
    summary, 
    filters, 
    error,
    actionLoading 
  } = useSelector(state => state.cashierOrders);
  
  const [localFilters, setLocalFilters] = useState(filters);
  const [notification, setNotification] = useState(null);

  // ===== PAYMENT MODAL STATES =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // ===== RECEIPT STATES =====
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceiptOrder, setCurrentReceiptOrder] = useState(null);

  // ============================================
  // AUTO-FILTER WHEN FILTERS CHANGE
  // ============================================
  useEffect(() => {
    console.log("Auto-applying filters:", localFilters);
    dispatch(setFilters(localFilters));
    dispatch(fetchCashierOrders(localFilters));
  }, [localFilters, dispatch]);

  // ============================================
  // NOTIFICATION TIMER
  // ============================================
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ============================================
  // SHOW NOTIFICATION
  // ============================================
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
  };

  // ============================================
  // HANDLE FILTER CHANGE
  // ============================================
  const handleFilterChange = (key, value) => {
    console.log(`Filter changed: ${key} = ${value}`);
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  // ============================================
  // HANDLE RESET FILTERS
  // ============================================
  const handleResetFilters = () => {
    const defaultFilters = {
      status: "ALL",
      orderSource: "ALL",
      search: "",
      dateRange: "TODAY"
    };
    setLocalFilters(defaultFilters);
    dispatch(resetFilters());
    dispatch(fetchCashierOrders(defaultFilters));
  };

  // ============================================
  // HANDLE KEY PRESS (Search)
  // ============================================
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      console.log("Search triggered with:", localFilters.search);
    }
  };

  // ============================================
  // HANDLE STATUS UPDATE
  // ============================================
  const handleStatusUpdate = async (orderId, status, e) => {
    e.stopPropagation(); // Prevent card click
    try {
      await dispatch(updateOrderStatus({ id: orderId, status })).unwrap();
      showNotification(`Order status updated to ${status}`, "success");
      dispatch(fetchCashierOrders(localFilters));
    } catch (error) {
      showNotification(error || "Failed to update status", "error");
    }
  };

  // ============================================
  // HANDLE PRINT RECEIPT
  // ============================================
  const handlePrintReceipt = (order) => {
    setCurrentReceiptOrder(order);
    setShowReceipt(true);
  };

  // ============================================
  // HANDLE PAYMENT FOR ORDER
  // ============================================
  const handlePaymentForOrder = (order, e) => {
    e.stopPropagation(); // Prevent card click
    setSelectedOrder(order);
    setPaymentMethod("CASH");
    setCashReceived("");
    setPaymentError("");
    setShowPaymentModal(true);
  };

  // ============================================
  // HANDLE CONFIRM PAYMENT
  // ============================================
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    if (paymentMethod === "CASH") {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < selectedOrder.totalAmount) {
        setPaymentError(`Cash received must be at least ${selectedOrder.totalAmount?.toLocaleString()} Ks`);
        return;
      }
    }

    setIsProcessing(true);
    setPaymentError("");
    
    try {
      await dispatch(updatePaymentStatus({ 
        id: selectedOrder.id, 
        paymentMethod: paymentMethod,
        paymentStatus: "PAID" 
      })).unwrap();
      
      setShowPaymentModal(false);
      
      // Show receipt after successful payment
      handlePrintReceipt(selectedOrder);
      
      setSelectedOrder(null);
      setCashReceived("");
      
      await dispatch(fetchCashierOrders(localFilters));
      
      showNotification(`Payment for ${selectedOrder.invoiceNo} completed successfully!`, "success");
      
    } catch (error) {
      setPaymentError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // HANDLE CANCEL ORDER
  // ============================================
  const handleCancelOrder = async (orderId, e) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      showNotification("Order cancelled successfully", "success");
      dispatch(fetchCashierOrders(localFilters));
    } catch (error) {
      showNotification(error || "Failed to cancel order", "error");
    }
  };

  // ============================================
  // HANDLE CARD CLICK - Navigate to Detail
  // ============================================
  const handleCardClick = (orderId) => {
    navigate(`/cashier/orders/${orderId}`);
  };

  // ============================================
  // GET STATUS COLOR
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      PENDING: "#ff9800",
      PREPARING: "#2196f3",
      COMPLETED: "#4caf50",
      CANCELLED: "#f44336"
    };
    return colors[status] || "#9e9e9e";
  };

  // ============================================
  // GET SOURCE ICON
  // ============================================
  const getSourceIcon = (source) => {
    if (!source) return "📋";
    const icons = {
      DINE_IN: "🍽️",
      TAKEAWAY: "📦",
      DELIVERY: "🚚"
    };
    return icons[source] || "📋";
  };

  // ============================================
  // GET SOURCE DISPLAY
  // ============================================
  const getSourceDisplay = (source) => {
    if (!source) return "Unknown";
    return source;
  };

  // ============================================
  // CHECK IF CAN UPDATE STATUS
  // ============================================
  const canUpdateStatus = (status) => {
    return !["COMPLETED", "CANCELLED"].includes(status);
  };

  // ============================================
  // CHECK IF CAN PAY
  // ============================================
  const canPay = (order) => {
    if (!order) return false;
    return order.paymentStatus === "PENDING" && 
           order.status !== "CANCELLED";
  };

  // ============================================
  // STATS FROM SUMMARY
  // ============================================
  const stats = [
    { 
      label: "Pending", 
      value: summary?.pendingOrders || 0, 
      icon: "⏳", 
      color: "#ff9800" 
    },
    { 
      label: "Preparing", 
      value: summary?.preparingOrders || 0, 
      icon: "👨‍🍳", 
      color: "#2196f3" 
    },
    { 
      label: "Completed", 
      value: summary?.completedOrders || 0, 
      icon: "✅", 
      color: "#4caf50" 
    },
    { 
      label: "Pending Payment", 
      value: summary?.pendingPaymentOrders || 0, 
      icon: "💰", 
      color: "#f44336" 
    },
    { 
      label: "Revenue", 
      value: summary?.todayRevenue?.toLocaleString() || 0, 
      icon: "💵", 
      color: "#2e7d32",
      isCurrency: true 
    }
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        {/* ===== NOTIFICATION TOAST ===== */}
        {notification && (
          <div className={`${styles.toast} ${styles[notification.type]}`}>
            {notification.type === "success" ? "✅" : "❌"} {notification.message}
          </div>
        )}

        {/* ===== ERROR TOAST ===== */}
        {error && (
          <div className={`${styles.toast} ${styles.error}`}>
            ❌ {error}
            <button onClick={() => dispatch(clearError())} className={styles.toastClose}>×</button>
          </div>
        )}

        {/* ===== PAGE HEADER ===== */}
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.toggleBtn} 
              onClick={() => dispatch(toggleSidebar())}
            >
              ☰
            </button>
            <h1>💰 Cashier Dashboard</h1>
            <span className={styles.dateBadge}>
              📅 {new Date().toLocaleDateString("en-US", { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.revenue}>
              💵 Revenue: {summary?.todayRevenue?.toLocaleString()} Ks
            </span>
          </div>
        </div>

        {/* ===== STATS CARDS ===== */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={styles.statCard} 
              style={{ borderColor: stat.color }}
            >
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statInfo}>
                <div className={styles.statValue}>
                  {stat.isCurrency ? `${stat.value} Ks` : stat.value}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== FILTERS ===== */}
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              className={styles.filterSelect}
              value={localFilters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="ALL">🌐 All</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="PREPARING">👨‍🍳 Preparing</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="CANCELLED">❌ Cancelled</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Source:</label>
            <select
              className={styles.filterSelect}
              value={localFilters.orderSource}
              onChange={(e) => handleFilterChange("orderSource", e.target.value)}
            >
              <option value="ALL">🌐 All</option>
              <option value="DINE_IN">🍽️ Dine In</option>
              <option value="TAKEAWAY">📦 Takeaway</option>
              <option value="DELIVERY">🚚 Delivery</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Date:</label>
            <select
              className={styles.filterSelect}
              value={localFilters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            >
              <option value="TODAY">📅 Today</option>
              <option value="YESTERDAY">📅 Yesterday</option>
              <option value="THIS_WEEK">📅 This Week</option>
              <option value="THIS_MONTH">📅 This Month</option>
              <option value="ALL">📅 All</option>
            </select>
          </div>

          <div className={styles.searchWrapper}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="🔍 Search invoice or table..."
              value={localFilters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className={styles.filterActions}>
            <button className={styles.clearFiltersBtn} onClick={handleResetFilters}>
              ✕ Clear Filters
            </button>
          </div>
        </div>

        {/* ===== ORDER COUNT ===== */}
        <div className={styles.orderCount}>
          <span>{orders?.length || 0} orders found</span>
          {loading && <span className={styles.loadingSpinner}>⏳ Loading...</span>}
        </div>

        {/* ===== ORDER LIST ===== */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading orders...</p>
          </div>
        ) : orders?.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyText}>No orders found</p>
            <p className={styles.emptySubtext}>Try changing your filters or create a new order</p>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((order) => (
              <div 
                key={order.id} 
                className={`${styles.orderCard} ${order.status === "CANCELLED" ? styles.cancelled : ""}`}
                onClick={() => handleCardClick(order.id)}
                style={{ cursor: "pointer" }}
              >
                {/* ===== ORDER HEADER ===== */}
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.invoiceNo}>#{order.invoiceNo}</span>
                    <span className={styles.orderSource}>
                      {getSourceIcon(order.orderSource)} {getSourceDisplay(order.orderSource)}
                    </span>
                    {order.orderSource === "DINE_IN" && order.table && (
                      <span className={styles.tableInfo}>
                        🪑 Table {order.table.tableNo}
                      </span>
                    )}
                    {order.orderSource === "TAKEAWAY" && (
                      <span className={styles.tableInfo}>📦 Takeaway</span>
                    )}
                    {order.orderSource === "DELIVERY" && (
                      <span className={styles.tableInfo}>🚚 Delivery</span>
                    )}
                  </div>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                    <span 
                      className={styles.statusBadge}
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </span>
                    {order.paymentStatus === "PAID" && (
                      <span className={styles.paidBadge}>✅ Paid</span>
                    )}
                    {order.paymentStatus === "PENDING" && (
                      <span className={styles.pendingBadge}>⏳ Pending</span>
                    )}
                  </div>
                </div>

                {/* ===== ORDER ITEMS ===== */}
                <div className={styles.orderItems}>
                  {order.orderItems?.slice(0, 4).map((item, index) => (
                    <span key={index} className={styles.orderItem}>
                      {item.product?.name || "Unknown"} × {item.quantity}
                    </span>
                  ))}
                  {order.orderItems?.length > 4 && (
                    <span className={styles.moreItems}>
                      +{order.orderItems.length - 4} more
                    </span>
                  )}
                </div>

                {/* ===== ORDER FOOTER ===== */}
                <div className={styles.orderFooter}>
                  <div className={styles.orderTotal}>
                    <span>Total:</span>
                    <span className={styles.totalAmount}>
                      {order.totalAmount?.toLocaleString()} Ks
                    </span>
                  </div>

                  {order.orderNote && (
                    <div className={styles.orderNote}>
                      📝 {order.orderNote}
                    </div>
                  )}

                  <div className={styles.orderActions}>
                    {/* ===== PAYMENT BUTTON ===== */}
                    {canPay(order) && (
                      <button 
                        className={styles.paymentBtn}
                        onClick={(e) => handlePaymentForOrder(order, e)}
                        disabled={actionLoading}
                      >
                        💳 Pay Now
                      </button>
                    )}

                    {/* ===== STATUS UPDATE BUTTONS ===== */}
                    {canUpdateStatus(order.status) ? (
                      <>
                        {order.status === "PENDING" && (
                          <button 
                            className={styles.actionBtn}
                            onClick={(e) => handleStatusUpdate(order.id, "PREPARING", e)}
                            disabled={actionLoading}
                          >
                            ▶️ Start
                          </button>
                        )}
                        
                        {order.status === "PREPARING" && (
                          <button 
                            className={styles.actionBtn}
                            onClick={(e) => handleStatusUpdate(order.id, "COMPLETED", e)}
                            disabled={actionLoading}
                          >
                            ✅ Complete
                          </button>
                        )}
                      </>
                    ) : (
                      order.status === "COMPLETED" && (
                        <span className={styles.completedBadge}>✅ Completed</span>
                      )
                    )}

                    {/* ===== CANCEL BUTTON ===== */}
                    {order.status === "PENDING" && (
                      <button 
                        className={styles.cancelBtn}
                        onClick={(e) => handleCancelOrder(order.id, e)}
                        disabled={actionLoading}
                      >
                        ❌ Cancel
                      </button>
                    )}
                    
                    {/* ===== CANCELLED BADGE ===== */}
                    {order.status === "CANCELLED" && (
                      <span className={styles.cancelledBadge}>❌ Cancelled</span>
                    )}

                    {/* ===== VIEW DETAILS BUTTON ===== */}
                    <button 
                      className={styles.viewBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(order.id);
                      }}
                    >
                      👁️ View
                    </button>
                  </div>
                </div>

                {/* ===== CLICK HINT ===== */}
                <div className={styles.clickHint}>
                  Click card to view details
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          PAYMENT MODAL
      ============================================================ */}
      {showPaymentModal && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>💳 Payment - {selectedOrder.invoiceNo}</h3>
              <button 
                className={styles.modalClose} 
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrder(null);
                  setCashReceived("");
                  setPaymentError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.paymentContent}>
              <div className={styles.orderInfo}>
                <p>
                  <strong>Table:</strong>{' '}
                  {selectedOrder.orderSource === "DINE_IN" 
                    ? `Table ${selectedOrder.table?.tableNo}` 
                    : selectedOrder.orderSource}
                </p>
                <p>
                  <strong>Items:</strong> {selectedOrder.orderItems?.length || 0}
                </p>
              </div>

              <div className={styles.paymentTotal}>
                <span>Total Amount</span>
                <span className={styles.paymentTotalAmount}>
                  {selectedOrder.totalAmount?.toLocaleString()} Ks
                </span>
              </div>

              <div className={styles.paymentMethodGroup}>
                <label>Payment Method</label>
                <div className={styles.methodButtons}>
                  {["CASH", "KPAY", "WAVE", "CARD"].map(method => (
                    <button 
                      key={method} 
                      className={`${styles.methodBtn} ${paymentMethod === method ? styles.active : ""}`} 
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method !== "CASH") {
                          setCashReceived("");
                        }
                        setPaymentError("");
                      }}
                    >
                      {method === "CASH" ? "💵 Cash" : 
                       method === "KPAY" ? "🏦 KBZ Pay" : 
                       method === "WAVE" ? "📱 Wave Pay" : "💳 Card"}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div className={styles.formGroup}>
                  <label>Cash Received (Ks)</label>
                  <input 
                    type="number" 
                    placeholder="Enter amount received" 
                    value={cashReceived} 
                    onChange={(e) => {
                      setCashReceived(e.target.value);
                      setPaymentError("");
                    }} 
                    className={styles.cashInput} 
                    min="0"
                    step="100"
                  />
                  {cashReceived && (
                    <div className={styles.changeAmount}>
                      <span>Change:</span>
                      <span className={styles.changeValue}>
                        {(() => {
                          const change = parseFloat(cashReceived) - selectedOrder.totalAmount;
                          return change.toLocaleString() + " Ks";
                        })()}
                      </span>
                    </div>
                  )}
                  {cashReceived && (() => {
                    const change = parseFloat(cashReceived) - selectedOrder.totalAmount;
                    return change < 0 && (
                      <div className={styles.insufficientWarning}>
                        ⚠️ Insufficient amount. Please enter at least {selectedOrder.totalAmount?.toLocaleString()} Ks
                      </div>
                    );
                  })()}
                </div>
              )}

              {paymentMethod !== "CASH" && (
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentInfoIcon}>ℹ️</div>
                  <div>
                    <p>Payment will be processed via <strong>{paymentMethod}</strong></p>
                    <p className={styles.paymentInfoSub}>Please confirm payment on the payment terminal.</p>
                  </div>
                </div>
              )}

              {paymentError && (
                <div className={styles.errorMessage}>
                  ❌ {paymentError}
                  <button 
                    className={styles.errorClose}
                    onClick={() => setPaymentError("")}
                  >
                    ×
                  </button>
                </div>
              )}

              <div className={styles.actionButtons}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedOrder(null);
                    setCashReceived("");
                    setPaymentError("");
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={handleConfirmPayment}
                  disabled={
                    isProcessing || 
                    (paymentMethod === "CASH" && (!cashReceived || (() => {
                      const change = parseFloat(cashReceived) - selectedOrder.totalAmount;
                      return change < 0;
                    })()))
                  }
                >
                  {isProcessing ? "⏳ Processing..." : "✅ Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          RECEIPT PRINTER MODAL
      ============================================================ */}
      {showReceipt && currentReceiptOrder && (
        <ReceiptPrinter
          order={currentReceiptOrder}
          onClose={() => {
            setShowReceipt(false);
            setCurrentReceiptOrder(null);
          }}
          onPrint={() => {
            console.log('Receipt printed successfully for:', currentReceiptOrder?.invoiceNo);
          }}
        />
      )}
    </div>
  );
}

export default CashierOrdersPage;