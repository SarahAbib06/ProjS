// src/components/QRScannerModal.jsx
import React, { useState, useRef } from 'react';
import { X, Camera, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QRScannerModal = ({ onClose, onScan }) => {
  const [scanMethod, setScanMethod] = useState('webcam');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // Démarrer la webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra');
      console.error('Erreur caméra:', err);
    }
  };

  // Arrêter la webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // Quand un QR code est détecté (simulé ici)
  const handleQRDetected = (data) => {
    // Si c'est une URL de recherche Owly
    if (data.includes('/search?q=')) {
      const username = decodeURIComponent(data.split('?q=')[1]);
      stopWebcam();
      onClose();
      
      // Utiliser onScan si fourni, sinon naviguer directement
      if (onScan) {
        onScan(data);
      } else {
        navigate(`/search?q=${encodeURIComponent(username)}`);
      }
    } else {
      setError('QR code non reconnu. Scannez un QR code Owly.');
    }
  };

  // Simulation de scan (à remplacer par jsQR)
  const simulateScan = () => {
    // Pour tester avec l'utilisateur actuel
    const currentUser = localStorage.getItem('username') || 'exemple';
    const fakeQRData = `${window.location.origin}/search?q=${encodeURIComponent(currentUser)}`;
    handleQRDetected(fakeQRData);
  };

  // Upload d'image (simplifié)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulation pour le moment
      alert('Fonctionnalité upload à implémenter avec jsQR');
      // Ici vous intégrerez jsQR pour décoder
      // const imageUrl = URL.createObjectURL(file);
      // ... logique de décodage avec jsQR
    }
  };

  React.useEffect(() => {
    if (scanMethod === 'webcam') {
      startWebcam();
    }
    
    return () => {
      stopWebcam();
    };
  }, [scanMethod]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-md">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Scanner un QR Code</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Sélecteur de méthode */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
              scanMethod === 'webcam' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300'
            }`}
            onClick={() => setScanMethod('webcam')}
          >
            <Camera size={20} />
            Caméra
          </button>
          <button
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
              scanMethod === 'upload' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 dark:bg-neutral-700 hover:bg-gray-300'
            }`}
            onClick={() => {
              stopWebcam();
              setScanMethod('upload');
            }}
          >
            <Upload size={20} />
            Galerie
          </button>
        </div>
        
        {/* Zone de scan */}
        {scanMethod === 'webcam' ? (
          <div className="relative mb-6">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover rounded-xl bg-black"
            />
            <div className="absolute inset-0 border-4 border-green-500 border-dashed rounded-xl pointer-events-none" />
            
            {/* Cadre de scan */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-green-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-green-500" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-green-500" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-green-500" />
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-xl p-8 text-center">
              <Upload className="mx-auto mb-4 text-gray-400 dark:text-neutral-500" size={48} />
              <p className="mb-4 text-gray-600 dark:text-neutral-300">
                Sélectionnez une image contenant un QR code
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 dark:text-neutral-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900 dark:file:text-blue-300
                  hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
              />
            </div>
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 dark:text-neutral-300 mb-6">
          <p>Scannez un QR code Owly pour trouver un utilisateur</p>
          <p className="mt-1">Le profil s'affichera dans la recherche</p>
        </div>
        
        {/* Boutons d'action */}
        <div className="flex gap-3">
          <button
            onClick={simulateScan}
            className="flex-1 bg-[#F9EE34] hover:bg-yellow-500 text-black py-3 rounded-lg font-medium transition"
          >
            Tester Scan
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 dark:hover:bg-neutral-600 py-3 rounded-lg transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;