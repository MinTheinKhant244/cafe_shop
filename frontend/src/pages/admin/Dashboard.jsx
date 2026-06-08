import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../features/dashboard/DashboardSlice";
import { toggleSidebar } from "../../app/uiSlice"; 
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import styles from "../../assets/css/menuItem.module.css";

function Dashboard() {
  const dispatch = useDispatch();
  const { summary, trend, popular, loading, error } = useSelector((state) => state.dashboard);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Loading State
  if (loading) return <div className="p-5 text-center"><h3>Loading Dashboard...</h3></div>;

  // Error State
  if (error) return (
    <div className="p-5 text-center text-danger">
      <h3>Error: {error}</h3>
      <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        <header className={`${styles.topHeader} d-flex align-items-center mb-4`}>
          {/* Menu Toggle Button - Modern Style */}
          <button 
            className="btn btn-light shadow-sm me-3 d-flex align-items-center justify-content-center" 
            onClick={() => dispatch(toggleSidebar())}
            style={{ 
                width: "40px", 
                height: "40px", 
                borderRadius: "8px", 
                border: "1px solid #dee2e6" 
            }}
          >
            ☰
          </button>
          <h2 className="mb-0">Dashboard Overview</h2>
        </header>

        {/* Summary Cards */}
        <div className="row mb-4">
          {[
            { title: "Revenue", val: (summary?.totalRevenue || 0) + " Ks", col: "bg-primary" },
            { title: "Orders", val: summary?.totalOrders || 0, col: "bg-success" },
            { title: "Tables", val: summary?.activeTables || 0, col: "bg-warning" },
            { title: "Pending", val: summary?.pendingOrders || 0, col: "bg-danger" }
          ].map((item, i) => (
            <div className="col-md-3" key={i}>
              <div className={`card text-white ${item.col} p-3 shadow-sm border-0`}>
                <h6 className="mb-1">{item.title}</h6>
                <h3 className="mb-0">{item.val}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="row">
          <div className="col-md-8">
            <div className="card p-3 shadow-sm border-0">
              <h5 className="mb-3">Sales Trend (Last 7 Days)</h5>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" /> 
                  <YAxis /> 
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#007bff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card p-3 shadow-sm border-0">
              <h5 className="mb-3">Top 5 Products</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popular}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" /> 
                  <Tooltip />
                  <Bar dataKey="total_sold" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;