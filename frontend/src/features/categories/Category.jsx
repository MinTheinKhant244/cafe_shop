import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { 
  fetchAllCategories, addCategory, updateCategory, deactivateCategory, activateCategory, searchCategories
} from "./categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function Category() {
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [formData, setFormData] = useState({ id: null, name: "", description: "", isActive: true });

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: categories, loading } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 0) dispatch(searchCategories(searchTerm));
      else dispatch(fetchAllCategories());
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await dispatch(updateCategory(formData)).unwrap();
      else await dispatch(addCategory(formData)).unwrap();
      setShowModal(false);
      resetForm();
      dispatch(fetchAllCategories());
    } catch (error) { alert("Error saving category!"); }
  };

  const resetForm = () => {
    setFormData({ id: null, name: "", description: "", isActive: true });
  };

  const handleToggleActive = async (cat) => {
    try {
      cat.isActive ? await dispatch(deactivateCategory(cat.id)).unwrap() 
                   : await dispatch(activateCategory(cat.id)).unwrap();
    } catch (error) { alert("Error updating status!"); }
  };

  // Truncate description
  const truncateDesc = (desc, maxLength = 60) => {
    if (!desc) return "-";
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + "...";
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
            <h1 className={styles.pageTitle}>📁 Category Management</h1>
          </div>
          <button className={styles.addBtn} onClick={() => { 
            resetForm();
            setIsEditing(false); 
            setShowModal(true); 
          }}>
            + Add Category
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 Search categories by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Statistics Bar - Compact */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.filter(c => c.isActive).length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.filter(c => !c.isActive).length}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
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
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className={styles.emptyRow}>
                      📭 No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
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
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewBtn} 
                            onClick={() => setDetailItem(cat)} 
                            title="View"
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
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className={cat.isActive ? styles.deactivateBtn : styles.activateBtn} 
                            onClick={() => handleToggleActive(cat)}
                            title={cat.isActive ? "Deactivate" : "Activate"}
                          >
                            {cat.isActive ? "🔴" : "🟢"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                  placeholder="Enter category description..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Changes</button>
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
                <p><strong>Name:</strong> {detailItem.name}</p>
                <p><strong>Description:</strong> {detailItem.description || "No description"}</p>
                <p><strong>Status:</strong> 
                  <span className={`${styles.statusBadge} ${detailItem.isActive ? styles.statusActive : styles.statusInactive}`}>
                    {detailItem.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;