import React, { useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import "./Settings.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Settings = () => {
  const { authUser, updateUsername,changePassword } = useAuthStore();

  const [username, setUsername] = useState(authUser?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew] = useState(false);

  const handleUsernameUpdate = async () => {
    try {
      setLoading(true);
      await updateUsername(username);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
  try {
    setLoading(true);
    await changePassword(currentPassword, newPassword);
    
    // optional: clear fields after success
    setCurrentPassword("");
    setNewPassword("");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="settings-wrapper">

      <h2 className="settings-title">Settings</h2>

      {/* PROFILE SECTION */}
      <div className="settings-section">
        <h3>Profile</h3>

        <div className="profile-row">
          <img
            src={authUser?.profilePic || "/avatar.png"}
            alt="profile"
          />

          <div className="profile-info">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <button onClick={handleUsernameUpdate}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

  <div className="settings-section">
  <h3>Change Password</h3>

  <div className="password-fields">

    {/* CURRENT PASSWORD */}
    <div className="password-wrapper">
      <input
        type={showCurrent ? "text" : "password"}
        placeholder="Current password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="password-input"
      />

      <span
        className="toggle-icon"
        onClick={() => setShowCurrent(!showCurrent)}
        title={showCurrent ? "Hide password" : "Show password"}
      >
        {showCurrent ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>

    {/* NEW PASSWORD */}
    <div className="password-wrapper">
      <input
        type={showNew ? "text" : "password"}
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="password-input"
      />

      <span
        className="toggle-icon"
        onClick={() => setShowNew(!showNew)}
        title={showNew ? "Hide password" : "Show password"}
      >
        {showNew ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>

  </div>

  <button
  onClick={handlePasswordUpdate}
  disabled={!currentPassword || !newPassword}
>
  {loading ? "Updating..." : "Update Password"}
</button>

</div>
  
    </div>
  );
};

export default Settings;