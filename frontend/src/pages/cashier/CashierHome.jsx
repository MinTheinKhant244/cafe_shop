import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/cashier.module.css";

// Sample Dummy Products Data
const MOCK_PRODUCTS = [
  { id: 1, name: "Iced Mocha", price: 140.00, category: "Coffee", image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=150" },
  { id: 2, name: "Hot Chocolate", price: 100.00, category: "Cocoa", image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150" },
  { id: 3, name: "Chai Latte", price: 100.00, category: "Coffee", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150" },
  { id: 4, name: "Cappuccino", price: 80.00, category: "Coffee", image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=150" },
  { id: 5, name: "Espresso", price: 50.00, category: "Coffee", image: "https://images.unsplash.com/photo-1510591509382-7434f31336f6?w=150" },
  { id: 6, name: "Americano", price: 60.00, category: "Coffee", image: "https://images.unsplash.com/photo-1551046713-b49f9a3c8d30?w=150" }
];

const CATEGORIES = ["Favorites", "Wine", "Starter", "Add on", "Coffee"];

function CashierHome() {
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState("Coffee");

  // Cart ထဲသို့ ပစ္စည်းထည့်ခြင်း Logic
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
  };

  // Quantity အတိုးအလျှော့ လုပ်ခြင်း Logic
  const updateQty = (id, amount) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + amount;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  // Item ဖျက်ခြင်း
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== id));
  };

  // တွက်ချက်မှုများ
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const tax = subtotal > 0 ? 21.00 : 0; // Fix TAX ပုံစံတွက်ထားခြင်း
  const total = subtotal + tax;

  return (
    <div className={styles.dashboardLayout}>
      {/* ၁။ Sidebar */}
      <Sidebar />

      {/* ၂။ အလယ်ပိုင်း ကော်ဖီရွေးချယ်ရန် Area */}
      <div className={styles.mainContent}>
        {/* Top Header Row */}
        <header className={styles.topHeader}>
          <div className={styles.searchBar}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search menu..." />
          </div>
          <div className={styles.headerInfo}>
            <span><i className="fa-solid fa-location-dot"></i> Mandalay</span>
            <span><i className="fa-solid fa-laptop"></i> CO-1</span>
            <i className="fa-regular fa-bell styles.noti"></i>
          </div>
        </header>

        {/* Categories Tabs */}
        <div className={styles.tabContainer}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              className={`${styles.tabBtn} ${activeTab === cat ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className={styles.productsGrid}>
          {MOCK_PRODUCTS.map(product => (
            <div key={product.id} className={styles.productCard} onClick={() => addToCart(product)}>
              <img src={product.image} alt={product.name} />
              <div className={styles.cardDetail}>
                <h4>{product.name}</h4>
                <p>₹ {product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ၃။ ညာဘက်ခြမ်း Order Cart Area */}
      <div className={styles.cartSection}>
        <div className={styles.cartHeader}>
          <h3>Delivery Order <i className="fa-solid fa-chevron-down"></i></h3>
        </div>
        
        <div className={styles.addCustomer}>
          <i className="fa-regular fa-user"></i> Add customer
        </div>

        {/* Cart Items List */}
        <div className={styles.cartItemsList}>
          {cart.map(item => (
            <div key={item.id} className={styles.cartItem}>
              <div className={styles.itemMeta}>
                <h5>{item.name}</h5>
                <span>Regular</span>
              </div>
              <div className={styles.qtyControl}>
                <button onClick={() => updateQty(item.id, -1)}>-</button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.id, 1)}>+</button>
              </div>
              <div className={styles.itemPrice}>
                ₹ {(item.price * item.qty).toFixed(2)}
              </div>
              <button className={styles.deleteBtn} onClick={() => removeFromCart(item.id)}>×</button>
            </div>
          ))}
        </div>

        {/* Total Calculations summary at bottom */}
        <div className={styles.cartSummary}>
          <div className={styles.summaryRow}>
            <span>Tax</span>
            <span>₹ {tax.toFixed(2)}</span>
          </div>
          <button className={styles.payButton}>
            <span>Pay</span>
            <span>₹ {total.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashierHome;