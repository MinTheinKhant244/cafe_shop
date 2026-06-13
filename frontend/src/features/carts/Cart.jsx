import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  updateItemQuantity, 
  removeFromCart, 
  clearCart,
  updateItemNote,
  updateOrderNote,
  setTableId,
  validateCartStock,
  setLoading,
  clearError,
  getAllCartProductsStock
} from "./cartSlice";
import api from "../../app/api";
import styles from "../../assets/css/posSales.module.css";

function Cart({ onOrderSuccess, onClose, selectedTableId }) {
  const dispatch = useDispatch();
  const { items, totalAmount, tableId, orderNote, error, loading, stockStatus } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🔥 Refresh ALL product stocks when cart items change
  useEffect(() => {
    if (items.length > 0) {
      const timeout = setTimeout(() => {
        dispatch(getAllCartProductsStock());
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [items.map(i => `${i.id}-${i.quantity}`).join()]);
  
  // Get stock warning for an item
  const getStockWarning = (item) => {
    const stock = stockStatus[item.id];
    if (stock?.isOutOfStock) return "❌ Out of stock!";
    if (stock?.isLowStock) return `⚠️ Only ${stock.availableQuantity} left`;
    if (stock?.warningMessage) return stock.warningMessage;
    if (item.quantity > (item.currentStock || 999)) return `⚠️ Only ${item.currentStock} available`;
    return null;
  };
  
  // Check if item can be increased
  const canIncrease = (item) => {
    const stock = stockStatus[item.id];
    const maxStock = stock?.availableQuantity ?? item.currentStock ?? 999;
    return item.quantity < maxStock && !stock?.isOutOfStock;
  };
  
  // Place order
  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      alert("Cart is empty!");
      return;
    }
    
    const currentTableId = selectedTableId || tableId;
    if (!currentTableId) {
      alert("Please select a table");
      return;
    }
    
    setIsProcessing(true);
    dispatch(setLoading(true));
    
    try {
      // Final stock validation before order
      const validationResult = await dispatch(validateCartStock()).unwrap();
      
      if (!validationResult.isValid) {
        alert(validationResult.message || "Some items have stock issues. Please check and try again.");
        setIsProcessing(false);
        dispatch(setLoading(false));
        return;
      }
      
      // Create order
      const orderData = {
        createdBy: { id: user?.id || 1 },
        table: { id: currentTableId },
        totalAmount: totalAmount,
        paymentStatus: "UNPAID",
        orderSource: "DINE_IN",
        status: "PENDING",
        orderItems: items.map(item => ({
          product: { id: item.id },
          quantity: item.quantity,
          price: item.price,
          note: item.note
        })),
        orderNote: orderNote
      };
      
      const response = await api.post("/orders/create", orderData);
      const result = response.data;
      
      // Clear cart after successful order
      dispatch(clearCart());
      
      if (onOrderSuccess) {
        onOrderSuccess(result);
      }
      
      if (onClose) {
        onClose();
      }
      
      alert(`✅ Order #${result.invoiceNo} created successfully!`);
      
    } catch (error) {
      console.error("Order failed:", error);
      alert("Order failed: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
      dispatch(setLoading(false));
    }
  };
  
  // Loading state
  if (loading || isProcessing) {
    return (
      <div className={styles.cartEmpty}>
        <span className={styles.emptyCartIcon}>⏳</span>
        <p>Processing...</p>
      </div>
    );
  }
  
  // Empty cart state
  if (items.length === 0) {
    return (
      <div className={styles.cartEmpty}>
        <span className={styles.emptyCartIcon}>🛒</span>
        <p>Cart is empty</p>
        <small>Tap on products to add</small>
      </div>
    );
  }
  
  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h3>🛒 Current Order</h3>
        <button 
          className={styles.clearCartBtn} 
          onClick={() => {
            if (window.confirm("Clear all items?")) {
              dispatch(clearCart());
            }
          }}
        >
          Clear All
        </button>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          ⚠️ {error}
          <button onClick={() => dispatch(clearError())}>×</button>
        </div>
      )}
      
      <div className={styles.cartItems}>
        {items.map((item) => {
          const stockWarning = getStockWarning(item);
          const canIncreaseItem = canIncrease(item);
          
          return (
            <div key={item.id} className={`${styles.cartItem} ${stockWarning ? styles.hasWarning : ""}`}>
              {item.image && (
                <img 
                  src={`http://localhost:8080/uploads/${item.image}`}
                  alt={item.name}
                  className={styles.cartItemImage}
                  onError={(e) => e.target.src = "/placeholder.png"}
                />
              )}
              <div className={styles.cartItemInfo}>
                <span className={styles.cartItemName}>{item.name}</span>
                <span className={styles.cartItemPrice}>{item.price?.toLocaleString()} Ks</span>
                {stockWarning && (
                  <div className={styles.stockWarning}>{stockWarning}</div>
                )}
                {item.note && (
                  <div className={styles.itemNote}>📝 {item.note}</div>
                )}
              </div>
              <div className={styles.cartItemActions}>
                <button 
                  className={styles.qtyBtn}
                  onClick={() => dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity - 1 }))}
                >
                  -
                </button>
                <span className={styles.cartItemQty}>{item.quantity}</span>
                <button 
                  className={styles.qtyBtn}
                  onClick={() => {
                    if (canIncreaseItem) {
                      dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity + 1 }));
                    } else {
                      alert(stockWarning || "Cannot add more");
                    }
                  }}
                  disabled={!canIncreaseItem}
                >
                  +
                </button>
                <button 
                  className={styles.removeBtn}
                  onClick={() => dispatch(removeFromCart(item.id))}
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className={styles.cartFooter}>
        <div className={styles.totalRow}>
          <span>Total Amount</span>
          <span className={styles.totalAmount}>{totalAmount?.toLocaleString()} Ks</span>
        </div>
        
        <textarea
          className={styles.orderNoteInput}
          placeholder="Order note (e.g., no onion, extra spicy)..."
          value={orderNote || ""}
          onChange={(e) => dispatch(updateOrderNote(e.target.value))}
          rows={2}
        />
        
        <button 
          className={styles.placeOrderBtn} 
          onClick={handlePlaceOrder}
          disabled={loading || isProcessing}
        >
          {loading || isProcessing ? "⏳ Processing..." : "📝 Place Order"}
        </button>
      </div>
    </div>
  );
}

export default Cart;