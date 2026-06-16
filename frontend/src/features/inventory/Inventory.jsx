import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchAllInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  activateInventory,
  deactivateInventory,
  getTotalStockValue,
  clearError,
} from "./inventorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/inventory.module.css";

function Inventory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { 
    list: inventoryList, 
    loading, 
    error: reduxError, 
    operationLoading,
    totalStockValue
  } = useSelector((state) => state.inventory);

  // Ensure inventory is always an array
  const inventory = Array.isArray(inventoryList) ? inventoryList : [];

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    unit: "",
    lowStockThreshold: "",
    currentPrice: ""
  });
  
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchAllInventory());
      await dispatch(getTotalStockValue());
    };
    loadData();
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

  // Filter inventory based on search, stock status, and active status
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = filterStock === "all" ||
      (filterStock === "low" && item.quantity <= (item.lowStockThreshold || 10)) ||
      (filterStock === "normal" && item.quantity > (item.lowStockThreshold || 10));
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && item.status === "ACTIVE") ||
      (filterStatus === "inactive" && item.status === "INACTIVE");
    return matchesSearch && matchesStock && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStock("all");
    setFilterStatus("all");
  };

  // Check if any filter is active
  const isFilterActive = searchTerm !== "" || filterStock !== "all" || filterStatus !== "all";

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification("Item name is required!", "error");
      return;
    }
    
    if (isEditing) {
      const data = {
        name: formData.name,
        unit: formData.unit,
        lowStockThreshold: formData.lowStockThreshold ? parseFloat(formData.lowStockThreshold) : 10,
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : 0
      };
      
      try {
        await dispatch(updateInventory({ id: formData.id, data })).unwrap();
        showNotification("Inventory updated successfully!", "success");
        setShowModal(false);
        resetForm();
        await dispatch(fetchAllInventory());
        await dispatch(getTotalStockValue());
      } catch (error) {
        showNotification(error || "Error updating inventory!", "error");
      }
    } else {
      const data = {
        name: formData.name,
        unit: formData.unit,
        lowStockThreshold: formData.lowStockThreshold ? parseFloat(formData.lowStockThreshold) : 10,
        currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : 0
      };
      
      try {
        const result = await dispatch(addInventory(data)).unwrap();
        showNotification("Inventory item created successfully!", "success");
        setShowModal(false);
        resetForm();
        await dispatch(fetchAllInventory());
        await dispatch(getTotalStockValue());
        
        if (window.confirm(`Would you like to add initial stock for "${formData.name}" now?`)) {
          navigate(`/admin/invTransactions?itemId=${result.id}`);
        }
      } catch (error) {
        showNotification(error || "Error adding inventory!", "error");
      }
    }
  };

  // Handle Deactivate
  const handleDeactivate = async (item) => {
    if (window.confirm(`Are you sure you want to deactivate "${item.name}"?`)) {
      try {
        await dispatch(deactivateInventory(item.id)).unwrap();
        showNotification(`"${item.name}" deactivated successfully!`, "success");
        await dispatch(fetchAllInventory());
        await dispatch(getTotalStockValue());
      } catch (error) {
        showNotification(error || "Failed to deactivate!", "error");
      }
    }
  };

  // Handle Activate
  const handleActivate = async (item) => {
    if (window.confirm(`Are you sure you want to activate "${item.name}"?`)) {
      try {
        await dispatch(activateInventory(item.id)).unwrap();
        showNotification(`"${item.name}" activated successfully!`, "success");
        await dispatch(fetchAllInventory());
        await dispatch(getTotalStockValue());
      } catch (error) {
        showNotification(error || "Failed to activate!", "error");
      }
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteInventory(item.id)).unwrap();
        showNotification(`"${item.name}" deleted successfully!`, "success");
        await dispatch(fetchAllInventory());
        await dispatch(getTotalStockValue());
      } catch (error) {
        showNotification(error || "Failed to delete!", "error");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      unit: "",
      lowStockThreshold: "",
      currentPrice: ""
    });
  };

  const getStockStatus = (item) => {
    const threshold = item.lowStockThreshold || 10;
    if (item.quantity <= 0) {
      return { text: "Out of Stock", class: styles.statusOut, icon: "❌" };
    }
    if (item.quantity <= threshold) {
      return { text: "Low Stock", class: styles.statusLow, icon: "⚠️" };
    }
    return { text: "In Stock", class: styles.statusNormal, icon: "✅" };
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const totalItems = inventory.length;
  const activeCount = inventory.filter(i => i.status === "ACTIVE").length;
  const inactiveCount = inventory.filter(i => i.status === "INACTIVE").length;
  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 10)).length;
  const outOfStockCount = inventory.filter(i => i.quantity <= 0).length;
  const totalUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0).toFixed(0);
  const zeroStockCount = inventory.filter(i => i.quantity === 0).length;

  if (loading && inventory.length === 0) {
    return (
      <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
        <Sidebar />
        <div className={styles.mainContent}>
          <div className={styles.loading}>Loading inventory...</div>
        </div>
      </div>
    );
  }

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
            <h1 className={styles.pageTitle}>Inventory Management</h1>
          </div>
          <button 
            className={styles.addBtn} 
            onClick={() => {
              resetForm();
              setIsEditing(false);
              setShowModal(true);
            }}
          >
            + Add Item
          </button>
        </div>

        {/* Statistics Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalItems}</span>
            <span className={styles.statLabel}>Total Items</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{activeCount}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{inactiveCount}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{zeroStockCount}</span>
            <span className={styles.statLabel}>Zero Stock</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{lowStockCount}</span>
            <span className={styles.statLabel}>Low Stock</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{totalUnits}</span>
            <span className={styles.statLabel}>Total Units</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>
              {(totalStockValue || 0).toLocaleString()} Ks
            </span>
            <span className={styles.statLabel}>Total Value</span>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="🔍 Search inventory by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
              <option value="all">📊 All Stock</option>
              <option value="low">⚠️ Low Stock</option>
              <option value="normal">✅ Normal Stock</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">🔄 All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">🔴 Inactive</option>
            </select>
            {isFilterActive && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Inventory Table */}
        <div className={styles.tableContainer}>
          {filteredInventory.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>
                {isFilterActive
                  ? "No items match your filters"
                  : "No inventory items found. Click 'Add Item' to create one."}
              </p>
            </div>
          ) : (
            <table className={styles.inventoryTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Unit</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const totalValue = (item.quantity || 0) * (item.currentPrice || 0);
                  const isActive = item.status === "ACTIVE";
                  
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.itemName}>{item.name}</span>
                      </td>
                      <td>{item.unit || "-"}</td>
                      <td>
                        <span className={`${styles.quantityText} ${item.quantity <= (item.lowStockThreshold || 10) ? styles.lowQuantity : ""}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.quantity === 0 && isActive && (
                          <button 
                            className={styles.addStockBtn}
                            onClick={() => navigate(`/admin/invTransactions?itemId=${item.id}`)}
                            title="Add Stock"
                          >
                            +
                          </button>
                        )}
                       </td>
                      <td>{(item.currentPrice || 0).toLocaleString()} Ks</td>
                      <td><span className={styles.costText}>{totalValue.toLocaleString()} Ks</span></td>
                      <td>
                        <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
                          {isActive ? "🟢 Active" : "🔴 Inactive"}
                        </span>
                       </td>
                      <td>
                        <span className={`${styles.statusBadge} ${stockStatus.class}`}>
                          {stockStatus.icon} {stockStatus.text}
                        </span>
                       </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.viewBtn}
                            onClick={() => setDetailItem(item)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className={styles.stockBtn}
                            onClick={() => navigate(`/admin/invTransactions?itemId=${item.id}`)}
                            title="Stock Transactions"
                          >
                            📊
                          </button>
                          <button
                            className={styles.editBtn}
                            onClick={() => {
                              setFormData({
                                id: item.id,
                                name: item.name,
                                unit: item.unit || "",
                                lowStockThreshold: item.lowStockThreshold || "",
                                currentPrice: item.currentPrice || ""
                              });
                              setIsEditing(true);
                              setShowModal(true);
                            }}
                            title="Edit Item"
                          >
                            ✏️
                          </button>
                          {/* Activate/Deactivate Button - Same style as User.jsx */}
                          <button 
                            className={isActive ? styles.deactivateBtn : styles.activateBtn} 
                            onClick={() => isActive ? handleDeactivate(item) : handleActivate(item)}
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            {isActive ? "🔴" : "🟢"}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(item)}
                            title="Delete Item"
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{isEditing ? "✏️ Edit Item" : "➕ Add New Item"}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className={styles.infoBanner}>
              💡 <strong>Note:</strong> Stock quantity will be managed through 
              <strong> Stock Transactions</strong>. Please add initial stock after creating the item.
            </div>
            
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="Enter item name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Unit</label>
                  <input
                    type="text"
                    placeholder="e.g., kg, liter, piece"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                  <small className={styles.hintText}>Measurement unit for this item</small>
                </div>
                
                {isEditing && (
                  <div className={styles.formGroup}>
                    <label>Current Stock</label>
                    <input
                      type="text"
                      value={`${(() => {
                        const item = inventory.find(i => i.id === formData.id);
                        return item ? `${item.quantity} ${item.unit || ''}` : 'Loading...';
                      })()}`}
                      disabled
                      className={styles.disabledField}
                    />
                    <small className={styles.hintText}>💡 Update stock via Transactions page</small>
                  </div>
                )}
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Unit Price (Ks) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter purchase price"
                    value={formData.currentPrice}
                    onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
                    required
                  />
                  <small className={styles.hintText}>Current selling/purchase price</small>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Alert when stock below"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                  />
                  <small className={styles.hintText}>Default: 10</small>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={operationLoading}>
                  {operationLoading ? "Saving..." : (isEditing ? "Update Item" : "Create Item")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className={styles.modalOverlay} onClick={() => setDetailItem(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📋 Item Details</h3>
              <button className={styles.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailInfo}>
                <p><strong>📛 Name:</strong> {detailItem.name}</p>
                <p><strong>📏 Unit:</strong> {detailItem.unit || "Not specified"}</p>
                <p><strong>📊 Quantity:</strong> {detailItem.quantity} {detailItem.unit}</p>
                <p><strong>💰 Unit Price:</strong> {(detailItem.currentPrice || 0).toLocaleString()} Ks</p>
                <p><strong>💵 Total Value:</strong> {((detailItem.quantity || 0) * (detailItem.currentPrice || 0)).toLocaleString()} Ks</p>
                <p><strong>⚠️ Low Stock Threshold:</strong> {detailItem.lowStockThreshold || 10} {detailItem.unit}</p>
                <p><strong>📋 Status:</strong>
                  <span className={`${styles.statusBadge} ${detailItem.status === "ACTIVE" ? styles.statusActive : styles.statusInactive}`}>
                    {detailItem.status === "ACTIVE" ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                </p>
                <p><strong>✅ Stock Status:</strong>
                  <span className={`${styles.statusBadge} ${getStockStatus(detailItem).class}`}>
                    {getStockStatus(detailItem).icon} {getStockStatus(detailItem).text}
                  </span>
                </p>
                <p><strong>🕐 Created At:</strong> {formatDate(detailItem.createdAt)}</p>
                <p><strong>🕐 Last Updated:</strong> {formatDate(detailItem.updatedAt)}</p>
                {detailItem.deactivatedAt && (
                  <p><strong>🔘 Deactivated At:</strong> {formatDate(detailItem.deactivatedAt)}</p>
                )}
                {detailItem.deactivatedBy && (
                  <p><strong>👤 Deactivated By:</strong> {detailItem.deactivatedBy}</p>
                )}
                <p><strong>🆔 ID:</strong> #{detailItem.id}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.transactionBtn}
                onClick={() => {
                  navigate(`/admin/invTransactions?itemId=${detailItem.id}`);
                  setDetailItem(null);
                }}
              >
                📊 View Transactions
              </button>
              {detailItem.quantity === 0 && detailItem.status === "ACTIVE" && (
                <button 
                  className={styles.addStockBtn}
                  onClick={() => {
                    navigate(`/admin/invTransactions?itemId=${detailItem.id}`);
                    setDetailItem(null);
                  }}
                >
                  ➕ Add Stock
                </button>
              )}
              <button className={styles.closeBtn} onClick={() => setDetailItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;