import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { 
  fetchAllUsers, 
  addUser, 
  updateUser, 
  deactivateUser, 
  activateUser 
} from "../../features/users/userSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css"; 

function User() {
  const dispatch = useDispatch();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: users, loading } = useSelector((state) => state.users);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    id: null, name: "", email: "", password: "", role: "CASHIER", isActive: true 
  });

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || 
                          (filterStatus === "active" ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await dispatch(updateUser(formData)).unwrap();
      } else {
        await dispatch(addUser(formData)).unwrap();
      }
      setShowModal(false);
      dispatch(fetchAllUsers());
    } catch (error) {
      alert("Error saving user! Check your permissions.");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      user.isActive ? await dispatch(deactivateUser(user.id)).unwrap() : await dispatch(activateUser(user.id)).unwrap();
      dispatch(fetchAllUsers());
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
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-light shadow-sm me-3 d-flex align-items-center justify-content-center" 
              onClick={() => dispatch(toggleSidebar())}
              style={{ width: "40px", height: "40px", borderRadius: "8px", border: "1px solid #dee2e6" }}
            >
              ☰
            </button>
            <h2 className="mb-0">Staffs Control</h2>
          </div>
          <button className={styles.addBtn} onClick={() => { 
            setFormData({name: "", email: "", password: "", role: "CASHIER", isActive: true}); 
            setIsEditing(false); setShowModal(true); 
          }}>+ Add Staff</button>
        </header>

        {/* Search & Filter Section */}
        <div className="row mb-3">
          <div className="col-md-4">
            <input 
              type="text" className="form-control" placeholder="Search name or email..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="CASHIER">CASHIER</option>
            </select>
          </div>
          <div className="col-md-4">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className="text-center p-5">Loading Staffs...</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={user.isActive ? "badge bg-success" : "badge bg-secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button className={styles.editBtn} onClick={() => { setFormData(user); setIsEditing(true); setShowModal(true); }}>Edit</button>
                      <button 
                        className={user.isActive ? styles.softDeleteBtn : styles.addBtn} 
                        onClick={() => handleToggleActive(user)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Input Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-header">
                    <h5 className="modal-title">{isEditing ? "Edit Staff" : "Add New Staff"}</h5>
                </div>
                <div className="modal-body">
                  <input className="form-control mb-2" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input className="form-control mb-2" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  {!isEditing && (
                    <input className="form-control mb-2" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  )}
                  <select className="form-select mb-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CASHIER">CASHIER</option>
                  </select>
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

export default User;