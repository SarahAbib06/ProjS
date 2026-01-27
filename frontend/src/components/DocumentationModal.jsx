// src/components/DocumentationModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Video, QrCode, Gamepad2, Shield, MessageCircle } from "lucide-react";

export default function DocumentationModal({ isOpen, onClose }) {
  const sections = [
    {
      icon: MessageCircle,
      title: "Messagerie instantanée",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      content: (
        <>
          <p>Envoyez des messages texte, photos, vidéos, voix et fichiers</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Sondage , theme</li>
            <li>Réactions</li>
            <li>Chats de groupe </li>
          </ul>
        </>
      )
    },
    {
      icon: Video,
      title: "Appels vidéo & audio",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      content: (
        <>
          <p>Appels en 1:1 </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Partage d'écran</li>
            
          </ul>
        </>
      )
    },
    {
      icon: QrCode,
      title: "Ajout par QR Code",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      content: (
        <p>
          Scannez le QR code d'un contact pour le trouver instantanément sans chercher son pseudo.
          Disponible dans le profil → "Mon QR Code" et dans les paramètres.
        </p>
      )
    },
    {
      icon: Gamepad2,
      title: "Jeux intégrés",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      content: (
        <>
          <p>Jouez directement dans le chat :</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Quiz Owly</li>
            <li>Pierre-papier-ciseaux multijoueur</li>
            <li>Memory</li>
            <li>Devine le nombre</li>
          </ul>
          <p className="mt-2 text-xs italic">Les scores sont affichés dans le chat.</p>
        </>
      )
    },
    {
      icon: Shield,
      title: "Sécurité & Confidentialité",
      color: "text-red-500",
      bg: "bg-red-500/10",
      content: (
        <>
          <p>Chiffrement de bout en bout (E2EE) sur tous les messages privés </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Mot de passe Hasher</li>
            <li>Blocage / Signalement</li>
            <li>Routes proteger</li>
          </ul>
        </>
      )
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="
                bg-white dark:bg-gray-900 
                rounded-2xl shadow-2xl 
                w-full max-w-2xl max-h-[90vh] overflow-y-auto
                border border-gray-200 dark:border-gray-700
              "
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-[#F9EE34]" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Documentation Owly
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-8">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Owly est une application de messagerie moderne avec chiffrement de bout en bout, appels vidéo, jeux intégrés et ajout ultra-rapide par QR code.
                </p>

                {sections.map((section, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${section.bg} flex items-center justify-center`}>
                        <section.icon className={`w-5 h-5 ${section.color}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                    </div>
                    <div className="pl-13 text-sm text-gray-600 dark:text-gray-300">
                      {section.content}
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
                  Version actuelle : 1.0.0 • Dernière mise à jour : Janvier 2026
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}