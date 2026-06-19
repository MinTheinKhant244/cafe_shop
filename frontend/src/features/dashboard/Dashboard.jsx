// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboardSummary } from "../../features/dashboard/dashboardSlice";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from "../../assets/css/dashboard.module.css";

function Dashboard() {
  const dispatch = useDispatch();
  const { summary, loading, error, lastUpdated } = useSelector((state) => state.dashboard);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const [selectedPeriod, setSelectedPeriod] = useState("week");

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  // Chart colors
  const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#e67e22', '#2c3e50'];

  // Loading State
  if (loading && !summary) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={() => dispatch(fetchDashboardSummary())}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // Format data for charts
  const todayStats = summary?.todayStats || {};
  const weeklyStats = summary?.weeklyStats || {};
  const monthlyStats = summary?.monthlyStats || {};
  const overallStats = summary?.overallStats || {};
  const recentOrders = summary?.recentOrders || [];
  const topProducts = summary?.topProducts || [];
  const salesTrend = summary?.salesTrend || [];
  const lowStockItems = summary?.lowStockItems || [];

  // Summary Cards
  const summaryCards = [
    {
      title: "Today's Revenue",
      value: (todayStats?.totalRevenue || 0).toLocaleString() + " Ks",
      icon: "💰",
      color: "primary",
      subtitle: `${todayStats?.totalOrders || 0} orders today`
    },
    {
      title: "Today's Orders",
      value: todayStats?.totalOrders || 0,
      icon: "📋",
      color: "success",
      subtitle: `${todayStats?.pendingOrders || 0} pending`
    },
    {
      title: "Active Tables",
      value: summary?.activeTables || 0,
      icon: "🪑",
      color: "warning",
      subtitle: `${summary?.availableTables || 0} available / ${summary?.totalTables || 0} total`
    },
    {
      title: "Pending Orders",
      value: todayStats?.pendingOrders || 0,
      icon: "⏳",
      color: "danger",
      subtitle: `${todayStats?.preparingOrders || 0} preparing`
    }
  ];

  // Sales Trend Data
  const trendData = salesTrend.map(item => ({
    date: item[0] || '',
    revenue: item[1] || 0,
    orders: item[2] || 0,
    avgOrder: item[3] || 0
  }));

  // Top Products Data
  const productData = topProducts.map(item => ({
    name: item[1] || 'Unknown',
    category: item[2] || 'Uncategorized',
    total_sold: item[3] || 0,
    revenue: item[4] || 0
  }));

  // Order Source Data for Pie Chart
  const orderSourceData = [
    { name: 'Dine In', value: todayStats?.dineInOrders || 0 },
    { name: 'Takeaway', value: todayStats?.takeawayOrders || 0 },
    { name: 'Delivery', value: todayStats?.deliveryOrders || 0 }
  ].filter(item => item.value > 0);

  // Status Distribution
  const statusData = [
    { name: 'Pending', value: todayStats?.pendingOrders || 0 },
    { name: 'Preparing', value: todayStats?.preparingOrders || 0 },
    { name: 'Completed', value: todayStats?.completedOrders || 0 },
    { name: 'Cancelled', value: todayStats?.cancelledOrders || 0 }
  ].filter(item => item.value > 0);

  // Format Recent Orders
  const formattedRecentOrders = recentOrders.map(order => {
    if (Array.isArray(order)) {
      return {
        id: order[0],
        invoiceNo: order[1] || `INV-${order[0]}`,
        orderSource: order[2] || 'N/A',
        status: order[3] || 'PENDING',
        totalAmount: order[4] || 0,
        createdAt: order[5] || ''
      };
    }
    return {
      id: order.id,
      invoiceNo: order.invoiceNo || `INV-${order.id}`,
      orderSource: order.orderSource || order.source || 'N/A',
      status: order.status || 'PENDING',
      totalAmount: order.totalAmount || order.total || 0,
      createdAt: order.createdAt || order.createdDate || ''
    };
  });

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>

        {/* Header */}
        <div className={styles.posHeader}>
          <div className={styles.headerLeft}>
            <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
              ☰
            </button>
            <div>
              <h1 className={styles.pageTitle}>📊 Dashboard</h1>
              <p className={styles.pageSubtitle}>
                Welcome back! Here's what's happening with your restaurant today.
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.dateBadge}>
              <span className={styles.dateIcon}>📅</span>
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            {lastUpdated && (
              <div className={styles.lastUpdated}>
                <span>🕐 {new Date(lastUpdated).toLocaleTimeString()}</span>
              </div>
            )}
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
                <div className={styles.cardSubtitle}>{card.subtitle}</div>
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
                <button
                  className={`${styles.periodBtn} ${selectedPeriod === "week" ? styles.active : ""}`}
                  onClick={() => setSelectedPeriod("week")}
                >
                  Week
                </button>
                <button
                  className={`${styles.periodBtn} ${selectedPeriod === "month" ? styles.active : ""}`}
                  onClick={() => setSelectedPeriod("month")}
                >
                  Month
                </button>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6c757d" 
                    fontSize={11} 
                    tick={{ fill: '#6c757d' }}
                    tickLine={{ stroke: '#e9ecef' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#6c757d" 
                    fontSize={11}
                    tick={{ fill: '#6c757d' }}
                    tickLine={{ stroke: '#e9ecef' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    dx={-5}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }}
                    formatter={(value) => [`${value.toLocaleString()} Ks`, 'Revenue']}
                    labelStyle={{ fontWeight: 600, color: '#1a2332' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3498db"
                    strokeWidth={3}
                    dot={{ fill: '#3498db', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
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
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={productData} 
                  layout="vertical" 
                  margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis 
                    type="number" 
                    stroke="#6c757d" 
                    fontSize={11}
                    tick={{ fill: '#6c757d' }}
                    tickLine={{ stroke: '#e9ecef' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    dy={10}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#6c757d" 
                    width={90}
                    fontSize={11}
                    tick={{ fill: '#6c757d' }}
                    tickLine={{ stroke: '#e9ecef' }}
                    axisLine={{ stroke: '#e9ecef' }}
                    dx={-5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      padding: '12px 16px'
                    }}
                    formatter={(value) => [`${value} units`, 'Sold']}
                    labelStyle={{ fontWeight: 600, color: '#1a2332' }}
                  />
                  <Bar dataKey="total_sold" fill="#2ecc71" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Source Distribution - FIXED */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>📊 Order Sources</h3>
              <p>Today's order distribution</p>
            </div>
            <div className={styles.chartContainer}>
              {orderSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderSourceData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => 
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {orderSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} orders`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        padding: '10px 14px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      height={40}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ 
                        fontSize: '13px', 
                        color: '#6c757d',
                        paddingTop: '8px'
                      }}
                      formatter={(value) => {
                        const item = orderSourceData.find(d => d.name === value);
                        return `${value} (${item?.value || 0})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>No orders today</div>
              )}
            </div>
          </div>

          {/* Status Distribution - FIXED */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>📊 Order Status</h3>
              <p>Current order status distribution</p>
            </div>
            <div className={styles.chartContainer}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => 
                        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} orders`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        padding: '10px 14px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      height={40}
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ 
                        fontSize: '13px', 
                        color: '#6c757d',
                        paddingTop: '8px'
                      }}
                      formatter={(value) => {
                        const item = statusData.find(d => d.name === value);
                        return `${value} (${item?.value || 0})`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>No orders</div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>

          {/* Recent Orders */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <span className={styles.statsIcon}>🔄</span>
              <h4>Recent Orders</h4>
              <span className={styles.statsBadge}>{formattedRecentOrders.length}</span>
            </div>
            <div className={styles.recentOrdersList}>
              {formattedRecentOrders.length > 0 ? (
                formattedRecentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className={styles.recentOrderItem}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderInvoice}>#{order.invoiceNo}</span>
                      <span className={styles.orderSource}>{order.orderSource}</span>
                    </div>
                    <div className={styles.orderStatus}>
                      <span className={`${styles.statusBadge} ${styles[order.status?.toLowerCase() || 'pending']}`}>
                        {order.status || 'PENDING'}
                      </span>
                      <span className={styles.orderAmount}>{order.totalAmount?.toLocaleString() || 0} Ks</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>No recent orders</div>
              )}
            </div>
          </div>

          {/* Quick Stats & Low Stock */}
          <div className={styles.statsCard}>
            <div className={styles.statsHeader}>
              <span className={styles.statsIcon}>📊</span>
              <h4>Quick Stats</h4>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Average Order Value</span>
                  <span className={styles.quickStatValue}>
                    {overallStats?.averageOrderValue?.toLocaleString() || 0} Ks
                  </span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Completion Rate</span>
                  <span className={styles.quickStatValue}>
                    {overallStats?.totalOrders > 0
                      ? Math.round(((overallStats.totalOrders - todayStats?.pendingOrders) / overallStats.totalOrders) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Sales Persons</span>
                  <span className={styles.quickStatValue}>
                    {overallStats?.totalCustomers || 0}
                  </span>
                </div>
              </div>
              <div className={styles.quickStatItem}>
                <div>
                  <span className={styles.quickStatLabel}>Low Stock Items</span>
                  <span className={`${styles.quickStatValue} ${styles.dangerText}`}>
                    {summary?.lowStockCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Stock Items */}
            {lowStockItems.length > 0 && (
              <div className={styles.lowStockSection}>
                <div className={styles.lowStockHeader}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Low Stock Alert</span>
                </div>
                <div className={styles.lowStockList}>
                  {lowStockItems.slice(0, 3).map((item, index) => (
                    <div key={index} className={styles.lowStockItem}>
                      <span>{item.name || `Item #${item.id}`}</span>
                      <span className={styles.lowStockQty}>{item.quantity} {item.unit || 'units'}</span>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <div className={styles.lowStockMore}>
                      +{lowStockItems.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;
