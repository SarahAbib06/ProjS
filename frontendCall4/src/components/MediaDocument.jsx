import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import logo from "../assets/images/owlylogo.png";

import { useTranslation } from "react-i18next";
import { messageService } from "../services/messageService";

export default function MediaDocuments({ onBack, conversationId }) {
  const [activeTab, setActiveTab] = useState("media");
  const [media, setMedia] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // 🔥 CHARGER LES MÉDIAS ET FICHIERS
  useEffect(() => {
    if (conversationId) {
      loadMediaAndFiles();
    }
  }, [conversationId]);

  const loadMediaAndFiles = async () => {
    try {
      setLoading(true);
      const response = await messageService.getConversationMedia(conversationId);
      
      console.log('📁 Médias et fichiers:', response);
      
      setMedia(response.media?.items || []);
      setFiles(response.files?.items || []);
    } catch (err) {
      console.error('❌ Erreur chargement médias:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FORMATER LA TAILLE DES FICHIERS
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full bg-myGray4 p-4">
      {/* Bouton retour */}
      <div className="flex items-center gap-2 mb-4">
        <FaArrowLeft
          className="w-4 h-4 text-myBlack dark:text-myWhite cursor-pointer"
          onClick={onBack}
        />
        <h1 className="text-2xl text-myBlack dark:text-myWhite ml-3">

          {t("Media.title")}

        </h1>
      </div>

      {/* Onglets */}
      <div className="flex justify-center border-b mb-4">
        <button
          onClick={() => setActiveTab("media")}
          className={`w-1/2 text-center px-6 pb-2 ${
            activeTab === "media"
              ? "border-b-2 border-myYellow font-medium"
              : "text-gray-500"
          }`}
        >

          {t("Media.medias")}

        </button>

        <button
          onClick={() => setActiveTab("docs")}
          className={`w-1/2 text-center px-6 pb-2 ${
            activeTab === "docs"
              ? "border-b-2 border-myYellow font-medium"
              : "text-gray-500"
          }`}
        >

          {t("Media.documents")}

        </button>
      </div>


      {/* 🟡 CONTENU DES ONGLES */}
      {activeTab === "media" ? (
        fakeMedias.length === 0 ? (
          /* 🟡 EMPTY STATE POUR MEDIAS */
          <div className="flex flex-col items-center mt-25 justify-center py-10">
            <div className="w-15 h-15 rounded-2xl bg-myYellow flex items-center justify-center shadow mb-6">
              <img
                src={logo}
                alt="Logo"
                className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[300px] md:h-[300px] object-contain"
              />
            </div>
            <p className="text-lg font-bold text-myBlack dark:text-myWhite">
              {t("Media.nomedia")}
            </p>
          </div>
        ) : (
          /* AFFICHAGE MÉDIAS */
          <div className="grid grid-cols-3 gap-4">
            {media.map((item, index) => (
              <div key={index} className="relative">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt="Media"
                    className="rounded-lg object-cover w-full h-32 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(item.url, '_blank')}
                  />
                ) : (
                  <video
                    src={item.url}
                    className="rounded-lg object-cover w-full h-32 cursor-pointer"
                    onClick={() => window.open(item.url, '_blank')}
                  />
                )}
                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">
                  {item.type === 'video' && item.duration && `${Math.floor(item.duration)}s`}
                </div>
              </div>
            ))}
          </div>
        )
      ) : files.length === 0 ? (
        /* EMPTY STATE DOCUMENTS */
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-15 h-15 rounded-2xl bg-myYellow flex items-center justify-center shadow mb-6">

            <img
              src={logo}
              alt="Logo"
              className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] md:w-[300px] md:h-[300px] object-contain"
            />
          </div>
          <p className="text-lg font-bold text-myBlack dark:text-myWhite">
            {t("Media.nodocuments")}
          </p>
        </div>
      ) : (
        /* AFFICHAGE DOCUMENTS */
        <div className="space-y-3">
          {files.map((doc, index) => (
            <a
              key={index}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-myBlack dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium dark:text-myWhite truncate">
                    {doc.fileName || 'Document'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(doc.size)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}