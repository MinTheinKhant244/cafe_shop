import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateItemQuantity, removeCartItem, clearCart, updateCartItemLimit } from "./cartSlice";
import { createOrder } from "../orders/orderSlice";
import { getProductStockStatus } from "../inventory/inventorySlice";
import styles from "../../assets/css/posSales.module.css";

function Cart({ onCheckout, onOrderSuccess }) {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);
  const { actionLoading, error } = useSelector((state) => state.orders);
  
  const [localStockChecking, setLocalStockChecking] = useState(false);
  const [productStockStatuses, setProductStockStatuses] = useState({});

  // Fetch stock status for each product in cart
  useEffect(() => {
    const fetchStockStatuses = async () => {
      if (items.length === 0) {
        setProductStockStatuses({});
        return;
      }
      
      setLocalStockChecking(true);
      
      const statuses = {};
      for (const item of items) {
        try {
          const result = await dispatch(getProductStockStatus(item.id)).unwrap();
          statuses[item.id] = result;
          
          // Update cart item limit if needed
          const maxAllowed = result.currentStock || 99;
          if (item.quantity > maxAllowed) {
            dispatch(updateCartItemLimit({ 
              productId: item.id, 
              maxAllowed: maxAllowed 
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch stock for ${item.id}:`, error);
          // Default to available if API fails
          statuses[item.id] = { currentStock: 99, outOfStock: false };
        }
      }
      
      setProductStockStatuses(statuses);
      setLocalStockChecking(false);
    };
    
    const timer = setTimeout(fetchStockStatuses, 300);
    return () => clearTimeout(timer);
  }, [items, dispatch]);

  const getMaxAllowed = (item) => {
    const stockInfo = productStockStatuses[item.id];
    if (stockInfo && stockInfo.currentStock !== undefined) {
      return stockInfo.currentStock;
    }
    return item.maxAllowed || 99;
  };

  const hasStockIssue = (item) => {
    const stockInfo = productStockStatuses[item.id];
    if (!stockInfo) return false;
    return stockInfo.outOfStock === true && stockInfo.currentStock <= 0;
  };

  const getRemainingStock = (item) => {
    const stockInfo = productStockStatuses[item.id];
    if (!stockInfo) return null;
    return (stockInfo.currentStock || 99) - item.quantity;
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear all items?")) {
      dispatch(clearCart());
      setProductStockStatuses({});
    }
  };

  const handleIncreaseQuantity = async (item) => {
    const maxAllowed = getMaxAllowed(item);
    const stockInfo = productStockStatuses[item.id];
    
    if (item.quantity >= maxAllowed) {
      if (stockInfo?.outOfStock) {
        alert(`"${item.name}" is out of stock!`);
      } else {
        alert(`Only ${maxAllowed} of "${item.name}" available!`);
      }
      return;
    }
    
    dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity + 1 }));
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity <= 1) {
      if (window.confirm(`Remove "${item.name}" from cart?`)) {
        dispatch(removeCartItem(item.id));
      }
    } else {
      dispatch(updateItemQuantity({ id: item.id, quantity: item.quantity - 1 }));
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const orderData = {
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: totalAmount,
      orderType: "RETAIL",
      paymentStatus: "PENDING"
    };

    const result = await dispatch(createOrder(orderData));
    
    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      setProductStockStatuses({});
      
      if (onOrderSuccess) {
        onOrderSuccess(result.payload);
      } else if (onCheckout) {
        onCheckout(result.payload);
      }
      
      alert(`Order #${result.payload.orderNumber || result.payload.id} created successfully!`);
    } else {
      alert(result.payload?.message || "Failed to create order");
    }
  };

  const isLoading = actionLoading || localStockChecking;
  const hasAnyStockIssue = items.some(item => hasStockIssue(item));

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
          onClick={handleClearCart}
          disabled={isLoading}
        >
          Clear All
        </button>
      </div>

      {isLoading && (
        <div className={styles.stockCheckingIndicator}>
          <span>⏳</span> Checking stock...
        </div>
      )}

      {error && !isLoading && (
        <div className={styles.cartStockWarning}>
          ⚠️ {error}
        </div>
      )}

      <div className={styles.cartItems}>
        {items.map((item) => {
          const stockInfo = productStockStatuses[item.id];
          const maxAllowed = getMaxAllowed(item);
          const isAtMax = item.quantity >= maxAllowed;
          const remaining = getRemainingStock(item);
          const hasIssue = hasStockIssue(item);
          
          return (
            <div key={item.id} className={`${styles.cartItem} ${hasIssue ? styles.hasStockIssue : ""}`}>
              <div className={styles.cartItemInfo}>
                <span className={styles.cartItemName}>{item.name}</span>
                <span className={styles.cartItemPrice}>{item.price?.toLocaleString()} Ks</span>
              </div>
              <div className={styles.cartItemActions}>
                <button 
                  className={styles.qtyBtn}
                  onClick={() => handleDecreaseQuantity(item)}
                  disabled={isLoading}
                >
                  -
                </button>
                <span className={styles.cartItemQty}>{item.quantity}</span>
                <button 
                  className={`${styles.qtyBtn} ${isAtMax ? styles.disabledBtn : ""}`}
                  onClick={() => handleIncreaseQuantity(item)}
                  disabled={isAtMax || isLoading}
                >
                  +
                </button>
                <button 
                  className={styles.removeBtn}
                  onClick={() => {
                    if (window.confirm(`Remove "${item.name}" from cart?`)) {
                      dispatch(removeCartItem(item.id));
                    }
                  }}
                  disabled={isLoading}
                >
                  🗑️
                </button>
              </div>
              
              {remaining !== null && remaining >= 0 && !hasIssue && remaining < 10 && (
                <div className={styles.cartItemStockInfo}>
                  <span className={styles.stockRemaining}>
                    📦 Only {remaining} left in stock
                  </span>
                </div>
              )}
              
              {hasIssue && (
                <div className={styles.stockWarningMsg}>
                  ⚠️ Out of stock
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.cartFooter}>
        <div className={styles.totalRow}>
          <span>Total Amount</span>
          <span className={styles.totalAmount}>{totalAmount?.toLocaleString()} Ks</span>
        </div>
        <div className={styles.cartSummary}>
          <small>Items: {items.reduce((sum, i) => sum + i.quantity, 0)}</small>
        </div>
        <button 
          className={styles.placeOrderBtn} 
          onClick={handlePlaceOrder}
          disabled={isLoading}
        >
          {isLoading ? "⏳ Processing..." : "📝 Place Order (Pay Later)"}
        </button>
      </div>
    </div>
  );
}

export default Cart;