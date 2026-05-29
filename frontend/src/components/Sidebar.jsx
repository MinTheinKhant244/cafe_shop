import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { selectUserRole, logout } from "../features/auth/authSlice";
import styles from "../assets/css/sidebar.module.css";
import { toggleSidebar } from "../app/uiSlice";


function Sidebar() {

  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = useSelector(selectUserRole);
  const normalizedRole = userRole ? userRole.toUpperCase() : "CASHIER";

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "fa-chart-line", roles: ["ADMIN"] },
    { name: "Menu Items", path: "/admin/menu-items", icon: "fa-bowl-food", roles: ["ADMIN"] },
    { name: "Categories", path: "/admin/categories", icon: "fa-tags", roles: ["ADMIN"] },
    { name: "Orders List", path: "/orders", icon: "fa-receipt", roles: ["ADMIN", "CASHIER"] },
    { name: "Staffs Control", path: "/admin/staffs", icon: "fa-users", roles: ["ADMIN"] }
  ];

  const allowedMenus = menuItems.filter(item => item.roles.includes(normalizedRole));

  return (
    // 💡 expanded ဖြစ်နေပါက class တစ်ခု ထပ်တိုးပေးခြင်း
    <aside className={`${styles.sidebar} ${isExpanded ? styles.expanded : ""}`}>
      <div className={styles.sidebarBrand}>
        <i className="fa-solid fa-mug-hot" style={{ color: "var(--enjoy-primary)", fontSize: "1.6rem" }}></i>
        {isExpanded && <span className={styles.brandName}>Enjoy Cafe</span>}
      </div>

      <ul className={styles.sidebarMenu}>
        {allowedMenus.map((menu) => {
          const isActive = location.pathname === menu.path ? styles.active : "";
          return (
            <li key={menu.name} className={isActive}>
              <Link to={menu.path}>
                <i className={`fa-solid ${menu.icon}`}></i>
                {/* 💡 Sidebar ချဲ့ထားမှသာ Menu နာမည် စာသားပြမည် */}
                {isExpanded && <span className={styles.menuText}>{menu.name}</span>}
              </Link>
            </li>
          );
        })}

        <li className={styles.logoutBtn}>
          <button onClick={() => { dispatch(logout()); navigate("/login"); }}>
            <i className="fa-solid fa-right-from-bracket"></i>
            {isExpanded && <span className={styles.menuText}>Logout</span>}
          </button>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;