// src/components/ThemeSelect.jsx
import { useState, useEffect } from "react";
import { FaSun, FaMoon, FaAngleDown } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function ThemeSelect() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const html = document.documentElement;
    setTheme(html.classList.contains("dark") ? "dark" : "light");
  }, []);

  const handleSelect = (value) => {
    const html = document.documentElement;
    if (value === "dark") {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    setTheme(value);
    setOpen(false);
  };

  const options = [
    { label: t("parametresGeneral.LightMode"), value: "light", icon: <FaSun className="text-yellow-400" /> },
    { label: t("parametresGeneral.DarkMode"), value: "dark", icon: <FaMoon className="text-gray-200" /> }
  ];

  return (
    <div className="relative w-60">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-white dark:bg-[#2E2F2F] border border-gray-300 dark:border-gray-600 p-3 rounded-md text-myBlack dark:text-white"
      >
        <span className="flex items-center gap-2">
          {theme === "dark" ? <FaMoon className="text-gray-200" /> : <FaSun className="text-yellow-400" />}
          {theme === "dark" ? t("parametresGeneral.DarkMode") : t("parametresGeneral.LightMode")}
        </span>
        <FaAngleDown className="text-gray-600 dark:text-gray-300" />
      </button>

      {open && (
        <div className="absolute top-full left-0 w-full bg-white dark:bg-[#2E2F2F] border border-gray-300 dark:border-gray-600 mt-1 rounded-md shadow-lg z-50">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2 text-myBlack dark:text-white"
            >
              {opt.icon} {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
