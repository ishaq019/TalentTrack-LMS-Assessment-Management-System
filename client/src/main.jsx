// client/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/TalentTrack-LMS-Assessment-Management-System">
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
