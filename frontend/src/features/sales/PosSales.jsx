import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProducts } from "../../features/products/productSlice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import { createOrder, updatePaymentStatus, fetchAllOrders } from "../../features/orders/orderSlice";
import { clearCart } from "../carts/cartSlice";
import { toggleSidebar } from "../../app/uiSlice";
import api from "../../app/api";
import Sidebar from "../../components/Sidebar";
import ProductCard from "../products/ProductCard";
import Cart from "../carts/Cart";
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

  // Initial data loading
  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
    dispatch(fetchAllOrders());
    fetchTables();
  }, [dispatch]);

  // Track pending orders
  useEffect(() => {
    if (orders?.length) {
      const unpaid = orders.filter(o => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED");
      setPendingOrders(unpaid);
    }
  }, [orders]);

  const fetchTables = async () => {
    try {
      const response = await api.get("/tables/all");
      setTables(response.data);
    } catch (error) {
      console.error("Failed to fetch tables", error);
      setTables([]);
    }
  };

  const filteredProducts = products?.filter((p) => {
    const matchesCategory = !selectedCategory || p.category?.id === Number(selectedCategory);
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && p.isActive;
  });

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      alert("Please add items to cart");
      return;
    }
    if (!selectedTableId) {
      alert("Please select a table");
      return;
    }
    
    setLoading(true);
    
    try {
      const orderData = {
        createdBy: { id: user?.id || 1 },
        table: { id: selectedTableId },
        totalAmount: totalAmount,
        paymentStatus: "UNPAID",
        orderSource: "DINE_IN",
        status: "PENDING",
        orderItems: items.map(item => ({
          product: { id: item.id },
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await dispatch(createOrder(orderData)).unwrap();
      setOrderSuccess(result);
      dispatch(clearCart());
      setSelectedTableId(null);
      setIsMobileCartOpen(false);
      dispatch(fetchAllOrders());
      
    } catch (error) {
      console.error("Order error:", error);
      alert("Order failed: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentForOrder = (order) => {
    setSelectedOrderForPayment(order);
    setPaymentMethod("CASH");
    setCashReceived("");
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrderForPayment) return;

    setLoading(true);
    
    try {
      await dispatch(updatePaymentStatus({ 
        id: selectedOrderForPayment.id, 
        paymentStatus: "PAID" 
      })).unwrap();
      
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setCashReceived("");
      dispatch(fetchAllOrders());
      alert(`Payment for ${selectedOrderForPayment.invoiceNo} completed successfully!`);
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

  const totalItemsInCart = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.posHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              ☰
            </button>
            <h1 className={styles.pageTitle}>POS Sales</h1>
          </div>
          <div className={styles.headerRight}>
            <select 
              className={styles.tableSelect}
              value={selectedTableId || ""}
              onChange={(e) => setSelectedTableId(Number(e.target.value))}
            >
              <option value="">-- Select Table --</option>
              {tables.filter(t => t.status === "AVAILABLE" && !t.parentTableId).map(t => (
                <option key={t.id} value={t.id}>Table {t.tableNo}</option>
              ))}
            </select>
            <button className={styles.mobileCartToggle} onClick={toggleMobileCart}>
              🛒 ({totalItemsInCart})
            </button>
          </div>
        </div>

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
                    <span className={styles.tableNo}>Table {order.table?.tableNo}</span>
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

        <div className={styles.productsGrid}>
          {productsLoading ? (
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

      <div className={`${styles.Cart} ${isMobileCartOpen ? styles.mobileOpen : ""}`}>
        <div className={styles.mobileCartHeader}>
          <h3>🛒 Your Order</h3>
          <button className={styles.closeMobileCart} onClick={toggleMobileCart}>×</button>
        </div>
        <Cart onOrderSuccess={(order) => {
          setOrderSuccess(order);
          setIsMobileCartOpen(false);
        }} />
      </div>

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
                <p>Table: <strong>Table {selectedOrderForPayment.table?.tableNo}</strong></p>
                <p>Items: <strong>{selectedOrderForPayment.orderItems?.length || 0}</strong></p>
              </div>
              <div className={styles.paymentTotal}>
                <span>Total Amount</span>
                <span className={styles.paymentTotalAmount}>{selectedOrderForPayment.totalAmount?.toLocaleString()} Ks</span>
              </div>
              <div className={styles.paymentMethodGroup}>
                <label>Payment Method</label>
                <div className={styles.methodButtons}>
                  {["CASH", "KPAY", "WAVE", "CARD"].map(method => (
                    <button 
                      key={method} 
                      className={`${styles.methodBtn} ${paymentMethod === method ? styles.active : ""}`} 
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === "CASH" ? "💵 Cash" : method === "KPAY" ? "🏦 KBZ Pay" : method === "WAVE" ? "📱 Wave Pay" : "💳 Card"}
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

      {/* Order Success Modal */}
      {orderSuccess && (
        <div className={styles.modalOverlay} onClick={() => setOrderSuccess(null)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIcon}>✅</div>
            <h3>Order Placed!</h3>
            <p>Invoice: <strong>{orderSuccess.invoiceNo}</strong></p>
            <p>Table: <strong>Table {orderSuccess.table?.tableNo}</strong></p>
            <p>Total: {orderSuccess.totalAmount?.toLocaleString()} Ks</p>
            <p className={styles.paymentNote}>⚠️ Payment will be collected after dining</p>
            <button className={styles.printBtn} onClick={() => window.print()}>🖨️ Print Order</button>
            <button className={styles.closeSuccessBtn} onClick={() => setOrderSuccess(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosSales;