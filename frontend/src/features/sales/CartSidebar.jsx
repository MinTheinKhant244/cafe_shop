import { useSelector, useDispatch } from "react-redux";
import { updateQuantity, removeFromCart, clearCart } from "./cartSlice";
import styles from "../../assets/css/posSales.module.css";

function CartSidebar({ onCheckout, stockResult, stockChecking }) {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);

  const hasStockIssue = (productId) => {
    if (!stockResult?.insufficient) return false;
    return stockResult.insufficient.some(ingredient =>
      ingredient.products.some(p => p.productId === productId)
    );
  };

  const getMaxAllowed = (item) => {
    if (hasStockIssue(item.id)) {
      return item.quantity;
    }
    return item.maxAllowed || 99;
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear all items?")) {
      dispatch(clearCart());
    }
  };

  const handleIncreaseQuantity = (item) => {
    const maxAllowed = getMaxAllowed(item);
    if (item.quantity >= maxAllowed) {
      if (hasStockIssue(item.id)) {
        alert(`Cannot add more "${item.name}" due to insufficient stock!`);
      } else {
        alert(`Only ${maxAllowed} of "${item.name}" available!`);
      }
      return;
    }
    dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }));
  };

  // ⭐ FIXED: Decrease quantity - shows confirmation only when removing
  const handleDecreaseQuantity = (item) => {
    if (item.quantity <= 1) {
      // Show confirmation before removing from cart
      if (window.confirm(`Remove "${item.name}" from cart?`)) {
        dispatch(removeFromCart(item.id));
      }
    } else {
      dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }));
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.cartEmpty}>
        <span className={styles.emptyCartIcon}>🛒</span>
        <p>Cart is empty</p>
        <small>Tap on products to add</small>
      </div>
    );
  }

  const hasAnyStockIssue = items.some(item => hasStockIssue(item.id));

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h3>🛒 Current Order</h3>
        <button className={styles.clearCartBtn} onClick={handleClearCart}>
          Clear All
        </button>
      </div>

      {stockChecking && (
        <div className={styles.stockCheckingIndicator}>
          <span>⏳</span> Checking stock availability...
        </div>
      )}

      {hasAnyStockIssue && !stockChecking && (
        <div className={styles.cartStockWarning}>
          ⚠️ Some items have insufficient stock. Cannot increase quantity.
        </div>
      )}

      <div className={styles.cartItems}>
        {items.map((item) => {
          const hasIssue = hasStockIssue(item.id);
          const maxAllowed = getMaxAllowed(item);
          const isAtMax = item.quantity >= maxAllowed;
          
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
                >
                  -
                </button>
                <span className={styles.cartItemQty}>{item.quantity}</span>
                <button 
                  className={`${styles.qtyBtn} ${isAtMax ? styles.disabledBtn : ""}`}
                  onClick={() => handleIncreaseQuantity(item)}
                  disabled={isAtMax}
                >
                  +
                </button>
                <button 
                  className={styles.removeBtn}
                  onClick={() => {
                    if (window.confirm(`Remove "${item.name}" from cart?`)) {
                      dispatch(removeFromCart(item.id));
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
              {hasIssue && (
                <div className={styles.stockWarningMsg}>
                  ⚠️ Insufficient stock - cannot add more
                </div>
              )}
              {!hasIssue && item.maxAllowed && item.quantity >= item.maxAllowed && item.maxAllowed > 0 && (
                <div className={styles.maxReachedMsg}>
                  Max reached ({item.maxAllowed})
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
          className={`${styles.placeOrderBtn} ${(stockResult?.available === false || hasAnyStockIssue) ? styles.disabled : ""}`} 
          onClick={onCheckout}
          disabled={stockResult?.available === false || stockChecking || hasAnyStockIssue}
        >
          {stockResult?.available === false || hasAnyStockIssue 
            ? "⚠️ Stock Insufficient - Cannot Place Order" 
            : "📝 Place Order (Pay Later)"}
        </button>
      </div>
    </div>
  );
}

export default CartSidebar;