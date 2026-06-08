import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAllTables, addTable, updateTableStatus } from "../../features/tables/tableSlice";
import { toggleSidebar } from "../../app/uiSlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function Table() {
  const dispatch = useDispatch();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { list: tables, loading } = useSelector((state) => state.tables);
  const isExpanded = useSelector((state) => state.ui?.isSidebarExpanded || false);

  const [showModal, setShowModal] = useState(false);
  const [tableNo, setTableNo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    dispatch(fetchAllTables());
  }, [dispatch]);

  const filteredTables = tables?.filter((t) => {
    const matchesSearch = t.tableNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    const result = await dispatch(addTable({ tableNo, status: "AVAILABLE" }));

    if (result.type === "tables/add/rejected") {
      setError(result.payload || "Could not add table.");
    } else {
      setShowModal(false);
      setTableNo("");
      dispatch(fetchAllTables());
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
            <h2 className="mb-0">Table Management</h2>
          </div>
          
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add New Table
          </button>
        </header>

        {/* Search & Filter Section */}
        <div className="row mb-4">
          <div className="col-md-6">
            <input 
              type="text" className="form-control" placeholder="Search by table number..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
            </select>
          </div>
        </div>

        <div className={styles.tableContainer}>
          {loading ? (
            <p className="text-center mt-5">Loading tables...</p>
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
                {filteredTables?.map((t) => (
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
                        onClick={() => dispatch(updateTableStatus({
                            id: t.id,
                            status: t.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE'
                        }))}
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

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Table</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <input
                    className="form-control"
                    placeholder="Enter Table Number"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                  <button type="submit" className="btn btn-primary">Save Table</button>
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