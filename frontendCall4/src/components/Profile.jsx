import { useState, useEffect } from "react";

import { Camera, QrCode, Download } from "lucide-react";

import { FaUser } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { profileService } from "../services/profileService";
import { useNavigate } from "react-router-dom";

import DeletePhotoModal from "../components/DeletePhotoModal";
import DeleteAccountModal from "./DeleteAccountModal";
import { Trash } from "lucide-react";

export default function Profile({ setSelectedMenu }) {
  const [editMode, setEditMode] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

    const [isImageOpen, setIsImageOpen] = useState(false);
const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
const [errorMessage, setErrorMessage] = useState("");


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [password, setPassword] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // ÉTATS POUR QR CODE
  const [qrCodeData, setQrCodeData] = useState(null);
  const [_searchUrl, setSearchUrl] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  //  Charger le profil à l'ouverture de la page
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await profileService.getProfile();
        setName(user.username);
        setEmail(user.email);
        setProfilePicture(user.profilePicture);
        
        // Générer automatiquement le QR code
        await generateQRCode();
      } catch (err) {
        console.error("Erreur chargement profil :", err);
      }
    };

    loadProfile();
  }, []);

  const [preview, setPreview] = useState(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    try {
      const user = await profileService.uploadProfilePicture(file);
      console.log("UPLOAD RESULT ===>", user);
      setProfilePicture(user.profilePicture);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement de la photo");
    }
  };


  
