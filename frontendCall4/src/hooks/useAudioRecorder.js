// frontend/src/hooks/useAudioRecorder.js
import { useState, useRef, useCallback } from 'react';
import { audioService } from '../services/audioService';
import socketService from '../services/socketService';

export const useAudioRecorder = (conversationId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Démarrer l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Notifier via Socket.IO
      const userId = localStorage.getItem('userId');
      socketService.startAudioRecording(conversationId, userId);

      console.log('🎤 Enregistrement démarré');
    } catch (err) {
      console.error('❌ Erreur démarrage enregistrement:', err);
      alert('Impossible d\'accéder au microphone');
    }
  }, [conversationId]);

  // Arrêter et envoyer
  const stopAndSend = useCallback(async () => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecording) {
        reject(new Error('Pas d\'enregistrement en cours'));
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        try {
          const message = await audioService.sendAudioMessage(conversationId, audioBlob);
          resolve(message);
          console.log('🎤 Message vocal envoyé');
        } catch (err) {
          reject(err);
        }

        // Nettoyer
        cleanup();
      };

      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      // Notifier via Socket.IO
      const userId = localStorage.getItem('userId');
      socketService.stopAudioRecording(conversationId, userId);
    });
  }, [conversationId, isRecording]);

  // Annuler l'enregistrement
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      cleanup();
      
      console.log('🎤 Enregistrement annulé');
    }
  }, [isRecording]);

  // Nettoyer
  const cleanup = () => {
    setIsRecording(false);
    setRecordingTime(0);
    chunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopAndSend,
    cancelRecording
  };
};