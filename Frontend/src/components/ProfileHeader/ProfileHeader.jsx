import React, { useState, useRef } from 'react';
import useAuthStore from '../../store/useAuthStore';
import "./ProfileHeader.css";

function ProfileHeader() {
  const { authUser, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const fileInputRef = useRef(null);

  if (!authUser) {
    return null;
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  return (
    <div className="profile-header">
      <div className="profile-avatar">
        <div className="avatar-wrapper">
          <img
            src={selectedImg || authUser.profilePic || "/avatar.png"}
            alt="user"
            onClick={() => fileInputRef.current?.click()}
          />
          <span className="avatar-overlay">Change</span>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="file-input"
      />

      {/* <div className="user-info"> */}
        {/* <h3 className="username">{authUser.username}</h3> */}
        {/* <p className="status">online</p> */}
      {/* </div> */}
    </div>
  );
}

export default ProfileHeader;
