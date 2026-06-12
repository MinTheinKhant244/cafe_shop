import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateCartItemLimit } from "../sales/cartSlice";
import { getProductMaxQuantity, updateProductLimit, checkAddProductStock } from "../sales/stockCheckSlice";
import styles from "../../assets/css/posSales.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [localMaxQuantity, setLocalMaxQuantity] = useState(null);
  const [checkingRealTime, setCheckingRealTime] = useState(false);
  const fetchedRef = useRef(false);
  
  const cartItems = useSelector((state) => state.cart.items);
  const productLimits = useSelector((state) => state.stockCheck?.productLimits || {});
  const cartWideInfo = useSelector((state) => state.stockCheck?.cartWideInfo);
  const refreshVersion = useSelector((state) => state.stockCheck?.refreshVersion || 0);
  
  const existingItem = cartItems.find(item => item.id === product.id);
  const currentQuantity = existingItem?.quantity || 0;
  
  const maxQuantity = productLimits[product.id] !== undefined ? productLimits[product.id] : localMaxQuantity;
  
  const productStockIssue = cartWideInfo?.productIssues?.find(
    issue => issue.productId === product.id
  );
  
  // ⭐ CRITICAL FIX: isOutOfStock should be based on maxQuantity, NOT remaining stock
  // If maxQuantity is 0 -> Out of stock
  // If maxQuantity > 0 -> Available (even if 1 left)
  const isOutOfStock = maxQuantity === 0;
  const remainingStock = maxQuantity !== null ? maxQuantity - currentQuantity : null;
  const isLowStock = remainingStock !== null && remainingStock > 0 && remainingStock <= 5;
  
  // Display quantity shows remaining (max - current) if positive, otherwise shows max
  const displayQuantity = remainingStock !== null && remainingStock > 0 ? remainingStock : maxQuantity;

  // Refresh product limit when cart changes or refreshVersion changes
  useEffect(() => {
    const refreshProductLimit = async () => {
      if (fetchedRef.current && cartItems.length > 0) {
        const currentCartItems = cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity
        }));
        
        try {
          const result = await dispatch(checkAddProductStock({ 
            product, 
            currentCartItems 
          })).unwrap();
          
          const newMax = result.maxAllowedQuantity;
          setLocalMaxQuantity(newMax);
          dispatch(updateProductLimit({ productId: product.id, maxQuantity: newMax }));
          
          if (existingItem && newMax < existingItem.quantity) {
            dispatch(updateCartItemLimit({ productId: product.id, maxAllowed: newMax }));
          }
        } catch (error) {
          console.error("Refresh product limit error:", error);
        }
      }
    };
    
    refreshProductLimit();
  }, [refreshVersion, cartItems, product.id, dispatch, existingItem]);

  // Initial fetch
  useEffect(() => {
    if (productLimits[product.id] === undefined && !fetchedRef.current) {
      fetchedRef.current = true;
      dispatch(getProductMaxQuantity(product)).then((result) => {
        if (getProductMaxQuantity.fulfilled.match(result)) {
          setLocalMaxQuantity(result.payload.maxQuantity);
        }
      });
    }
  }, [product.id, dispatch, productLimits]);

  // Handle add to cart
  const handleAdd = async () => {
    if (adding || checkingRealTime) return;
    
    // ⭐ FIXED: Check if maxQuantity is 0 (out of stock)
    if (maxQuantity === 0) {
      alert(`"${product.name}" is out of stock!`);
      return;
    }
    
    // Check if remaining stock is 0
    if (remainingStock !== null && remainingStock <= 0) {
      alert(`Cannot add more "${product.name}" - Only ${maxQuantity} total available!`);
      return;
    }
    
    setAdding(true);
    setCheckingRealTime(true);
    
    try {
      const currentCartItems = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
      }));
      
      const result = await dispatch(checkAddProductStock({ 
        product, 
        currentCartItems 
      })).unwrap();
      
      if (result.canAdd) {
        dispatch(addToCart({ 
          ...product, 
          maxAllowedQuantity: result.maxAllowedQuantity
        }));
        
        setLocalMaxQuantity(result.maxAllowedQuantity);
        dispatch(updateProductLimit({ productId: product.id, maxQuantity: result.maxAllowedQuantity }));
        
        setAdded(true);
        setTimeout(() => setAdded(false), 1000);
      } else {
        if (result.insufficientIngredients && result.insufficientIngredients.length > 0) {
          const ingredientList = result.insufficientIngredients.map(i => 
            `${i.name} (need ${i.shortfall.toFixed(2)} ${i.unit})`
          ).join(", ");
          alert(`Cannot add "${product.name}"! Insufficient: ${ingredientList}`);
        } else if (result.isOutOfStock || result.maxAllowedQuantity === 0) {
          alert(`"${product.name}" is out of stock!`);
        } else {
          alert(`Only ${result.maxAllowedQuantity} of "${product.name}" available in total!`);
        }
        setLocalMaxQuantity(result.maxAllowedQuantity);
        dispatch(updateProductLimit({ productId: product.id, maxQuantity: result.maxAllowedQuantity }));
      }
    } catch (error) {
      console.error("Stock check error:", error);
      alert("Failed to check stock availability. Please try again.");
    } finally {
      setAdding(false);
      setCheckingRealTime(false);
    }
  };

  // Loading state
  if (maxQuantity === null && !fetchedRef.current) {
    return (
      <div className={styles.productCard}>
        <div className={styles.productImageWrapper}>
          <img 
            src={`http://localhost:8080/uploads/${product.image}`} 
            alt={product.name}
            className={styles.productImage}
            onError={(e) => e.target.src = "/placeholder.png"}
          />
          <div className={styles.loadingBadge}>Loading...</div>
        </div>
        <div className={styles.productInfo}>
          <h4 className={styles.productTitle}>{product.name}</h4>
          <p className={styles.productCategory}>{product.category?.name}</p>
          <div className={styles.stockLoading}>Checking stock...</div>
          <div className={styles.productFooter}>
            <span className={styles.productPrice}>{product.price?.toLocaleString()} Ks</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${styles.productCard} ${isOutOfStock ? styles.disabled : ""}`} 
      onClick={!isOutOfStock ? handleAdd : undefined}
      style={{ cursor: isOutOfStock ? 'not-allowed' : 'pointer', opacity: isOutOfStock ? 0.5 : 1 }}
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
        {checkingRealTime && (
          <div className={styles.checkingBadge}>Checking...</div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h4 className={styles.productTitle}>{product.name}</h4>
        <p className={styles.productCategory}>{product.category?.name}</p>
        
        {/* ⭐ FIXED: Show stock info correctly */}
        {maxQuantity !== null && !isOutOfStock && (
          <div className={`${styles.stockInfo} ${isLowStock ? styles.lowStockWarning : ''}`}>
            📦 {displayQuantity} {product.unit || 'units'} left
            {currentQuantity > 0 && (
              <span className={styles.inCartQuantity}> ({currentQuantity} in cart)</span>
            )}
          </div>
        )}
        
        {isOutOfStock && (
          <div className={styles.outOfStockMsg}>⚠️ Out of stock</div>
        )}
        
        {productStockIssue && !isOutOfStock && (
          <div className={styles.cartWideWarning}>
            ⚠️ Adding more may cause stock issue
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