import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function ModifierMotDePasse({ setPrivacySubPage }) {
  const { t } = useTranslation();


  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  
  // États pour les mots de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Fonction pour envoyer au backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Récupérer le token du localStorage
      const token = localStorage.getItem("token");
      
      if (!token) {
        setMessage("Veuillez vous reconnecter");
        setIsError(true);
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Succès
        setMessage(data.message || "Mot de passe modifié avec succès !");
        setIsError(false);
        
        // Réinitialiser les champs
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Erreur
        setMessage(data.message || "Une erreur est survenue");
        setIsError(true);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setMessage("Erreur de connexion au serveur");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-myGray4 dark:bg-mydarkGray3 rounded-xl p-8 w-full shadow-sm font-poppins">
      {/* TITRE */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaArrowLeft
            className="w-4 h-4 text-myBlack dark:text-white cursor-pointer"
            onClick={() => setPrivacySubPage(null)}
          />
          <h2 className="text-2xl font-semibold text-myBlack dark:text-white ml-3">
            {t("modifierMotDePasse.titre")}
          </h2>
        </div>
      </div>

      <p className="text-sm mb-6 text-[#575757]">
        {t("modifierMotDePasse.sousTitre")}
      </p>

      {/* Message de succès/erreur */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-lg">
        {/* INPUT 1 — Ancien mot de passe */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">
            <MdLock className="text-gray-400" size={24} />
            <input
              type={showOld ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("modifierMotDePasse.motDePasseActuel")}
              className="w-full p-3 bg-transparent outline-none"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowOld(!showOld)}
              className="focus:outline-none"
            >

              {showOld ? (
                <MdVisibilityOff size={22} className="text-gray-400"/>
              ) : (
                <MdVisibility size={22} className="text-gray-400"/>
              )}
            </button>
          </div>
        </div>

        {/* INPUT 2 — Nouveau mot de passe */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">

            <MdLock className="text-gray-400" size={24} />
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("modifierMotDePasse.nouveauMotDePasse")}
              className="w-full p-3 bg-transparent outline-none"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowNew(!showNew)}
              className="focus:outline-none"
            >
              {showNew ? (
                <MdVisibilityOff size={22} className="text-gray-400" />
              ) : (
                <MdVisibility size={22} className="text-gray-400" />

              )}
            </button>
          </div>
        </div>

        {/* INPUT 3 — Confirmer */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">

            <MdLock className="text-gray-400" size={24} />
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("modifierMotDePasse.confirmerMotDePasse")}
              className="w-full p-3 bg-transparent outline-none"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowConfirm(!showConfirm)}
              className="focus:outline-none"
            >

              {showConfirm ? (
                <MdVisibilityOff size={22} className="text-gray-400"/>
              ) : (
                <MdVisibility size={22} className="text-gray-400"/>
              )}
            </button>
          </div>
        </div>

        {/* BOUTON */}

        <button 
          type="submit"
          disabled={loading}
          className={`bg-[#008C23] hover:bg-myGray2 text-white h-[54px] w-[147px] rounded-xl font-semibold flex items-center justify-center ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              En cours...
            </div>
          ) : (
            t("modifierMotDePasse.enregistrer")
          )}
        </button>
      </form>
    </div>
  );
}

