
// src/components/SearchModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, User, MessageCircle, QrCode, Camera, Upload, UserCheck } from 'lucide-react';
import jsQR from 'jsqr';

const SearchModal = ({ onClose, onUserSelect }) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' ou 'scan'
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]); // ← REMPLACÉ
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false); // ← AJOUTÉ
  const [error, setError] = useState('');
  
  // États pour le scanner QR
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

 // Dans SearchModal.jsx - fonction fetchContacts simplifiée
const fetchContacts = async () => {
  try {
    setLoadingContacts(true);
    const token = localStorage.getItem('token');
    
    console.log('🔄 Chargement des contacts...');
    
    const response = await fetch('http://localhost:5000/api/relations/contacts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Contacts reçus:', data);
    
    // data est déjà un tableau, pas besoin de data.contacts
    setContacts(data);
    
  } catch (error) {
    console.error('❌ Erreur chargement contacts:', error);
    setError('Impossible de charger les contacts: ' + error.message);
    setContacts([]);
  } finally {
    setLoadingContacts(false);
  }
};
  // RECHERCHE PAR USERNAME
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/search/users?username=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Erreur de recherche');
      }
      
      const data = await response.json();
      setUsers(data);
      
      if (data.length === 0) {
        setError('Aucun utilisateur trouvé');
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // SCANNER QR CODE
  const startQRScanner = async () => {
    try {
      setScanning(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanFrame();
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      setError('Impossible d\'accéder à la caméra: ' + error.message);
      setActiveTab('search');
    }
  };

  const stopQRScanner = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        console.log('QR Code détecté:', code.data);
        handleQRScan(code.data);
        return;
      }
    }
    
    // Continue à scanner tant qu'on est en mode scan
    requestAnimationFrame(scanFrame);
  };

  const handleQRScan = async (qrData) => {
    try {
      stopQRScanner();
      
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/qr/scan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrContent: qrData })
      });
      
      const data = await response.json();
      
      if (data.success && data.users && data.users.length > 0) {
        setScanResult(data.users[0]);
        setError('');
      } else {
        setError(data.message || 'QR code non reconnu');
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      setError('Erreur lors du scan');
    }
  };

  // Upload d'image QR
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleQRScan(code.data);
        } else {
          setError('Aucun QR code détecté dans l\'image');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Effets
  useEffect(() => {
    if (activeTab === 'scan') {
      startQRScanner();
    } else {
      stopQRScanner();
    }
    
    return () => {
      stopQRScanner();
    };
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && activeTab === 'search') {
        handleSearch();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery, activeTab]);

  // Charger les contacts au démarrage
  useEffect(() => {
    if (activeTab === 'search') {
      fetchContacts();
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        
        {/* En-tête minimaliste */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-gray-600" />
            <span className="font-medium">Rechercher</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          
          {/* Onglets horizontaux */}
          <div className="flex mb-4 bg-gray-100 dark:bg-neutral-700 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-colors ${
                activeTab === 'search' 
                  ? 'bg-white dark:bg-neutral-800 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('search')}
            >
              Recherche
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm font-medium rounded-md transition-colors ${
                activeTab === 'scan' 
                  ? 'bg-white dark:bg-neutral-800 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}
              onClick={() => setActiveTab('scan')}
            >
              QR Code
            </button>
          </div>

          {activeTab === 'search' ? (
            // RECHERCHE PAR USERNAME
            <div>
              {/* Champ de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher sur Owly..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-4 pr-10 py-3 bg-gray-100 dark:bg-neutral-700 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500"
                  >
                    <Search size={20} />
                  </button>
                </div>
                
              </div>

              {/* Contacts suggérés */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 px-1">Contacts</h3>
                {loadingContacts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Chargement des contacts...</p>
                  </div>
                ) : contacts.length > 0 ? (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            contact.profilePicture 
                              ? '' 
                              : 'bg-gradient-to-br from-blue-400 to-purple-500'
                          }`}>
                            {contact.profilePicture ? (
                              <img
                                src={contact.profilePicture}
                                alt={contact.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{contact.username}</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                contact.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className="text-xs text-gray-500">
                                {contact.status === 'online' ? 'En ligne' : 'Hors ligne'}
                              </span>
                              {contact.isContact && (
                                <UserCheck size={12} className="text-blue-500 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onUserSelect && onUserSelect(contact)}
                          className="p-2 bg-black hover:bg-gray-800 text-white rounded-full"
                          title="Envoyer un message"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aucun contact pour le moment
                  </div>
                )}
              </div>

              {/* Résultats de recherche */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Recherche en cours...</p>
                </div>
              ) : users.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 px-1">Résultats</h3>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.profilePicture 
                              ? '' 
                              : 'bg-gradient-to-br from-blue-400 to-purple-500'
                          }`}>
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.username}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              }`}></div>
                              <span className="text-xs text-gray-500">
                                {user.status === 'online' ? 'En ligne' : 'Hors ligne'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onUserSelect && onUserSelect(user)}
                          className="p-2 bg-black hover:bg-gray-800 text-white rounded-full"
                          title="Envoyer un message"
                        >
                          <MessageCircle size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery && !loading && (
                <div className="text-center py-4 text-gray-500">
                  Aucun résultat pour "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            // SCANNER QR CODE
            <div>
              <div className="text-center mb-6">
                <h3 className="font-medium mb-2">Scanner un QR Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Scannez le code QR d'un utilisateur pour l'ajouter
                </p>
              </div>
              
              {scanResult ? (
                // Résultat du scan
                <div className="text-center p-4">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    {scanResult.profilePicture ? (
                      <img
                        src={scanResult.profilePicture}
                        alt={scanResult.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-white" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1">{scanResult.username}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                    Utilisateur trouvé
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        onUserSelect && onUserSelect(scanResult);
                        onClose();
                      }}
                      className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Message
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setScanResult(null);
                      setActiveTab('scan');
                      startQRScanner();
                    }}
                    className="mt-4 text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Scanner un autre code
                  </button>
                </div>
              ) : (
                // Scanner en cours
                <div>
                  {scanning ? (
                    <div className="relative mb-6">
                      <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover rounded-2xl bg-black"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {/* Cadre de scan */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-2xl p-8 text-center mb-6">
                      <QrCode className="mx-auto mb-4 text-gray-400" size={48} />
                      <p className="text-gray-600 dark:text-gray-300">Préparation du scanner...</p>
                    </div>
                  )}

                  {/* Upload d'image */}
                  <div className="mb-4">
                    <label className="block text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">
                        OU téléchargez une image
                      </span>
                      <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 px-4 py-2 rounded-xl cursor-pointer transition-colors">
                        <Upload size={18} />
                        <span className="text-sm">Choisir une image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </label>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-xl mb-4">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
