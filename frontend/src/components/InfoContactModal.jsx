import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Archive, Lock, Ban, Trash2 } from "lucide-react";
import {  FaChevronRight } from "react-icons/fa";
import MediaDocument from "./MediaDocument";

export default function InfoContactModal({ chat, onClose }) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("info");

  //  état pour le zoom image
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <>
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      ></div>

      {/* IMAGE FULLSCREEN MODAL */}
      {isImageOpen && (
  <div 
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]"
    onClick={() => setIsImageOpen(false)}
  >
    {/* CONTENEUR CARRÉ */}
    <div className="w-[380px] h-[380px] rounded-full overflow-hidden shadow-2xl"
         style={{ maxWidth: "90vw", maxHeight: "90vh" }}>
      
      <img 
        src={chat.avatar}
        className="w-full h-full object-cover"
      />
    </div>
  </div>
)}

     

      {/* RIGHT PANEL */}
      <div className="absolute inset-0 bg-myGray4 dark:bg-neutral-800 shadow-xl z-50 p-6 overflow-y-auto">

        {activeSection !== "media" && (
          <button className="text-2xl mb-4" onClick={onClose}>✕</button>
        )}

        {activeSection === "media" && (
          <MediaDocument onBack={() => setActiveSection("info")} />
        )}

        {/* SECTION INFO */}
        {activeSection === "info" && (
          <div>
            {/* Avatar + Name */}
            <div className="flex flex-col items-center">
              
              {/* 👉 Clique pour agrandir */}
              <img
                src={chat.avatar}
                className="w-24 h-24 rounded-full object-cover mb-2 cursor-pointer hover:scale-105 transition"
                onClick={() => setIsImageOpen(true)}
              />

              <h2 className="text-lg font-semibold">{chat.name}</h2>
              <p className="text-sm text-gray-500">email@emailemai.com</p>
            </div>

            {/* MENU */}
            <div className="text-sm space-y-1 mt-4">

              <div
                className="cursor-pointer py-2 px-2 rounded-md  hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setActiveSection("media")}
              >
                <div className="flex items-center justify-between">
                {t("infoContactModal.mediaDocuments")}
                <FaChevronRight className="text-gray-400" />
                </div>
              
              </div>
               <hr className="border-gray-300" />


               <div
  className="cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
  onClick={() => {
    chat.openTheme();  // ouvre le ThemeSelector
    onClose();         // ferme l'info
  }}
>
   <div className="flex items-center justify-between">
  {t("infoContactModal.themes")}
  <FaChevronRight className="text-gray-400" />
  </div>
</div>
              


              
              <hr className="border-gray-300" />

              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Star size={15} />
                <span>{t("infoContactModal.addToFavorites")}</span>
              </div>

              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Archive size={15} />
                <span>{t("infoContactModal.archiveConversation")}</span>
              </div>

              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <Lock size={15} />
                <span>{t("infoContactModal.lockConversation")}</span>
              </div>

              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700">
                <Ban size={15} />
                <span>{t("infoContactModal.block")}</span>
              </div>

              <div className="cursor-pointer flex items-center gap-2 py-2 px-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-700">
                <Trash2 size={15} />
                <span>{t("infoContactModal.deleteConversation")}</span>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
