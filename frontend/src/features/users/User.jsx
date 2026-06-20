import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import { fetchAllUsers, addUser, updateUser, deactivateUser, activateUser } from "../../features/users/userSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/user.module.css";

function User() {
  const dispatch = useDispatch();
  const { list: users, loading } = useSelector((state) => state.users);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [formData, setFormData] = useState({ 
    id: null, name: "", email: "", password: "", role: "CASHIER", isActive: true 
  });

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || (filterStatus === "active" ? user.isActive : !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
    setFilterStatus("all");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.password || payload.password.trim() === "") delete payload.password;
    
    try {
      if (isEditing) await dispatch(updateUser(payload)).unwrap();
      else await dispatch(addUser(payload)).unwrap();
      setShowModal(false);
      resetForm();
      dispatch(fetchAllUsers());
    } catch (error) { alert("Action Failed: " + error); }
  };

  const resetForm = () => {
    setFormData({ id: null, name: "", email: "", password: "", role: "CASHIER", isActive: true });
  };

  const getRoleBadge = (role) => {
    if (role === "ADMIN") {
      return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>👑 ADMIN</span>;
    }
    return <span className={`${styles.roleBadge} ${styles.roleCashier}`}>💰 CASHIER</span>;
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || "?";
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
            <h1 className={styles.pageTitle}>User Management</h1>
          </div>
          <button className={styles.addBtn} onClick={() => { 
            resetForm(); 
            setIsEditing(false); 
            setShowModal(true); 
          }}>
            + Add User
          </button>
        </div>

        {/* Statistics Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{users.length}</span>
            <span className={styles.statLabel}>Total User</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{users.filter(u => u.isActive).length}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{users.filter(u => !u.isActive).length}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{users.filter(u => u.role === "ADMIN").length}</span>
            <span className={styles.statLabel}>Admins</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{users.filter(u => u.role === "CASHIER").length}</span>
            <span className={styles.statLabel}>Cashiers</span>
          </div>
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 Search by name or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="all">📂 All Roles</option>
              <option value="ADMIN">👑 ADMIN</option>
              <option value="CASHIER">💰 CASHIER</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">🔄 All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">⛔ Inactive</option>
            </select>
            {(searchTerm || filterRole !== "all" || filterStatus !== "all") && (
              <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                ✕ Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* User Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No users found</p>
            </div>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar} style={{ background: user.role === "ADMIN" ? "#3498db" : "#2ecc71" }}>
                          {getInitials(user.name)}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{user.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.userEmail}>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {user.isActive ? "🟢 Active" : "🔴 Inactive"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.lastLogin}>
                        {formatDateTime(user.lastLogin)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewBtn} 
                          onClick={() => setDetailUser(user)} 
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button 
                          className={styles.editBtn} 
                          onClick={() => { 
                            setFormData(user); 
                            setIsEditing(true); 
                            setShowModal(true); 
                          }} 
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className={user.isActive ? styles.deactivateBtn : styles.activateBtn} 
                          onClick={() => dispatch(user.isActive ? deactivateUser(user.id) : activateUser(user.id))}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {user.isActive ? "🔴" : "🟢"}
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
              <h3>{isEditing ? "✏️ Edit User" : "➕ Add New User"}</h3>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter full name"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input 
                  type="email" 
                  placeholder="Enter email address"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  required 
                />
              </div>
              {!isEditing && (
                <div className={styles.formGroup}>
                  <label>Password *</label>
                  <input 
                    type="password" 
                    placeholder="Enter password"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    required 
                  />
                </div>
              )}
              <div className={styles.formGroup}>
                <label>Role *</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="ADMIN">👑 ADMIN</option>
                  <option value="CASHIER">💰 CASHIER</option>
                </select>
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
      {detailUser && (
        <div className={styles.modalOverlay} onClick={() => setDetailUser(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>👤 User Details</h3>
              <button className={styles.modalClose} onClick={() => setDetailUser(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.detailAvatar}>
                <div className={styles.detailAvatarCircle} style={{ background: detailUser.role === "ADMIN" ? "#3498db" : "#2ecc71" }}>
                  {getInitials(detailUser.name)}
                </div>
              </div>
              <div className={styles.detailInfo}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Full Name:</span>
                  <span className={styles.detailValue}>{detailUser.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{detailUser.email}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Role:</span>
                  <span className={styles.detailValue}>{getRoleBadge(detailUser.role)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Status:</span>
                  <span className={styles.detailValue}>
                    <span className={`${styles.statusBadge} ${detailUser.isActive ? styles.statusActive : styles.statusInactive}`}>
                      {detailUser.isActive ? "🟢 Active" : "🔴 Inactive"}
                    </span>
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Last Login:</span>
                  <span className={styles.detailValue}>{formatDateTime(detailUser.lastLogin)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Joined:</span>
                  <span className={styles.detailValue}>{formatDateTime(detailUser.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setDetailUser(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;