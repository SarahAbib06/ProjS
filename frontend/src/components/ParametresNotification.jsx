import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaChevronRight } from "react-icons/fa";
import { useState } from "react";

export default function ParametresNotification({
  setSelectedMenu,
  setNotifSubPage,
  bannerSelection,
  
}) {
  const { t } = useTranslation();

  const [messageNotif, setMessageNotif] = useState(true);
  const [callNotif, setCallNotif] = useState(true);
  const [incomingSound, setIncomingSound] = useState(true);

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
            {t("parametresNotifications.Title")}
          </h1>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresNotifications.Description")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">

        {/* Bannière */}
        <div className="flex flex-col">
          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setNotifSubPage("banner")}
          >
            <span className="text-myBlack dark:text-gray-300 hover:text-black dark:hover:text-white transition text-left">
              {t("parametresNotifications.Banner")}
            </span>

            <FaChevronRight className="text-gray-400" />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {bannerSelection === "never"
              ? t("banniereNotifications.Never")
              : bannerSelection === "always"
              ? t("banniereNotifications.Always")
              : t("banniereNotifications.OnlyOpen")}
          </p>

          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>
        </div>

        {/* Messages */}
        <div className="flex flex-col -mt-4">
          <div className="flex items-center justify-between p-3">
            <button className="text-myBlack dark:text-gray-300 hover:text-black dark:hover:text-white transition text-left">
              {t("parametresNotifications.Messages")}
            </button>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={messageNotif}
                onChange={() => setMessageNotif(!messageNotif)}
              />
              <div className="
                w-11 h-6 bg-gray-300 rounded-full 
                peer peer-checked:bg-[#F9EE34]
                after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-5
              "></div>
            </label>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {t("parametresNotifications.MessagesDesc")}
          </p>

          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>
        </div>

        {/* Appels */}
        <div className="flex flex-col -mt-4">
          <div className="flex items-center justify-between p-3">
            <button className="text-myBlack dark:text-gray-300 hover:text-black dark:hover:text-white transition text-left">
              {t("parametresNotifications.Calls")}
            </button>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={callNotif}
                onChange={() => setCallNotif(!callNotif)}
              />
              <div className="
                w-11 h-6 bg-gray-300 rounded-full 
                peer peer-checked:bg-[#F9EE34]
                after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-5
              "></div>
            </label>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {t("parametresNotifications.CallsDesc")}
          </p>

          <div className="border-t border-gray-300 dark:border-gray-700 mt-3"></div>
        </div>

        {/* Son appels entrants */}
        <div className="flex flex-col -mt-4">
          <div className="flex items-center justify-between p-3">
            <button className="text-myBlack dark:text-gray-300 hover:text-black dark:hover:text-white transition text-left">
              {t("parametresNotifications.IncomingSound")}
            </button>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={incomingSound}
                onChange={() => setIncomingSound(!incomingSound)}
              />
              <div className="
                w-11 h-6 bg-gray-300 rounded-full 
                peer peer-checked:bg-[#F9EE34]
                after:absolute after:top-[2px] after:left-[2px]
                after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                peer-checked:after:translate-x-5
              "></div>
            </label>
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 ml-3 -mt-3">
            {t("parametresNotifications.IncomingSoundDesc")}
          </p>
        </div>

      </div>
    </div>
  );
}
