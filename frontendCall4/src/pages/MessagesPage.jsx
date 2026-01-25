// frontend/src/pages/MessagesPage.jsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import WelcomeChatScreen from "../components/WelcomeChatScreen";
import { Search, Plus, QrCode  } from "lucide-react";
import SearchModal from "../components/SearchModal"; // NOUVEAU COMPOSANT
export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false); // ÉTAT POUR LA MODAL


  const { setChatOpen } = useOutletContext();

  const openChat = (chat) => {
    setSelectedChat(chat);
    setChatOpen(true);
  };

  const closeChat = () => {
    setSelectedChat(null);


    setChatOpen(false);
  };

  return (
    <div className="flex h-screen relative">
      
      {/* === BOUTON NOUVELLE DISCUSSION === */}



      {/* LISTE DES CONVERSATIONS */}
      <div className={`
        ${selectedChat ? "hidden md:block" : "block"} 
        w-full md:w-[360px] border-r border-gray-300 dark:border-gray-700
      `}>
        <ConversationList
  onSelect={openChat}
  onNewChat={() => setShowSearchModal(true)}
/>
      </div>

      {/* FENÊTRE DE CHAT */}
      <div className={`flex-1 ${selectedChat ? "block" : "hidden md:block"}`}>
        {selectedChat ? (
          <ChatWindow
            selectedChat={selectedChat}
            onBack={closeChat}
          />
        ) : (
          <div className="hidden md:flex flex-1 h-full w-full justify-center items-center">
            <WelcomeChatScreen />
          </div>
        )}
      </div>


      {/* === MODAL DE RECHERCHE === */}
      {showSearchModal && (
        <SearchModal 
          onClose={() => setShowSearchModal(false)}
          onUserSelect={(user) => {
            setShowSearchModal(false);
            // Créer ou ouvrir une conversation avec cet utilisateur
            openChat({
              _id: `direct_${user._id}`,
              type: 'direct',
              participants: [user],
              lastMessage: null
            });
          }}
        />
      )}
    </div>
  );
}
