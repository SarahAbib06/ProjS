import Modal from "./Modal";

export default function DeletePhotoModal({ isOpen, onClose, onConfirm }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-myBlack mb-2">
          Supprimer la photo de profil ?
        </h2>

        <p className="text-center text-sm text-myGray2 dark:text-gray-300 mb-4">
          Cette action est <b>définitive</b>. 
          Vous ne pourrez plus récupérer cette photo.
        </p>

        {/* Buttons */}
        <div className="flex justify-between gap-4 mt-6">
          
          <button
            onClick={onClose}
            className="w-1/2 py-2 rounded-lg bg-myBlack text-white font-semibold text-sm hover:bg-myGray2 transition"
          >
            Annuler
          </button>

          <button
            onClick={onConfirm}
            className="w-1/2 py-2 rounded-lg bg-myBlack text-white font-semibold text-sm hover:bg-myGray2 transition"
          >
            Supprimer
          </button>

        </div>

      </div>
    </Modal>
  );
}
