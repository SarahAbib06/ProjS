import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";
import { FaArrowLeft } from "react-icons/fa";

export default function ParametresGeneral({setSelectedMenu}) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-myGray4 dark:bg-mydarkGray3 rounded-xl shadow-md border border-myGray4 dark:border-gray-700 p-6 h-[400px] overflow-auto">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <FaArrowLeft
            onClick={() => setSelectedMenu(null)}
            className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
          />
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            {t("parametresGeneral.Title")}
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresGeneral.Description")}
        </p>
      </div>

      {/* LANGUE */}
      <div className="flex flex-col gap-2 mt-6">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("parametresGeneral.Language")}
        </span>
        <LanguageSelect />
      </div>

      {/* THÈME */}
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("parametresGeneral.Theme")}
        </span>
        <ThemeSelect />
      </div>
    </div>
  );
}
