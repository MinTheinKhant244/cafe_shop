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

  // 💡 User Role အလိုက် လမ်းကြောင်းခွဲမောင်းနှင်မှုကို ပိုမိုစိတ်ချရအောင် စီမံခြင်း
  useEffect(() => {
    if (isAuthenticated && userRole) {
      // .toUpperCase() ထည့်ထားခြင်းဖြင့် Backend က စာလုံးအသေး/အကြီး မည်သို့ပင်ပို့ပါစေ အလုပ်လုပ်မည်
      const normalizedRole = userRole.toUpperCase();

      if (normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN") {
        navigate("/admin/dashboard"); 
      } else if (normalizedRole === "CASHIER" || normalizedRole === "ROLE_CASHIER") {
        navigate("/cashier"); 
      } else {
        navigate("/cashier"); // Default fallback route
      }
    }
  }, [isAuthenticated, userRole, navigate]);

  // Component စတင်ချိန်တွင် Error ဟောင်းများအား ရှင်းလင်းခြင်း
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Form Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password, rememberMe }));
  };

  // Password Visibility Toggle
  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
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
                type={showPassword ? "text" : "password"}
                id="password"
                className={`form-control rounded-1 border-0 py-2 text-dark ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn btn-light border-0 d-flex align-items-center px-3"
                onClick={togglePasswordVisibility}
                style={{ borderRadius: "0 2px 2px 0", zIndex: 4 }}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle Switch */}
          <div className="d-flex align-items-center gap-2 mt-1">
            <div className="form-check form-switch p-0 m-0 d-flex align-items-center" style={{ zIndex: 4 }}>
              <input
                className={`form-check-input m-0 cursor-pointer ${styles.customSwitch}`}
                type="checkbox"
                role="switch"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
            </div>
            <label className="form-check-label text-secondary small user-select-none cursor-pointer" htmlFor="rememberMe" style={{ fontSize: "0.8rem" }}>
              Remember my login & password
            </label>
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

        <div className="d-flex justify-content-between mt-4 small">
          <a href="#forgot" className="text-secondary text-decoration-none">Forgot Password?</a>
          <a href="#signup" className="text-white fw-bold text-decoration-none">Sign Up</a>
        </div>

        <div className="d-flex flex-column align-items-center gap-1" style={{ marginTop: "5rem" }}>
          <a href="#contact" className="text-white fw-bold text-decoration-none small">Contact US</a>
          <span className="text-muted" style={{ fontSize: "0.75rem" }}>Ver. 3.0.4.3</span>
        </div>

      </div>
    </div>
  );
}

export default Login;