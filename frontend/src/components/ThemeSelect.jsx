// src/components/ThemeSelect.jsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function ThemeSelect() {
  const { t } = useTranslation();
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
  };

  const options = [
    { 
      label: t("parametresGeneral.LightMode"), 
      value: "light", 
      icon: Sun,
      iconColor: "text-yellow-400"
    },
    { 
      label: t("parametresGeneral.DarkMode"), 
      value: "dark", 
      icon: Moon,
      iconColor: "text-gray-200"
    }
  ];

  const currentOption = options.find(opt => opt.value === theme);
  const CurrentIcon = currentOption?.icon;

  return (
    <Select value={theme} onValueChange={handleSelect}>
      <SelectTrigger className="w-60 bg-white dark:bg-[#2E2F2F] border-gray-300 dark:border-gray-600 text-myBlack dark:text-white">
        <SelectValue>
          <span className="flex items-center gap-2">
            {CurrentIcon && <CurrentIcon className={`w-5 h-5 ${currentOption?.iconColor}`} />}
            {currentOption?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-[#2E2F2F] border-gray-300 dark:border-gray-600">
        {options.map((opt) => {
          const Icon = opt.icon;
          
          return (
            <SelectItem 
              key={opt.value} 
              value={opt.value}
              className="text-myBlack dark:text-white cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${opt.iconColor}`} />
                {opt.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}