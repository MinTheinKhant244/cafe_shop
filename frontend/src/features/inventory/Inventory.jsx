import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchAllInventory,
  addInventory,
  updateInventory,
  deleteInventory,
  addStock,
  removeStock,
  getTransactionHistory,
  getPriceHistory,
  getTotalStockValue,
  clearError,
  setSelectedInventory
} from "./inventorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/inventory.module.css";

function Inventory() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { 
    list: inventoryList, 
    loading, 
    error: reduxError, 
    operationLoading,
    transactions,
    totalStockValue
  } = useSelector((state) => state.inventory);

  // Ensure inventory is always an array
  const inventory = Array.isArray(inventoryList) ? inventoryList : [];

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStock, setFilterStock] = useState("all");
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Stock Form Data
  const [stockData, setStockData] = useState({
    quantity: "",
    price: "",
    notes: ""
  });
  
  // Form Data
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    unit: "",
    quantity: "",
    lowStockThreshold: "",
    currentPrice: ""
  });
  
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Debug log
  useEffect(() => {
    console.log("Inventory state:", { inventory, loading, inventoryList });
  }, [inventory, loading, inventoryList]);

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

  // Filter inventory based on search and stock status
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStock = filterStock === "all" ||
      (filterStock === "low" && item.quantity <= (item.lowStockThreshold || 10)) ||
      (filterStock === "normal" && item.quantity > (item.lowStockThreshold || 10));
    return matchesSearch && matchesStock;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStock("all");
  };

  // Check if any filter is active
  const isFilterActive = searchTerm !== "" || filterStock !== "all";

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showNotification("Item name is required!", "error");
      return;
    }
    if (!formData.quantity || formData.quantity < 0) {
      showNotification("Valid quantity is required!", "error");
      return;
    }
    
    const data = {
      name: formData.name,
      unit: formData.unit,
      quantity: parseFloat(formData.quantity),
      lowStockThreshold: formData.lowStockThreshold ? parseFloat(formData.lowStockThreshold) : 10,
      currentPrice: formData.currentPrice ? parseFloat(formData.currentPrice) : 0
    };
    
    try {
      if (isEditing) {
        await dispatch(updateInventory({ id: formData.id, data })).unwrap();
        showNotification("Inventory updated successfully!", "success");
      } else {
        await dispatch(addInventory(data)).unwrap();
        showNotification("Inventory added successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      await dispatch(fetchAllInventory());
      await dispatch(getTotalStockValue());
    } catch (error) {
      showNotification(error || "Error saving inventory!", "error");
    }
  };

  const handleAddStock = async () => {
    if (!selectedItem) return;
    
    if (!stockData.quantity || stockData.quantity <= 0) {
      showNotification("Please enter valid quantity", "error");
      return;
    }
    if (!stockData.price || stockData.price < 0) {
      showNotification("Please enter valid price", "error");
      return;
    }
    
    try {
      await dispatch(addStock({
        id: selectedItem.id,
        quantity: parseFloat(stockData.quantity),
        price: parseFloat(stockData.price),
        notes: stockData.notes
      })).unwrap();
      
      showNotification(`Added ${stockData.quantity} ${selectedItem.unit || 'units'} to stock!`, "success");
      setShowAddStockModal(false);
      setStockData({ quantity: "", price: "", notes: "" });
      setSelectedItem(null);
      await dispatch(fetchAllInventory());
      await dispatch(getTotalStockValue());
    } catch (error) {
      showNotification(error || "Failed to add stock!", "error");
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
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

  const handleViewTransactions = async (item) => {
    setSelectedItem(item);
    await dispatch(getTransactionHistory(item.id));
    setShowTransactionModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      unit: "",
      quantity: "",
      lowStockThreshold: "",
      currentPrice: ""
    });
  };

  const getStockStatus = (item) => {
    const threshold = item.lowStockThreshold || 10;
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
  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockThreshold || 10)).length;
  const totalUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0).toFixed(0);

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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const totalValue = (item.quantity || 0) * (item.currentPrice || 0);
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.itemName}>{item.name}</span>
                      </td>
                      <td>{item.unit || "-"}</td>
                      <td>
                        <span className={styles.quantityText}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td>
                        {(item.currentPrice || 0).toLocaleString()} Ks
                      </td>
                      <td>
                        <span className={styles.costText}>
                          {totalValue.toLocaleString()} Ks
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
                            className={styles.editBtn}
                            onClick={() => {
                              setFormData({
                                id: item.id,
                                name: item.name,
                                unit: item.unit || "",
                                quantity: item.quantity,
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
                          <button
                            className={styles.stockBtn}
                            onClick={() => {
                              setSelectedItem(item);
                              setStockData({ quantity: "", price: "", notes: "" });
                              setShowAddStockModal(true);
                            }}
                            title="Add Stock"
                          >
                            ➕
                          </button>
                          <button
                            className={styles.historyBtn}
                            onClick={() => handleViewTransactions(item)}
                            title="View History"
                          >
                            📜
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
                </div>
                <div className={styles.formGroup}>
                  <label>Initial Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
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
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={operationLoading}>
                  {operationLoading ? "Saving..." : (isEditing ? "Update Item" : "Add Item")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStockModal && selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setShowAddStockModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>➕ Add Stock - {selectedItem.name}</h3>
              <button className={styles.modalClose} onClick={() => setShowAddStockModal(false)}>×</button>
            </div>
            <div className={styles.stockInfo}>
              <p>Current Stock: <strong>{selectedItem.quantity} {selectedItem.unit || 'units'}</strong></p>
              <p>Current Price: <strong>{(selectedItem.currentPrice || 0).toLocaleString()} Ks/{selectedItem.unit || 'unit'}</strong></p>
            </div>
            <div className={styles.formGroup}>
              <label>Quantity to Add *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter quantity"
                value={stockData.quantity}
                onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label>Purchase Price (Ks/{selectedItem.unit || 'unit'}) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter purchase price"
                value={stockData.price}
                onChange={(e) => setStockData({ ...stockData, price: e.target.value })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Notes</label>
              <textarea
                rows="2"
                placeholder="Optional notes"
                value={stockData.notes}
                onChange={(e) => setStockData({ ...stockData, notes: e.target.value })}
              />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddStockModal(false)}>
                Cancel
              </button>
              <button className={styles.saveBtn} onClick={handleAddStock} disabled={operationLoading}>
                {operationLoading ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionModal && selectedItem && transactions && transactions[selectedItem.id] && (
        <div className={styles.modalOverlay} onClick={() => setShowTransactionModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📜 Transaction History - {selectedItem.name}</h3>
              <button className={styles.modalClose} onClick={() => setShowTransactionModal(false)}>×</button>
            </div>
            <div className={styles.transactionList}>
              {transactions[selectedItem.id].length === 0 ? (
                <div className={styles.emptyState}>No transactions found</div>
              ) : (
                <table className={styles.transactionTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Change</th>
                      <th>Old Qty</th>
                      <th>New Qty</th>
                      <th>Price</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions[selectedItem.id].map((t, idx) => (
                      <tr key={t.id || idx}>
                        <td>{formatDate(t.transactionDate)}</td>
                        <td>
                          <span className={`${styles.transactionType} ${styles[t.transactionType?.toLowerCase()]}`}>
                            {t.transactionType}
                          </span>
                        </td>
                        <td className={t.quantityChange > 0 ? styles.positive : styles.negative}>
                          {t.quantityChange > 0 ? `+${t.quantityChange}` : t.quantityChange}
                        </td>
                        <td>{t.oldQuantity}</td>
                        <td>{t.newQuantity}</td>
                        <td>{t.unitPrice?.toLocaleString()} Ks</td>
                        <td>{t.referenceId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setShowTransactionModal(false)}>Close</button>
            </div>
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
                <p><strong>✅ Status:</strong>
                  <span className={`${styles.statusBadge} ${getStockStatus(detailItem).class}`}>
                    {getStockStatus(detailItem).icon} {getStockStatus(detailItem).text}
                  </span>
                </p>
                <p><strong>🕐 Last Updated:</strong> {formatDate(detailItem.updatedAt)}</p>
                <p><strong>🆔 ID:</strong> #{detailItem.id}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setDetailItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;