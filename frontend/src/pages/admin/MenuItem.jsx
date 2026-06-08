import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchAllProducts,
  addProduct,
  updateProduct,
  deactivateProduct,
  activateProduct,
} from "../../features/products/productSLice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function MenuItem() {
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: products, loading } = useSelector((state) => state.products);
  const { list: categories } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null, name: "", price: "", description: "", categoryId: "", isActive: "true", imageFile: null,
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "" || item.category?.id == filterCategory;
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? item.isActive : !item.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      if (isEditing) {
        await dispatch(updateProduct({ id: formData.id, formData: data })).unwrap();
      } else {
        await dispatch(addProduct(data)).unwrap();
      }
      setShowModal(false);
      dispatch(fetchAllProducts());
    } catch (error) {
      alert("Error saving item!");
    }
  };

  const handleToggleActive = async (item) => {
    item.isActive ? await dispatch(deactivateProduct(item.id)).unwrap() : await dispatch(activateProduct(item.id)).unwrap();
    dispatch(fetchAllProducts());
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        
        {/* Header Section */}
        <header className={`${styles.topHeader} d-flex align-items-center mb-4 justify-content-between`}>
          <button className="btn btn-light shadow-sm" onClick={() => dispatch(toggleSidebar())} style={{width: "40px", height: "40px", borderRadius: "8px", border: "1px solid #dee2e6"}}>☰</button>
          <h2 className="mb-0">Menu Items Management</h2>
          <button className={styles.addBtn} onClick={() => { setFormData({id: null, name: "", price: "", description: "", categoryId: "", isActive: "true", imageFile: null}); setIsEditing(false); setShowModal(true); }}>+ Add New Item</button>
        </header>

        {/* Filter Section */}
        <div className="row mb-4">
          <div className="col-md-4"><input type="text" className="form-control" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="col-md-4">
            <select className="form-select" onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <select className="form-select" onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.adminTable}>
            <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredProducts.map((item) => (
                <tr key={item.id}>
                  <td><img src={`http://localhost:8080/uploads/${item.image}`} alt={item.name} style={{width: "50px", height: "50px", objectFit: "cover", borderRadius: "5px"}} /></td>
                  <td>{item.name}</td>
                  <td>{item.category?.name}</td>
                  <td>{item.price} Ks</td>
                  <td><span className={`badge ${item.isActive ? "bg-success" : "bg-secondary"}`}>{item.isActive ? "Active" : "Inactive"}</span></td>
                  <td>
                    <button className={styles.editBtn} onClick={() => { setFormData({id: item.id, name: item.name, price: item.price, description: item.description, categoryId: item.category?.id, isActive: item.isActive ? "true" : "false", imageFile: null}); setIsEditing(true); setShowModal(true); }}>Edit</button>
                    <button className={item.isActive ? styles.softDeleteBtn : styles.addBtn} onClick={() => handleToggleActive(item)}>{item.isActive ? "Deactivate" : "Activate"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: "rgba(0,0,0,0.5)"}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header"><h5 className="modal-title">{isEditing ? "Edit Item" : "Add New Item"}</h5></div>
                <div className="modal-body">
                  <input className="form-control mb-2" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                  <input className="form-control mb-2" type="number" placeholder="Price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                  <textarea className="form-control mb-2" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  <select className="form-select mb-2" value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="file" className="form-control" onChange={(e) => setFormData({...formData, imageFile: e.target.files[0]})} />
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

export default MenuItem;