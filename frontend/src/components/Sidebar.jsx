import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { selectUserRole, logout } from "../features/auth/authSlice";
import { sidebarItems } from "../config/sidebarItems";
import styles from "../assets/css/sidebar.module.css";
import { toggleSidebar } from "../app/uiSlice";
import { useState, useEffect, useCallback } from "react";

function Sidebar() {
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const userRole = useSelector(selectUserRole);
  const normalizedRole = userRole ? userRole.toUpperCase() : "CASHIER";

  // ============================================
  // CHECK MOBILE SCREEN SIZE - NO AUTO-CLOSE
  // ============================================
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // ✅ Empty dependency - only runs once

  // ============================================
  // CLOSE SIDEBAR ON MOBILE LINK CLICK
  // ============================================
  const handleLinkClick = useCallback(() => {
    if (isMobile && isExpanded) {
      dispatch(toggleSidebar());
    }
  }, [isMobile, isExpanded, dispatch]);

  // ============================================
  // CLOSE SIDEBAR ON OVERLAY CLICK
  // ============================================
  const handleOverlayClick = useCallback(() => {
    if (isMobile && isExpanded) {
      dispatch(toggleSidebar());
    }
  }, [isMobile, isExpanded, dispatch]);

  // ============================================
  // HANDLE LOGOUT
  // ============================================
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/login");
    if (isMobile && isExpanded) {
      dispatch(toggleSidebar());
    }
  }, [dispatch, navigate, isMobile, isExpanded]);

  // ============================================
  // CLOSE LOGOUT CONFIRM MODAL
  // ============================================
  const handleCloseConfirm = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  // ============================================
  // FILTER MENU ITEMS BY ROLE
  // ============================================
  const allowedMenus = sidebarItems.filter(item => 
    item.roles.includes(normalizedRole)
  );

  return (
    <>
      {/* ============================================ */}
      {/* MOBILE OVERLAY */}
      {/* ============================================ */}
      {isMobile && isExpanded && (
        <div 
          className={styles.overlay} 
          onClick={handleOverlayClick}
          role="button"
          aria-label="Close sidebar"
        />
      )}
      
      {/* ============================================ */}
      {/* SIDEBAR */}
      {/* ============================================ */}
      <aside 
        className={`${styles.sidebar} ${isExpanded ? styles.expanded : ""} ${isMobile ? styles.mobile : ""}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* ========================================== */}
        {/* BRAND SECTION - FIXED AT TOP */}
        {/* ========================================== */}
        <div className={styles.sidebarBrand}>
          <div className={styles.logoWrapper}>
            <i 
              className="fa-solid fa-mug-hot" 
              style={{ color: "#f3a807", fontSize: "1.6rem" }}
              aria-hidden="true"
            />
          </div>
          {isExpanded && (
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>Enjoy Cafe</span>
              <span className={styles.brandSubtitle}>Cafe POS</span>
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* MENU CONTAINER - SCROLLABLE AREA */}
        {/* ========================================== */}
        <div className={styles.menuContainer}>
          <ul className={styles.sidebarMenu}>
            {allowedMenus.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li 
                  key={item.title} 
                  className={isActive ? styles.active : ""}
                >
                  <Link 
                    to={item.path} 
                    onClick={handleLinkClick}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <i 
                      className={`fa-solid ${item.icon}`}
                      aria-hidden="true"
                    />
                    {isExpanded && (
                      <span className={styles.menuText}>{item.title}</span>
                    )}
                    {isActive && isExpanded && (
                      <span 
                        className={styles.activeIndicator}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ========================================== */}
        {/* LOGOUT SECTION - FIXED AT BOTTOM */}
        {/* ========================================== */}
        <div className={styles.logoutSection}>
          <button 
            className={styles.logoutBtn}
            onClick={() => setShowLogoutConfirm(true)}
            aria-label="Logout"
          >
            <i 
              className="fa-solid fa-right-from-bracket"
              aria-hidden="true"
            />
            {isExpanded && <span className={styles.menuText}>Logout</span>}
          </button>
          
          {/* User Info - Only shows when expanded */}
          {isExpanded && (
            <div className={styles.sidebarFooter}>
              <div className={styles.userInfo}>
                <div 
                  className={styles.userAvatar}
                  aria-hidden="true"
                >
                  {normalizedRole === "ADMIN" ? "👑" : "💰"}
                </div>
                <div className={styles.userDetails}>
                  <span className={styles.userRole}>{normalizedRole}</span>
                  <span className={styles.userStatus}>
                    <span 
                      style={{ 
                        display: "inline-block", 
                        width: "8px", 
                        height: "8px", 
                        background: "#2ecc71", 
                        borderRadius: "50%",
                        marginRight: "4px"
                      }}
                      aria-hidden="true"
                    />
                    Online
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================ */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showLogoutConfirm && (
        <div 
          className={styles.modalOverlay} 
          onClick={handleCloseConfirm}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
        >
          <div 
            className={styles.confirmModal} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.confirmHeader}>
              <span 
                className={styles.confirmIcon}
                aria-hidden="true"
              >
                🚪
              </span>
              <h4 id="logout-title">Logout Confirmation</h4>
            </div>
            <p>Are you sure you want to logout?</p>
            <div className={styles.confirmActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={handleCloseConfirm}
                type="button"
              >
                Cancel
              </button>
              <button 
                className={styles.confirmBtn} 
                onClick={handleLogout}
                type="button"
                autoFocus
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;