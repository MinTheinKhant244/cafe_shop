import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchRecipesByProduct,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  clearError,
  checkIngredientExists,
  clearIngredientExists,
  fetchRecipeCostDetails,
  clearCostDetails
} from "./recipeSlice";
import { fetchAllProducts } from "../products/productSLice";
import { fetchAllCategories } from "../categories/categorySlice";
import { fetchAllInventory } from "../inventory/inventorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/recipe.module.css";

function Recipe() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { 
    currentProductRecipes, 
    loading, 
    error: reduxError, 
    operationLoading, 
    ingredientExists,
    costDetails,
    loadingCost
  } = useSelector((state) => state.recipes);
  const { list: products } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);
  const { list: inventory } = useSelector((state) => state.inventory);

  // States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  
  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    product: { id: "" },
    inventory: { id: "" },
    quantity: ""
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
    dispatch(fetchAllInventory());
  }, [dispatch]);

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Show redux error as notification
  useEffect(() => {
    if (reduxError) {
      showNotification(reduxError, "error");
      dispatch(clearError());
    }
  }, [reduxError, dispatch]);

  // Check ingredient exists when inventory selection changes
  useEffect(() => {
    if (formData.inventory.id && selectedProduct && !isEditing) {
      dispatch(checkIngredientExists({
        productId: selectedProduct.id,
        inventoryId: parseInt(formData.inventory.id)
      }));
    }
  }, [formData.inventory.id, selectedProduct, isEditing, dispatch]);

  // Show warning if ingredient already exists
  useEffect(() => {
    if (ingredientExists && !isEditing) {
      showNotification("This ingredient is already in the recipe!", "error");
      dispatch(clearIngredientExists());
    }
  }, [ingredientExists, isEditing, dispatch]);

  // Filter products by search term and category
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category?.id === parseInt(selectedCategory));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [products, selectedCategory, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    dispatch(fetchRecipesByProduct(product.id));
    dispatch(fetchRecipeCostDetails(product.id));
  };

  useEffect(() => {
    return () => {
      dispatch(clearCostDetails());
    };
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.product.id) {
      showNotification("Please select a product", "error");
      return;
    }
    if (!formData.inventory.id) {
      showNotification("Please select an ingredient", "error");
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      showNotification("Please enter a valid quantity", "error");
      return;
    }
    
    if (!isEditing) {
      try {
        const exists = await dispatch(checkIngredientExists({
          productId: parseInt(formData.product.id),
          inventoryId: parseInt(formData.inventory.id)
        })).unwrap();
        
        if (exists.exists) {
          showNotification("This ingredient is already added to the recipe!", "error");
          return;
        }
      } catch (error) {}
    }
    
    const data = {
      product: { id: parseInt(formData.product.id) },
      inventory: { id: parseInt(formData.inventory.id) },
      quantity: parseFloat(formData.quantity)
    };
    
    try {
      if (isEditing) {
        await dispatch(updateRecipe({ id: formData.id, data })).unwrap();
        showNotification("Recipe updated successfully!", "success");
      } else {
        await dispatch(addRecipe(data)).unwrap();
        showNotification("Ingredient added to recipe successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      if (selectedProduct) {
        dispatch(fetchRecipesByProduct(selectedProduct.id));
        dispatch(fetchRecipeCostDetails(selectedProduct.id));
      }
    } catch (error) {
      showNotification(error || "Error saving recipe!", "error");
    }
  };

  const handleDelete = async (recipe) => {
    if (window.confirm(`Are you sure you want to remove "${recipe.inventory?.name}" from ${selectedProduct?.name}?`)) {
      try {
        await dispatch(deleteRecipe(recipe.id)).unwrap();
        showNotification("Ingredient removed from recipe!", "success");
        dispatch(fetchRecipesByProduct(selectedProduct.id));
        dispatch(fetchRecipeCostDetails(selectedProduct.id));
      } catch (error) {
        showNotification(error || "Failed to delete!", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      product: { id: selectedProduct?.id || "" },
      inventory: { id: "" },
      quantity: ""
    });
    setIsEditing(false);
    dispatch(clearIngredientExists());
  };

  const openAddModal = () => {
    if (!selectedProduct) {
      showNotification("Please select a product first", "error");
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (recipe) => {
    setFormData({
      id: recipe.id,
      product: { id: recipe.product?.id },
      inventory: { id: recipe.inventory?.id },
      quantity: recipe.quantity
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const getAvailableInventory = () => {
    const usedInventoryIds = currentProductRecipes.map(r => r.inventory?.id);
    return inventory.filter(item => !usedInventoryIds.includes(item.id));
  };

  const getTotalCost = () => {
    if (costDetails?.totalCost) {
      return costDetails.totalCost.toLocaleString();
    }
    return "0";
  };

  const getProfitMargin = () => {
    if (costDetails?.profitMargin) {
      return costDetails.profitMargin.toFixed(1);
    }
    return "0";
  };

  const getProfit = () => {
    if (costDetails?.profit) {
      return costDetails.profit.toLocaleString();
    }
    return "0";
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
  };

  const isFilterActive = searchTerm !== "" || selectedCategory !== "";

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        
        {/* Notification Toast */}
        {notification.show && (
          <div className={`${styles.toast} ${notification.type === "success" ? styles.success : styles.error}`}>
            {notification.type === "success" ? "✅ " : "❌ "}
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              ☰
            </button>
            <h1 className={styles.pageTitle}>📋 Recipe Management</h1>
          </div>
        </div>

        {/* Product Selection Section */}
        <div className={styles.productSelection}>
          <div className={styles.selectionCard}>
            <h3>📦 Select Product</h3>
            
            {/* Compact Filter Bar */}
            <div className={styles.compactFilterBar}>
              <div className={styles.compactSearchBox}>
                <input
                  type="text"
                  placeholder="🔍 Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.compactCategoryFilter}>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {isFilterActive && (
                  <button className={styles.compactClearBtn} onClick={clearFilters}>
                    ✕ Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Product Grid */}
            <div className={styles.productGrid}>
              {paginatedProducts.length === 0 ? (
                <div className={styles.emptyProducts}>
                  <span>📭</span>
                  <p>No products found</p>
                </div>
              ) : (
                paginatedProducts.map(product => (
                  <button
                    key={product.id}
                    className={`${styles.productCard} ${selectedProduct?.id === product.id ? styles.active : ""}`}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className={styles.productCardContent}>
                      <span className={styles.productEmoji}>🍽️</span>
                      <div className={styles.productDetails}>
                        <span className={styles.productCardName}>{product.name}</span>
                        <span className={styles.productCardCategory}>
                          {product.category?.name || "Uncategorized"}
                        </span>
                      </div>
                      <span className={styles.productCardPrice}>
                        {product.price?.toLocaleString()} Ks
                      </span>
                    </div>
                    {selectedProduct?.id === product.id && (
                      <span className={styles.checkMark}>✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                <span className={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </span>
                <button 
                  className={styles.pageBtn}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recipe Details - With Product Header */}
        {selectedProduct && (
          <>
            {/* Product Info Header with Add Button */}
            <div className={styles.productInfoHeader}>
              <div className={styles.productInfoContent}>
                <div className={styles.productInfoLeft}>
                  <span className={styles.productInfoEmoji}>🍽️</span>
                  <div className={styles.productInfoDetails}>
                    <h2 className={styles.productInfoName}>{selectedProduct.name}</h2>
                    <div className={styles.productInfoMeta}>
                      <span className={styles.productInfoCategory}>
                        📂 {selectedProduct.category?.name || "Uncategorized"}
                      </span>
                      <span className={styles.productInfoPrice}>
                        💰 {selectedProduct.price?.toLocaleString()} Ks
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.productInfoRight}>
                  <div className={styles.productInfoStats}>
                    <div className={styles.productStat}>
                      <span className={styles.productStatValue}>{currentProductRecipes.length}</span>
                      <span className={styles.productStatLabel}>Ingredients</span>
                    </div>
                    <div className={styles.productStat}>
                      <span className={styles.productStatValue}>
                        {loadingCost ? "..." : getTotalCost()} Ks
                      </span>
                      <span className={styles.productStatLabel}>Total Cost</span>
                    </div>
                    <div className={styles.productStat}>
                      <span className={styles.productStatValue}>
                        {loadingCost ? "..." : getProfit()} Ks
                      </span>
                      <span className={styles.productStatLabel}>Profit</span>
                    </div>
                    <div className={styles.productStat}>
                      <span className={styles.productStatValue}>
                        {loadingCost ? "..." : getProfitMargin()}%
                      </span>
                      <span className={styles.productStatLabel}>Margin</span>
                    </div>
                  </div>
                  <button 
                    className={styles.addIngredientBtn} 
                    onClick={openAddModal}
                    disabled={!selectedProduct || operationLoading}
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>
            </div>

            {/* Recipe Table */}
            <div className={styles.tableContainer}>
              {loading ? (
                <div className={styles.loading}>Loading recipes...</div>
              ) : currentProductRecipes.length === 0 ? (
                <div className={styles.emptyState}>
                  <span className={styles.emptyIcon}>📭</span>
                  <p>No ingredients added yet. Click "Add Ingredient" to create a recipe.</p>
                </div>
              ) : (
                <table className={styles.recipeTable}>
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Unit</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProductRecipes.map((recipe) => {
                      const unitPrice = recipe.inventory?.currentPrice || 0;
                      const totalCost = unitPrice * recipe.quantity;
                      
                      return (
                        <tr key={recipe.id}>
                          <td>
                            <span className={styles.ingredientName}>
                              {recipe.inventory?.name}
                            </span>
                          </td>
                          <td>{recipe.inventory?.unit || "-"}</td>
                          <td>
                            <span className={styles.quantityText}>
                              {recipe.quantity} {recipe.inventory?.unit}
                            </span>
                          </td>
                          <td>{unitPrice.toLocaleString()} Ks</td>
                          <td>
                            <span className={styles.costText}>
                              {totalCost.toLocaleString()} Ks
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                className={styles.editBtn}
                                onClick={() => openEditModal(recipe)}
                                title="Edit Ingredient"
                                disabled={operationLoading}
                              >
                                ✏️
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(recipe)}
                                title="Remove Ingredient"
                                disabled={operationLoading}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Recipe Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !operationLoading && setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{isEditing ? "✏️ Edit Ingredient" : "➕ Add Ingredient to Recipe"}</h3>
              <button className={styles.modalClose} onClick={() => !operationLoading && setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Product</label>
                <input
                  type="text"
                  value={selectedProduct?.name || ""}
                  disabled
                  className={styles.disabledInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ingredient *</label>
                <select
                  value={formData.inventory.id}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    inventory: { id: e.target.value },
                    product: { id: selectedProduct?.id }
                  })}
                  required
                  disabled={isEditing || operationLoading}
                >
                  <option value="">Select Ingredient</option>
                  {(isEditing ? inventory : getAvailableInventory()).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - {item.quantity} {item.unit} - {(item.currentPrice || 0).toLocaleString()} Ks
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Quantity Required *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity needed"
                  value={formData.quantity === null || formData.quantity === undefined ? "" : formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  // disabled={operationLoading}  {/* ← ဒီ line ကို ဖယ်လိုက်ပါ ဒါမှမဟုတ် comment လုပ်လိုက်ပါ */}
                />
                <small className={styles.hintText}>
                  {formData.inventory.id && inventory.find(i => i.id === parseInt(formData.inventory.id))?.unit}
                </small>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => !operationLoading && setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={operationLoading}>
                  {operationLoading ? "Saving..." : (isEditing ? "Update" : "Add Ingredient")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Recipe;