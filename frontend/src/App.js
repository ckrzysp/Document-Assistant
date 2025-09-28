import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';

// pages
import GuestLanding from "./pages/GuestLanding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Chat from "./pages/Chat";
import Upload from "./pages/Upload";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          {/* landing page for guest users */}
          <Route path="/" element={<GuestLanding />} />

          {/* auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* main app pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/chat/:docId" element={<Chat />} />
          <Route path="/upload" element={<Upload />} />

          {/* fallback: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
