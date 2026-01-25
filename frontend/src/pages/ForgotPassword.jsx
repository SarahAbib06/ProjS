// frontend/src/pages/Dashboard.jsx
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import logo from "../assets/images/owlylogo.png";
import { FaSignOutAlt, FaCheckCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-myYellow via-white to-myGray3 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-mydarkGray3 rounded-3xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden">
        
        {/* Effet de fond décoratif */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-myYellow via-myBlack to-myYellow"></div>
        
        {/* Logo */}
        <div className="mb-6">
          <img
            src={logo}
            alt="Owly Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 mx-auto object-contain animate-bounce-slow"
          />
        </div>

        {/* Icône de succès */}
        <div className="mb-4">
          <FaCheckCircle className="text-green-500 text-5xl mx-auto animate-pulse" />
        </div>

        {/* Message de bienvenue */}
        <h1 className="text-2xl sm:text-3xl font-bold text-myBlack mb-2">
          {t("dashboard.welcome") || "Bienvenue"} 🎉
        </h1>
        
        <p className="text-myGray2 text-sm mb-6">
          {t("dashboard.successMessage") || "Vous êtes maintenant connecté !"}
        </p>

        {/* Informations utilisateur */}
        <div className="bg-myGray3 dark:bg-mydarkGray2 rounded-xl p-4 mb-6">
          <p className="text-xs text-myGray2 uppercase tracking-wider mb-2">
            {t("dashboard.yourAccount") || "Votre compte"}
          </p>
          <p className="text-lg font-semibold text-myBlack">
            {user?.username || "Utilisateur"}
          </p>
          <p className="text-sm text-myGray2">
            {user?.email || "email@example.com"}
          </p>
        </div>

        {/* Message de confirmation */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
          <p className="text-sm text-green-700">
            ✅ {t("dashboard.allWorking") || "Tout fonctionne parfaitement !"}
          </p>
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-myBlack text-white py-3 rounded-lg font-semibold text-sm
                     hover:bg-myGray2 transition-all duration-300 
                     hover:scale-105 active:scale-95
                     flex items-center justify-center gap-2"
        >
          <FaSignOutAlt />
          {t("dashboard.logout") || "Se déconnecter"}
        </button>

        {/* Note de bas de page */}
        <p className="text-xs text-myGray2 mt-6">
          {t("dashboard.appWorking") || "L'application fonctionne correctement"}
        </p>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

