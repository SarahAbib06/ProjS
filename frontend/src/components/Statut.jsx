import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function Statut({ setPrivacySubPage, selection, setSelection }) {
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
      {/* TITRE AVEC ICONE */}
      <div className="flex items-center gap-2 mb-2">
        <FaArrowLeft
          className="w-4 h-4 text-myBlack dark:text-white cursor-pointer"
            onClick={() => setPrivacySubPage(null)}
        />
        <h1 className="text-2xl font-semibold text-myBlack dark:text-white ml-3">
          {t("statut.Title")}
        </h1>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        {t("statut.Description")}
      </p>

      {/* CONTENU CHECKBOX */}
      <div className="mt-6 flex flex-col gap-4">

        {/* Tout le monde */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setSelection("Tout le monde")}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center
            ${selection === "Tout le monde" ? "bg-[#F9EE34]" : "border-2 border-gray-300 dark:border-gray-500"}`}>
            {selection === "Tout le monde" && <span className="text-black text-[10px] font-bold">✓</span>}
          </div>
          <span className="text-sm text-myBlack dark:text-white ml-3">
            {t("statut.Everyone")}
          </span>
        </div>

        {/* Personne */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setSelection("Personne")}
        >
          <div className={`w-5 h-5 rounded-full flex items-center justify-center
            ${selection === "Personne" ? "bg-[#F9EE34]" : "border-2 border-gray-300 dark:border-gray-500"}`}>
            {selection === "Personne" && <span className="text-black text-[10px] font-bold">✓</span>}
          </div>
          <span className="text-sm text-myBlack dark:text-white ml-3">
            {t("statut.NoOne")}
          </span>
        </div>
      </div>
    </div>
  );
}
