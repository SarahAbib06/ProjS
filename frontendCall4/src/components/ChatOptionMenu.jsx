import { useTranslation } from "react-i18next";
import { Info, Star, Archive, Lock, Ban, Trash2 } from "lucide-react";


export default function ChatOptionsMenu({ selectedChat, onClose, onOpenSearch}) {

  const { t } = useTranslation();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-30"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="absolute right-4 top-14 w-60 bg-myGray4 dark:bg-neutral-800 shadow-xl rounded-xl p-2 z-40">

        <div
          className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
          onClick={() => {
            onClose();        
            selectedChat.openInfo(); 
          }}
        >
          <Info size={15} />
          <span>{t("chatOptions.infoOn")} {selectedChat.name}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
          <Star size={15} />
          <span>{t("chatOptions.addToFavorites")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
          <Archive size={15} />
          <span>{t("chatOptions.archiveConversation")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
          <Lock size={15} />
          <span>{t("chatOptions.lockConversation")}</span>
        </div>
         <hr className="border-gray-400 dark:border-gray-700 my-1" />
   
        <div className="flex items-center gap-2 text-xs text-red-600 cursor-pointer py-2 px-2 rounded-md hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150">
          <Ban size={15} />
          <span>{t("chatOptions.block")}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-red-600 cursor-pointer py-2 px-2 rounded-md hover:bg-red-100 dark:hover:bg-red-700 transition-colors duration-150">
          <Trash2 size={15} />
          <span>{t("chatOptions.deleteConversation")}</span>
        </div>

           {/* ✅ Nouvelle option : Rechercher */}
 <button
  onClick={() => { onOpenSearch(); onClose(); }}
  className="flex items-center gap-2 text-xs text-gray-900 dark:text-gray-200 cursor-pointer py-2 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
>
  🔍 {t("chat.searchButton")}
</button>

      </div>
    </>
  );
}
