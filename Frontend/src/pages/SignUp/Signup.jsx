import { useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import {
  MessageCircleIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  LoaderIcon,
} from "lucide-react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Signup.css";

function SignUpPage() {
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const { signup, isSigningUp } = useAuthStore();

  const handleSignup = (e) => {
    e.preventDefault();
    signup(signupData);
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <div className="signup-content">

          {/* LEFT SIDE */}
          <div className="signup-left">
            <div className="form-box">
              <div className="mobile-brand">
                <div className="mobile-brand-mark">
                  <img src="/logo2.png" alt="Chatify" className="mobile-brand-logo" />
                </div>
                <div className="mobile-brand-copy">
                  <span className="mobile-brand-title">Chatify</span>
                  <span className="mobile-brand-text">Create your space and start chatting</span>
                </div>
              </div>

              <div className="form-heading">
                <MessageCircleIcon className="heading-icon" />
                <h2>Create Account</h2>
                <p>Sign up for a new account</p>
              </div>

              <form onSubmit={handleSignup} className="signup-form">

                {/* USERNAME */}
                <div className="form-group">
                  <label>User Name</label>
                  <div className="input-wrapper">
                    <UserIcon className="input-icon" />
                    <input
                      type="text"
                      required
                      value={signupData.username}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          username: e.target.value,
                        })
                      }
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* EMAIL */}
                <div className="form-group">
                  <label>Email</label>
                  <div className="input-wrapper">
                    <MailIcon className="input-icon" />
                    <input
                      type="email"
                      required
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          email: e.target.value,
                        })
                      }
                      placeholder="johndoe@gmail.com"
                    />
                  </div>
                </div>

                {/* PASSWORD WITH EYE */}
                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper password-wrapper">
                    <LockIcon className="input-icon" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({
                          ...signupData,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter your password"
                    />

                    {/* EYE ICON */}
                    <span
                      className="eye-icon"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSigningUp}
                >
                  {isSigningUp ? (
                    <LoaderIcon className="loader" />
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* LOGIN LINK */}
              <div className="login-link">
                <Link to="/login">Login</Link>
              </div>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="signup-right">
            <div className="image-box">
              <img src="/logo2.png" alt="Signup Illustration" />
            </div>

            <div className="image-text">
              <div className="content-signup">
                <h3>Start Your Journey Today</h3>
                <div className="badges">
                  <span className="badge">Free</span>
                  <span className="badge">Easy Setup</span>
                  <span className="badge">Private</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
