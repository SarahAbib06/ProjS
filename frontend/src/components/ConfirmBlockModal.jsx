import Modal from "./Modal";
import { useTranslation } from "react-i18next";

export default function ConfirmBlockModal({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  userInfo
}) {
  const { t } = useTranslation();

  const userName = userInfo?.name || t("common.user");
  //const userAvatar = userInfo?.avatar || "/default-avatar.png";

  const isBlock = actionType === "block";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6 text-center">

        {/* Avatar */}
       

        {/* Titre */}
        <h2 className="text-xl font-semibold mb-2">
          {isBlock
            ? t("confirmBlockModal.blockTitle", { name: userName })
            : t("confirmBlockModal.unblockTitle", { name: userName })}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
          {isBlock
            ? t("confirmBlockModal.blockDescription")
            : t("confirmBlockModal.unblockDescription")}
        </p>

        {/* Boutons */}
        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg bg-gray-300 text-black font-semibold text-sm hover:bg-gray-400 transition"
          >
            {t("confirmBlockModal.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className={`w-1/2 py-2 rounded-lg font-semibold text-sm transition ${
              isBlock
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-myYellow text-white hover:bg-myYellow2"
            }`}
          >
            {isBlock
              ? t("confirmBlockModal.block")
              : t("confirmBlockModal.unblock")}
          </button>
        </div>

      </div>
    </Modal>
  );
}
