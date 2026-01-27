import { useTranslation } from "react-i18next";
import LanguageSelect from "./LanguageSelect";
import ThemeSelect from "./ThemeSelect";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ParametresGeneral({ setSelectedMenu }) {
  const { t } = useTranslation();

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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className="w-full bg-myGray4 dark:bg-mydarkGray3 rounded-xl shadow-md border border-myGray4 dark:border-gray-700 p-6 h-auto max-h-[100vh] overflow-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            whileHover={{ x: -5, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <FaArrowLeft
              onClick={() => setSelectedMenu(null)}
              className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
            />
          </motion.div>
          <h1 className="text-2xl font-semibold text-myBlack dark:text-white">
            {t("parametresGeneral.Title")}
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {t("parametresGeneral.Description")}
        </p>
      </motion.div>

      {/* LANGUE */}
      <div variants={itemVariants} className="flex flex-col gap-2 mt-6">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("parametresGeneral.Language")}
        </span>
        <div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <LanguageSelect />
        </div>
      </div>

      {/* THÈME */}
      <div variants={itemVariants} className="flex flex-col gap-2 mt-4">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("parametresGeneral.Theme")}
        </span>
        <div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <ThemeSelect />
        </div>
      </div>
    </motion.div>
  );
}
