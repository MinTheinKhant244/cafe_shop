// src/pages/cashier/CashierOrderDetail.jsx
import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { 
  fetchOrderById, 
  updateOrderStatus, 
  updatePaymentStatus, 
  cancelOrder, 
  addItemToOrder 
} from "./cashierOrderSlice";
import { fetchAllProducts } from "../../features/products/productSlice";
import { getProductStockStatus } from "../carts/cartSlice";
import ReceiptPrinter from "../../features/orders/ReceiptPrinter";
import styles from "../../assets/css/cashierOrderDetail.module.css";

function CashierOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedOrder: order, loading, actionLoading, error } = useSelector(
    (state) => state.cashierOrders
  );
  
  // ===== GET PRODUCTS FROM REDUX =====
  const { list: products, loading: productsLoading } = useSelector(
    (state) => state.products
  );
  
  // ===== GET STOCK STATUS FROM CART SLICE =====
  const stockStatus = useSelector((state) => state.cart?.stockStatus || {});
  const refreshVersion = useSelector((state) => state.cart?.refreshVersion || 0);
  const isStockLoading = useSelector((state) => state.cart?.loading || false);
  
  // ===== STATE =====
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // ===== ADD ITEM STATES =====
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addItemLoading, setAddItemLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [addItemError, setAddItemError] = useState("");
  const [stockError, setStockError] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const fetchedRef = useRef(false);
  
  // ===== RECEIPT STATES =====
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceiptOrder, setCurrentReceiptOrder] = useState(null);

  // Load order data
  useEffect(() => {
    if (id) {
      dispatch(fetchOrderById(id));
    }
  }, [id, dispatch]);

  // Load products when modal opens
  useEffect(() => {
    if (showAddItemModal && products.length === 0 && !productsLoading) {
      dispatch(fetchAllProducts());
    }
  }, [showAddItemModal, products.length, productsLoading, dispatch]);

  // ============================================
  // FETCH STOCK STATUS FOR PRODUCTS
  // ============================================
  const fetchStockStatus = async (productId) => {
    if (!productId) return;
    
    try {
      await dispatch(getProductStockStatus({ 
        productId: productId
      })).unwrap();
    } catch (error) {
      console.error(`Failed to fetch stock status:`, error);
    }
  };

  // Fetch stock when modal opens
  useEffect(() => {
    if (showAddItemModal && products.length > 0 && !fetchedRef.current) {
      fetchedRef.current = true;
      const productsToFetch = products.slice(0, 20);
      productsToFetch.forEach(product => {
        fetchStockStatus(product.id);
      });
    }
  }, [showAddItemModal, products]);

  // ============================================
  // HELPER: GET PRODUCT STOCK STATUS - FIXED
  // ============================================
  const getProductStockInfo = (productId) => {
    if (!productId) {
      return {
        availableQuantity: 0,
        isOutOfStock: true,
        isLowStock: false
      };
    }
    
    const productIdStr = String(productId);
    const status = stockStatus[productIdStr];
    
    if (!status) {
      const product = products.find(p => Number(p.id) === Number(productId));
      return {
        availableQuantity: product?.currentStock ?? 999,
        isOutOfStock: false,
        isLowStock: false
      };
    }
    return {
      availableQuantity: status.availableQuantity ?? 0,
      isOutOfStock: status.isOutOfStock ?? false,
      isLowStock: status.isLowStock ?? false,
      ingredientLimits: status.ingredientLimits || []
    };
  };

  // ============================================
  // HELPER: CHECK IF PRODUCT ALREADY IN ORDER - FIXED
  // ============================================
  const getExistingItem = (productId) => {
    if (!productId) return null;
    if (!order?.orderItems || order.orderItems.length === 0) return null;
    
    const numericProductId = Number(productId);
    
    const found = order.orderItems.find(item => {
      const itemProductId = item.productId || item.product?.id || item.product_id;
      return Number(itemProductId) === numericProductId;
    });
    
    return found || null;
  };

  // ============================================
  // HELPER: GET EXISTING QUANTITY - NEW
  // ============================================
  const getExistingQuantity = (productId) => {
    if (!productId) return 0;
    const existing = getExistingItem(productId);
    return existing?.quantity || 0;
  };

  // ============================================
  // HELPER: GET AVAILABLE STOCK - FIXED
  // ============================================
  const getAvailableStock = (productId) => {
    if (!productId) return 0;
    const stockInfo = getProductStockInfo(productId);
    const usedQuantity = getExistingQuantity(productId);
    return Math.max(0, stockInfo.availableQuantity - usedQuantity);
  };

  // ============================================
  // HELPER: GET TOTAL STOCK
  // ============================================
  const getTotalStock = (productId) => {
    if (!productId) return 0;
    const stockInfo = getProductStockInfo(productId);
    return stockInfo.availableQuantity || 0;
  };

  // ============================================
  // HANDLE SELECT PRODUCT
  // ============================================
  const handleSelectProduct = async (product) => {
    if (!product) return;
    
    setStockError("");
    setAddItemError("");
    setAddQuantity(1);
    
    try {
      await dispatch(getProductStockStatus({ 
        productId: product.id
      })).unwrap();
    } catch (error) {
      console.error("Stock fetch error:", error);
    }
    
    const availableStock = getAvailableStock(product.id);
    
    if (availableStock <= 0) {
      const stockInfo = getProductStockInfo(product.id);
      const totalStock = stockInfo.availableQuantity || 0;
      
      if (totalStock <= 0) {
        setStockError(`❌ ${product.name} is completely out of stock!`);
      } else {
        setStockError(`❌ ${product.name} is out of stock! (Available: ${availableStock})`);
      }
      setSelectedProduct(null);
      return;
    }
    
    setMaxQuantity(availableStock);
    setSelectedProduct(product);
  };

  // ============================================
  // HANDLE QUANTITY CHANGE
  // ============================================
  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Math.min(value, maxQuantity));
    setAddQuantity(newQuantity);
  };

  // ============================================
  // HANDLE ADD ITEM TO ORDER (With Custom Quantity)
  // ============================================
  const handleAddItem = async () => {
    if (!selectedProduct) {
      setAddItemError("Please select a product");
      return;
    }

    if (addQuantity < 1) {
      setAddItemError("Quantity must be at least 1");
      return;
    }

    try {
      await dispatch(getProductStockStatus({ 
        productId: selectedProduct.id
      })).unwrap();
    } catch (error) {
      console.error("Stock fetch error:", error);
    }

    const availableStock = getAvailableStock(selectedProduct.id);
    if (availableStock <= 0) {
      setStockError(`❌ ${selectedProduct.name} is out of stock!`);
      return;
    }

    if (addQuantity > availableStock) {
      setStockError(
        `❌ Not enough stock for ${selectedProduct.name}!\n` +
        `Available: ${availableStock}\n` +
        `Requested: ${addQuantity}`
      );
      return;
    }

    const existingQuantity = getExistingQuantity(selectedProduct.id);
    const newTotalQuantity = existingQuantity + addQuantity;

    const totalStock = getTotalStock(selectedProduct.id);
    if (newTotalQuantity > totalStock) {
      setStockError(
        `❌ Not enough stock for ${selectedProduct.name}!\n` +
        `Total available: ${totalStock}\n` +
        `Requested total: ${newTotalQuantity}`
      );
      return;
    }

    setAddItemLoading(true);
    setAddItemError("");
    setStockError("");

    try {
      await dispatch(addItemToOrder({
        orderId: id,
        productId: selectedProduct.id,
        quantity: addQuantity
      })).unwrap();

      await dispatch(fetchOrderById(id));
      
      setShowAddItemModal(false);
      setSelectedProduct(null);
      setAddQuantity(1);
      setProductSearch("");
      
      const existingMsg = existingQuantity > 0 
        ? `Added ${addQuantity} more ${selectedProduct.name} (Total: ${newTotalQuantity})`
        : `Added ${addQuantity}x ${selectedProduct.name} to order`;
      
      alert(`✅ ${existingMsg} successfully!`);
      
    } catch (error) {
      setAddItemError(error.message || "Failed to add item");
    } finally {
      setAddItemLoading(false);
    }
  };

  // ============================================
  // HELPER: GET CREATED BY NAME
  // ============================================
  const getCreatedByName = (orderData) => {
    if (!orderData) return "Unknown";
    
    if (orderData.createdBy) {
      if (typeof orderData.createdBy === 'object') {
        return orderData.createdBy.username || 
               orderData.createdBy.name || 
               orderData.createdBy.fullName || 
               orderData.createdBy.email || 
               "Unknown";
      }
      if (typeof orderData.createdBy === 'string' || typeof orderData.createdBy === 'number') {
        return `User #${orderData.createdBy}`;
      }
    }
    
    if (orderData.user?.username) return orderData.user.username;
    if (orderData.user?.name) return orderData.user.name;
    if (orderData.creator?.username) return orderData.creator.username;
    if (orderData.creator?.name) return orderData.creator.name;
    
    return "Unknown";
  };

  // ============================================
  // HELPER: GET CREATED BY ICON
  // ============================================
  const getCreatedByIcon = (orderData) => {
    if (!orderData) return "👤";
    
    const role = orderData.createdBy?.role || 
                 orderData.role || 
                 orderData.user?.role ||
                 orderData.createdBy?.userType;
    
    if (role === "ADMIN" || role === "admin") return "👑";
    if (role === "CASHIER" || role === "cashier") return "💰";
    if (role === "STAFF" || role === "staff") return "👨‍🍳";
    if (role === "MANAGER" || role === "manager") return "👔";
    
    return "👤";
  };

  // ============================================
  // HELPER: GET CREATED BY ROLE
  // ============================================
  const getCreatedByRole = (orderData) => {
    if (!orderData) return "";
    
    const role = orderData.createdBy?.role || 
                 orderData.role || 
                 orderData.user?.role ||
                 orderData.createdBy?.userType;
    
    return role || "";
  };

  // ============================================
  // HANDLE STATUS UPDATE
  // ============================================
  const handleStatusUpdate = async (status) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
      dispatch(fetchOrderById(id));
    } catch (error) {
      alert(`Failed to update status: ${error}`);
    }
  };

  // ============================================
  // HANDLE CANCEL ORDER
  // ============================================
  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      await dispatch(cancelOrder(id)).unwrap();
      dispatch(fetchOrderById(id));
    } catch (error) {
      alert(`Failed to cancel order: ${error}`);
    }
  };

  // ============================================
  // HANDLE PRINT RECEIPT
  // ============================================
  const handlePrintReceipt = (orderData) => {
    setCurrentReceiptOrder(orderData);
    setShowReceipt(true);
  };

  // ============================================
  // HANDLE PAYMENT
  // ============================================
  const handlePayment = async () => {
    if (paymentMethod === "CASH") {
      const received = parseFloat(cashReceived);
      if (isNaN(received) || received < order?.totalAmount) {
        setPaymentError(`Cash received must be at least ${order?.totalAmount?.toLocaleString()} Ks`);
        return;
      }
    }

    setIsProcessing(true);
    setPaymentError("");
    
    try {
      await dispatch(updatePaymentStatus({ 
        id: order.id, 
        paymentMethod: paymentMethod,
        paymentStatus: "PAID" 
      })).unwrap();
      
      setShowPaymentModal(false);
      
      await dispatch(fetchOrderById(id));
      
      const updatedOrder = { ...order, paymentMethod: paymentMethod, paymentStatus: "PAID" };
      handlePrintReceipt(updatedOrder);
      
    } catch (error) {
      setPaymentError(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // GET STATUS STYLES
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

  const getStatusClass = (status) => {
    return status?.toLowerCase() || "";
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
  // CHECK FUNCTIONS
  // ============================================
  const canUpdateStatus = (status) => {
    return !["COMPLETED", "CANCELLED"].includes(status);
  };

  const canPay = (orderData) => {
    if (!orderData) return false;
    return orderData.paymentStatus === "PENDING" && 
           orderData.status !== "CANCELLED";
  };

  const canAddItem = (orderData) => {
    if (!orderData) return false;
    return !["COMPLETED", "CANCELLED"].includes(orderData.status);
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================
  const filteredProducts = products.filter(product => 
    product.isActive !== false &&
    (product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
     product.category?.name?.toLowerCase().includes(productSearch.toLowerCase()))
  );

  // ============================================
  // HANDLE OPEN ADD ITEM MODAL
  // ============================================
  const handleOpenAddItemModal = () => {
    setShowAddItemModal(true);
    setSelectedProduct(null);
    setAddQuantity(1);
    setProductSearch("");
    setAddItemError("");
    setStockError("");
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Error Loading Order</h3>
          <p>{error}</p>
          <button 
            className={styles.retryBtn} 
            onClick={() => dispatch(fetchOrderById(id))}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>📭</div>
          <h3>Order Not Found</h3>
          <p>The order you're looking for doesn't exist or has been removed.</p>
          <button 
            className={styles.retryBtn} 
            onClick={() => navigate("/cashier/orders")}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className={styles.pageContainer}>
      {/* ===== BACK BUTTON ===== */}
      <button 
        className={styles.backButton} 
        onClick={() => navigate("/cashier/orders")}
      >
        <i className="fa-solid fa-arrow-left"></i>
        Back to Orders
      </button>

      {/* ===== ORDER DETAIL CARD ===== */}
      <div className={styles.orderDetailCard}>
        {/* ===== HEADER ===== */}
        <div className={styles.orderHeader}>
          <div className={styles.orderHeaderLeft}>
            <div className={styles.invoiceNo}>#{order.invoiceNo}</div>
            <div className={styles.orderMeta}>
              <span className={styles.source}>
                {getSourceIcon(order.orderSource)} {order.orderSource}
              </span>
              {order.orderSource === "DINE_IN" && order.table && (
                <span className={styles.table}>
                  🪑 Table {order.table.tableNo}
                </span>
              )}
              <span className={styles.time}>
                📅 {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          <div className={styles.orderHeaderRight}>
            <span 
              className={`${styles.statusBadge} ${styles[getStatusClass(order.status)]}`}
              style={{ backgroundColor: getStatusColor(order.status) }}
            >
              {order.status}
            </span>
            <span className={`${styles.paymentBadge} ${styles[order.paymentStatus?.toLowerCase()]}`}>
              {order.paymentStatus === "PAID" ? "✅ Paid" : "⏳ Pending Payment"}
            </span>
            <span className={styles.orderTime}>
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* ===== CONTENT ===== */}
        <div className={styles.orderContent}>
          {/* ===== INFO GRID ===== */}
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.label}>Order Type</span>
              <span className={styles.value}>
                {getSourceIcon(order.orderSource)} {order.orderSource}
              </span>
            </div>
            {order.orderSource === "DINE_IN" && order.table && (
              <div className={styles.infoItem}>
                <span className={styles.label}>Table</span>
                <span className={styles.value}>
                  <span className={styles.highlight}>Table {order.table.tableNo}</span>
                </span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.label}>Order Status</span>
              <span className={styles.value} style={{ color: getStatusColor(order.status) }}>
                {order.status}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Payment Status</span>
              <span className={styles.value} style={{ 
                color: order.paymentStatus === "PAID" ? "#2e7d32" : "#ff9800" 
              }}>
                {order.paymentStatus === "PAID" ? "✅ Paid" : "⏳ Pending"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Payment Method</span>
              <span className={styles.value}>
                {order.paymentMethod || "Not paid yet"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.label}>Created By</span>
              <span className={styles.value}>
                <span className={styles.createdByIcon}>
                  {getCreatedByIcon(order)}
                </span>
                {getCreatedByName(order)}
                {getCreatedByRole(order) && (
                  <span className={styles.createdByRole}>
                    ({getCreatedByRole(order)})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* ===== ORDER NOTE ===== */}
          {order.orderNote && (
            <div className={styles.orderNote}>
              <span className={styles.noteIcon}>📝</span>
              <span className={styles.noteText}>{order.orderNote}</span>
            </div>
          )}

          {/* ===== ITEMS SECTION ===== */}
          <div className={styles.itemsSection}>
            <div className={styles.sectionTitle}>
              Order Items
              <span className={styles.count}>({order.orderItems?.length || 0} items)</span>
              
              {canAddItem(order) && (
                <button 
                  className={styles.addItemBtn}
                  onClick={handleOpenAddItemModal}
                  disabled={actionLoading}
                >
                  <i className="fa-solid fa-plus"></i> Add Item
                </button>
              )}
            </div>

            <div className={styles.itemsTableWrapper}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th className={styles.colProduct}>Product</th>
                    <th className={styles.colQty}>Qty</th>
                    <th className={styles.colPrice}>Price</th>
                    <th className={styles.colTotal}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.orderItems?.map((item, index) => (
                    <tr key={index}>
                      <td className={styles.colProduct}>
                        <div className={styles.productInfo}>
                          {item.product?.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product?.name} 
                              className={styles.productImage}
                            />
                          ) : (
                            <div 
                              className={styles.productImage}
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center",
                                background: "#f0f2f5",
                                fontSize: "20px"
                              }}
                            >
                              🍽️
                            </div>
                          )}
                          <div>
                            <div className={styles.productName}>
                              {item.product?.name || "Unknown Product"}
                              <span className={styles.productCode}>
                                ID: {item.productId}
                              </span>
                            </div>
                            {item.options && item.options.length > 0 && (
                              <div className={styles.itemOptions}>
                                {item.options.map((opt, idx) => (
                                  <span key={idx} className={styles.optionTag}>
                                    {opt.name}: {opt.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.colQty}>{item.quantity}</td>
                      <td className={styles.colPrice}>
                        {item.price?.toLocaleString()} Ks
                      </td>
                      <td className={styles.colTotal}>
                        {(item.price * item.quantity)?.toLocaleString()} Ks
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ===== ORDER SUMMARY ===== */}
          <div className={styles.orderSummary}>
            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span className={styles.label}>Subtotal</span>
                <span className={styles.value}>
                  {order.totalAmount?.toLocaleString()} Ks
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.label}>Tax</span>
                <span className={styles.value}>0 Ks</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span className={styles.label}>Total</span>
                <span className={styles.value}>
                  {order.totalAmount?.toLocaleString()} Ks
                </span>
              </div>
            </div>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className={styles.actionButtons}>
            {canAddItem(order) && (
              <button 
                className={`${styles.actionBtn} ${styles.primary}`}
                onClick={handleOpenAddItemModal}
                disabled={actionLoading}
              >
                <i className="fa-solid fa-plus"></i> Add Item
              </button>
            )}

            {canPay(order) && (
              <button 
                className={`${styles.actionBtn} ${styles.success}`}
                onClick={() => setShowPaymentModal(true)}
                disabled={actionLoading}
              >
                💳 Pay Now
              </button>
            )}

            {canUpdateStatus(order.status) && (
              <>
                {order.status === "PENDING" && (
                  <button 
                    className={`${styles.actionBtn} ${styles.primary}`}
                    onClick={() => handleStatusUpdate("PREPARING")}
                    disabled={actionLoading}
                  >
                    ▶️ Start Preparing
                  </button>
                )}
                
                {order.status === "PREPARING" && (
                  <button 
                    className={`${styles.actionBtn} ${styles.success}`}
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={actionLoading}
                  >
                    ✅ Complete Order
                  </button>
                )}
              </>
            )}

            {!["COMPLETED", "CANCELLED"].includes(order.status) && (
              <button 
                className={`${styles.actionBtn} ${styles.danger}`}
                onClick={handleCancelOrder}
                disabled={actionLoading}
              >
                ❌ Cancel Order
              </button>
            )}

            <button 
              className={`${styles.actionBtn} ${styles.outline}`}
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          PAYMENT MODAL
      ============================================================ */}
      {showPaymentModal && order && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>💳 Payment - {order.invoiceNo}</h3>
              <button 
                className={styles.modalClose} 
                onClick={() => {
                  setShowPaymentModal(false);
                  setCashReceived("");
                  setPaymentError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.paymentContent}>
              <div className={styles.orderInfo}>
                <p><strong>Table:</strong> {order.orderSource === "DINE_IN" ? `Table ${order.table?.tableNo}` : order.orderSource}</p>
                <p><strong>Items:</strong> {order.orderItems?.length || 0}</p>
              </div>

              <div className={styles.paymentTotal}>
                <span>Total Amount</span>
                <span className={styles.paymentTotalAmount}>
                  {order.totalAmount?.toLocaleString()} Ks
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
                        if (method !== "CASH") setCashReceived("");
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
                          const change = parseFloat(cashReceived) - order.totalAmount;
                          return change.toLocaleString() + " Ks";
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentError && (
                <div className={styles.errorMessage}>
                  ❌ {paymentError}
                  <button className={styles.errorClose} onClick={() => setPaymentError("")}>×</button>
                </div>
              )}

              <div className={styles.actionButtons}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setCashReceived("");
                    setPaymentError("");
                  }}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={handlePayment}
                  disabled={
                    isProcessing || 
                    (paymentMethod === "CASH" && (!cashReceived || (() => {
                      const change = parseFloat(cashReceived) - order.totalAmount;
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
          ADD ITEM MODAL - WITH CUSTOM QUANTITY
      ============================================================ */}
      {showAddItemModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddItemModal(false)}>
          <div className={`${styles.paymentModal} ${styles.addItemModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🛒 Add Item to Order</h3>
              <button 
                className={styles.modalClose} 
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedProduct(null);
                  setAddQuantity(1);
                  setProductSearch("");
                  setAddItemError("");
                  setStockError("");
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.paymentContent}>
              {/* ===== Search Input ===== */}
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="🔍 Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              {/* ===== Product List ===== */}
              <div className={styles.productList}>
                {productsLoading || isStockLoading ? (
                  <div className={styles.noProducts}>
                    <span>⏳</span>
                    <p>Loading products...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className={styles.noProducts}>
                    <span>📭</span>
                    <p>No products found</p>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const existingQuantity = getExistingQuantity(product.id);
                    const stockInfo = getProductStockInfo(product.id);
                    const availableStock = getAvailableStock(product.id);
                    const isOutOfStock = availableStock <= 0 || stockInfo.isOutOfStock;
                    const totalStock = stockInfo.availableQuantity || 0;
                    
                    return (
                      <div 
                        key={product.id}
                        className={`${styles.productItem} ${selectedProduct?.id === product.id ? styles.selected : ""} ${isOutOfStock ? styles.outOfStock : ""}`}
                        onClick={() => !isOutOfStock && handleSelectProduct(product)}
                        style={{ 
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          opacity: isOutOfStock ? 0.6 : 1
                        }}
                      >
                        <div className={styles.productItemInfo}>
                          <div className={styles.productItemImage}>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} />
                            ) : (
                              <span>🍽️</span>
                            )}
                          </div>
                          <div className={styles.productItemDetails}>
                            <span className={styles.productItemName}>
                              {product.name}
                              {existingQuantity > 0 && (
                                <span className={styles.existingBadge}>
                                  🛒 {existingQuantity}
                                </span>
                              )}
                              {isOutOfStock && (
                                <span className={styles.outOfStockBadge}>🚫 Out of Stock</span>
                              )}
                              {!isOutOfStock && totalStock > 0 && totalStock <= 5 && (
                                <span className={styles.lowStockBadge}>⚠️ Only {totalStock} left</span>
                              )}
                            </span>
                            <span className={styles.productItemCategory}>
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                        <div className={styles.productItemPrice}>
                          {product.price?.toLocaleString()} Ks
                        </div>
                        {selectedProduct?.id === product.id && (
                          <div className={styles.selectedCheck}>✅</div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* ===== Selected Product Info ===== */}
              {selectedProduct && (
                <div className={styles.selectedProductInfo}>
                  <div className={styles.selectedProductDetails}>
                    <strong>{selectedProduct.name}</strong>
                    <span>{selectedProduct.price?.toLocaleString()} Ks</span>
                  </div>
                  
                  {/* ===== Stock Information ===== */}
                  <div className={styles.stockInfo}>
                    <div className={styles.stockRow}>
                      <span>📦 Available Stock:</span>
                      <span className={getAvailableStock(selectedProduct.id) <= 5 ? styles.lowStock : styles.inStock}>
                        {getAvailableStock(selectedProduct.id)} units
                      </span>
                    </div>
                    <div className={styles.stockRow}>
                      <span>🛒 Current in Order:</span>
                      <span className={styles.inStock}>
                        {getExistingQuantity(selectedProduct.id)} units
                      </span>
                    </div>
                    <div className={styles.stockRow}>
                      <span>🔢 Max can add:</span>
                      <span className={styles.inStock}>
                        {maxQuantity} units
                      </span>
                    </div>
                    {getProductStockInfo(selectedProduct.id).ingredientLimits?.length > 0 && 
                     getProductStockInfo(selectedProduct.id).ingredientLimits[0]?.isLimiting && (
                      <div className={styles.stockRow}>
                        <span>🔸 Limited by:</span>
                        <span className={styles.lowStock}>
                          {getProductStockInfo(selectedProduct.id).ingredientLimits[0].ingredientName}
                          ({getProductStockInfo(selectedProduct.id).ingredientLimits[0].availableStock} left)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ===== Quantity Selector ===== */}
                  <div className={styles.quantitySelector}>
                    <label>Quantity to add:</label>
                    <div className={styles.quantityControls}>
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => handleQuantityChange(addQuantity - 1)}
                        disabled={addQuantity <= 1}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className={styles.qtyInput}
                        value={addQuantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max={maxQuantity}
                      />
                      <button 
                        className={styles.qtyBtn}
                        onClick={() => handleQuantityChange(addQuantity + 1)}
                        disabled={addQuantity >= maxQuantity}
                      >
                        +
                      </button>
                    </div>
                    <div className={styles.quantityInfo}>
                      <span>Available: <strong>{maxQuantity}</strong></span>
                      <span>Adding: <strong className={styles.addingQty}>{addQuantity}</strong></span>
                    </div>
                  </div>

                  {/* ===== New Total ===== */}
                  <div className={styles.autoQuantityInfo}>
                    <div className={styles.quantityInfo}>
                      <span>Current in order:</span>
                      <strong className={styles.currentQty}>
                        {getExistingQuantity(selectedProduct.id)} units
                      </strong>
                    </div>
                    <div className={styles.quantityInfo}>
                      <span>Adding:</span>
                      <strong className={styles.addingQty}>
                        + {addQuantity} units
                      </strong>
                    </div>
                    <div className={styles.quantityInfo}>
                      <span>New total:</span>
                      <strong className={styles.newTotal}>
                        {getExistingQuantity(selectedProduct.id) + addQuantity} units
                      </strong>
                    </div>
                    <div className={styles.quantityInfo}>
                      <span>Total price:</span>
                      <strong className={styles.newTotal}>
                        {((getExistingQuantity(selectedProduct.id) + addQuantity) * selectedProduct.price)?.toLocaleString()} Ks
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Error Messages ===== */}
              {stockError && (
                <div className={styles.errorMessage}>
                  {stockError}
                  <button className={styles.errorClose} onClick={() => setStockError("")}>×</button>
                </div>
              )}

              {addItemError && (
                <div className={styles.errorMessage}>
                  ❌ {addItemError}
                  <button className={styles.errorClose} onClick={() => setAddItemError("")}>×</button>
                </div>
              )}

              {/* ===== Action Buttons ===== */}
              <div className={styles.actionButtons}>
                <button 
                  className={styles.cancelBtn} 
                  onClick={() => {
                    setShowAddItemModal(false);
                    setSelectedProduct(null);
                    setAddQuantity(1);
                    setProductSearch("");
                    setAddItemError("");
                    setStockError("");
                  }}
                  disabled={addItemLoading}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmBtn} 
                  onClick={handleAddItem}
                  disabled={!selectedProduct || addItemLoading || addQuantity < 1 || addQuantity > maxQuantity}
                >
                  {addItemLoading ? "⏳ Adding..." : 
                   `✅ Add ${addQuantity}x to Order`}
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

export default CashierOrderDetail;