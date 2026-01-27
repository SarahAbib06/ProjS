import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, MessageSquare, Phone, Volume2, ChevronRight } from "lucide-react";

export default function ParametresNotification({
  setSelectedMenu,
  setNotifSubPage,
  bannerSelection,
}) {
  const { t } = useTranslation();

  const [messageNotif, setMessageNotif] = useState(true);
  const [callNotif, setCallNotif] = useState(true);
  const [incomingSound, setIncomingSound] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 160,
        damping: 25,
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 100,
      transition: { duration: 0.5 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  const getBannerText = () => {
    if (bannerSelection === "never") return t("banniereNotifications.Never");
    if (bannerSelection === "always") return t("banniereNotifications.Always");
    return t("banniereNotifications.OnlyOpen");
  };

  const toggleItems = [
    {
      id: "messages",
      icon: MessageSquare,
      title: t("parametresNotifications.Messages"),
      description: t("parametresNotifications.MessagesDesc"),
      checked: messageNotif,
      onChange: () => setMessageNotif(!messageNotif),
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/10"
    },
    {
      id: "calls",
      icon: Phone,
      title: t("parametresNotifications.Calls"),
      description: t("parametresNotifications.CallsDesc"),
      checked: callNotif,
      onChange: () => setCallNotif(!callNotif),
      iconColor: "text-green-500",
      iconBg: "bg-green-500/10"
    },
    {
      id: "sound",
      icon: Volume2,
      title: t("parametresNotifications.IncomingSound"),
      description: t("parametresNotifications.IncomingSoundDesc"),
      checked: incomingSound,
      onChange: () => setIncomingSound(!incomingSound),
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/10"
    }
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="
        w-full
        bg-myGray4 dark:bg-mydarkGray3
        rounded-xl 
        shadow-md 
        border border-myGray4 dark:border-gray-700
        p-6
        h-auto max-h-[100vh]
        overflow-auto
      "
    >
      {/* Header */}
      <div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <div
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <FaArrowLeft
              onClick={() => setSelectedMenu(null)}
              className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
            />
          </div>
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            {t("parametresNotifications.Title")}
          </h1>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresNotifications.Description")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {/* Bannière - Navigation Item */}
        <div
          variants={itemVariants}
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => setNotifSubPage("banner")}
          className="
            flex items-center justify-between p-4 rounded-xl cursor-pointer
            bg-white dark:bg-[#2E2F2F]
            border border-gray-200 dark:border-gray-700
            hover:border-gray-300 dark:hover:border-gray-600
            transition-all duration-200
            group
          "
        >
          <div className="flex items-center gap-4 flex-1">
            <div
              whileHover={{ rotate: 5 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10"
            >
              <Bell className="w-5 h-5 text-orange-500" />
            </div>

            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-myBlack dark:text-white">
                {t("parametresNotifications.Banner")}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {getBannerText()}
              </span>
            </div>
          </div>

          <div
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </div>
        </div>

        {/* Toggle Items */}
        {toggleItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              variants={itemVariants}
              className="
                flex items-center justify-between p-4 rounded-xl
                bg-white dark:bg-[#2E2F2F]
                border border-gray-200 dark:border-gray-700
              "
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  whileHover={{ rotate: 5 }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>

                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium text-myBlack dark:text-white">
                    {item.title}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <label
                whileTap={{ scale: 0.95 }}
                className="relative inline-flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={item.checked}
                  onChange={item.onChange}
                />
                <div
                  className="
                    w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full 
                    peer peer-checked:bg-[#F9EE34]
                    after:absolute after:top-[2px] after:left-[2px]
                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                    peer-checked:after:translate-x-5
                  "
                />
              </label>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}