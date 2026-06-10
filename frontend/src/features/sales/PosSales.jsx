import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllProducts } from "../../features/products/productSlice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import { createOrder } from "../../features/orders/orderSlice";
import { clearCart } from "./cartSlice";
import { toggleSidebar } from "../../app/uiSlice";
import api from "../../app/api";  // ⭐ api instance ထည့်ပါ
import Sidebar from "../../components/Sidebar";
import ProductCard from "../../pages/admin/ProductCard";
import CartSidebar from "./CartSidebar";
import styles from "../../assets/css/posSales.module.css";

function PosSales() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: products, loading: productsLoading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [tables, setTables] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
    fetchTables();
  }, [dispatch]);

  // ⭐ api instance သုံးပြီး ပြင်ထားပါ
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

  const handleCheckout = () => {
    if (items.length === 0) {
      alert("Please add items to cart");
      return;
    }
    if (!selectedTableId) {
      alert("Please select a table");
      return;
    }
    setShowPaymentModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!selectedTableId) {
      alert("Please select a table");
      return;
    }

    setLoading(true);
    const orderData = {
      createdBy: { id: user?.id || 1 },
      table: { id: selectedTableId },
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      orderSource: "DINE_IN",
      orderItems: items.map(item => ({
        product: { id: item.id },
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      setOrderSuccess(result);
      dispatch(clearCart());
      setShowPaymentModal(false);
      setSelectedTableId(null);
      setCashReceived("");
    } catch (error) {
      alert("Order failed: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const getChangeAmount = () => {
    if (paymentMethod !== "CASH" || !cashReceived) return 0;
    const received = parseFloat(cashReceived);
    if (isNaN(received)) return 0;
    return received - totalAmount;
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <div className={styles.posHeader}>
          <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
            ☰
          </button>
          <h1 style={{background:"none",color:"black", fontSize:"18px",weight:"bold"}}>🧾 POS Sales</h1>
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
          </div>
        </div>

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
            filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>

      <div className={styles.cartSidebar}>
        <CartSidebar onCheckout={handleCheckout} />
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.paymentModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>💳 Payment</h3>
              <button className={styles.modalClose} onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            
            <div className={styles.paymentContent}>
              <div className={styles.paymentTotal}>
                <span>Total Amount</span>
                <span className={styles.paymentTotalAmount}>{totalAmount?.toLocaleString()} Ks</span>
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
                onClick={handleConfirmOrder}
                disabled={loading}
              >
                {loading ? "Processing..." : `Confirm & Pay ${totalAmount?.toLocaleString()} Ks`}
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
            <h3>Order Successful!</h3>
            <p>Invoice: <strong>{orderSuccess.invoiceNo}</strong></p>
            <p>Total: {orderSuccess.totalAmount?.toLocaleString()} Ks</p>
            <button className={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print Invoice
            </button>
            <button className={styles.closeSuccessBtn} onClick={() => setOrderSuccess(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PosSales;