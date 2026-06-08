import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser, selectLoading, selectError, selectAuth, selectUserRole, clearError } from "../features/auth/authSlice";
import styles from "../assets/css/login.module.css"; 

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux States
  const isLoading = useSelector(selectLoading);
  const loginError = useSelector(selectError);
  const isAuthenticated = useSelector(selectAuth); 
  const userRole = useSelector(selectUserRole);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const normalizedRole = userRole.toUpperCase();

      if (normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN") {
        navigate("/admin/dashboard"); 
      } else {
        navigate("/cashier"); // Default fallback route
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className={`vw-100 vh-100 d-flex justify-content-center align-items-center position-relative ${styles.loginContainer}`}>
      <div className={`position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-75 ${styles.overlay}`}></div>

      <div className="position-relative z-3 w-100 px-4" style={{ maxWidth: "420px" }}>
        
        {/* Logo Section */}
        <div className="text-center mb-4">
          <div className="d-flex flex-column align-items-center">
            <svg viewBox="0 0 100 60" width="80" height="50">
              <path 
                d="M 20 45 A 15 15 0 0 1 30 20 A 20 20 0 0 1 70 20 A 15 15 0 0 1 80 45 Z" 
                fill="none" 
                stroke="#f3a807" 
                strokeWidth="6" 
                strokeLinecap="round"
              />
            </svg>
            <h1 className="fw-bold m-0" style={{ color: "#f3a807", fontSize: "2.5rem", letterSpacing: "1px" }}>enjoy</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          
          {/* Error Feedback Display */}
          {loginError && (
            <div className="alert alert-danger py-2 px-3 text-center small rounded-1 border-0" role="alert" style={{ fontSize: "0.85rem" }}>
              {typeof loginError === "string" ? loginError : "Login failed. Please try again."}
            </div>
          )}

          {/* Email Input */}
          <div className="text-start">
            <label htmlFor="email" className="text-white form-label small mb-1">Email</label>
            <input
              type="email"
              id="email"
              className="form-control rounded-1 border-0 py-2 text-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div className="text-start">
            <label htmlFor="password" className="text-white form-label small mb-1">Password</label>
            <div className="input-group">
              <input
                // type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control rounded-1 border-0 py-2 text-dark ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              
            </div>
          </div>

          {/* Log In Button */}
          <button 
            type="submit" 
            className="btn fw-bold w-100 py-2 mt-2 border-0 rounded-1 d-flex justify-content-center align-items-center" 
            style={{ backgroundColor: "#f3a807", color: "#000000", zIndex: 4 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              "Log In"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;