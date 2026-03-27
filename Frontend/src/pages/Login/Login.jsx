import { useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import {
  MessageCircleIcon,
  MailIcon,
  LoaderIcon,
  LockIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    login(loginData);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <div className="login-content">

          {/* LEFT SIDE */}
          <div className="login-left">
            <div className="form-box">

              <div className="form-heading">
                <MessageCircleIcon className="heading-icon" />
                <h2>Welcome Back</h2>
                <p>Login to access your account</p>
              </div>

              <form onSubmit={handleLogin} className="login-form">

                {/* EMAIL */}
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <MailIcon className="input-icon" />
                    <input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      placeholder="johndoe@gmail.com"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <LockIcon className="input-icon" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter your password"
                    />

                    <span
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <LoaderIcon className="loader" />
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* SIGNUP LINK */}
              <div className="signup-link">
                <p>Don't have an account?</p>
                <Link to="/signup" className="register-link">
                  Signup
                </Link>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="login-right">
            <div className="logo-box">
              <img
                src="/logo2.png"
                alt="App Logo"
                className="app-logo"
              />
            </div>

            <div className="content-login">
              <h2>Welcome to Chatify</h2>
              <p>Connect with your friends anytime, anywhere!</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;