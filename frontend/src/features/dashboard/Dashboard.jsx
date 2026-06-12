import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardData } from "../../features/dashboard/DashboardSlice";
import { toggleSidebar } from "../../app/uiSlice"; 
import Sidebar from "../../components/Sidebar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from "../../assets/css/dashboard.module.css";

function Dashboard() {
  const dispatch = useDispatch();
  const { summary, trend, popular, loading, error } = useSelector((state) => state.dashboard);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Chart colors
  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];

  // Loading State
  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading Dashboard...</p>
    </div>
  );

  // Error State
  if (error) return (
    <div className={styles.errorContainer}>
      <span className={styles.errorIcon}>⚠️</span>
      <h3>Error: {error}</h3>
      <button className={styles.retryBtn} onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const summaryCards = [
    { title: "Total Revenue", value: (summary?.totalRevenue || 0).toLocaleString() + " Ks", icon: "💰", color: "primary", trend: "+12.5%" },
    { title: "Total Orders", value: summary?.totalOrders || 0, icon: "📋", color: "success", trend: "+8.2%" },
    { title: "Active Tables", value: summary?.activeTables || 0, icon: "🪑", color: "warning", trend: "+5.1%" },
    { title: "Pending Orders", value: summary?.pendingOrders || 0, icon: "⏳", color: "danger", trend: "-3.4%" }
  ];

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
            <div>
              <h1 className={styles.pageTitle}>Dashboard</h1>
              <p className={styles.pageSubtitle}>Welcome back! Here's what's happening with your restaurant today.</p>
            </div>
          </div>
          <div className={styles.dateBadge}>
            <span className={styles.dateIcon}>📅</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          {summaryCards.map((card, index) => (
            <div key={index} className={`${styles.summaryCard} ${styles[card.color]}`}>
              <div className={styles.cardIcon}>{card.icon}</div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <div className={styles.cardValue}>{card.value}</div>
                <div className={styles.cardTrend}>
                  <span className={card.trend.startsWith('+') ? styles.trendUp : styles.trendDown}>
                    {card.trend}
                  </span>
                  <span className={styles.trendLabel}>vs last week</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Sales Trend Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h3>📈 Sales Trend</h3>
                <p>Revenue overview for the last 7 days</p>
              </div>
              <div className={styles.periodButtons}>
                <button className={`${styles.periodBtn} ${selectedPeriod === "week" ? styles.active : ""}`} onClick={() => setSelectedPeriod("week")}>Week</button>
                <button className={`${styles.periodBtn} ${selectedPeriod === "month" ? styles.active : ""}`} onClick={() => setSelectedPeriod("month")}>Month</button>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" stroke="#6c757d" />
                  <YAxis stroke="#6c757d" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value.toLocaleString()} Ks`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3498db" strokeWidth={3} dot={{ fill: '#3498db', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>🏆 Top Selling Products</h3>
              <p>Most popular items this month</p>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={popular} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis type="number" stroke="#6c757d" />
                  <YAxis type="category" dataKey="name" stroke="#6c757d" width={70} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                    formatter={(value) => [`${value} units`, 'Sold']}
                  />
                  <Bar dataKey="total_sold" fill="#2ecc71" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <span className={styles.statsIcon}>🔄</span>
              <h4>Recent Activity</h4>
            </div>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <p>New order #INV-001 received</p>
                  <span>2 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <p>Table #4 status changed to Occupied</p>
                  <span>15 minutes ago</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <p>Payment received for order #INV-099</p>
                  <span>1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <span className={styles.statsIcon}>📊</span>
              <h4>Quick Stats</h4>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Average Order Value</span>
                  <span className={styles.quickStatValue}>{((summary?.totalRevenue || 0) / (summary?.totalOrders || 1)).toLocaleString()} Ks</span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Completion Rate</span>
                  <span className={styles.quickStatValue}>
                    {Math.round(((summary?.totalOrders - summary?.pendingOrders) / (summary?.totalOrders || 1)) * 100)}%
                  </span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Table Occupancy</span>
                  <span className={styles.quickStatValue}>
                    {Math.round((summary?.activeTables / (summary?.totalTables || 10)) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;