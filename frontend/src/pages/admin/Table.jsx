import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllTables, addTable, updateTableStatus } from "../../features/tables/tableSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function Table() {
  const dispatch = useDispatch();
  const { list: tables, loading } = useSelector((state) => state.tables);
  const [showModal, setShowModal] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const [error, setError] = useState(""); // Error message ပြသရန်

  useEffect(() => {
    dispatch(fetchAllTables());
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); // အသစ်မထည့်ခင် အရင် error ကို ရှင်းထုတ်ခြင်း

    const result = await dispatch(addTable({ tableNo, status: "AVAILABLE" }));

    // API ကနေ Error ပြန်လာရင် (rejected)
    if (result.type === "tables/add/rejected") {
      setError(result.payload || "Could not add table. Please try again.");
    } else {
      // အောင်မြင်ရင် Modal ပိတ်၊ Input ရှင်း၊ စာရင်းပြန်ဆွဲ
      setShowModal(false);
      setTableNo("");
      dispatch(fetchAllTables());
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <header className={styles.topHeader}>
          <h2>Table Management</h2>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add New Table
          </button>
        </header>

        <div className={styles.tableContainer}>
          {loading ? (
            <p>Loading tables...</p>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Table No</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables?.map((t) => (
                  <tr key={t.id}>
                    <td>{t.tableNo}</td>
                    <td>
                      <span className={`badge ${t.status === 'AVAILABLE' ? 'bg-success' : 'bg-danger'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() =>
                          dispatch(updateTableStatus({
                            id: t.id,
                            status: t.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE'
                          }))
                        }
                      >
                        {t.status === 'AVAILABLE' ? 'Mark Occupied' : 'Mark Available'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Section */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Table</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger mb-3">{error}</div>}
                  <input
                    className="form-control"
                    placeholder="Enter Table Number (e.g. 001)"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;

