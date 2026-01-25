// src/components/LanguageSelect.jsx
import { FaAngleDown } from "react-icons/fa";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const options = [
    { label: t("parametresGeneral.English"), value: "en" },
    { label: t("parametresGeneral.French"), value: "fr" }
  ];

  const handleSelect = (value) => {
    i18n.changeLanguage(value);
    setOpen(false);
  };

  return (
    <div className="relative w-60">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white dark:bg-[#2E2F2F] border border-gray-300 dark:border-gray-600 p-3 rounded-md text-myBlack dark:text-white"
      >
        {i18n.language === "en" ? t("parametresGeneral.English") : t("parametresGeneral.French")}
        <FaAngleDown className="text-gray-600 dark:text-gray-300" />
      </button>

      {open && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-[#2E2F2F] border border-gray-300 dark:border-gray-600 mt-1 rounded-md shadow-lg z-50">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-myBlack dark:text-white"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
