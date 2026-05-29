import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../app/uiSlice";
import {
  fetchAllProducts,
  addProduct,
  updateProduct,
  deactivateProduct,
  activateProduct,
} from "../../features/products/productSLice";
import { fetchAllCategories } from "../../features/categories/categorySlice";
import Sidebar from "../../components/Sidebar";
import styles from "../../assets/css/menuItem.module.css";

function MenuItem() {
  const dispatch = useDispatch();

  const isExpanded = useSelector(
    (state) => state.ui?.isSidebarExpanded
  );

  const { list: products, loading } = useSelector(
    (state) => state.products
  );

  const { list: categories } = useSelector(
    (state) => state.categories
  );

  const [showModal, setShowModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    price: "",
    description: "",
    categoryId: "",
    isActive: "true",
    imagePath: "",
    imageFile: null,
  });

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();

    const data = new FormData();

    data.append("name", formData.name);
    data.append("price", formData.price);
    data.append("description", formData.description);

    // FIXED
    data.append("categoryId", formData.categoryId);

    data.append("isActive", formData.isActive);

    if (formData.imageFile) {
      data.append("imageFile", formData.imageFile);
    }

    try {
      if (isEditing) {
        await dispatch(
          updateProduct({
            id: formData.id,
            formData: data,
          })
        ).unwrap();
      } else {
        await dispatch(addProduct(data)).unwrap();
      }

      setShowModal(false);

      dispatch(fetchAllProducts());
    } catch (error) {
      console.error(error);
      alert("Error saving menu item!");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      item.isActive
        ? await dispatch(
            deactivateProduct(item.id)
          ).unwrap()
        : await dispatch(
            activateProduct(item.id)
          ).unwrap();

      dispatch(fetchAllProducts());
    } catch (error) {
      console.error(error);
      alert("Error updating status!");
    }
  };

  return (
    <div
      className={`${styles.layout} ${
        isExpanded ? styles.sidebarExpanded : ""
      }`}
    >
      <Sidebar />

      <div className={styles.mainContent}>
        <button
          className={styles.toggleBtn}
          onClick={() => dispatch(toggleSidebar())}
        >
          <i className="fa-solid fa-bars"></i>
        </button>

        <header className={styles.topHeader}>
          <h2>Menu Items Management</h2>

          <button
            className={styles.addBtn}
            onClick={() => {
              setFormData({
                id: null,
                name: "",
                price: "",
                description: "",
                categoryId: "",
                isActive: "true",
                imagePath: "",
                imageFile: null,
              });

              setIsEditing(false);

              setShowModal(true);
            }}
          >
            + Add New Item
          </button>
        </header>

        <div className={styles.tableContainer}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className={styles.adminTable}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img
                        src={`http://localhost:8080/uploads/${item.imagePath}`}
                        alt={item.name}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "5px",
                        }}
                      />
                    </td>

                    <td>{item.name}</td>

                    <td>{item.category?.name}</td>

                    <td>{item.price} Ks</td>

                    <td>
                      <span
                        className={
                          item.isActive
                            ? "badge bg-success"
                            : "badge bg-secondary"
                        }
                      >
                        {item.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td className={styles.actionCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => {
                          setFormData({
                            id: item.id,
                            name: item.name || "",
                            price: item.price || "",
                            description:
                              item.description || "",

                            // FIXED
                            categoryId:
                              item.category?.id || "",

                            isActive: item.isActive
                              ? "true"
                              : "false",

                            imagePath:
                              item.imagePath || "",

                            imageFile: null,
                          });

                          setIsEditing(true);

                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>

                      <button
                        className={
                          item.isActive
                            ? styles.softDeleteBtn
                            : styles.addBtn
                        }
                        onClick={() =>
                          handleToggleActive(item)
                        }
                      >
                        {item.isActive
                          ? "Deactivate"
                          : "Activate"}
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
        <div
          className="modal fade show d-block"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing
                    ? "Edit Item"
                    : "Add New Item"}
                </h5>

                <button
                  className="btn-close"
                  onClick={() =>
                    setShowModal(false)
                  }
                ></button>
              </div>

              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {/* Name */}
                  <input
                    className="form-control mb-2"
                    placeholder="Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    required
                  />

                  {/* Price */}
                  <input
                    className="form-control mb-2"
                    type="number"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value,
                      })
                    }
                    required
                  />

                  {/* Description */}
                  <textarea
                    className="form-control mb-2"
                    placeholder="Description"
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description:
                          e.target.value,
                      })
                    }
                  />

                  {/* Current Image */}
                  {isEditing &&
                    formData.imagePath && (
                      <div className="mb-2">
                        <small className="text-muted">
                          Current Image:
                        </small>

                        <br />

                        <img
                          src={`http://localhost:8080/uploads/${formData.imagePath}`}
                          alt="Current"
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "5px",
                          }}
                        />
                      </div>
                    )}

                  {/* Upload */}
                  <label className="form-label">
                    Upload Image:
                  </label>

                  <input
                    className="form-control mb-2"
                    type="file"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        imageFile:
                          e.target.files[0],
                      })
                    }
                  />

                  {/* Category */}
                  <select
                    className="form-control mb-2"
                    value={
                      formData.categoryId || ""
                    }

                    // FIXED
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryId: Number(
                          e.target.value
                        ),
                      })
                    }
                    required
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Status */}
                  <select
                    className="form-control"
                    value={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive:
                          e.target.value,
                      })
                    }
                  >
                    <option value="true">
                      Active
                    </option>

                    <option value="false">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setShowModal(false)
                    }
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {isEditing
                      ? "Update"
                      : "Save"}
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

export default MenuItem;