// frontend/src/App.jsx
import "./i18n";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppelProvider } from "./context/AppelContext";
import IncomingCallModal from "./components/IncomingCallModal.jsx";
import VideoCall from './components/VideoCall';
import AudioCall from './components/AudioCall';
import { useAppel } from "./context/AppelContext"; // Import pour le composant conditionnel

import RockPaper from "./pages/RockPaper";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import Welcome from "./pages/Welcome.jsx";
import OtpPage from "./pages/OtpPage";
import ProfilPic from "./pages/ProfilPic.jsx";

import TicTacToe2 from "./components/TicTacToe2";
import MessagesPage from "./pages/MessagesPage";
import MainLayout from "./components/MainLayout";
import SettingsPage from "./pages/SettingsPage";
import ForgotPassword from "./pages/ForgotPassword";


import ProtectedRoute from "./components/ProtectedRoute";
import MemoryGame from "./components/MemoryGame";
import OwlyQuiz from "./components/OwlyQuiz";
import GamesPage from "./pages/GamesPage";
import { ChatProvider } from "./context/ChatContext";
import { useEffect } from "react";
export default function App() {
  const currentUser = JSON.parse(localStorage.getItem("user")); // récupère l'utilisateur connecté
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserTheme = async () => {
      try {
        const res = await fetch(`/api/user/${currentUser._id}`);
        const data = await res.json();
        const theme = data.theme;

        if (theme.type === "gradient") {
          document.body.style.background = theme.value;
        } else if (theme.type === "color" || theme.type === "seasonal") {
          document.body.style.background = theme.value;
        } else if (theme.type === "upload") {
          document.body.style.backgroundImage = `url(${theme.value})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundRepeat = "no-repeat";
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserTheme();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AppelProvider>
          {/* 🆕 Modals d'appel globaux - toujours montés */}
          <IncomingCallModal />
          <VideoCall />
          <AudioCall />

          <ChatProvider>
            <Routes>
              {/* Route par défaut */}
              <Route path="/" element={<Welcome />} />

              {/* Routes publiques */}
              <Route path="/welcome" element={<Welcome />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/OtpPage" element={<OtpPage />} />
              <Route path="/ForgotPassword" element={<ForgotPassword />} />
              <Route path="/profil-pic" element={<ProfilPic />} />

              {/* Layout avec sidebar/header */}
              <Route element={<MainLayout />}>
                {/* Ces pages doivent être accessibles avec layout mais protégées */}
                <Route
                  path="/MessagesPage"
                  element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/Settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />



                <Route
                  path="/tic-tac-toe2"
                  element={
                    <ProtectedRoute>
                      <TicTacToe2 />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/memory-game"
                  element={
                    <ProtectedRoute>
                      <MemoryGame />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/games"
                  element={
                    <ProtectedRoute>
                      <GamesPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/rock-paper-scissors"
                  element={
                    <ProtectedRoute>
                      <RockPaper />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/owly-quiz"
                  element={
                    <ProtectedRoute>
                      <OwlyQuiz />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </ChatProvider>
        </AppelProvider>
      </AuthProvider>
    </Router>
  );
}