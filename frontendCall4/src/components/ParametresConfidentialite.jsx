// src/components/ParametresConfidentialite.jsx
import { useTranslation } from "react-i18next";

import { FaArrowLeft, FaChevronRight } from "react-icons/fa";


export default function ParametresConfidentialite({
  setSelectedMenu,
  setPrivacySubPage,
  dernierConnexionChoice,
  statutChoice
}) {
  const { t } = useTranslation();

  return (
    <div
      className="
        w-full
        bg-myGray4 dark:bg-mydarkGray3
        rounded-xl 
        shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6
        h-[400px]
        overflow-auto
      "
    >
      <div>
        <div className="flex items-center gap-3 mb-6">
          <FaArrowLeft
            onClick={() => setSelectedMenu(null)}
            className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
          />
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            {t("parametresConfidentialite.Title")}
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresConfidentialite.Description")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">

        {/* Dernière connexion */}
        <div className="flex flex-col">

          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setPrivacySubPage("lastLogin")}
          >
            <span className="text-myBlack dark:text-gray-300 transition text-left">
              {t("parametresConfidentialite.LastLogin")}
            </span>
            <FaChevronRight className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {dernierConnexionChoice === "Tout le monde"
              ? t("derniereConnexion.Everyone")
              : t("derniereConnexion.NoOne")}
          </p>
          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>

        </div>

        {/* Statut */}
        <div className="flex flex-col -mt-4">

          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setPrivacySubPage("statut")}
          >
            <span className="text-myBlack dark:text-gray-300 transition text-left">
              {t("parametresConfidentialite.Status")}
            </span>
            <FaChevronRight className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {statutChoice === "Tout le monde"
              ? t("statut.Everyone")
              : t("statut.NoOne")}
          </p>
          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>

        </div>

        {/* Utilisateurs bloqués */}
        <div className="flex flex-col -mt-4">

          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setPrivacySubPage("blockedUsers")}
          >
            <span className="text-myBlack dark:text-gray-300 transition text-left">
              {t("parametresConfidentialite.BlockedUsers")}
            </span>
            <FaChevronRight className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            2 {t("parametresConfidentialite.BlockedUsersCount")}
          </p>
          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>

        </div>

        {/* Modifier le mot de passe */}
        <div className="flex flex-col -mt-4">

          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setPrivacySubPage("ModefierMotDePasse")}
          >
            <span className="text-myBlack dark:text-gray-300 transition text-left">
              {t("parametresConfidentialite.ChangePassword")}
            </span>
            <FaChevronRight className="text-gray-400" />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {t("parametresConfidentialite.ChangePasswordDesc")}
          </p>
        </div>

      </div>
    </div>
  );

}

