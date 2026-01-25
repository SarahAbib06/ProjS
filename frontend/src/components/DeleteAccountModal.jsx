import Modal from "./Modal";

export default function DeleteAccountModal({
  isOpen,
  onClose,
  password,
  setPassword,
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg p-6">

        {/* Title */}
        <h2 className="text-xl font-bold text-center text-myBlack mb-2">
          Supprimer le compte ?
        </h2>

        <p className="text-center text-sm text-myGray2 dark:text-gray-300 mb-4">
          Cette action est <b>définitive</b>.  
          Entrez votre mot de passe pour confirmer.
        </p>

        {/* Input mot de passe */}
        <div className="border border-myYellow  border-2 rounded-lg flex items-center px-3 bg-white dark:bg-neutral-800">
          <input
            type="password"
            className="w-full py-2 text-xs bg-transparent  focus:outline-none"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

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
