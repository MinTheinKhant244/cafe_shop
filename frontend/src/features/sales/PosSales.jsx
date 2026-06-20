import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProducts } from "../../features/products/productSlice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import { createOrder, updatePaymentStatus, fetchAllOrders } from "../../features/orders/orderSlice";
import { clearCart } from "../carts/cartSlice";
import { toggleSidebar } from "../../app/uiSlice";
import api from "../../app/api";
import Sidebar from "../../components/Sidebar";
import ProductCard from "./ProductCard";
import Cart from "../carts/Cart";
import ReceiptPrinter from "../../features/orders/ReceiptPrinter";
import styles from "../../assets/css/posSales.module.css";

function PosSales() { 
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: products, loading: productsLoading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const { list: orders, actionLoading } = useSelector((state) => state.orders);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tables, setTables] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [orderSource, setOrderSource] = useState("DINE_IN");
  const [isCartOpen, setIsCartOpen] = useState(true);
  
  // Receipt states
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceiptOrder, setCurrentReceiptOrder] = useState(null);

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, [dispatch]);

  const loadInitialData = async () => {
    await Promise.all([
      dispatch(fetchAllProducts()),
      dispatch(fetchAllCategories()),
      dispatch(fetchAllOrders()),
      fetchTables()
    ]);
  };

  // Track pending orders
  useEffect(() => {
    if (orders?.length) {
      const unpaid = orders.filter(o => o.paymentStatus === "PENDING" && o.status !== "CANCELLED");
      setPendingOrders(unpaid);
    }
  }, [orders]);

  const fetchTables = async () => {
    try {
      const response = await api.get("/tables/all");
      console.log("Tables loaded:", response.data);
      setTables(response.data || []);
    } catch (error) {
      console.error("Failed to fetch tables", error);
      setTables([]);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchAllProducts()).unwrap(),
        dispatch(fetchAllCategories()).unwrap(),
        dispatch(fetchAllOrders()).unwrap(),
        fetchTables()
      ]);
      console.log("Data refreshed successfully - stock status updated");
    } catch (error) {
      console.error("Refresh failed:", error);
      alert("Failed to refresh data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredProducts = products?.filter((p) => {
    const matchesCategory = !selectedCategory || p.category?.id === Number(selectedCategory);
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && p.isActive;
  });

  // Handle table selection
  const handleTableChange = (e) => {
    const value = e.target.value;
    console.log("Table selected - value:", value);
    if (value === "" || value === null) {
      setSelectedTableId(null);
    } else {
      setSelectedTableId(Number(value));
    }
  };

  // Handle Print Receipt
  const handlePrintReceipt = (order) => {
    setCurrentReceiptOrder(order);
    setShowReceipt(true);
  };

  // ========== FIXED: Place Order with correct JSON structure ==========
  const handlePlaceOrder = async () => {
    console.log("=== ORDER DEBUG ===");
    console.log("orderSource:", orderSource);
    console.log("selectedTableId:", selectedTableId);
    console.log("items length:", items.length);
    
    if (items.length === 0) {
      alert("Please add items to cart");
      return;
    }
    
    if (orderSource === "DINE_IN" && !selectedTableId) {
      alert("Please select a table for DINE_IN orders");
      return;
    }
    
    setLoading(true);
    
    try {
      const orderData = {
        createdBy: user?.id || 1,
        tableId: orderSource === "DINE_IN" ? selectedTableId : null,
        totalAmount: totalAmount,
        paymentStatus: "PENDING",
        orderSource: orderSource,
        status: "PENDING",
        orderItems: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        orderNote: null
      };

      console.log("Order data being sent:", orderData);
      
      const result = await dispatch(createOrder(orderData)).unwrap();
      
      console.log("Order created successfully:", result);
      
      setOrderSuccess(result);
      dispatch(clearCart());
      setSelectedTableId(null);
      setIsMobileCartOpen(false);
      await dispatch(fetchAllOrders());
      await fetchTables();
      
    } catch (error) {
      console.error("Order error:", error);
      alert("Order failed: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Handle Payment for Order
  const handlePaymentForOrder = (order) => {
    setSelectedOrderForPayment(order);
    setPaymentMethod("CASH");
    setCashReceived("");
    setShowPaymentModal(true);
  };

  // Handle Confirm Payment
  const handleConfirmPayment = async () => {
    if (!selectedOrderForPayment) return;

    setLoading(true);
    
    try {
      await dispatch(updatePaymentStatus({ 
        id: selectedOrderForPayment.id, 
        paymentMethod: paymentMethod, 
        paymentStatus: "PAID" 
      })).unwrap();
      
      setShowPaymentModal(false);
      
      // ✅ Show receipt after payment
      handlePrintReceipt(selectedOrderForPayment);
      
      setSelectedOrderForPayment(null);
      setCashReceived("");
      await dispatch(fetchAllOrders());
      await fetchTables();
      
    } catch (error) {
      alert("Payment failed: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const getChangeAmount = () => {
    if (paymentMethod !== "CASH" || !cashReceived) return 0;
    const received = parseFloat(cashReceived);
    if (isNaN(received)) return 0;
    return received - (selectedOrderForPayment?.totalAmount || 0);
  };

  const toggleMobileCart = () => {
    setIsMobileCartOpen(!isMobileCartOpen);
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  const totalItemsInCart = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        {/* Fixed Header */}
        <div className={styles.posHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              ☰
            </button>
            <h1 className={styles.pageTitle}>POS Sales</h1>
          </div>
          <div className={styles.headerRight}>
            {/* Refresh Button */}
            <button 
              className={styles.refreshBtn} 
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Menu & Stock Status"
            >
              {isRefreshing ? "⏳" : "🔄"} Refresh
            </button>
            
            {/* Order Source Selection */}
            <select 
              className={styles.orderSourceSelect}
              value={orderSource}
              onChange={(e) => {
                setOrderSource(e.target.value);
                if (e.target.value !== "DINE_IN") {
                  setSelectedTableId(null);
                }
              }}
            >
              <option value="DINE_IN">🍽️ Dine In</option>
              <option value="TAKEAWAY">📦 Takeaway</option>
              <option value="DELIVERY">🚚 Delivery</option>
            </select>
            
            {/* Table Selection - Show ONLY for DINE_IN */}
            {orderSource === "DINE_IN" && (
              <select 
                className={styles.tableSelect}
                value={selectedTableId === null ? "" : selectedTableId}
                onChange={handleTableChange}
                style={{ border: !selectedTableId && items.length > 0 ? '2px solid red' : '1px solid #ddd' }}
              >
                <option value="">-- Select Table --</option>
                {tables && tables.length > 0 ? (
                  tables
                    .filter(t => t.status === "AVAILABLE" && !t.parentTableId)
                    .map(t => (
                      <option key={t.id} value={t.id}>Table {t.tableNo}</option>
                    ))
                ) : (
                  <option disabled>No tables available</option>
                )}
              </select>
            )}
            
            {/* Show order type badge for TAKEAWAY/DELIVERY */}
            {orderSource !== "DINE_IN" && (
              <span className={styles.orderTypeBadge}>
                {orderSource === "TAKEAWAY" ? "📦 Takeaway" : "🚚 Delivery"}
              </span>
            )}
            
            {/* Toggle Cart Button - Desktop */}
            <button 
              className={styles.toggleCartBtn} 
              onClick={toggleCart}
              title={isCartOpen ? "Hide Cart" : "Show Cart"}
            >
              {isCartOpen ? "▶️ Hide Cart" : "◀️ Show Cart"}
            </button>
            
            {/* Mobile cart toggle */}
            <button className={styles.mobileCartToggle} onClick={toggleMobileCart}>
              🛒 ({totalItemsInCart})
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={`${styles.scrollableContent} ${!isCartOpen ? styles.expandedContent : ""}`}>
          {/* Pending Orders Section */}
          {pendingOrders.length > 0 && (
            <div className={styles.pendingOrdersSection}>
              <div className={styles.pendingHeader}>
                <h3>💰 Pending Payments</h3>
                <span>{pendingOrders.length} orders</span>
              </div>
              <div className={styles.pendingOrdersList}>
                {pendingOrders.map(order => (
                  <div key={order.id} className={styles.pendingOrderCard}>
                    <div className={styles.pendingOrderInfo}>
                      <span className={styles.invoiceNo}>#{order.invoiceNo}</span>
                      <span className={styles.tableNo}>
                        {order.orderSource === "DINE_IN" 
                          ? `Table ${order.table?.tableNo}` 
                          : order.orderSource}
                      </span>
                      <span className={styles.amount}>{order.totalAmount?.toLocaleString()} Ks</span>
                      <span className={`${styles.status} ${styles[order.status?.toLowerCase()]}`}>
                        {order.status}
                      </span>
                    </div>
                    <button className={styles.payNowBtn} onClick={() => handlePaymentForOrder(order)}>
                      💳 Pay Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Bar - Sticky */}
          <div className={styles.categoryBar}>
            <button 
              className={`${styles.categoryChip} ${!selectedCategory ? styles.active : ""}`} 
              onClick={() => setSelectedCategory("")}
            >
              All
            </button>
            {categories?.filter(c => c.isActive).map(cat => (
              <button 
                key={cat.id} 
                className={`${styles.categoryChip} ${selectedCategory === cat.id ? styles.active : ""}`} 
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
            <div className={styles.searchWrapper}>
              <input 
                type="text" 
                placeholder="🔍 Search menu..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className={styles.searchInput} 
              />
            </div>
          </div>

          {/* Products Grid - Scrollable */}
          <div className={styles.productsGrid}>
            {productsLoading || isRefreshing ? (
              <div className={styles.loading}>Loading menu...</div>
            ) : filteredProducts?.length === 0 ? (
              <div className={styles.emptyProducts}>
                <span>📭</span>
                <p>No products found</p>
              </div>
            ) : (
              filteredProducts.map(product => <ProductCard key={product.id} product={product} />)
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar - Conditional Rendering */}
      {isCartOpen && (
        <div className={`${styles.Cart} ${isMobileCartOpen ? styles.mobileOpen : ""}`}>
          <div className={styles.mobileCartHeader}>
            <h3>🛒 Your Order</h3>
            <button className={styles.closeMobileCart} onClick={() => setIsMobileCartOpen(false)}>×</button>
          </div>
          <Cart 
            cartId={null}
            userId={user?.id || 1}
            selectedTableId={selectedTableId}
            orderSource={orderSource}
            onOrderSuccess={(order) => {
              setOrderSuccess(order);
              setIsMobileCartOpen(false);
              dispatch(fetchAllOrders());
            }} 
            onClose={() => {}}
          />
        </div>
      )}

      {/* Floating Button to Show Cart when hidden */}
      {!isCartOpen && (
        <button className={styles.showCartFloatingBtn} onClick={toggleCart}>
          🛒
          {totalItemsInCart > 0 && (
            <span className={styles.cartBadge}>{totalItemsInCart}</span>
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileCartOpen && <div className={styles.mobileOverlay} onClick={toggleMobileCart} />}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>💳 Payment - {selectedOrderForPayment.invoiceNo}</h3>
              <button className={styles.modalClose} onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className={styles.paymentContent}>
              <div className={styles.orderInfo}>
                <p>Table: <strong>
                  {selectedOrderForPayment.orderSource === "DINE_IN" 
                    ? `Table ${selectedOrderForPayment.table?.tableNo}` 
                    : selectedOrderForPayment.orderSource}
                </strong></p>
                <p>Items: <strong>{selectedOrderForPayment.orderItems?.length || 0}</strong></p>
              </div>
              <div className={styles.paymentTotal}>
                <span>Total Amount</span>
                <span className={styles.paymentTotalAmount}>{selectedOrderForPayment.totalAmount?.toLocaleString()} Ks</span>
              </div>
              <div className={styles.paymentMethodGroup}>
                <label>Payment Method</label>
                <div className={styles.methodButtons}>
                  {["CASH", "KPAY", "WAVEPAY", "CARD"].map(method => (
                    <button 
                      key={method} 
                      className={`${styles.methodBtn} ${paymentMethod === method ? styles.active : ""}`} 
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === "CASH" ? "💵 Cash" : method === "KPAY" ? "🏦 KBZ Pay" : method === "WAVEPAY" ? "📱 Wave Pay" : "💳 Card"}
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
                    onChange={(e) => setCashReceived(e.target.value)} 
                    className={styles.cashInput} 
                  />
                  {cashReceived && (
                    <div className={styles.changeAmount}>
                      Change: {getChangeAmount().toLocaleString()} Ks
                    </div>
                  )}
                </div>
              )}
              <button 
                className={styles.confirmPayBtn} 
                onClick={handleConfirmPayment} 
                disabled={loading || actionLoading}
              >
                {loading || actionLoading ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal - Print Order button removed */}
      {orderSuccess && (
        <div className={styles.modalOverlay} onClick={() => setOrderSuccess(null)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIcon}>✅</div>
            <h3>Order Placed!</h3>
            <p>Invoice: <strong>{orderSuccess.invoiceNo}</strong></p>
            <p>
              {orderSuccess.orderSource === "DINE_IN" 
                ? `Table: Table ${orderSuccess.table?.tableNo}` 
                : `Order Type: ${orderSuccess.orderSource}`}
            </p>
            <p>Total: {orderSuccess.totalAmount?.toLocaleString()} Ks</p>
            <p className={styles.paymentNote}>⚠️ Payment will be collected after dining</p>
            <button className={styles.closeSuccessBtn} onClick={() => setOrderSuccess(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Receipt Printer Modal - Show after payment only */}
      {showReceipt && currentReceiptOrder && (
        <ReceiptPrinter
          order={currentReceiptOrder}
          onClose={() => {
            setShowReceipt(false);
            setCurrentReceiptOrder(null);
          }}
          onPrint={() => {
            console.log('Receipt printed successfully');
          }}
        />
      )}
    </div>
  );
}

export default PosSales;