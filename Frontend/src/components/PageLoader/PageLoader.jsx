import React from "react";
import { LoaderIcon } from "lucide-react";
import "./PageLoader.css";

function PageLoader() {
  return (
    <div className="loader-container">
      <LoaderIcon className="spin-icon" size={40} />
    </div>
  );
}

export default PageLoader;
