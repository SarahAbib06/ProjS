import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { profileService } from "../services/profileService";

export default function SupprimerCompte({ setPrivacySubPage }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await profileService.deleteAccount(password);
      
      // Succès
      setMessage(res.message || "Compte supprimé avec succès");
      setIsError(false);
      
      // Attendre 2 secondes puis rediriger
      setTimeout(() => {
        localStorage.removeItem("token");
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      console.error("❌ Erreur:", error);
      
      // L'erreur est déjà l'objet { message: "..." } envoyé par le service
      const errorMessage = error?.message || "Erreur lors de la suppression du compte";
      
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le message d'erreur quand l'utilisateur tape
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (message && isError) {
      setMessage("");
      setIsError(false);
    }
  };

  return (
    <div className="w-full bg-myGray4 dark:bg-mydarkGray3 rounded-xl shadow-md border border-myGray4 dark:border-gray-700 p-4 sm:p-6 md:p-8 h-auto max-h-[500px] overflow-auto">
      {/* TITRE */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FaArrowLeft
            className="w-4 h-4 sm:w-5 sm:h-5 text-myBlack dark:text-white cursor-pointer hover:opacity-70 transition"
            onClick={() => setPrivacySubPage(null)}
          />
          <h2 className="text-xl sm:text-2xl font-semibold text-myBlack dark:text-white">
            {t("supprimerCompte.titre")}
          </h2>
        </div>
      </div>

      {/* AVERTISSEMENT - Sans cadre */}
      <div className="mb-4 sm:mb-6">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">
          <span className="font-semibold">{t("supprimerCompte.attention")}</span>
        </p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {t("supprimerCompte.avertissement")}
        </p>
      </div>

      <p className="text-xs sm:text-sm mb-4 sm:mb-6 text-gray-600 dark:text-gray-400">
        {t("supprimerCompte.sousTitre")}
      </p>

      {/* Message de succès/erreur */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-xs sm:text-sm ${isError ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 w-full max-w-lg">
        {/* INPUT — Mot de passe */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myYellow2 w-full">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-3 sm:px-4">
            <MdLock className="text-gray-400 flex-shrink-0" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              placeholder={t("supprimerCompte.motDePasse")}
              className="w-full p-2 sm:p-3 bg-transparent outline-none text-sm sm:text-base text-myBlack dark:text-white placeholder:text-gray-400"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none flex-shrink-0 ml-2"
            >
              {showPassword ? (
                <MdVisibilityOff size={20} className="text-gray-400"/>
              ) : (
                <MdVisibility size={20} className="text-gray-400"/>
              )}
            </button>
          </div>
        </div>

        {/* BOUTONS - Même largeur que l'input */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            type="button"
            onClick={() => setPrivacySubPage(null)}
            className="w-full sm:flex-1 border-1 border-black bg-myGray hover:bg-myGray3 dark:bg-gray-600 dark:hover:bg-gray-700 text-black dark:text-white h-[44px] sm:h-[48px] px-4 sm:px-5 rounded-xl font-semibold text-sm transition-colors"
          >
            {t("supprimerCompte.annuler")}
          </button>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full sm:flex-1 bg-[#EF0000] hover:bg-red-700 text-white h-[44px] sm:h-[48px] px-4 sm:px-5 rounded-xl font-semibold text-sm flex items-center justify-center transition-colors ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">{t("supprimerCompte.enCours")}</span>
              </div>
            ) : (
              t("supprimerCompte.confirmer")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}