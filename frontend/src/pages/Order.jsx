import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../app/uiSlice";
import { fetchAllOrders, updateOrderStatus, updatePaymentStatus } from "../features/orders/orderSlice";
import Sidebar from "../components/Sidebar";
import styles from "../assets/css/menuItem.module.css";

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
    } catch (error) {
      alert("Failed to update status!");
    }
  };

  const handlePaymentChange = async (id, paymentStatus) => {
    try {
      await dispatch(updatePaymentStatus({ id, paymentStatus })).unwrap();
      dispatch(fetchAllOrders());
    } catch (error) {
      alert("Failed to update payment!");
    }
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        
        {/* Header Section */}
        <header className={`${styles.topHeader} d-flex align-items-center mb-4 justify-content-between`}>
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-light shadow-sm me-3 d-flex align-items-center justify-content-center" 
              onClick={() => dispatch(toggleSidebar())}
              style={{ width: "40px", height: "40px", borderRadius: "8px", border: "1px solid #dee2e6" }}
            >
              ☰
            </button>
            <h2 className="mb-0">Order Management</h2>
          </div>
        </header>

        {/* Filter Section */}
        <div className="row mb-4 g-2">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Search Invoice..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="date" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="PENDING">PENDING</option>
              <option value="PREPARING">PREPARING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">All Payment</option>
              <option value="UNPAID">UNPAID</option>
              <option value="PAID">PAID</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className="text-center p-5">Loading Orders...</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order) => (
                  <tr key={order.id}>
                    <td onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}>
                      {order.invoiceNo}
                    </td>
                    <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}</td>
                    <td>{order.totalAmount?.toLocaleString()} Ks</td>
                    <td>
                      <select className="form-select form-select-sm" value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}>
                        <option value="PENDING">PENDING</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td>
                      <select className="form-select form-select-sm" value={order.paymentStatus} onChange={(e) => handlePaymentChange(order.id, e.target.value)}>
                        <option value="UNPAID">UNPAID</option>
                        <option value="PAID">PAID</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Order Details: {selectedOrder.invoiceNo}</h5>
                <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Table:</strong> {selectedOrder.table?.tableNo || "N/A"}</p>
                <p><strong>Total Amount:</strong> {selectedOrder.totalAmount?.toLocaleString()} Ks</p>
                <hr />
                <h6>Items:</h6>
                <ul>
                  {selectedOrder.orderItems?.map((item) => (
                    <li key={item.id}>
                      {item.product?.name} (x{item.quantity}) - {item.price} Ks
                    </li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Order;