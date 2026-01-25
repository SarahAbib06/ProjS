import Modal from "./Modal";
import { useTranslation } from "react-i18next";

export default function UnblockUserModal({ isOpen, onClose, onConfirm, user }) {
  const { t } = useTranslation();

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-center text-myBlack mb-2">
          {t("privacy.UnblockConfirmTitle")}
        </h2>

        {/* Text */}
        <p className="text-center text-sm text-myGray2 dark:text-gray-300 mb-4">
          {t("privacy.UnblockConfirmText", { username: user.username })}
        </p>

        {/* Buttons */}
        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg bg-myBlack text-white font-semibold text-sm hover:bg-myGray2 transition"
          >
            {t("privacy.Cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="w-1/2 py-2 rounded-lg bg-myBlack text-white font-semibold text-sm hover:bg-myGray2 transition"
          >
            {t("privacy.Confirm")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
