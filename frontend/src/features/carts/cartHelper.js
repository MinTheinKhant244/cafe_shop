// utils/cartHelper.js
const CART_KEY = "pos_cart_session";

// Get cart from session storage
export const getCart = () => {
  try {
    const cart = sessionStorage.getItem(CART_KEY);
    if (cart) {
      const parsed = JSON.parse(cart);
      // Check if cart is expired (30 minutes)
      if (parsed.lastUpdated && (Date.now() - parsed.lastUpdated) > 30 * 60 * 1000) {
        clearCart();
        return emptyCart();
      }
      return parsed;
    }
    return emptyCart();
  } catch (error) {
    console.error("Failed to get cart:", error);
    return emptyCart();
  }
};

const emptyCart = () => ({
  items: [],
  totalAmount: 0,
  tableId: null,
  orderNote: "",
  createdAt: Date.now(),
  lastUpdated: Date.now()
});

// Save cart to session storage
export const saveCart = (cart) => {
  try {
    cart.lastUpdated = Date.now();
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
};

// Clear cart
export const clearCart = () => {
  sessionStorage.removeItem(CART_KEY);
  return emptyCart();
};

// Get cart item count
export const getCartItemCount = () => {
  const cart = getCart();
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
};

// Check if cart has items
export const hasCartItems = () => {
  const cart = getCart();
  return cart.items.length > 0;
};

// Setup before unload warning
export const setupBeforeUnloadWarning = () => {
  const handler = (e) => {
    if (hasCartItems()) {
      e.preventDefault();
      e.returnValue = "You have items in cart. Leave anyway?";
      return e.returnValue;
    }
  };
  
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
};

// Add to cart helper
export const addToCartHelper = (product, tableId = null) => {
  const cart = getCart();
  const existingItem = cart.items.find(item => item.id === product.id);
  
  const maxStock = product.currentStock || 999;
  
  if (existingItem) {
    if (existingItem.quantity + 1 > maxStock) {
      throw new Error(`Only ${maxStock} ${product.name} available`);
    }
    existingItem.quantity += 1;
  } else {
    cart.items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      category: product.category?.name,
      note: "",
      currentStock: product.currentStock,
      unit: product.unit
    });
  }
  
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (tableId) cart.tableId = tableId;
  
  saveCart(cart);
  return cart;
};

// Update quantity helper
export const updateQuantityHelper = (productId, quantity) => {
  const cart = getCart();
  const item = cart.items.find(i => i.id === productId);
  
  if (item) {
    const maxStock = item.currentStock || 999;
    const newQty = Math.min(quantity, maxStock);
    
    if (newQty <= 0) {
      cart.items = cart.items.filter(i => i.id !== productId);
    } else {
      item.quantity = newQty;
    }
    
    cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    saveCart(cart);
  }
  
  return cart;
};

// Remove from cart helper
export const removeFromCartHelper = (productId) => {
  const cart = getCart();
  cart.items = cart.items.filter(i => i.id !== productId);
  cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  saveCart(cart);
  return cart;
};