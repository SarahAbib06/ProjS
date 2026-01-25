import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Lire l'état actuel depuis localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-16 h-8 flex items-center px-1 rounded-full transition-all duration-500 shadow-md
        ${isDark ? "bg-yellow-400" : "bg-gray-300"}`}
    >
      <FaSun className={`text-white absolute left-2 transition-opacity duration-300 ${isDark ? "opacity-50" : "opacity-100"}`} />
      <FaMoon className={`text-white absolute right-2 transition-opacity duration-300 ${isDark ? "opacity-100" : "opacity-50"}`} />
      <span className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-500 ${isDark ? "translate-x-8" : "translate-x-0"}`}></span>
    </button>
  );
};

export default DarkModeToggle;


