// frontend/src/components/ForwardModal.jsx
import React from "react";
import { X } from "lucide-react";

export default function ForwardModal({
  isOpen,
  onClose,
  message,
  onForward,
  conversations = [],
  currentConversationId,
}) {
  if (!isOpen) return null;

  const [selectedConversation, setSelectedConversation] = React.useState(null);

  // Filtre : toutes les conversations sauf la actuelle + uniquement les privées
  const availableConversations = conversations.filter(
    (conv) => conv._id !== currentConversationId && conv.type === "private"
  );

  const handleForward = () => {
    if (!selectedConversation) {
      alert("Veuillez sélectionner une personne");
      return;
    }

    console.log("Transfert vers conversation ID :", selectedConversation._id);
    onForward(selectedConversation._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-semibold">Transférer à...</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Aperçu du message */}
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Message :</p>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-sm break-words">
            {message?.typeMessage === "text" && message.content}
            {message?.typeMessage === "image" && "📷 Image"}
            {message?.typeMessage === "video" && "🎥 Vidéo"}
            {message?.typeMessage === "audio" && "🎤 Message vocal"}
            {message?.typeMessage === "file" && `📎 ${message.fileName || "Fichier"}`}
          </div>
        </div>

        {/* Liste des personnes */}
        <div className="flex-1 overflow-y-auto">
          {availableConversations.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              Aucune autre conversation privée disponible
            </p>
          ) : (
            availableConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
                  selectedConversation?._id === conv._id ? "bg-blue-100 dark:bg-blue-900/50" : ""
                }`}
              >
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                  {conv.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{conv.name || "Utilisateur"}</p>
                  <p className="text-xs text-gray-500">Conversation privée</p>
                </div>
                {selectedConversation?._id === conv._id && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Boutons */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-gray-600">
            Annuler
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedConversation}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Transférer
          </button>
        </div>
      </div>
    </div>
  );
}