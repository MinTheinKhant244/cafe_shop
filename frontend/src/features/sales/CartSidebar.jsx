// src/features/sales/CartSidebar.jsx
import { useSelector, useDispatch } from "react-redux";
import { updateQuantity, removeFromCart, clearCart } from "./cartSlice";
import styles from "../../assets/css/posSales.module.css";

function CartSidebar({ onCheckout }) {  // ⭐ onCheckout ကို props အနေနဲ့ လက်ခံထားပြီးသား
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector((state) => state.cart);

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear all items?")) {
      dispatch(clearCart());
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

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeader}>
        <h3>🛒 Current Order</h3>
        <button 
          className={styles.clearCartBtn} 
          onClick={handleClearCart}  // ⭐ confirmation ထည့်ထားပါတယ်
        >
          Clear All
        </button>
      </div>

      <div className={styles.cartItems}>
        {items.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <div className={styles.cartItemInfo}>
              <span className={styles.cartItemName}>{item.name}</span>
              <span className={styles.cartItemPrice}>{item.price?.toLocaleString()} Ks</span>
            </div>
            <div className={styles.cartItemActions}>
              <button 
                className={styles.qtyBtn}
                onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
              >-</button>
              <span className={styles.cartItemQty}>{item.quantity}</span>
              <button 
                className={styles.qtyBtn}
                onClick={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
              >+</button>
              <button 
                className={styles.removeBtn}
                onClick={() => dispatch(removeFromCart(item.id))}
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cartFooter}>
        <div className={styles.totalRow}>
          <span>Total Amount</span>
          <span className={styles.totalAmount}>{totalAmount?.toLocaleString()} Ks</span>
        </div>
        <button className={styles.checkoutBtn} onClick={onCheckout}>
          💳 Proceed to Payment
        </button>
      </div>
    </div>
  );
}

export default CartSidebar;