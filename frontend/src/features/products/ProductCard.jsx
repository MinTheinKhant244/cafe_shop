import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../sales/cartSlice";
import styles from "../../assets/css/posSales.module.css";

function ProductCard({ product }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    dispatch(addToCart(product));
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <div className={styles.productCard} onClick={handleAdd}>
      <div className={styles.productImageWrapper}>
        <img 
          src={`http://localhost:8080/uploads/${product.image}`} 
          alt={product.name}
          className={styles.productImage}
          onError={(e) => e.target.src = "/placeholder.png"}
        />
      </div>
      <div className={styles.productInfo}>
        <h4 className={styles.productTitle}>{product.name}</h4>
        <p className={styles.productCategory}>{product.category?.name}</p>
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>{product.price.toLocaleString()} Ks</span>
          {added && <span className={styles.addedBadge}>✓ Added</span>}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;