import React from "react";
import {
  FaComments,
  FaUsers,
  FaAddressBook,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { useNavigate, useLocation } from "react-router-dom";

import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import ProfileHeader from "../ProfileHeader/ProfileHeader";

import "./SidebarNav.css";

function SidebarNav() {
  const { activeTab, setActiveTab } = useChatStore();
  const { logout } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: "chats", icon: <FaComments /> },
    // { name: "users", icon: <FaUsers /> },
    { name: "contacts", icon: <FaAddressBook /> },
    { name: "settings", icon: <FaCog /> },
  ];

  const handleClick = (item) => {
    if (item.name === "settings") {
      navigate("/settings"); // 🔥 GO TO SETTINGS PAGE
    } else {
      setActiveTab(item.name);
      navigate("/chat"); // ensure we stay in chat page
    }
  };

  return (
    <div className="sidebar-nav">
      <ProfileHeader />

      <div className="nav-items">
        {navItems.map((item) => {
          const isActive =
            item.name === "settings"
              ? location.pathname === "/settings"
              : activeTab === item.name && location.pathname === "/chat";

          return (
            <button
              key={item.name}
              onClick={() => handleClick(item)}
              className={`nav-icon ${isActive ? "active" : ""}`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>

      <button className="nav-icon logout-btn" onClick={logout}>
        <FaSignOutAlt />
      </button>
    </div>
  );
}

export default SidebarNav;