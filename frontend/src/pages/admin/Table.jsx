import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllTables,
  addTable,
  updateTableStatus,
  mergeTables,
  unmergeTable,
  setMaster,
} from "../../features/tables/tableSlice";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/table.module.css";

function Table() {
  const dispatch = useDispatch();

  const { list: tables, loading } = useSelector((state) => state.tables);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded || false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableNo, setTableNo] = useState("");
  const [error, setError] = useState("");
  const [selectedSubTableId, setSelectedSubTableId] = useState(null);
  const [selectedMasterTableId, setSelectedMasterTableId] = useState(null);

  useEffect(() => {
    dispatch(fetchAllTables());
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await dispatch(addTable({ tableNo })).unwrap();
      setTableNo("");
      setShowAddModal(false);
      setError("");
      dispatch(fetchAllTables());
    } catch (err) {
      setError(err || "Failed to add table");
    }
  };

  const handleMergeAction = async () => {
    if (!selectedMasterTableId) {
      alert("Please select master table");
      return;
    }
    if (!selectedSubTableId) {
      alert("Invalid table");
      return;
    }
    try {
      await dispatch(mergeTables({ masterTableId: selectedMasterTableId, subTableId: selectedSubTableId })).unwrap();
      setShowMergeModal(false);
      setSelectedMasterTableId(null);
      setSelectedSubTableId(null);
      dispatch(fetchAllTables());
    } catch (err) {
      alert(err || "Merge failed");
    }
  };

  const getStatusIcon = (status) => {
    return status === "AVAILABLE" ? "🟢" : "🔴";
  };

  const getTypeIcon = (type, isMaster, parentTableId) => {
    if (isMaster) return "👑";
    if (parentTableId) return "🔗";
    return "📋";
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />

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
            <span className={styles.statValue}>{tables?.filter(t => t.isMaster).length || 0}</span>
            <span className={styles.statLabel}>Master Tables</span>
          </div>
        </div>

        {/* Table Grid */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading tables...</div>
          ) : (
            <div className={styles.tableGrid}>
              {tables?.map((t) => (
                <div key={t.id} className={styles.tableCard}>
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
                        {getTypeIcon(t.type, t.isMaster, t.parentTableId)} {t.isMaster ? "MASTER" : t.parentTableId ? "SUB" : "NORMAL"}
                      </span>
                    </div>
                    
                    {t.parentTableId && (
                      <div className={styles.parentInfo}>
                        Sub of: Table #{t.parentTableId}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.tableActions}>
                    {!t.isMaster && !t.parentTableId && (
                      <>
                        <button 
                          className={styles.masterBtn}
                          onClick={() => dispatch(setMaster(t.id)).then(() => dispatch(fetchAllTables()))}
                        >
                          👑 Set Master
                        </button>
                        <button 
                          className={styles.mergeBtn}
                          onClick={() => {
                            setSelectedSubTableId(t.id);
                            setShowMergeModal(true);
                          }}
                        >
                          🔗 Merge
                        </button>
                      </>
                    )}
                    
                    {t.parentTableId && (
                      <button 
                        className={styles.unmergeBtn}
                        onClick={() => dispatch(unmergeTable(t.id)).then(() => dispatch(fetchAllTables()))}
                      >
                        🔓 Unmerge
                      </button>
                    )}
                    
                    <button 
                      className={`${t.status === "AVAILABLE" ? styles.occupyBtn : styles.releaseBtn}`}
                      onClick={() =>
                        dispatch(updateTableStatus({
                          id: t.id,
                          status: t.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE",
                        })).then(() => dispatch(fetchAllTables()))
                      }
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
                />
                {error && <small className={styles.errorText}>{error}</small>}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Add Table</button>
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
              >
                <option value="">-- Select Master Table --</option>
                {tables.filter((t) => t.isMaster).map((t) => (
                  <option key={t.id} value={t.id}>
                    Table #{t.tableNo} {t.status === "AVAILABLE" ? "🟢" : "🔴"}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowMergeModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleMergeAction}>Confirm Merge</button>
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
                  {selectedTable.isMaster ? "👑 Master Table" : selectedTable.parentTableId ? "🔗 Sub Table" : "📋 Normal Table"}
                </span>
              </div>
              {selectedTable.parentTableId && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Parent Table:</span>
                  <span className={styles.detailValue}>Table #{selectedTable.parentTableId}</span>
                </div>
              )}
              {selectedTable.subTables && selectedTable.subTables.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Sub Tables:</span>
                  <span className={styles.detailValue}>
                    {selectedTable.subTables.map(st => `Table #${st.tableNo}`).join(", ")}
                  </span>
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