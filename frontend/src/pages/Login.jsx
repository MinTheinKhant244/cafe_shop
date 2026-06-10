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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const normalizedRole = userRole.toUpperCase();

      if (normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN") {
        navigate("/admin/dashboard"); 
      } else {
        navigate("/pos");
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Load saved email if remember me was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.overlay}></div>
      
      <div className={styles.loginCard}>
        
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 100 60" width="70" height="42">
              <path 
                d="M 20 45 A 15 15 0 0 1 30 20 A 20 20 0 0 1 70 20 A 15 15 0 0 1 80 45 Z" 
                fill="none" 
                stroke="#f3a807" 
                strokeWidth="5" 
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className={styles.logoText}>enjoy</h1>
          <p className={styles.logoSubtext}>Cafe Management System</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          
          {/* Error Feedback Display */}
          {loginError && (
            <div className={styles.errorAlert}>
              <span className={styles.errorIcon}>⚠️</span>
              {typeof loginError === "string" ? loginError : "Login failed. Please try again."}
            </div>
          )}

          {/* Email Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              <span className={styles.labelIcon}>📧</span> Email Address
            </label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="admin@enjoy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password Input */}
          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              <span className={styles.labelIcon}>🔒</span> Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className={styles.passwordInput}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button 
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className={styles.optionsRow}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Remember me</span>
            </label>
            {/* <a href="#" className={styles.forgotLink}>Forgot password?</a> */}
          </div>

          {/* Log In Button */}
          <button 
            type="submit" 
            className={styles.loginBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          <p>© 2024 Enjoy Restaurant. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;