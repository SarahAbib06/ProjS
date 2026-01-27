// src/components/ContactModal.jsx

import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ContactModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const API_URL = '/api/contact';  // ← relatif → passe par le proxy Vite

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setStatus("success");
      setMessage("");

      // Ferme le modal après un court délai pour que l'utilisateur voie le succès
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 1800);
    } catch (err) {
      console.error("Erreur envoi message :", err);
      setStatus("error");
      setErrorMsg(
        err.message.includes("Failed to fetch")
          ? "Impossible de contacter le serveur. Vérifiez votre connexion."
          : "L'envoi a échoué. Réessayez plus tard."
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="
                bg-white dark:bg-gray-900 
                rounded-2xl shadow-2xl 
                w-full max-w-md overflow-hidden
                border border-gray-200 dark:border-gray-700
              "
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nous contacter
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Envoyez-nous votre message. Nous vous répondrons le plus rapidement possible à{" "}
                  <span className="font-medium text-[#F9EE34]">owly.app.team@gmail.com</span>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre question, suggestion, signalement de bug..."
                    rows={7}
                    required
                    disabled={status === "loading" || status === "success"}
                    className="
                      w-full px-4 py-3 rounded-xl
                      bg-gray-50 dark:bg-gray-800
                      border border-gray-300 dark:border-gray-700
                      focus:border-[#F9EE34] focus:ring-2 focus:ring-[#F9EE34]/30 focus:outline-none
                      text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      resize-none
                    "
                  />

                  <button
                    type="submit"
                    disabled={status === "loading" || status === "success" || !message.trim()}
                    className={`
                      w-full py-3.5 px-6 rounded-xl font-medium
                      flex items-center justify-center gap-2
                      transition-all duration-200
                      ${
                        status === "loading"
                          ? "bg-gray-400 cursor-wait"
                          : status === "success"
                          ? "bg-green-600 text-white"
                          : "bg-[#F9EE34] hover:bg-[#f0e028] active:scale-[0.98] text-black"
                      }
                      shadow-md disabled:opacity-60
                    `}
                  >
                    {status === "loading" && <>Envoi en cours...</>}
                    {status === "success" && <>Message envoyé ✓</>}
                    {status !== "loading" && status !== "success" && (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer
                      </>
                    )}
                  </button>

                  {status === "error" && (
                    <p className="text-red-600 dark:text-red-400 text-center text-sm pt-2">
                      {errorMsg}
                    </p>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}