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
const DEFAULT_PROFILE_PICTURE = "https://res.cloudinary.com/dv9oqjulh/image/upload/v1764324539/photo_de_profil_par_defaut_j3qm1p.png";

    const [isImageOpen, setIsImageOpen] = useState(false);
const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

 // États originaux (données du serveur)
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
  

// États temporaires (pendant l'édition)
const [tempName, setTempName] = useState("");
const [tempFile, setTempFile] = useState(null);
const [preview, setPreview] = useState(null);
// Activer le mode édition
  const handleEditMode = () => {
    setEditMode(true);
    setTempName(name);
    setPreview(null);
    setTempFile(null);
    setErrorMessage("");
  };
  //  Charger le profil à l'ouverture de la page
 // Au chargement du profil
useEffect(() => {
  const loadProfile = async () => {
    try {
      const user = await profileService.getProfile();
      setName(user.username);
      setProfilePicture(user.profilePicture);
      setTempName(user.username); // Initialiser les états temporaires
      setEmail(user.email)
      // ...
    } catch (err) {
      console.error("Erreur chargement profil :", err);
    }
  };
  loadProfile();
}, []);

  // Gérer le changement de photo (SANS upload immédiat)
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setTempFile(file);
    setPreview(URL.createObjectURL(file));
  };
  // Bouton ANNULER
  const handleCancel = () => {
    setEditMode(false);
    setTempName(name);
    setPreview(null);
    setTempFile(null);
    setErrorMessage("");
  };

  // Bouton ENREGISTRER
  const handleUpdate = async () => {
    setErrorMessage("");
    
    try {
      // 1. Uploader la photo si elle a changé
      if (tempFile) {
        const user = await profileService.uploadProfilePicture(tempFile);
        setProfilePicture(user.profilePicture);
      }
      
      // 2. Mettre à jour le username si changé
      if (tempName !== name) {
        const updated = await profileService.updateUsername(tempName);
        setName(updated.username);
      }
      
      // 3. Réinitialiser
      setEditMode(false);
      setPreview(null);
      setTempFile(null);
      
    } catch (error) {
      setErrorMessage(error.message || "Une erreur est survenue lors de la mise à jour.");
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
    setProfilePicture( DEFAULT_PROFILE_PICTURE);
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
  


return (
  <div className="bg-myGray4 dark:bg-neutral-900 p-6 rounded-2xl shadow-md lg:h-auto h-auto">


<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  
  {/* Left: Back + Title */}
  <div className="flex items-center gap-3">
    <FaArrowLeft
      onClick={() => setSelectedMenu(null)}
      className="w-5 h-5 cursor-pointer text-myBlack dark:text-white lg:hidden"
    />

    <h2 className="text-2xl font-semibold whitespace-nowrap">
      {t("profile.profile")}
    </h2>
  </div>

  {/* Right: Actions */}
  {!editMode ? (
    <button
      onClick={handleEditMode}
      className="
        h-9
        w-full md:w-auto
        rounded-lg
        bg-black
        px-6
        text-xs font-semibold text-white
      "
    >
      {t("profile.edit")}
    </button>
  ) : (
    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
      <button
        onClick={handleCancel}
        className="
          h-9
          w-full md:w-auto
          rounded-lg
          border border-myBlack
          px-6
          text-xs font-semibold
          dark:bg-neutral-700
        "
      >
        {t("profile.cancel")}
      </button>

      <button
        onClick={handleUpdate}
        className="
          h-9
          w-full md:w-auto
          rounded-lg
          bg-[#008C23]
          px-6
          text-xs font-semibold text-white
          hover:bg-green-700
          dark:bg-myYellow
        "
      >
        {t("profile.save")}
      </button>
    </div>
  )}
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
            <div className="flex items-center gap-3">
            <p className="text-md">{name}</p>
            <button
  onClick={async () => {
    // Générer le QR code si pas encore fait
    if (!qrCodeData && !loadingQR) {
      await generateQRCode();
    }
    // Ouvrir la modal
    if (qrCodeData) {
      setShowQRModal(true);
    }
  }}
  disabled={loadingQR}
  className="flex items-center justify-center bg-black hover:bg-gray-800 text-white px-3 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
>
  {loadingQR ? (
    <div className="animate-spin rounded-full h-[18px] w-[18px] border-b-2 border-white"></div>
  ) : (
    <QrCode size={18} />
  )}
</button>
               
            </div>
            <p className="text-gray-500 text-xs sm:text-sm pt-1.5">{email}</p>
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

 
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col">
            <label className="text-sm mb-2">{t("profile.username")}</label>

            <div className="p-[2px] rounded-lg bg-gradient-to-r from-[#F9EE34] via-gray-300 to-transparent">
              <div className="flex items-center bg-white dark:bg-neutral-800 rounded-lg px-3">
                <FaUser className="text-gray-500 text-sm mr-2" />
                <input
                  className="w-full py-2 text-xs bg-transparent focus:outline-none"
                  value={tempName}
                  onChange={(e) => {setTempName(e.target.value)
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
                  disabled={true}
                />
              </div>
            </div>
          </div>
        </div>


        {editMode && (  
          <div className="mt-6">
          </div>
        )}
      </div>


      
      {/* ==================== */}
      {/* MODAL QR CODE AGRANDI */}
      {/* ==================== */}
      {showQRModal &&  (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-white dark:bg-neutral-800 p-6 sm:p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl "
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-14 sm:mb-16">{t("profile.votreqrcode")}</h3>

            <div className="relative mb-6">
              {/* Photo de profil - moitié sur le carré blanc, moitié en haut */}
              {profilePicture && (
                <div className="absolute -top-8 sm:-top-9 left-1/2 -translate-x-1/2 z-10">
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <img 
                      src={profilePicture} 
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              <div className="w-full aspect-square max-w-[240px] sm:max-w-[260px] mx-auto rounded-xl border-8 border-white bg-white p-4 sm:p-5 shadow-2xl pt-10 sm:pt-11">
                <img 
                  src={qrCodeData} 
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>

              <div className="absolute -top-3 -right-3 bg-[#F9EE34] text-black font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm shadow-md">
                OWLY
              </div>
            </div>

            <div className="mb-6">
              <p className="font-bold text-xl sm:text-2xl text-myGray2">@{name}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadQRCode}
                className="w-full sm:flex-1 bg-myYellow hover:bg-myYellow2 text-black py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={20} />
                 {t("profile.Telecharger")}
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full sm:flex-1 bg-myGray border-1 border-black hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 py-3 rounded-lg font-bold transition-colors"
              >
                {t("profile.Fermer")}
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

