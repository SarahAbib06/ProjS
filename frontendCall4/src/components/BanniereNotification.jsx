import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function BanniereNotification({ setNotifSubPage, selection, setSelection }) {
  const { t } = useTranslation();

  const handleBack = () => {
    setNotifSubPage(null);
  };

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
      <div className="flex items-center gap-2 mb-2">
        <FaArrowLeft
          className="w-4 h-4 text-myBlack dark:text-white cursor-pointer"
          onClick={handleBack}
        />
        <h1 className="text-2xl font-semibold text-myBlack dark:text-white ml-3">
          {t("banniereNotifications.Title")}
        </h1>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
        {t("banniereNotifications.Description")}
      </p>

      <div className="mt-6 flex flex-col gap-4">

        <RadioItem
          label={t("banniereNotifications.Never")}
          value="never"
          current={selection}
          onClick={setSelection}
        />

        <RadioItem
          label={t("banniereNotifications.Always")}
          value="always"
          current={selection}
          onClick={setSelection}
        />

        <RadioItem
          label={t("banniereNotifications.OnlyOpen")}
          value="opened"
          current={selection}
          onClick={setSelection}
        />

      </div>
    </div>
  );
}

function RadioItem({ label, value, current, onClick }) {
  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => onClick(value)}
    >
      <div className={`w-5 h-5 rounded-full flex items-center justify-center
        ${current === value ? "bg-[#F9EE34]" : "border-2 border-gray-300 dark:border-gray-500"}`}>
        {current === value && <span className="text-black text-[10px] font-bold">✓</span>}
      </div>

      <span className="text-sm text-myBlack dark:text-white ml-3">
        {label}
      </span>
    </div>
  );
}
