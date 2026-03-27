import React from "react";
import "./UsersLoadingSkeleton.css";

function UsersLoadingSkeleton() {
   return (
    <div className="middle-skeletonLoad">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="chat-itemLoad">
          <div className="chat-avatarLoad"></div>

          <div className="chat-textLoad">
            <div className="chat-nameLoadLoad"></div>
            <div className="chat-messageLoad"></div>
          </div>
        </div>
      ))}
    </div>
  );
   
   
  
}

export default UsersLoadingSkeleton;