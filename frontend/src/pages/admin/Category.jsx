import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { 
  fetchAllCategories, 
  addCategory, 
  updateCategory, 
  deactivateCategory, 
  activateCategory 
} from "../../features/categories/categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function Category() {
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: categories, loading } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, name: "", description: "", isActive: true 
  });

  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = 
      cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" ? cat.isActive : !cat.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updateCategory(formData)).unwrap();
      } else {
        await dispatch(addCategory(formData)).unwrap();
      }
      setShowModal(false);
      dispatch(fetchAllCategories());
    } catch (error) {
      alert("Error saving category!");
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      cat.isActive ? await dispatch(deactivateCategory(cat.id)).unwrap() : await dispatch(activateCategory(cat.id)).unwrap();
      dispatch(fetchAllCategories());
    } catch (error) {
      alert("Error updating status!");
    }
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        
        {/* Header Section */}
        <header className={`${styles.topHeader} d-flex align-items-center mb-4 justify-content-between`}>
          {/* Menu Toggle Button */}
          <button 
            className="btn btn-light shadow-sm d-flex align-items-center justify-content-center" 
            onClick={() => dispatch(toggleSidebar())}
            style={{ width: "40px", height: "40px", borderRadius: "8px", border: "1px solid #dee2e6" }}
          >
            ☰
          </button>
          
          <h2 className="mb-0">Category Management</h2>
          
          <button className={styles.addBtn} onClick={() => { 
            setFormData({name: "", description: "", isActive: true}); 
            setIsEditing(false); setShowModal(true); 
          }}>+ Add Category</button>
        </header>

        {/* Search & Filter Section */}
        <div className="row mb-3">
          <div className="col-md-6">
            <input 
              type="text" className="form-control" placeholder="Search by name or description..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className="text-center p-5">Loading Categories...</div>
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
                    <td>{cat.name}</td>
                    <td>{cat.description}</td>
                    <td>
                      <span className={cat.isActive ? "badge bg-success" : "badge bg-secondary"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button className={styles.editBtn} onClick={() => { setFormData(cat); setIsEditing(true); setShowModal(true); }}>Edit</button>
                      <button 
                        className={cat.isActive ? styles.softDeleteBtn : styles.addBtn} 
                        onClick={() => handleToggleActive(cat)}
                      >
                        {cat.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{isEditing ? "Edit Category" : "Add New Category"}</h5>
                </div>
                <div className="modal-body">
                  <input className="form-control mb-2" placeholder="Category Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <textarea className="form-control mb-2" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Category;