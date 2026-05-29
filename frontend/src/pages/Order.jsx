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

  useEffect(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateOrderStatus({ id, status })).unwrap();
    } catch (error) {
      alert("Failed to update status!");
      dispatch(fetchAllOrders()); // အမှားဖြစ်ရင် data ကို refresh ပြန်လုပ်ပေးပါ
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
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.invoiceNo}</td>
                    <td>{order.totalAmount.toLocaleString()} Ks</td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={order.paymentStatus} 
                        onChange={(e) => handlePaymentChange(order.id, e.target.value)}
                      >
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
    </div>
  );
}

export default Order;