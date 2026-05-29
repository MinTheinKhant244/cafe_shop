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
      // isActive ဖြစ်လျှင် Deactivate, မဟုတ်လျှင် Activate လုပ်ပါ
      if (user.isActive) {
        await dispatch(deactivateUser(user.id)).unwrap();
      } else {
        await dispatch(activateUser(user.id)).unwrap();
      }
      dispatch(fetchAllUsers());
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
          <h2>Staffs Control</h2>
          <button className={styles.addBtn} onClick={() => { 
            setFormData({name: "", email: "", password: "", role: "CASHIER", isActive: true}); 
            setIsEditing(false); setShowModal(true); 
          }}>
            + Add Staff
          </button>
        </header>

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
                {users.map((user) => (
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
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <h5>{isEditing ? "Edit Staff" : "Add New Staff"}</h5>
                  <input className="form-control mb-2" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  <input className="form-control mb-2" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  {!isEditing && (
                    <input className="form-control mb-2" type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                  )}
                  <select className="form-control mb-2" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
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