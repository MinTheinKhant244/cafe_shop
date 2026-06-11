import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllTables,
  addTable,
  updateTableStatus,
  mergeTables,
  unmergeTable,
  setMaster,
  removeMaster,
  clearError,
} from "../../features/tables/tableSlice";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/table.module.css";

function Table() {
  const dispatch = useDispatch();

  const { list: tables, loading, error: reduxError, operationLoading } = useSelector((state) => state.tables);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded || false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableNo, setTableNo] = useState("");
  const [error, setError] = useState("");
  const [selectedSubTableId, setSelectedSubTableId] = useState(null);
  const [selectedMasterTableId, setSelectedMasterTableId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Fetch all tables on component mount
  useEffect(() => {
    dispatch(fetchAllTables());
  }, [dispatch]);

  // DEBUG: Log tables data to see what backend sends
  useEffect(() => {
    if (tables && tables.length > 0) {
      console.log("=== TABLES DATA FROM BACKEND ===");
      tables.forEach(table => {
        console.log({
          id: table.id,
          tableNo: table.tableNo,
          isMaster: table.isMaster,
          parentTableId: table.parentTableId,
          status: table.status,
          subTables: table.subTables
        });
      });
    }
  }, [tables]);

  // Show notification helper
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  // Clear error when modals close
  useEffect(() => {
    if (!showAddModal && !showMergeModal) {
      setError("");
      dispatch(clearError());
    }
  }, [showAddModal, showMergeModal, dispatch]);

  // Show redux error as notification
  useEffect(() => {
    if (reduxError) {
      showNotification(reduxError, "error");
    }
  }, [reduxError]);

  // Add new table
  const handleSave = async (e) => {
    e.preventDefault();
    if (!tableNo.trim()) {
      setError("Table number is required");
      return;
    }
    try {
      await dispatch(addTable({ tableNo })).unwrap();
      setTableNo("");
      setShowAddModal(false);
      setError("");
      showNotification(`Table ${tableNo} added successfully!`, "success");
      dispatch(fetchAllTables());
    } catch (err) {
      setError(err || "Failed to add table");
      showNotification(err || "Failed to add table", "error");
    }
  };

  // Merge tables action
  const handleMergeAction = async () => {
    if (!selectedMasterTableId) {
      showNotification("Please select master table", "error");
      return;
    }
    if (!selectedSubTableId) {
      showNotification("Invalid table", "error");
      return;
    }
    try {
      await dispatch(mergeTables({ masterTableId: selectedMasterTableId, subTableId: selectedSubTableId })).unwrap();
      setShowMergeModal(false);
      setSelectedMasterTableId(null);
      setSelectedSubTableId(null);
      showNotification("Tables merged successfully!", "success");
      dispatch(fetchAllTables());
    } catch (err) {
      showNotification(err || "Merge failed", "error");
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    return status === "AVAILABLE" ? "🟢" : "🔴";
  };

  // Check if table is master
  const isMasterTable = (table) => {
    if (!table) return false;
    return table.isMaster === true || table.isMaster === 1 || table.isMaster === "1" || table.isMaster === "true";
  };

  // Get table type for display
  const getTableType = (table) => {
    if (isMasterTable(table)) return "MASTER";
    if (table.parentTableId && table.parentTableId !== null && table.parentTableId !== 0) return "SUB";
    return "NORMAL";
  };

  // Get type icon
  const getTypeIcon = (table) => {
    if (isMasterTable(table)) return "👑";
    if (table.parentTableId && table.parentTableId !== null && table.parentTableId !== 0) return "🔗";
    return "📋";
  };

  // Check if table can be modified (not a sub table)
  const canModify = (table) => {
    return !table.parentTableId || table.parentTableId === null || table.parentTableId === 0;
  };

  // FIXED: Change table status (Occupy/Release) - Master will update all sub tables
  const handleStatusChange = async (table) => {
    // Sub table cannot be modified individually
    if (!canModify(table)) {
      showNotification("This table is merged as a sub table. Please unmerge first or change master table status.", "error");
      return;
    }
    
    // Check if trying to occupy/release master with sub tables
    if (isMasterTable(table) && table.subTables && table.subTables.length > 0) {
      const newStatus = table.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE";
      const actionText = newStatus === "OCCUPIED" ? "occupy" : "release";
      
      // Show confirmation dialog
      if (window.confirm(`This master table has ${table.subTables.length} sub table(s).\n\nDo you want to ${actionText} ALL of them as well?`)) {
        try {
          await dispatch(updateTableStatus({
            id: table.id,
            status: newStatus,
          })).unwrap();
          showNotification(`Master table ${table.tableNo} and its ${table.subTables.length} sub table(s) are now ${newStatus}!`, "success");
          dispatch(fetchAllTables());
        } catch (err) {
          showNotification(err || "Failed to update status", "error");
        }
      }
      return;
    }
    
    // Normal table or master without sub tables
    const newStatus = table.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE";
    try {
      await dispatch(updateTableStatus({
        id: table.id,
        status: newStatus,
      })).unwrap();
      showNotification(`Table ${table.tableNo} is now ${newStatus}`, "success");
      dispatch(fetchAllTables());
    } catch (err) {
      showNotification(err || "Failed to update status", "error");
    }
  };

  // Set table as master
  const handleSetMaster = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    if (table.parentTableId) {
      showNotification("Cannot set a sub table as master. Please unmerge first.", "error");
      return;
    }
    
    if (isMasterTable(table)) {
      showNotification("Table is already a master table.", "error");
      return;
    }
    
    try {
      await dispatch(setMaster(tableId)).unwrap();
      showNotification(`Table ${table.tableNo} is now a MASTER table!`, "success");
      dispatch(fetchAllTables());
    } catch (err) {
      showNotification(err || "Failed to set as master", "error");
    }
  };

  // Remove master status (convert to normal)
  const handleRemoveMaster = async (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    if (table.subTables && table.subTables.length > 0) {
      showNotification(`Cannot remove master status. Table ${table.tableNo} has ${table.subTables.length} sub table(s). Please unmerge first.`, "error");
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove master status from Table ${table.tableNo}? It will become a NORMAL table.`)) {
      try {
        await dispatch(removeMaster(tableId)).unwrap();
        showNotification(`Table ${table.tableNo} is now a NORMAL table!`, "success");
        dispatch(fetchAllTables());
      } catch (err) {
        showNotification(err || "Failed to remove master status", "error");
      }
    }
  };

  // Unmerge sub table
  const handleUnmerge = async (subTableId) => {
    const table = tables.find(t => t.id === subTableId);
    try {
      await dispatch(unmergeTable(subTableId)).unwrap();
      showNotification(`Table ${table?.tableNo} has been unmerged!`, "success");
      dispatch(fetchAllTables());
    } catch (err) {
      showNotification(err || "Failed to unmerge", "error");
    }
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />

      {/* Notification Toast */}
      {notification.show && (
        <div className={`${styles.toast} ${notification.type === "success" ? styles.success : styles.error}`}>
          {notification.type === "success" ? "✅ " : "❌ "}
          {notification.message}
        </div>
      )}

      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              ☰
            </button>
            <h1 className={styles.pageTitle}>🪑 Table Management</h1>
          </div>
          <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
            + Add New Table
          </button>
        </div>

        {/* Statistics Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{tables?.length || 0}</span>
            <span className={styles.statLabel}>Total Tables</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{tables?.filter(t => t.status === "AVAILABLE").length || 0}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{tables?.filter(t => t.status === "OCCUPIED").length || 0}</span>
            <span className={styles.statLabel}>Occupied</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{tables?.filter(t => isMasterTable(t)).length || 0}</span>
            <span className={styles.statLabel}>Master Tables</span>
          </div>
        </div>

        {/* Table Grid */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading tables...</div>
          ) : tables?.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>🪑</div>
              <div className={styles.emptyStateText}>No tables found. Click "Add New Table" to create one.</div>
            </div>
          ) : (
            <div className={styles.tableGrid}>
              {tables?.map((t) => (
                <div key={t.id} className={styles.tableCard} data-status={t.status}>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableNumber}>{t.tableNo}</span>
                    <button 
                      className={styles.detailBtn} 
                      onClick={() => {
                        setSelectedTable(t);
                        setShowDetailModal(true);
                      }}
                      title="View Details"
                    >
                      👁️
                    </button>
                  </div>
                  
                  <div className={styles.tableBody}>
                    <div className={styles.tableInfo}>
                      <span className={`${styles.statusIndicator} ${t.status === "AVAILABLE" ? styles.statusAvailable : styles.statusOccupied}`}>
                        {getStatusIcon(t.status)} {t.status}
                      </span>
                      <span className={styles.typeBadge}>
                        {getTypeIcon(t)} {getTableType(t)}
                      </span>
                    </div>
                    
                    {t.parentTableId && t.parentTableId !== 0 && (
                      <div className={styles.parentInfo}>
                        Sub of: Table #{tables?.find(p => p.id === t.parentTableId)?.tableNo || t.parentTableId}
                      </div>
                    )}
                    
                    {isMasterTable(t) && t.subTables && t.subTables.length > 0 && (
                      <div className={styles.subTablesInfo}>
                        📌 {t.subTables.length} sub table(s)
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.tableActions}>
                    {/* Set Master Button - only for normal tables (not master, not sub) */}
                    {!isMasterTable(t) && (!t.parentTableId || t.parentTableId === 0) && (
                      <button 
                        className={styles.masterBtn}
                        onClick={() => handleSetMaster(t.id)}
                        disabled={operationLoading}
                      >
                        👑 Set Master
                      </button>
                    )}
                    
                    {/* Remove Master Button - only for master tables WITHOUT sub tables */}
                    {isMasterTable(t) && (!t.subTables || t.subTables.length === 0) && (
                      <button 
                        className={styles.removeMasterBtn}
                        onClick={() => handleRemoveMaster(t.id)}
                        disabled={operationLoading}
                      >
                        🔄 Remove Master
                      </button>
                    )}
                    
                    {/* Merge Button - only for normal tables (not master, not sub) */}
                    {!isMasterTable(t) && (!t.parentTableId || t.parentTableId === 0) && (
                      <button 
                        className={styles.mergeBtn}
                        onClick={() => {
                          setSelectedSubTableId(t.id);
                          setShowMergeModal(true);
                        }}
                        disabled={operationLoading}
                      >
                        🔗 Merge
                      </button>
                    )}
                    
                    {/* Unmerge Button - only for sub tables */}
                    {t.parentTableId && t.parentTableId !== 0 && (
                      <button 
                        className={styles.unmergeBtn}
                        onClick={() => handleUnmerge(t.id)}
                        disabled={operationLoading}
                      >
                        🔓 Unmerge
                      </button>
                    )}
                    
                    {/* Occupy/Release Button */}
                    <button 
                      className={`
                        ${t.status === "AVAILABLE" ? styles.occupyBtn : styles.releaseBtn}
                        ${!canModify(t) ? styles.disabledBtn : ""}
                      `.trim()}
                      onClick={() => handleStatusChange(t)}
                      disabled={(!canModify(t) && !isMasterTable(t)) || operationLoading}
                      title={!canModify(t) && !isMasterTable(t) ? "Cannot modify merged sub table. Please unmerge first or change master table status." : ""}
                    >
                      {t.status === "AVAILABLE" ? "🚪 Occupy" : "✅ Release"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>➕ Add New Table</h3>
              <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Table Number *</label>
                <input 
                  type="text" 
                  placeholder="Enter table number (e.g., T01, Table 1)"
                  value={tableNo} 
                  onChange={(e) => setTableNo(e.target.value)} 
                  required 
                  disabled={operationLoading}
                />
                {error && <small className={styles.errorText}>{error}</small>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={operationLoading}>
                  {operationLoading ? "Adding..." : "Add Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {showMergeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMergeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔗 Merge Table to Master</h3>
              <button className={styles.modalClose} onClick={() => setShowMergeModal(false)}>×</button>
            </div>
            <div className={styles.formGroup}>
              <label>Select Master Table *</label>
              <select 
                className={styles.selectInput}
                value={selectedMasterTableId || ""}
                onChange={(e) => setSelectedMasterTableId(Number(e.target.value))}
                disabled={operationLoading}
              >
                <option value="">-- Select Master Table --</option>
                {tables
                  ?.filter((t) => isMasterTable(t) && t.id !== selectedSubTableId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.tableNo} (ID: {t.id}) {t.status === "AVAILABLE" ? "🟢" : "🔴"}
                    </option>
                  ))}
              </select>
              {tables?.filter(t => isMasterTable(t) && t.id !== selectedSubTableId).length === 0 && (
                <small className={styles.warningText}>
                  ⚠️ No master tables available. Please set a table as master first.
                </small>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowMergeModal(false)}>Cancel</button>
              <button 
                className={styles.saveBtn} 
                onClick={handleMergeAction}
                disabled={tables?.filter(t => isMasterTable(t) && t.id !== selectedSubTableId).length === 0 || operationLoading}
              >
                {operationLoading ? "Merging..." : "Confirm Merge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTable && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📋 Table Details</h3>
              <button className={styles.modalClose} onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Table Number:</span>
                <span className={styles.detailValue}>{selectedTable.tableNo}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={`${styles.statusBadge} ${selectedTable.status === "AVAILABLE" ? styles.statusAvailable : styles.statusOccupied}`}>
                  {getStatusIcon(selectedTable.status)} {selectedTable.status}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Type:</span>
                <span className={styles.typeBadgeLarge}>
                  {getTypeIcon(selectedTable)} {getTableType(selectedTable)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ID:</span>
                <span className={styles.detailValue}>#{selectedTable.id}</span>
              </div>
              {selectedTable.parentTableId && selectedTable.parentTableId !== 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Parent Table:</span>
                  <span className={styles.detailValue}>
                    {tables?.find(p => p.id === selectedTable.parentTableId)?.tableNo || `ID #${selectedTable.parentTableId}`}
                  </span>
                </div>
              )}
              {isMasterTable(selectedTable) && selectedTable.subTables && selectedTable.subTables.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sub Tables:</span>
                  <span className={styles.detailValue}>
                    {selectedTable.subTables.map(st => `${st.tableNo}`).join(", ")}
                  </span>
                </div>
              )}
              {selectedTable.parentTableId && selectedTable.parentTableId !== 0 && (
                <div className={styles.warningDetailRow}>
                  ⚠️ This table is merged as a sub table. Change master table status to update this table.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;