import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/dashboard.module.css";

function Dashboard() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);

  const recentOrders = [
    { id: "ORD-0021", items: "Iced Mocha x2, Croissant x1", total: 9500, time: "10 mins ago", status: "Pending" },
    { id: "ORD-0020", items: "Cappuccino x1", total: 2800, time: "25 mins ago", status: "Completed" },
    { id: "ORD-0019", items: "Hot Chocolate x1, Espresso x2", total: 7000, time: "1 hour ago", status: "Completed" },
  ];

  return (
    <div className={`${styles.dashboardLayout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <h2 className={styles.pageTitle}>Dashboard Overview</h2>
          </div>
          <div className={styles.headerInfo}>
            <span><i className="fa-solid fa-location-dot"></i> Mandalay</span>
            <i className={`fa-regular fa-bell ${styles.noti}`}></i>
          </div>
        </header>

        <div className={styles.analyticsGrid}>
          <div className={styles.analyticCard}>
            <div className={styles.cardInfo}>
              <h3>Today's Sales</h3>
              <p>245,000 Ks</p>
            </div>
            <div className={`${styles.cardIcon} ${styles.iconSales}`}>
              <i className="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>
          {/* Add more analyticCards here... */}
        </div>

        <div className={styles.dashboardGridLower}>
          <div className={styles.tableContainer}>
            <h3>Recent Live Orders</h3>
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.items}</td>
                    <td>{order.total.toLocaleString()} Ks</td>
                    <td>
                      <span className={`${styles.statusBadge} ${order.status === "Completed" ? styles.statusCompleted : styles.statusPending}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;