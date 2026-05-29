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
  
  // Detail Modal အတွက် State
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
    } catch (error) {
      alert("Failed to update status!");
      dispatch(fetchAllOrders());
    }
  };

  const handlePaymentChange = async (id, paymentStatus) => {
    try {
      await dispatch(updatePaymentStatus({ id, paymentStatus })).unwrap();
    } catch (error) {
      alert("Failed to update payment!");
      dispatch(fetchAllOrders());
    }
  };

  return (
    <div className={`${styles.layout} ${isExpanded ? styles.sidebarExpanded : ""}`}>
      <Sidebar />
      <div className={styles.mainContent}>
        <button className={styles.toggleBtn} onClick={() => dispatch(toggleSidebar())}>
          <i className="fa-solid fa-bars"></i>
        </button>

        <header className={styles.topHeader}>
          <h2>Order Management</h2>
        </header>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className="text-center p-5">Loading Orders...</div>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id}>
                    {/* Invoice No ကို နှိပ်ပြီး အသေးစိတ်ကြည့်ရန် */}
                    <td onClick={() => setSelectedOrder(order)} style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}>
                      {order.invoiceNo}
                    </td>
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

      {/* Modal Section */}
      {selectedOrder && (
        <div className="modal-overlay" style={modalOverlayStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <div className="d-flex justify-content-between">
              <h3>Order: {selectedOrder.invoiceNo}</h3>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}></button>
            </div>
            <p><strong>Table:</strong> {selectedOrder.table?.tableNo}</p>
            <p><strong>Total:</strong> {selectedOrder.totalAmount?.toLocaleString()} Ks</p>
            <hr />
            <h5>Items:</h5>
            <ul>
              {selectedOrder.orderItems?.map((item) => (
                <li key={item.id}>
                  {item.product?.name} (x{item.quantity}) - {item.price} Ks
                </li>
              ))}
            </ul>
            <button className="btn btn-secondary w-100" onClick={() => setSelectedOrder(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Styles များ (CSS သီးသန့်မခွဲချင်ပါကသုံးနိုင်သည်)
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 };
const modalContentStyle = { background: "white", padding: "20px", borderRadius: "10px", width: "400px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" };

export default Order;