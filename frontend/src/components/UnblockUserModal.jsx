// UnblockUserModal.jsx - version animée
import Modal from "./Modal";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function UnblockUserModal({ isOpen, onClose, onConfirm, user }) {
  const { t } = useTranslation();

  if (!user) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.85,
      transition: { duration: 0.2 }
    },
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 max-w-md mx-auto"
      >
        {/* Title */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-center text-myBlack dark:text-myWhite mb-4"
        >
          {t("privacy.UnblockConfirmTitle")}
        </motion.h2>

        {/* Text */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center text-base text-myGray2 dark:text-gray-300 mb-6 px-4"
        >
          {t("privacy.UnblockConfirmText", { username: user.username })}
        </motion.p>

        {/* Buttons */}
        <div className="flex justify-between gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-myBlack dark:text-gray-200 font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          >
            {t("privacy.Cancel")}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-myBlack text-white font-semibold text-sm hover:bg-myGray2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {t("privacy.Confirm")}
          </motion.button>
        </div>
      </motion.div>
    </Modal>
  );
}
