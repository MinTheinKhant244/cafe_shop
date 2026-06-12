import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { selectUserRole, logout } from "../features/auth/authSlice";
import { sidebarItems } from "../config/sidebarItems";
import styles from "../assets/css/sidebar.module.css";
import { toggleSidebar } from "../app/uiSlice";
import { useState, useEffect } from "react";

function Sidebar() {
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userRole = useSelector(selectUserRole);
  const normalizedRole = userRole ? userRole.toUpperCase() : "CASHIER";

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Close sidebar on mobile mode
      if (mobile && isExpanded) {
        dispatch(toggleSidebar());
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [dispatch, isExpanded]);

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    if (isMobile) {
      dispatch(toggleSidebar());
    }
  };

  // Filter menu items based on user role
  const allowedMenus = sidebarItems.filter(item => 
    item.roles.includes(normalizedRole)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isExpanded && (
        <div className={styles.overlay} onClick={() => dispatch(toggleSidebar())} />
      )}
      
      <aside className={`${styles.sidebar} ${isExpanded ? styles.expanded : ""} ${isMobile ? styles.mobile : ""}`}>
        {/* Brand Section */}
        <div className={styles.sidebarBrand}>
          <div className={styles.logoWrapper}>
            <i className="fa-solid fa-mug-hot" style={{ color: "var(--enjoy-primary)", fontSize: "1.6rem" }}></i>
          </div>
          {isExpanded && (
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>Enjoy Cafe</span>
              <span className={styles.brandSubtitle}>Restaurant POS</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <ul className={styles.sidebarMenu}>
          {allowedMenus.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.title} className={isActive ? styles.active : ""}>
                <Link to={item.path} onClick={handleLinkClick}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  {isExpanded && <span className={styles.menuText}>{item.title}</span>}
                  {isActive && isExpanded && <span className={styles.activeIndicator}></span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout Button */}
        <div className={styles.logoutSection}>
          <button 
            className={styles.logoutBtn}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            {isExpanded && <span className={styles.menuText}>Logout</span>}
          </button>
          <div className={styles.sidebarFooter}>
            {isExpanded && (
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  {normalizedRole === "ADMIN" ? "👑" : "💰"}
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.userRole}>{normalizedRole}</span>
                  <span className={styles.userStatus}>Online</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutConfirm(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <span className={styles.confirmIcon}>🚪</span>
              <h4>Logout Confirmation</h4>
            </div>
            <p>Are you sure you want to logout?</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;