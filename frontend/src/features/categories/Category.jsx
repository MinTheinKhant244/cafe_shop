import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { 
  fetchAllCategories, addCategory, updateCategory, deactivateCategory, activateCategory, searchCategories, clearError
} from "./categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function Category() {
  const dispatch = useDispatch();
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [formData, setFormData] = useState({ id: null, name: "", description: "", isActive: true });
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: categories, loading, error: reduxError } = useSelector((state) => state.categories);
 
  useEffect(() => {
    dispatch(fetchAllCategories());
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

  // Search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        dispatch(searchCategories(searchTerm));
      } else {
        dispatch(fetchAllCategories());
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch]);

  // Filtering Logic (for status filter)
  const filteredCategories = categories.filter((cat) => {
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" ? cat.isActive : !cat.isActive);
    return matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      showNotification("Category name is required!", "error");
      return;
    }
    
    try {
      if (isEditing) {
        await dispatch(updateCategory(formData)).unwrap();
        showNotification("Category updated successfully!", "success");
      } else {
        await dispatch(addCategory(formData)).unwrap();
        showNotification("Category added successfully!", "success");
      }
      setShowModal(false);
      resetForm();
      dispatch(fetchAllCategories());
    } catch (error) { 
      showNotification(error || "Error saving category!", "error");
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: "", description: "", isActive: true });
  };

  const handleToggleActive = async (cat) => {
    try {
      if (cat.isActive) {
        await dispatch(deactivateCategory(cat.id)).unwrap();
        showNotification(`Category "${cat.name}" deactivated!`, "success");
      } else {
        await dispatch(activateCategory(cat.id)).unwrap();
        showNotification(`Category "${cat.name}" activated!`, "success");
      }
      dispatch(fetchAllCategories());
    } catch (error) { 
      showNotification(error || "Error updating status!", "error");
    }
  };

  // Truncate description
  const truncateDesc = (desc, maxLength = 60) => {
    if (!desc) return "-";
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + "...";
  };

  // Check if any filter is active
  const isFilterActive = searchTerm !== "" || filterStatus !== "all";

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
            <h1 className={styles.pageTitle}>Category Management</h1>
          </div>
          <button 
            className={styles.addBtn} 
            onClick={() => { 
              resetForm();
              setIsEditing(false); 
              setShowModal(true); 
            }}
          >
            + Add Category
          </button>
        </div>

        {/* Search & Filter Section - Like MenuItem */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 Search categories by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">🔄 All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">⛔ Inactive</option>
            </select>
            {isFilterActive && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Statistics Bar - Compact */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{filteredCategories.length}</span>
            <span className={styles.statLabel}>Filtered</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.filter(c => c.isActive).length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.filter(c => !c.isActive).length}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>
                {searchTerm || filterStatus !== "all" 
                  ? "No categories match your filters" 
                  : "No categories found. Click 'Add Category' to create one."}
              </p>
            </div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span className={styles.productName}>
                        {cat.name}
                      </span>
                    </td>
                    <td>
                      <span className={styles.descriptionText}>
                        {truncateDesc(cat.description)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${cat.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {cat.isActive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewBtn} 
                          onClick={() => setDetailItem(cat)} 
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          className={styles.editBtn} 
                          onClick={() => { 
                            setFormData(cat); 
                            setIsEditing(true); 
                            setShowModal(true); 
                          }} 
                          title="Edit Category"
                        >
                          ✏️
                        </button>
                        <button 
                          className={cat.isActive ? styles.deactivateBtn : styles.activateBtn} 
                          onClick={() => handleToggleActive(cat)}
                          title={cat.isActive ? "Deactivate Category" : "Activate Category"}
                        >
                          {cat.isActive ? "🔴" : "🟢"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h3>{isEditing ? "✏️ Edit Category" : "➕ Add New Category"}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter category name..."
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  rows="3"
                  placeholder="Enter category description (optional)..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
                <small className={styles.hintText}>Max 200 characters</small>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>
                  {isEditing ? "Update Category" : "Add Category"}
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
            <div className={styles.detailHeader}>
              <h3>📋 Category Details</h3>
              <button className={styles.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailInfo}>
                <p><strong>📛 Name:</strong> {detailItem.name}</p>
                <p><strong>📝 Description:</strong> {detailItem.description || "No description provided"}</p>
                <p><strong>📊 Status:</strong> 
                  <span className={`${styles.statusBadge} ${detailItem.isActive ? styles.statusActive : styles.statusInactive}`}>
                    {detailItem.isActive ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                </p>
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

export default Category;
