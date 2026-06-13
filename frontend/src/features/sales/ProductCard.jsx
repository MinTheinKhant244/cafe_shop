// features/products/ProductCard.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, getProductStockStatus } from "../carts/cartSlice";
import styles from "../../assets/css/posSales.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showOutOfStockMsg, setShowOutOfStockMsg] = useState(false);
  const fetchedRef = useRef(false);
  
  // Get data from cart slice (Session Storage)
  const cartItems = useSelector((state) => state.cart.items);
  const refreshVersion = useSelector((state) => state.cart?.refreshVersion || 0);
  
  // Get stock status from cart slice
  const stockStatus = useSelector((state) => state.cart?.stockStatus?.[product.id]);
  const isLoading = useSelector((state) => state.cart?.loading || false);
  
  const existingItem = cartItems.find(item => item.id === product.id);
  const currentQuantity = existingItem?.quantity || 0;
  
  // 🔥 availableQuantity = MAX total that can be in cart (including current)
  const maxTotalQuantity = stockStatus?.availableQuantity ?? product.currentStock ?? 999;
  const isOutOfStock = stockStatus?.isOutOfStock ?? maxTotalQuantity <= 0;
  const isLowStock = stockStatus?.isLowStock ?? (maxTotalQuantity > 0 && maxTotalQuantity <= 5);
  
  // 🔥 remainingQuantity = how many MORE can be added
  const remainingQuantity = Math.max(0, maxTotalQuantity - currentQuantity);
  
  // Display text
  const getStockDisplayText = () => {
    if (isOutOfStock) return "Out of stock";
    if (remainingQuantity === 0) return "Max reached";
    if (remainingQuantity <= 5) return `Only ${remainingQuantity} left`;
    if (maxTotalQuantity === 999) return "In stock";
    return `${remainingQuantity} more can be added`;
  };

  // Fetch product stock from backend (with current cart items)
  const fetchProductStock = async () => {
    if (!product?.id) return;
    
    try {
      await dispatch(getProductStockStatus({ 
        productId: product.id
      })).unwrap();
    } catch (error) {
      console.error(`Failed to fetch stock status for ${product.name}:`, error);
    }
  };

  // Initial stock fetch
  useEffect(() => {
    if (!fetchedRef.current && product?.id) {
      fetchedRef.current = true;
      fetchProductStock();
    }
  }, [product.id]);

  // Refetch stock when cart changes
  useEffect(() => {
    if (fetchedRef.current && product?.id) {
      const timeoutId = setTimeout(() => {
        fetchProductStock();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [refreshVersion, product.id, currentQuantity]);

  // Auto-hide out of stock message after 2 seconds
  useEffect(() => {
    if (showOutOfStockMsg) {
      const timer = setTimeout(() => {
        setShowOutOfStockMsg(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showOutOfStockMsg]);

  const handleAdd = async () => {
    if (adding || isLoading) return;
    
    // 🔥 Check out of stock FIRST - show message but don't add
    if (isOutOfStock) {
      setShowOutOfStockMsg(true);
      return;
    }
    
    // 🔥 Check if max reached
    if (remainingQuantity <= 0) {
      setShowOutOfStockMsg(true);
      return;
    }
    
    setAdding(true);
    
    try {
      // Add to session storage cart
      dispatch(addToCart({
        ...product,
        currentStock: maxTotalQuantity
      }));
      
      setAdded(true);
      setTimeout(() => setAdded(false), 1000);
      
      // Refresh stock status after adding
      setTimeout(() => {
        fetchProductStock();
      }, 100);
      
    } catch (error) {
      console.error("Add to cart error:", error);
      alert(error?.message || "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  // Show loading state
  const showLoading = isLoading && !stockStatus && fetchedRef.current;

  return (
    <div 
      className={`${styles.productCard} ${isOutOfStock || remainingQuantity <= 0 ? styles.disabled : ""}`} 
      onClick={handleAdd}
      style={{ 
        cursor: (isOutOfStock || remainingQuantity <= 0) ? 'not-allowed' : 'pointer', 
        opacity: (isOutOfStock || remainingQuantity <= 0) ? 0.6 : 1 
      }}
    >
      <div className={styles.productImageWrapper}>
        <img 
          src={`http://localhost:8080/uploads/${product.image}`} 
          alt={product.name}
          className={styles.productImage}
          onError={(e) => e.target.src = "/placeholder.png"}
        />
        {(isOutOfStock || remainingQuantity <= 0) && (
          <div className={styles.outOfStockBadge}>Out of Stock</div>
        )}
        {!isOutOfStock && remainingQuantity > 0 && remainingQuantity <= 5 && (
          <div className={styles.lowStockBadge}>Low Stock</div>
        )}
        {showLoading && (
          <div className={styles.loadingBadge}>Loading...</div>
        )}
      </div>
      
      <div className={styles.productInfo}>
        <h4 className={styles.productTitle}>{product.name}</h4>
        <p className={styles.productCategory}>{product.category?.name}</p>
        
        {/* 🔥 Real-time stock info */}
        {!showLoading && (
          <div className={`${styles.stockInfo} ${(isOutOfStock || remainingQuantity <= 0) ? styles.outOfStockMsg : (isLowStock ? styles.lowStockWarning : '')}`}>
            📦 {getStockDisplayText()}
            {currentQuantity > 0 && !isOutOfStock && (
              <span className={styles.inCartQuantity}> ({currentQuantity} in cart)</span>
            )}
          </div>
        )}
        
        {/* 🔥 Show out of stock message when clicked */}
        {showOutOfStockMsg && (
          <div className={styles.outOfStockClickMsg}>
            ⚠️ {product.name} is out of stock!
          </div>
        )}
        
        {/* Show limiting ingredient if any */}
        {stockStatus?.ingredientLimits && stockStatus.ingredientLimits.length > 0 && 
         stockStatus.ingredientLimits[0]?.isLimiting && !isOutOfStock && remainingQuantity > 0 && (
          <div className={styles.limitingIngredient}>
            🔸 Limited by: {stockStatus.ingredientLimits[0].ingredientName}
            <span className={styles.limitDetail}>
              ({stockStatus.ingredientLimits[0].availableStock} {stockStatus.ingredientLimits[0].unit} left)
            </span>
          </div>
        )}
        
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>{product.price?.toLocaleString()} Ks</span>
          {added && <span className={styles.addedBadge}>✓ Added</span>}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;