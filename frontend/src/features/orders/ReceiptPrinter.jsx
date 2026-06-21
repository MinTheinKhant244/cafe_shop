// src/components/ReceiptPrinter.jsx
import React, { useRef } from "react";
import styles from "../../assets/css/receipt.module.css";

const ReceiptPrinter = ({ order, payment, onClose }) => {
  const receiptRef = useRef();

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "0";
    return amount.toLocaleString();
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.invoiceNo}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              background: white;
              width: 80mm;
              margin: 0 auto;
            }
            .receipt { 
              padding: 10px;
            }
            .header { 
              text-align: center;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .header h1 { 
              margin: 0;
              font-size: 18px;
            }
            .header p { 
              margin: 2px 0;
              font-size: 12px;
              color: #666;
            }
            .divider { 
              border-top: 1px dashed #ccc;
              margin: 8px 0;
            }
            .order-info { 
              font-size: 12px;
              margin-bottom: 10px;
            }
            .order-info span { 
              display: inline-block;
              margin-right: 10px;
            }
            table { 
              width: 100%;
              font-size: 12px;
              border-collapse: collapse;
            }
            th { 
              text-align: left;
              border-bottom: 1px solid #ccc;
              padding: 4px 0;
            }
            td { 
              padding: 4px 0;
            }
            .text-right { 
              text-align: right;
            }
            .total-section { 
              margin-top: 10px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            .total-row { 
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              font-weight: bold;
            }
            .payment-info { 
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
              font-size: 12px;
            }
            .footer { 
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #ccc;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.receiptModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🧾 Receipt - {order.invoiceNo}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.receiptContainer} ref={receiptRef}>
          <div className={styles.receipt}>
            {/* Header */}
            <div className={styles.header}>
              <h1>☕ Enjoy Cafe</h1>
              <p>123 Main Street, Yangon</p>
              <p>Tel: 09-123456789</p>
            </div>

            <div className={styles.divider} />

            {/* Order Info */}
            <div className={styles.orderInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Invoice:</span>
                <span className={styles.infoValue}>{order.invoiceNo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date:</span>
                <span className={styles.infoValue}>{formatDate(order.createdAt)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Cashier:</span>
                <span className={styles.infoValue}>{order.createdBy?.name || "System"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Source:</span>
                <span className={styles.infoValue}>
                  {order.orderSource === "DINE_IN"
                    ? `Table ${order.table?.tableNo || "N/A"}`
                    : order.orderSource}
                </span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Items Table */}
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th className={styles.textCenter}>Qty</th>
                  <th className={styles.textRight}>Price</th>
                  <th className={styles.textRight}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product?.name || "Unknown"}</td>
                    <td className={styles.textCenter}>{item.quantity}</td>
                    <td className={styles.textRight}>{formatCurrency(item.price)}</td>
                    <td className={styles.textRight}>
                      {formatCurrency(item.quantity * item.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.divider} />

            {/* Total Section */}
            <div className={styles.totalSection}>
              <div className={styles.totalRow}>
                <span>Subtotal:</span>
                <span>{formatCurrency(order.totalAmount)} Ks</span>
              </div>
              <div className={styles.totalRow}>
                <span>Tax (0%):</span>
                <span>{formatCurrency(order.totalAmount * 0)} Ks</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>TOTAL:</span>
                <span>{formatCurrency(order.totalAmount)} Ks</span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Payment Info */}
            <div className={styles.paymentInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Payment Method:</span>
                <span className={styles.infoValue}>
                  {payment?.method || order.paymentMethod || "CASH"}
                </span>
              </div>
              {payment?.method === "CASH" && (
                <>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Cash Received:</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(payment.cashReceived)} Ks
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Change:</span>
                    <span className={styles.infoValue}>
                      {formatCurrency(payment.changeAmount)} Ks
                    </span>
                  </div>
                </>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Payment Status:</span>
                <span className={`${styles.infoValue} ${styles.statusPaid}`}>
                  ✅ PAID
                </span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Footer */}
            <div className={styles.footer}>
              <p>Thank you for dining with us!</p>
              <p>Please come again 😊</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.receiptActions}>
          <button className={styles.printBtn} onClick={handlePrint}>
            🖨️ Print
          </button>
          <button className={styles.closeBtn} onClick={onClose}>
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPrinter;