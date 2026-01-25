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
import GroupVideoCall from './components/GroupVideoCall.jsx';
import TicTacToe2 from "./components/TicTacToe2";
import MessagesPage from "./pages/MessagesPage";
import MainLayout from "./components/MainLayout";
import SettingsPage from "./pages/SettingsPage";
import ForgotPassword from "./pages/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import MemoryGame from "./components/MemoryGame";
import OwlyQuiz from "./components/OwlyQuiz";
import GamesPage from "./pages/GamesPage";

// Composant wrapper pour gérer l'interface principale
function MainInterface() {
  const { currentCall, callType } = useAppel();
  
  // Si un appel vidéo est en cours, on affiche VideoCall
  if (currentCall && callType === 'video') {
    return <VideoCall />;
  }
  
  // Si un appel audio est en cours, on affiche AudioCall
  if (currentCall && callType === 'audio') {
    return <AudioCall />;
  }
  
  // Sinon, on affiche les routes normales
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/OtpPage" element={<OtpPage />} />
      <Route path="/ForgotPassword" element={<ForgotPassword />} />

      <Route element={<MainLayout />}>
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
          path="/video-call"
          element={
            <ProtectedRoute>
              <div>Page d'appel vidéo</div>
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
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppelProvider>
          {/* Interface principale conditionnelle */}
          <MainInterface />
          
          {/* MODALS GLOBAUX (toujours visibles si nécessaires) */}
          <IncomingCallModal />
          
        </AppelProvider>
      </AuthProvider>
    </Router>
  );
}