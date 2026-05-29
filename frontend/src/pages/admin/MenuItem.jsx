import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { 
  fetchAllProducts, 
  addProduct, 
  updateProduct, 
  deactivateProduct, 
  activateProduct 
} from "../../features/products/productSLice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function MenuItem() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: products, loading } = useSelector((state) => state.products); // 💡 Redux state
  const { list: categories } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, name: "", price: "", description: "", categoryId: "", imageFile: null, isActive: true 
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("description", formData.description);
    data.append("categoryId", formData.categoryId);
    if (formData.imageFile) data.append("imageFile", formData.imageFile);

    try {
      if (isEditing) {
        await dispatch(updateProduct({ id: formData.id, formData: data })).unwrap();
      } else {
        await dispatch(addProduct(data)).unwrap();
      }
      setShowModal(false);
    } catch (error) {
      alert("Error saving menu item!");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      if (item.isActive) {
        await dispatch(deactivateProduct(item.id)).unwrap();
      } else {
        await dispatch(activateProduct(item.id)).unwrap();
      }
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
          <h2>Menu Items Management</h2>
          <button className={styles.addBtn} onClick={() => { 
            setFormData({name: "", price: "", description: "", categoryId: "", imageFile: null, isActive: true}); 
            setIsEditing(false); setShowModal(true); 
          }}>+ Add New Item</button>
        </header>

        <div className={styles.tableContainer}>
          {loading ? <p>Loading...</p> : (
            <table className={styles.adminTable}>
              <thead>
                <tr><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category?.name}</td>
                    <td>{item.price} Ks</td>
                    <td>
                      <span className={item.isActive ? "badge bg-success" : "badge bg-secondary"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button className={styles.editBtn} onClick={() => { setFormData({...item, categoryId: item.category?.id}); setIsEditing(true); setShowModal(true); }}>Edit</button>
                      <button 
                        className={item.isActive ? styles.softDeleteBtn : styles.addBtn} 
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal JSX */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <input className="form-control mb-2" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input className="form-control mb-2" type="number" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                  <input className="form-control mb-2" type="file" onChange={e => setFormData({...formData, imageFile: e.target.files[0]})} />
                  <select className="form-control" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="modal-footer">
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

export default MenuItem;