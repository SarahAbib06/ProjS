// src/components/LanguageSelect.jsx
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();

  const options = [
    { label: t("parametresGeneral.English"), value: "en", flag: "🇬🇧" },
    { label: t("parametresGeneral.French"), value: "fr", flag: "🇫🇷" }
  ];

  const handleSelect = (value) => {
    i18n.changeLanguage(value);
  };

  const currentOption = options.find(opt => opt.value === i18n.language);

  return (
    <Select value={i18n.language} onValueChange={handleSelect}>
      <SelectTrigger className="w-60 bg-white dark:bg-[#2E2F2F] border-gray-300 dark:border-gray-600 text-myBlack dark:text-white">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span className="text-xl">{currentOption?.flag}</span>
            {currentOption?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white dark:bg-[#2E2F2F] border-gray-300 dark:border-gray-600">
        {options.map((opt) => (
          <SelectItem 
            key={opt.value} 
            value={opt.value}
            className="text-myBlack dark:text-white cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{opt.flag}</span>
              {opt.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}