// supression du compte
const handleDelete = async () => {
  try {
    const res = await profileService.deleteAccount(password);
    alert(res.message);
    // Déconnecter l’utilisateur
    localStorage.removeItem("token");
    navigate("/login");
  } catch (error) {
    console.error(error);
    alert(error.response?.data?.message || "Erreur");
  }
};
const handleDeletePhoto = async () => {
 
  try {
    // Appel au backend pour supprimer la photo et récupérer le message
     await profileService.deleteProfilePicture();
    // Appel au backend pour supprimer la photo

    // Supprimer la photo côté front
    setProfilePicture("");
    setPreview(null);

   
  } catch (error) {
    console.error("Erreur suppression photo :", error);
    
  }
};
useEffect(() => {
  if (!editMode) {
    setErrorMessage("");
  }
}, [editMode]);
  // FONCTIONS QR CODE
  const generateQRCode = async () => {
    try {
      setLoadingQR(true);
      const token = localStorage.getItem("token");
      
      const API_BASE_URL = import.meta.env.VITE_API_URL; 
      
      const url = `${API_BASE_URL}/qr/generate`;
      console.log("🔗 URL de requête:", url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("📊 Status HTTP:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur HTTP:", errorText);
        
        if (response.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          localStorage.removeItem("token");
          navigate("/login");
        } else if (response.status === 404) {
          alert("Route introuvable. Vérifiez le backend.");
        }
        
        throw new Error(`Erreur ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Données reçues:", data);
      
      if (data.success) {
        setQrCodeData(data.qrCode);
        setSearchUrl(data.searchUrl);
        console.log("🎉 QR code généré avec succès!");
      } else {
        console.error("⚠️ Erreur API:", data.message);
        alert(`Erreur API: ${data.message}`);
      }
    } catch (error) {
      console.error("💥 Erreur complète:", error);
      alert(`Erreur de connexion: ${error.message}\n\nVérifiez que le serveur backend fonctionne sur le port 5000.`);
    } finally {
      setLoadingQR(false);
    }
  };

  // Télécharger le QR code
  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `owly-qr-${name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

//message derreur 
  
const handleUpdate = async () => {
  setErrorMessage(""); // reset avant chaque update
  try {
    const updated = await profileService.updateUsername(name);
    setName(updated.username);
    setEditMode(false);
  } catch (error) {
    // si tu as throw { message: ... } côté service
    setErrorMessage(error.message || "Une erreur est survenue lors de la mise à jour du username.");
  }
};

return (
  <div className="bg-myGray4 dark:bg-neutral-900 p-6 rounded-2xl shadow-md lg:h-auto h-auto">


      <div className="flex items-center gap-3 mb-6">
        <FaArrowLeft
          onClick={() => setSelectedMenu(null)}
          className="w-5 h-5 text-myBlack dark:text-white cursor-pointer lg:hidden"
        />

        <h2 className="text-2xl font-semibold">
          {t("profile.profile")}
        </h2>
      </div>


      {/* IMAGE FULLSCREEN MODAL */}
      {isImageOpen && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]"
          onClick={() => setIsImageOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <div 
              className="w-[380px] h-[380px] rounded-full overflow-hidden shadow-2xl"
              style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            >
              <img 
                src={preview || profilePicture || ""}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}


      {/* ▬▬▬ CARD 1 : identité ▬▬▬ */}
      <div
        className="
        bg-myGray4 dark:bg-neutral-800 
        rounded-xl border-[1.2px] border-myBlack 
        p-7 mb-6 
        flex items-center justify-between 
        flex-col sm:flex-col md:flex-row 
        gap-4
        w-full
      "
      >

        <div className="flex items-center gap-4 flex-col md:flex-row text-center md:text-left">
          <div className="relative h-16 w-16">
            <img
              src={preview || profilePicture || ""}
              onClick={() => setIsImageOpen(true)}
              className="w-16 h-16 rounded-full object-cover border"
            />
            {editMode && (profilePicture || preview) && (
              <button
                onClick={() => setShowDeletePhotoModal(true)}
                className="absolute top-0 right-0 bg-red-500 hover:bg-red-700 text-white p-1 rounded-full"
              >
                <Trash size={14} />
              </button>
            )}
          </div>

          <div>
            <p className="text-md">{name}</p>
            <p className="text-gray-500 text-sm pt-1.5">{email}</p>
          </div>
        </div>


        {editMode && (
          <>
            <input
              type="file"
              id="photoInput"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              onClick={() => document.getElementById("photoInput").click()}
              className="bg-[#008C23] hover:bg-green-700 dark:bg-myYellow text-white text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-2"
            >
              <Camera size={18} /> {t("profile.changePhoto")}
            </button>
          </>
        )}

      </div>

      {/* ▬▬▬ CARD 2 : infos personnelles ▬▬▬ */}
      <div
        className="
        bg-myGray4 dark:bg-neutral-800 
        rounded-xl border-[1.2px] border-myBlack 

        p-4 w-full mb-6

      "
      >
        <div className="flex items-center justify-between mb-6 flex-col md:flex-row gap-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {t("profile.personalInfo")}
            </h3>
            <p className="text-sm text-gray-500">
              {t("profile.personalInfoDesc")}
            </p>
          </div>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-lg w-full md:w-auto h-9"
            >
              {t("profile.edit")}
            </button>
          ) : (
            <div className="flex gap-3 flex-col md:flex-row w-full md:w-auto">
              <button
                onClick={() => setEditMode(false)}
                className="border border-myBlack text-xs font-semibold dark:bg-neutral-700 px-6 py-2.5 rounded-lg h-9 w-full md:w-auto"
              >
                {t("profile.cancel")}
              </button>

              <button
                onClick={handleUpdate}

                className="bg-[#008C23] hover:bg-green-700 dark:bg-myYellow text-white text-xs font-semibold px-6 py-2.5 rounded-lg h-9 w-full md:w-auto"
              >
                {t("profile.save")}
              </button>
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col">
            <label className="text-sm mb-2">{t("profile.username")}</label>

            <div className="p-[2px] rounded-lg bg-gradient-to-r from-[#F9EE34] via-gray-300 to-transparent">
              <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg px-3">
                <FaUser className="text-gray-500 text-sm mr-2" />
                <input
                  className="w-full py-2 text-xs bg-transparent focus:outline-none"
                  value={name}
                  onChange={(e) => {setName(e.target.value)
                    setErrorMessage("")
                  }}
                  
                  disabled={!editMode}
                  
                />
              </div>
            </div>
              {errorMessage && (
    <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
  )}
          </div>

          <div className="flex flex-col">
            <label className="text-sm mb-2">{t("profile.email")}</label>

            <div className="p-[2px] rounded-lg bg-gradient-to-r from-[#F9EE34] via-gray-300 to-transparent">
              <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg px-3">
                <MdEmail className="text-gray-500 text-sm mr-2" />
                <input
                  className="w-full py-2 text-xs bg-transparent focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={editMode}
                />
              </div>
            </div>
          </div>
        </div>


        {editMode && (  
          <div className="mt-6">
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="bg-[#EF0000] hover:bg-red-700 text-white text-xs font-semibold px-5 py-2 rounded-lg"
            >

              {t("profile.deleteAccount")}
            </button>
          </div>
        )}
      </div>


      {/* ▬▬▬ CARD 3 : QR CODE (MAINTENANT À L’INTÉRIEUR DU CONTAINER !) ▬▬▬ */}
      <div
        className="
        bg-myGray4 dark:bg-neutral-800 
        rounded-xl border-[1.2px] border-myBlack 
        p-6 w-full mb-4
      "
      >
        <div className="mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
            <QrCode size={20} />
            Votre QR Code Personnel
          </h3>
        </div>

        {loadingQR ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#F9EE34]"></div>
            <p className="text-gray-600 mt-3">Génération du QR code...</p>
          </div>
        ) : qrCodeData ? (
          <div className="flex flex-col lg:flex-row items-center gap-8">

            <div className="relative">
              <div className="w-64 h-64 rounded-xl border-4 border-white shadow-xl bg-white p-4">
                <img 
                  src={qrCodeData} 
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>
              <div className="absolute -top-3 -right-3 bg-[#F9EE34] text-black text-sm font-bold px-3 py-1 rounded-full shadow">
                Owly
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-6 text-center lg:text-left">
                <p className="font-bold text-xl text-[#008C23] mb-2">{name}</p>
                <p className="text-sm text-gray-600">
                  Partagez ce QR code pour que vos contacts vous trouvent facilement
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="flex items-center justify-center gap-3 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg flex-1"
                >
                  <QrCode size={20} />
                  Agrandir
                </button>

                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center gap-3 bg-[#F9EE34] hover:bg-yellow-500 text-black px-6 py-3 rounded-lg flex-1"
                >
                  <Download size={20} />
                  Télécharger
                </button>
              </div>

              <button
                onClick={generateQRCode}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 w-full text-center"
              >
                Regénérer le QR code
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700">
              <QrCode size={40} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">
              Créez votre QR code personnel pour partager votre profil
            </p>
            <button
              onClick={generateQRCode}
              className="bg-[#F9EE34] hover:bg-yellow-500 text-black px-8 py-3 rounded-lg font-medium text-lg"
            >
              Générer mon QR Code
            </button>
          </div>
        )}
      </div>

      {/* ==================== */}
      {/* MODAL QR CODE AGRANDI */}
      {/* ==================== */}
      {showQRModal && qrCodeData && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white dark:bg-neutral-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-4">Votre QR Code</h3>

            <div className="relative mb-6">
              <div className="w-80 h-80 mx-auto rounded-xl border-8 border-white bg-white p-6 shadow-2xl">
                <img 
                  src={qrCodeData} 
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>

              <div className="absolute -top-3 -right-3 bg-[#F9EE34] text-black font-bold px-4 py-1.5 rounded-full text-sm">
                OWLY
              </div>

              {profilePicture && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img 
                      src={profilePicture} 
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <p className="font-bold text-2xl text-[#008C23] mb-1">{name}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-[#F9EE34] hover:bg-yellow-500 text-black py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3"
              >
                <Download size={22} />
                Télécharger
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-neutral-700 py-4 rounded-lg font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        password={password}
        setPassword={setPassword}
        onConfirm={handleDelete}
      />

      <DeletePhotoModal
        isOpen={showDeletePhotoModal}
        onClose={() => setShowDeletePhotoModal(false)}
        onConfirm={() => {
          handleDeletePhoto();
          setShowDeletePhotoModal(false);
        }}
      />
    </div>
);

}

