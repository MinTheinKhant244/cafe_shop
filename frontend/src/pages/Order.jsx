import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../app/uiSlice";
import { fetchAllOrders, updateOrderStatus, updatePaymentStatus } from "../features/orders/orderSlice";
import Sidebar from "../components/Sidebar";
import styles from "../assets/css/order.module.css";

function Order() {
  const dispatch = useDispatch();
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded);
  const { list: orders, loading } = useSelector((state) => state.orders);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = order.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || order.createdAt?.startsWith(filterDate);
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesPayment = filterPayment === "all" || order.paymentStatus === filterPayment;
    return matchesSearch && matchesDate && matchesStatus && matchesPayment;
  });

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
      dispatch(fetchAllOrders());
    } catch (error) { alert("Failed to update status!"); }
  };

  const handlePaymentChange = async (id, paymentStatus) => {
    try {
      await dispatch(updatePaymentStatus({ id, paymentStatus })).unwrap();
      dispatch(fetchAllOrders());
    } catch (error) { alert("Failed to update payment!"); }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDING: { class: styles.statusPending, icon: "⏳", text: "Pending" },
      PREPARING: { class: styles.statusPreparing, icon: "🍳", text: "Preparing" },
      COMPLETED: { class: styles.statusCompleted, icon: "✅", text: "Completed" }
    };
    const s = statusMap[status] || statusMap.PENDING;
    return <span className={`${styles.statusBadge} ${s.class}`}>{s.icon} {s.text}</span>;
  };

  const getPaymentBadge = (paymentStatus) => {
    const paymentMap = {
      UNPAID: { class: styles.paymentUnpaid, icon: "❌", text: "Unpaid" },
      PAID: { class: styles.paymentPaid, icon: "💰", text: "Paid" }
    };
    const p = paymentMap[paymentStatus] || paymentMap.UNPAID;
    return <span className={`${styles.paymentBadge} ${p.class}`}>{p.icon} {p.text}</span>;
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
            <h1 className={styles.pageTitle}>📋 Order Management</h1>
          </div>
          <div className={styles.statsSummary}>
            <div className={styles.statSummaryItem}>
              <span className={styles.statSummaryValue}>{filteredOrders?.length || 0}</span>
              <span className={styles.statSummaryLabel}>Orders</span>
            </div>
            <div className={styles.statSummaryItem}>
              <span className={styles.statSummaryValue}>
                {filteredOrders?.filter(o => o.paymentStatus === "UNPAID").length || 0}
              </span>
              <span className={styles.statSummaryLabel}>Unpaid</span>
            </div>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{orders?.length || 0}</span>
            <span className={styles.statLabel}>Total Orders</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{orders?.filter(o => o.status === "PENDING").length || 0}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{orders?.filter(o => o.status === "PREPARING").length || 0}</span>
            <span className={styles.statLabel}>Preparing</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{orders?.filter(o => o.status === "COMPLETED").length || 0}</span>
            <span className={styles.statLabel}>Completed</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{orders?.filter(o => o.paymentStatus === "PAID").length || 0}</span>
            <span className={styles.statLabel}>Paid</span>
          </div>
        </div>

        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="🔍 Search by invoice number..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className={styles.filterGroup}>
            <input 
              type="date" 
              className={styles.dateInput}
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
            />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">📊 All Status</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="PREPARING">🍳 Preparing</option>
              <option value="COMPLETED">✅ Completed</option>
            </select>
            <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">💳 All Payment</option>
              <option value="UNPAID">❌ Unpaid</option>
              <option value="PAID">💰 Paid</option>
            </select>
          </div>
        </div>

        {/* Order Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>Loading Orders...</div>
          ) : filteredOrders?.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>No orders found</p>
            </div>
          ) : (
            <table className={styles.orderTable}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Table</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span 
                        className={styles.invoiceLink} 
                        onClick={() => setSelectedOrder(order)}
                      >
                        #{order.invoiceNo}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                      </span>
                      <small className={styles.timeText}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : ""}
                      </small>
                    </td>
                    <td>
                      <span className={styles.tableBadge}>
                        🪑 {order.table?.tableNo || "N/A"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountText}>
                        {order.totalAmount?.toLocaleString()} Ks
                      </span>
                    </td>
                    <td>
                      <select 
                        className={`${styles.statusSelect} ${styles[`statusSelect_${order.status}`]}`}
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="PENDING">⏳ Pending</option>
                        <option value="PREPARING">🍳 Preparing</option>
                        <option value="COMPLETED">✅ Completed</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className={`${styles.paymentSelect} ${styles[`paymentSelect_${order.paymentStatus}`]}`}
                        value={order.paymentStatus} 
                        onChange={(e) => handlePaymentChange(order.id, e.target.value)}
                      >
                        <option value="UNPAID">❌ Unpaid</option>
                        <option value="PAID">💰 Paid</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className={styles.viewBtn} 
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🧾 Invoice Details</h3>
              <button className={styles.modalClose} onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className={styles.detailContent}>
              <div className={styles.invoiceHeader}>
                <div className={styles.invoiceNumber}>
                  <span className={styles.label}>Invoice No:</span>
                  <span className={styles.value}>#{selectedOrder.invoiceNo}</span>
                </div>
                <div className={styles.invoiceDate}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
              </div>
              
              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>🪑 Table</span>
                  <span className={styles.infoValue}>{selectedOrder.table?.tableNo || "N/A"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>💰 Total Amount</span>
                  <span className={styles.infoValueAmount}>{selectedOrder.totalAmount?.toLocaleString()} Ks</span>
                </div>
              </div>

              <div className={styles.infoRow}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>📊 Status</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>💳 Payment</span>
                  {getPaymentBadge(selectedOrder.paymentStatus)}
                </div>
              </div>

              <hr className={styles.divider} />
              
              <h4 className={styles.itemsTitle}>🛍️ Order Items</h4>
              <div className={styles.itemsList}>
                <div className={styles.itemsHeader}>
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>
                {selectedOrder.orderItems?.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <span className={styles.itemName}>{item.product?.name || "N/A"}</span>
                    <span className={styles.itemQty}>x{item.quantity}</span>
                    <span className={styles.itemPrice}>{item.price?.toLocaleString()} Ks</span>
                    <span className={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()} Ks</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.totalRow}>
                <span>Grand Total</span>
                <span>{selectedOrder.totalAmount?.toLocaleString()} Ks</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.closeBtn} onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;