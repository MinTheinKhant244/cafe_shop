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
      if (cat.isActive) {
        await dispatch(deactivateCategory(cat.id)).unwrap();
      } else {
        await dispatch(activateCategory(cat.id)).unwrap();
      }
      dispatch(fetchAllCategories());
    } catch (error) {
      alert("Error updating status!");
    }
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        
        <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
          <i className="fa-solid fa-bars"></i>
        </button>

        <header className={styles.topHeader}>
          <h2>Category Management</h2>
          <button className={styles.addBtn} onClick={() => { 
            setFormData({name: "", description: "", isActive: true}); 
            setIsEditing(false); setShowModal(true); 
          }}>
            + Add Category
          </button>
        </header>

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
                {categories.map((cat) => (
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
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <h5>{isEditing ? "Edit Category" : "Add New Category"}</h5>
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