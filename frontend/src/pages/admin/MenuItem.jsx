import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchAllProducts, addProduct, updateProduct, deactivateProduct, activateProduct,
} from "../../features/products/productSLice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function MenuItem() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: products, loading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    id: null, name: "", price: "", description: "", categoryId: "", isActive: true, imageFile: null,
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  // Filtering Logic
  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "" || Number(item.category?.id) === Number(filterCategory);
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? item.isActive : !item.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    data.append("isActive", formData.isActive);
    if (formData.imageFile) data.append("imageFile", formData.imageFile);

    try {
      if (isEditing) await dispatch(updateProduct({ id: formData.id, formData: data })).unwrap();
      else await dispatch(addProduct(data)).unwrap();
      setShowModal(false);
      setImagePreview(null);
      resetForm();
    } catch (error) { alert("Error saving item!"); }
  };

  const resetForm = () => {
    setFormData({
      id: null, name: "", price: "", description: "", categoryId: "", isActive: true, imageFile: null,
    });
    setImagePreview(null);
  };

  // Truncate description
  const truncateDesc = (desc, maxLength = 50) => {
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
            <h1 className={styles.pageTitle}>🍽️ Menu Management</h1>
          </div>
          <button className={styles.addBtn} onClick={() => {
            resetForm();
            setIsEditing(false);
            setShowModal(true);
          }}>
            + Add New Item
          </button>
        </div>

        {/* Search & Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 Search by name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">📂 All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">🔄 All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">⛔ Inactive</option>
            </select>
          </div>
        </div>

        {/* Statistics Bar - Compact */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{filteredProducts.length}</span>
            <span className={styles.statLabel}>Items</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{products.filter(p => p.isActive).length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{categories.length}</span>
            <span className={styles.statLabel}>Categories</span>
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
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={styles.emptyRow}>
                      📭 No items found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img 
                          src={`http://localhost:8080/uploads/${item.image}`} 
                          alt={item.name} 
                          className={styles.productImage}
                          onClick={() => setPreviewImage(item.image)}
                        />
                      </td>
                      <td><span className={styles.productName}>{item.name}</span></td>
                      <td><span className={styles.categoryBadge}>{item.category?.name || "-"}</span></td>
                      <td><span className={styles.descriptionText}>{truncateDesc(item.description)}</span></td>
                      <td><span className={styles.priceText}>{Number(item.price).toLocaleString()} Ks</span></td>
                      <td>
                        <span className={`${styles.statusBadge} ${item.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.viewBtn} onClick={() => setDetailItem(item)} title="View">👁️</button>
                          <button className={styles.editBtn} onClick={() => { 
                            setFormData({...item, categoryId: item.category?.id}); 
                            setIsEditing(true); 
                            setShowModal(true); 
                          }} title="Edit">✏️</button>
                          <button 
                            className={item.isActive ? styles.deactivateBtn : styles.activateBtn} 
                            onClick={() => dispatch(item.isActive ? deactivateProduct(item.id) : activateProduct(item.id))}
                            title={item.isActive ? "Deactivate" : "Activate"}
                          >
                            {item.isActive ? "🔴" : "🟢"}
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
              <h3>{isEditing ? "✏️ Edit Item" : "➕ Add New Item"}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              {imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Price (Ks) *</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Category *</label>
                  <select 
                    value={formData.categoryId} 
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  rows="3"
                  placeholder="Enter item description..."
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange} 
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
              <h3>📋 Item Details</h3>
              <button className={styles.modalClose} onClick={() => setDetailItem(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              {detailItem.image && (
                <img 
                  src={`http://localhost:8080/uploads/${detailItem.image}`} 
                  alt={detailItem.name} 
                  className={styles.detailImage}
                />
              )}
              <div className={styles.detailInfo}>
                <p><strong>Name:</strong> {detailItem.name}</p>
                <p><strong>Category:</strong> {detailItem.category?.name}</p>
                <p><strong>Price:</strong> {Number(detailItem.price).toLocaleString()} Ks</p>
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className={styles.modalOverlay} onClick={() => setPreviewImage(null)}>
          <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
            <img src={`http://localhost:8080/uploads/${previewImage}`} alt="Preview" />
            <button className={styles.imageClose} onClick={() => setPreviewImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuItem;