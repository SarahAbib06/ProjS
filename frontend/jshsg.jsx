// frontend/src/pages/MessagesPage.jsx
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import ConversationList from "../components/ConversationList";
import ChatWindow from "../components/ChatWindow";
import WelcomeChatScreen from "../components/WelcomeChatScreen";
import { Search, Plus, QrCode, PanelLeftClose } from "lucide-react";
import SearchModal from "../components/SearchModal";
import ResizablePanel from "../components/ResizablePanel";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [panelWidth, setPanelWidth] = useState(360);

  const { setChatOpen } = useOutletContext();

  const openChat = (chat, isFromArchived = false) => {
    setSelectedChat({
      ...chat,
      isFromArchived,
    });
    setChatOpen(true);
  };

  const closeChat = () => {
    setSelectedChat(null);
    setChatOpen(false);
  };

  const handleResize = (newWidth) => {
    setPanelWidth(newWidth);
  };

  return (
    <div className="flex h-screen relative">
      {/* LISTE DES CONVERSATIONS */}
      <div className={`
        ${selectedChat ? "hidden md:block" : "block"} 
        border-r border-gray-300 dark:border-gray-700
        w-full md:w-auto
      `}>
        {/* Version mobile : ConversationList normal */}
        <div className="md:hidden h-full">
          <ConversationList
            onSelect={openChat}
            onNewChat={() => setShowSearchModal(true)}
          />
        </div>
        
        {/* Version desktop : avec ResizablePanel */}
        <div className="hidden md:block h-full">
          <ResizablePanel 
            defaultWidth={360}
            minWidth={280}
            maxWidth={600}
            onResize={handleResize}
          >
            <ConversationList
              onSelect={openChat}
              onNewChat={() => setShowSearchModal(true)}
            />
          </ResizablePanel>
        </div>
      </div>

      {/* FENÊTRE DE CHAT */}
      <div className={`flex-1 ${selectedChat ? "block" : "hidden md:block"}`}>
        {selectedChat ? (
          <>
            <ChatWindow
              selectedChat={selectedChat}
              onBack={closeChat}
            />
            {/* Bouton retour sur mobile */}
            <button
              onClick={closeChat}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow md:hidden"
            >
              <PanelLeftClose size={20} />
            </button>
          </>
        ) : (
          <div className="hidden md:flex flex-1 h-full w-full justify-center items-center">
            <WelcomeChatScreen />
          </div>
        )}
      </div>

      {/* MODAL DE RECHERCHE */}
      {showSearchModal && (
        <SearchModal 
          onClose={() => setShowSearchModal(false)}
          onUserSelect={async (user) => {
            setShowSearchModal(false);
            const token = localStorage.getItem('token');

            try {
              const res = await fetch('http://localhost:5000/api/conversations/private', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ receiverId: user._id })
              });

              if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erreur serveur');
              }

              const data = await res.json();

              if (data.success && data.conversation) {
                openChat({
                  _id: data.conversation._id,
                  type: 'private',
                  participants: [user]
                });
              }
            } catch (err) {
              console.error(err);
              alert("Impossible d'ouvrir la conversation");
            }
          }}
        />
      )}
    </div>
  );
}