import { useState, useEffect } from "react";
import i18n from "../i18n";

const LanguageToggle = () => {
  const [language, setLanguage] = useState("fr");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") || "fr";
    setLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "fr" ? "en" : "fr";
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 rounded bg-myGray2 text-white font-semibold hover:bg-myGray3  transition"
    >
      {language.toUpperCase()}
    </button>
  );
};

export default LanguageToggle;

