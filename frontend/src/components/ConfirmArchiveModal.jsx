import Modal from "./Modal";
import { useTranslation } from "react-i18next";

export default function ConfirmArchiveModal({
  isOpen,
  onClose,
  onConfirm,
  isArchived,
  chatName
}) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6 text-center">

        {/* Titre */}
        <h2 className="text-xl font-semibold mb-2">
          {isArchived
            ? t("confirmArchiveModal.unarchiveTitle", { name: chatName })
            : t("confirmArchiveModal.archiveTitle", { name: chatName })}
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
          {isArchived
            ? t("confirmArchiveModal.unarchiveDescription")
            : t("confirmArchiveModal.archiveDescription")}
        </p>

        {/* Boutons */}
        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg bg-gray-300 text-black font-semibold text-sm hover:bg-gray-400 transition"
          >
            {t("confirmArchiveModal.cancel")}
          </button>

          <button
            onClick={onConfirm}
            className="w-1/2 py-2 rounded-lg bg-myYellow text-white font-semibold text-sm hover:bg-myYellow2 transition"
          >
            {isArchived
              ? t("confirmArchiveModal.unarchive")
              : t("confirmArchiveModal.archive")}
          </button>
        </div>

      </div>
    </Modal>
  );
}