import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { toggleSidebar } from "../../app/uiSlice";
import {
  stockIn,
  stockOut,
  adjustStock,
  getTxByInventory,
  getTxByDateRange,
  clearTxError,
  resetTx,
} from "./inventoryTransactionSlice";
import { fetchAllInventory } from "../inventory/inventorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/inventoryTransaction.module.css";

function InventoryTransaction() {
  const dispatch = useDispatch();
  const location = useLocation();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  
  // Get itemId from URL query params
  const queryParams = new URLSearchParams(location.search);
  const itemIdFromUrl = queryParams.get("itemId");
  
  // ✅ Fix: Safe access with optional chaining
  const transactionState = useSelector((state) => state.inventoryTransaction) || {};
  const { 
    transactions = [], 
    currentInventoryTx = [], 
    loading = false, 
    error: reduxError = null, 
    operationLoading = false 
  } = transactionState;
  
  // ✅ Fix: Safe access for inventory state
  const inventoryState = useSelector((state) => state.inventory) || {};
  const { list: inventoryList = [] } = inventoryState;

  // ✅ Fix: Filter only ACTIVE items and ensure array
  const inventory = Array.isArray(inventoryList) 
    ? inventoryList.filter(item => item?.status === "ACTIVE") 
    : [];
  const transactionList = Array.isArray(transactions) ? transactions : [];
  const currentTxList = Array.isArray(currentInventoryTx) ? currentInventoryTx : [];

  // Filter States
  const [selectedInventoryId, setSelectedInventoryId] = useState(itemIdFromUrl || "");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [transactionType, setTransactionType] = useState("all");
  const [useDateRange, setUseDateRange] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("STOCK_IN");
  const [detailTx, setDetailTx] = useState(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    inventoryId: "",
    transactionType: "STOCK_IN",
    quantity: "",
    unitPrice: "",
    referenceNo: "",
    remark: ""
  });
  
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Load inventory data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchAllInventory());
      } catch (error) {
        console.error("Failed to load inventory:", error);
      }
    };
    loadData();
  }, [dispatch]);

  // Load transactions when inventory selected (and not using date range)
  useEffect(() => {
    if (selectedInventoryId && !useDateRange && selectedInventoryId !== "") {
      dispatch(getTxByInventory(selectedInventoryId));
    } else if (!useDateRange && !selectedInventoryId) {
      dispatch(resetTx());
    }
  }, [selectedInventoryId, useDateRange, dispatch]);

  // Handle URL parameter
  useEffect(() => {
    if (itemIdFromUrl && itemIdFromUrl !== "") {
      const itemExists = inventory.find(i => i.id === parseInt(itemIdFromUrl));
      if (itemExists) {
        setSelectedInventoryId(itemIdFromUrl);
        setUseDateRange(false);
      }
    }
  }, [itemIdFromUrl, inventory]);

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Show redux error as notification
  useEffect(() => {
    if (reduxError) {
      showNotification(reduxError, "error");
      dispatch(clearTxError());
    }
  }, [reduxError, dispatch]);

  // Handle Date Range Search
  const handleDateRangeSearch = async () => {
    if (dateRange.start && dateRange.end) {
      setUseDateRange(true);
      setSelectedInventoryId("");
      await dispatch(getTxByDateRange({ start: dateRange.start, end: dateRange.end }));
    } else {
      showNotification("Please select both start and end dates", "error");
    }
  };

  // Clear Date Range
  const clearDateRange = () => {
    setDateRange({ start: "", end: "" });
    setSelectedInventoryId("");
    setUseDateRange(false);
    setTransactionType("all");
    dispatch(resetTx());
  };

  // Clear filters
  const clearFilters = () => {
    clearDateRange();
  };

  // Handle Save Transaction
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.inventoryId) {
      showNotification("Please select an inventory item!", "error");
      return;
    }
    
    // ✅ Fix: Validate that selected item exists and is active
    const selectedItem = inventory.find(i => i.id === parseInt(formData.inventoryId));
    if (!selectedItem) {
      showNotification("Selected item is not active or does not exist!", "error");
      return;
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      showNotification("Valid quantity is required!", "error");
      return;
    }
    
    const data = {
      inventoryId: parseInt(formData.inventoryId),
      transactionType: modalType,
      quantity: parseFloat(formData.quantity),
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
      referenceNo: formData.referenceNo || null,
      remark: formData.remark || null
    };
    
    try {
      if (modalType === "STOCK_IN") {
        await dispatch(stockIn(data)).unwrap();
      } else if (modalType === "STOCK_OUT") {
        await dispatch(stockOut(data)).unwrap();
      } else {
        await dispatch(adjustStock(data)).unwrap();
      }
      
      showNotification(`${getModalTitle()} completed successfully!`, "success");
      setShowModal(false);
      resetForm();
      
      // Refresh data
      if (selectedInventoryId && !useDateRange) {
        dispatch(getTxByInventory(selectedInventoryId));
      }
      await dispatch(fetchAllInventory());
    } catch (error) {
      showNotification(error || "Error saving transaction!", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      inventoryId: "",
      transactionType: "STOCK_IN",
      quantity: "",
      unitPrice: "",
      referenceNo: "",
      remark: ""
    });
  };

  const getModalTitle = () => {
    switch (modalType) {
      case "STOCK_IN": return "Stock In";
      case "STOCK_OUT": return "Stock Out";
      case "ADJUST": return "Adjust Stock";
      default: return "Transaction";
    }
  };

  const getTransactionTypeBadge = (type) => {
    const badges = {
      STOCK_IN: { class: styles.typeStockIn, icon: "📥", text: "Stock In" },
      STOCK_OUT: { class: styles.typeStockOut, icon: "📤", text: "Stock Out" },
      ADJUSTMENT: { class: styles.typeAdjustment, icon: "⚙️", text: "Adjustment" },
      INITIAL: { class: styles.typeInitial, icon: "🏁", text: "Initial" },
      RETURN: { class: styles.typeReturn, icon: "↩️", text: "Return" },
      WASTAGE: { class: styles.typeWastage, icon: "⚠️", text: "Wastage" }
    };
    return badges[type] || { class: styles.typeDefault, icon: "📋", text: type };
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0 Ks";
    return `${amount.toLocaleString()} Ks`;
  };

  // Get filtered transactions based on type
  const getFilteredTransactions = () => {
    let filtered = useDateRange ? transactionList : currentTxList;
    
    if (transactionType !== "all") {
      filtered = filtered.filter(tx => tx.transactionType === transactionType);
    }
    
    return filtered;
  };

  const displayedTransactions = getFilteredTransactions();
  
  // Calculate statistics
  const totalStockIn = displayedTransactions
    .filter(tx => tx.transactionType === "STOCK_IN")
    .reduce((sum, tx) => sum + (tx.quantity > 0 ? tx.quantity : 0), 0);
    
  const totalStockOut = displayedTransactions
    .filter(tx => tx.transactionType === "STOCK_OUT")
    .reduce((sum, tx) => sum + Math.abs(tx.quantity), 0);
    
  const totalAdjustments = displayedTransactions
    .filter(tx => tx.transactionType === "ADJUSTMENT")
    .length;

  const totalValue = displayedTransactions.reduce((sum, tx) => 
    sum + (Math.abs(tx.quantity) * (tx.unitPrice || 0)), 0);

  const isFilterActive = selectedInventoryId || dateRange.start || dateRange.end || transactionType !== "all";

  // ✅ Fix: Loading state
  const isLoading = loading && displayedTransactions.length === 0 && !selectedInventoryId && !useDateRange;

  if (isLoading) {
    return (
      <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
        <Sidebar />
        <div className={styles.mainContent}>
          <div className={styles.loading}>Loading transactions...</div>
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
            <h1 className={styles.pageTitle}>📊 Inventory Transactions</h1>
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.stockInBtn}
              onClick={() => {
                setModalType("STOCK_IN");
                resetForm();
                setShowModal(true);
              }}
            >
              📥 Stock In
            </button>
            <button 
              className={styles.stockOutBtn}
              onClick={() => {
                setModalType("STOCK_OUT");
                resetForm();
                setShowModal(true);
              }}
            >
              📤 Stock Out
            </button>
            <button 
              className={styles.adjustBtn}
              onClick={() => {
                setModalType("ADJUST");
                resetForm();
                setShowModal(true);
              }}
            >
              ⚙️ Adjust
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📥</span>
            <div>
              <div className={styles.statValue}>{totalStockIn.toFixed(0)}</div>
              <div className={styles.statLabel}>Total Stock In</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📤</span>
            <div>
              <div className={styles.statValue}>{totalStockOut.toFixed(0)}</div>
              <div className={styles.statLabel}>Total Stock Out</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⚙️</span>
            <div>
              <div className={styles.statValue}>{totalAdjustments}</div>
              <div className={styles.statLabel}>Adjustments</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>💰</span>
            <div>
              <div className={styles.statValue}>{formatCurrency(totalValue)}</div>
              <div className={styles.statLabel}>Total Value</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div>
              <div className={styles.statValue}>{displayedTransactions.length}</div>
              <div className={styles.statLabel}>Transactions</div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterGroup}>
            <label>Select Inventory Item</label>
            <select 
              value={selectedInventoryId} 
              onChange={(e) => {
                setSelectedInventoryId(e.target.value);
                setUseDateRange(false);
                setDateRange({ start: "", end: "" });
              }}
            >
              <option value="">-- Select an active item --</option>
              {inventory.length > 0 ? (
                inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - Stock: {item.quantity} {item.unit || 'unit'}
                  </option>
                ))
              ) : (
                <option disabled>No active items available</option>
              )}
            </select>
          </div>

          <div className={styles.filterDivider}>OR</div>

          <div className={styles.filterGroup}>
            <label>Date Range</label>
            <div className={styles.dateRangeGroup}>
              <input
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
              <span>to</span>
              <input
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
              <button onClick={handleDateRangeSearch} className={styles.searchBtn}>
                🔍 Search
              </button>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Transaction Type</label>
            <select 
              value={transactionType} 
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="all">📋 All Types</option>
              <option value="STOCK_IN">📥 Stock In</option>
              <option value="STOCK_OUT">📤 Stock Out</option>
              <option value="ADJUSTMENT">⚙️ Adjustment</option>
              <option value="WASTAGE">⚠️ Wastage</option>
              <option value="RETURN">↩️ Return</option>
              <option value="INITIAL">🏁 Initial</option>
            </select>
          </div>

          {isFilterActive && (
            <button className={styles.clearFiltersBtn} onClick={clearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>

        {/* Transactions Table */}
        <div className={styles.tableContainer}>
          {displayedTransactions.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>
                {isFilterActive
                  ? "No transactions found for the selected criteria"
                  : "Select an inventory item or date range to view transactions"}
              </p>
              {!isFilterActive && (
                <button 
                  className={styles.stockInBtn}
                  style={{ marginTop: "15px" }}
                  onClick={() => {
                    setModalType("STOCK_IN");
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  + Create First Transaction
                </button>
              )}
            </div>
          ) : (
            <table className={styles.transactionTable}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.map((tx) => {
                  const typeBadge = getTransactionTypeBadge(tx.transactionType);
                  const isPositive = tx.quantity > 0;
                  const total = Math.abs(tx.quantity) * (tx.unitPrice || 0);
                  
                  return (
                    <tr key={tx.id}>
                      <td className={styles.dateCell}>{formatDateTime(tx.transactionDate)}</td>
                      <td>
                        <span className={styles.itemName}>
                          {tx.inventory?.name || `Item #${tx.inventoryId}`}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.typeBadge} ${typeBadge.class}`}>
                          {typeBadge.icon} {typeBadge.text}
                        </span>
                      </td>
                      <td className={isPositive ? styles.positive : styles.negative}>
                        {isPositive ? `+${tx.quantity}` : `${tx.quantity}`}
                      </td>
                      <td>{formatCurrency(tx.unitPrice)}</td>
                      <td className={styles.totalCell}>{formatCurrency(total)}</td>
                      <td>{tx.beforeQuantity?.toFixed(2)}</td>
                      <td>{tx.afterQuantity?.toFixed(2)}</td>
                      <td>
                        {tx.referenceNo ? (
                          <span className={styles.referenceBadge}>{tx.referenceNo}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => setDetailTx(tx)}
                          title="View Details"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {displayedTransactions.length > 0 && (
          <div className={styles.footerInfo}>
            <span>📝 Showing {displayedTransactions.length} transactions</span>
          </div>
        )}
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalType === "STOCK_IN" ? "📥" : modalType === "STOCK_OUT" ? "📤" : "⚙️"} {getModalTitle()}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Select Item *</label>
                <select
                  value={formData.inventoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, inventoryId: e.target.value });
                    const item = inventory.find(i => i.id === parseInt(e.target.value));
                    if (item && modalType !== "STOCK_IN") {
                      setFormData(prev => ({ ...prev, unitPrice: item.currentPrice }));
                    }
                  }}
                  required
                >
                  <option value="">-- Select an active item --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - Stock: {item.quantity} {item.unit || 'unit'} - Price: {formatCurrency(item.currentPrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
                {modalType === "STOCK_OUT" && formData.inventoryId && (
                  <small className={styles.hintText}>
                    Max available: {inventory.find(i => i.id === parseInt(formData.inventoryId))?.quantity || 0}
                  </small>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Unit Price</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Enter unit price (Ks)"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                />
                <small className={styles.hintText}>
                  {modalType === "STOCK_IN" ? "Purchase price" : "Leave empty to use current price"}
                </small>
              </div>

              <div className={styles.formGroup}>
                <label>Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g., PO-001, SALE-123"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Remark</label>
                <textarea
                  rows="3"
                  placeholder="Additional notes..."
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                />
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={operationLoading}>
                  {operationLoading ? "Processing..." : "Confirm Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailTx && (
        <div className={styles.modalOverlay} onClick={() => setDetailTx(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📋 Transaction Details</h3>
              <button className={styles.modalClose} onClick={() => setDetailTx(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailInfo}>
                <p><strong>🆔 ID:</strong> #{detailTx.id}</p>
                <p><strong>📛 Item:</strong> {detailTx.inventory?.name}</p>
                <p><strong>🏷️ Type:</strong> {getTransactionTypeBadge(detailTx.transactionType).icon} {detailTx.transactionType}</p>
                <p><strong>📊 Quantity:</strong> <span className={detailTx.quantity > 0 ? styles.positive : styles.negative}>
                  {detailTx.quantity > 0 ? `+${detailTx.quantity}` : detailTx.quantity}
                </span></p>
                <p><strong>💰 Unit Price:</strong> {formatCurrency(detailTx.unitPrice)}</p>
                <p><strong>💵 Total Value:</strong> {formatCurrency(Math.abs(detailTx.quantity) * (detailTx.unitPrice || 0))}</p>
                <p><strong>📈 Before:</strong> {detailTx.beforeQuantity} {detailTx.inventory?.unit}</p>
                <p><strong>📉 After:</strong> {detailTx.afterQuantity} {detailTx.inventory?.unit}</p>
                <p><strong>📋 Reference:</strong> {detailTx.referenceNo || "-"}</p>
                <p><strong>📝 Remark:</strong> {detailTx.remark || "-"}</p>
                <p><strong>👤 Created By:</strong> {detailTx.createdBy || "SYSTEM"}</p>
                <p><strong>🕐 Transaction Date:</strong> {formatDateTime(detailTx.transactionDate)}</p>
                <p><strong>🕐 Created At:</strong> {formatDateTime(detailTx.createdAt)}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setDetailTx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryTransaction;