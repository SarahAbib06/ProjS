// src/components/ConfirmDeleteModal.jsx
import Modal from "./Modal";
import { Trash2 } from "lucide-react";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  chatName,
  chatAvatar,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 text-center">

        {/* Titre */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Supprimer la conversation ?
        </h2>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-xs mx-auto">
          Tous vos messages avec <span className="font-semibold">{chatName}</span> seront définitivement supprimés de votre côté. Cette action est irréversible.
        </p>

        {/* Boutons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Annuler
          </button>

          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition flex items-center gap-2"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  );
}