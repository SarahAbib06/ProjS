// src/components/IncomingCallModal.jsx
import React, { useEffect, useRef } from 'react';
import { useAppel } from '../context/AppelContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, X } from 'lucide-react';

export default function IncomingCallModal() {
  const { incomingCall, showCallModal, acceptIncomingCall, rejectIncomingCall } = useAppel();
  const ringtoneRef = useRef(null);

  // Jouer/arrêter le son d'appel
  useEffect(() => {
    if (showCallModal && incomingCall) {
      // Jouer le son
      try {
        ringtoneRef.current = new Audio('/sounds/ringtone.mp3');
        ringtoneRef.current.loop = true;
        ringtoneRef.current.play().catch(e => console.log('Son ignoré'));
      } catch (e) {
        console.log('Impossible de jouer le son');
      }

      // Timeout automatique après 30 secondes
      const timeout = setTimeout(() => {
        if (showCallModal) {
          rejectIncomingCall();
        }
      }, 30000);

      return () => {
        clearTimeout(timeout);
        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
        }
      };
    }
  }, [showCallModal, incomingCall, rejectIncomingCall]);

  if (!showCallModal || !incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={`rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl ${incomingCall.callType === 'video'
            ? 'bg-gradient-to-br from-[#d9b899] to-[#c4a882]'
            : 'bg-gradient-to-br from-yellow-400 to-yellow-600'
            }`}
        >
          <div className="text-center text-white">
            {/* 🆕 Avatar/Image - Vraie photo de profil avec fallback initiales */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
              {incomingCall.fromAvatar ? (
                <img
                  src={incomingCall.fromAvatar}
                  alt={incomingCall.fromUsername || "Utilisateur"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback vers initiales si l'image ne charge pas
                    e.target.onerror = null;
                    const name = incomingCall.fromUsername || "User";
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F9EE34&color=000&bold=true&size=128`;
                  }}
                />
              ) : (
                // Afficher initiales directement si pas de photo
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(incomingCall.fromUsername || "User")}&background=F9EE34&color=000&bold=true&size=128`}
                  alt={incomingCall.fromUsername || "Utilisateur"}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Informations */}
            <h2 className="text-2xl font-bold mb-2">
              {incomingCall.callType === 'audio' ? "Appel vocal entrant" : "Appel vidéo entrant"}
            </h2>
            <p className="text-lg mb-1">
              <strong>{incomingCall.fromUsername || "Utilisateur"}</strong>
            </p>
            <p className="text-sm text-white/80 mb-8">
              vous appelle...
            </p>

            {/* Boutons */}
            <div className="flex justify-center gap-6">
              {/* Bouton Refuser */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={rejectIncomingCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={24} />
              </motion.button>

              {/* Bouton Accepter */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={acceptIncomingCall}
                className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
              >
                <Phone size={24} />
              </motion.button>
            </div>

            {/* Texte info */}
            <p className="text-sm text-white/60 mt-8">
              L'appel s'arrêtera automatiquement dans 30 secondes
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}