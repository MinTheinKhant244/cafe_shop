import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateCartItemLimit } from "../carts/cartSlice";
import { getProductStockStatus } from "../inventory/inventorySlice";
import styles from "../../assets/css/posSales.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [stockStatus, setStockStatus] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [apiError, setApiError] = useState(false);
  const fetchedRef = useRef(false);
  
  const cartItems = useSelector((state) => state.cart.items);
  const refreshVersion = useSelector((state) => state.cart?.refreshVersion || 0);
  
  const existingItem = cartItems.find(item => item.id === product.id);
  const currentQuantity = existingItem?.quantity || 0;
  
  // ⭐ Default to available if API fails (don't block user)
  const currentStock = stockStatus?.currentStock ?? 999;
  const isOutOfStock = stockStatus?.outOfStock === true && currentStock <= 0;
  
  // Calculate remaining stock
  const remainingStock = currentStock - currentQuantity;
  const isLowStock = !isOutOfStock && remainingStock > 0 && remainingStock <= 5;
  const displayQuantity = remainingStock > 0 ? remainingStock : (currentStock > 0 ? currentStock : 0);

  // Fetch product stock status from inventory API
  const fetchProductStock = async () => {
    if (!product?.id) return;
    
    setCheckingStock(true);
    setApiError(false);
    try {
      const result = await dispatch(getProductStockStatus(product.id)).unwrap();
      console.log(`Stock for ${product.name}:`, result);
      setStockStatus(result);
      
      // Update cart item limit if needed
      const maxAllowed = result.currentStock || 999;
      if (existingItem && maxAllowed < existingItem.quantity) {
        dispatch(updateCartItemLimit({ 
          productId: product.id, 
          maxAllowed: maxAllowed 
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch stock status for ${product.name}:`, error);
      setApiError(true);
      // ⭐ If API fails, assume product is available (don't block sales)
      setStockStatus({ currentStock: 999, outOfStock: false });
    } finally {
      setCheckingStock(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!fetchedRef.current && product?.id) {
      fetchedRef.current = true;
      fetchProductStock();
    }
  }, [product.id]);

  // Refresh stock when cart changes
  useEffect(() => {
    if (fetchedRef.current && product?.id) {
      const timeoutId = setTimeout(() => {
        fetchProductStock();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [refreshVersion, product.id, currentQuantity]);

  // Handle add to cart
  const handleAdd = async () => {
    if (adding || checkingStock) return;
    
    // ⭐ Don't block if API is still loading - allow add
    // Only block if we know for sure it's out of stock
    if (stockStatus && isOutOfStock) {
      alert(`"${product.name}" is out of stock!`);
      return;
    }
    
    // If still checking stock, allow add (optimistic)
    if (checkingStock) {
      // Still allow add, will sync later
      console.log("Still checking stock, adding anyway...");
    }
    
    setAdding(true);
    
    try {
      // Fetch latest stock status before adding
      const latestStock = await dispatch(getProductStockStatus(product.id)).unwrap();
      setStockStatus(latestStock);
      
      const currentMax = latestStock.currentStock || 999;
      const currentInCart = currentQuantity;
      
      // Check if we can add more (only if we have stock info)
      if (currentMax !== 999 && currentInCart + 1 > currentMax) {
        alert(`Only ${currentMax} of "${product.name}" available!`);
        setAdding(false);
        return;
      }
      
      // Add to cart
      dispatch(addToCart({ 
        ...product, 
        maxAllowedQuantity: currentMax === 999 ? 99 : currentMax,
        currentStock: latestStock.currentStock
      }));
      
      setAdded(true);
      setTimeout(() => setAdded(false), 1000);
      
    } catch (error) {
      console.error("Stock check error:", error);
      // ⭐ Even if error, allow adding to cart (optimistic)
      dispatch(addToCart({ 
        ...product, 
        maxAllowedQuantity: 99,
        currentStock: 999
      }));
      setAdded(true);
      setTimeout(() => setAdded(false), 1000);
    } finally {
      setAdding(false);
    }
  };

  // Don't show loading for too long
  const showLoading = (stockStatus === null && !fetchedRef.current && !apiError) || (checkingStock && !stockStatus);

  return (
    <div 
      className={`${styles.productCard} ${isOutOfStock ? styles.disabled : ""}`} 
      onClick={handleAdd}
      style={{ cursor: 'pointer', opacity: 1 }}
    >
      <div className={styles.productImageWrapper}>
        <img 
          src={`http://localhost:8080/uploads/${product.image}`} 
          alt={product.name}
          className={styles.productImage}
          onError={(e) => e.target.src = "/placeholder.png"}
        />
        {isOutOfStock && (
          <div className={styles.outOfStockBadge}>Out of Stock</div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className={styles.lowStockBadge}>Low Stock</div>
        )}
        {showLoading && (
          <div className={styles.loadingBadge}>Loading...</div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h4 className={styles.productTitle}>{product.name}</h4>
        <p className={styles.productCategory}>{product.category?.name}</p>
        
        {/* Stock info display */}
        {!showLoading && stockStatus && currentStock > 0 && currentStock !== 999 && !isOutOfStock && (
          <div className={`${styles.stockInfo} ${isLowStock ? styles.lowStockWarning : ''}`}>
            📦 {displayQuantity} {product.unit || 'units'} left
            {currentQuantity > 0 && (
              <span className={styles.inCartQuantity}> ({currentQuantity} in cart)</span>
            )}
          </div>
        )}
        
        {!showLoading && stockStatus && currentStock === 999 && !isOutOfStock && (
          <div className={styles.stockInfo}>
            📦 In stock
            {currentQuantity > 0 && (
              <span className={styles.inCartQuantity}> ({currentQuantity} in cart)</span>
            )}
          </div>
        )}
        
        {isOutOfStock && (
          <div className={styles.outOfStockMsg}>⚠️ Out of stock</div>
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