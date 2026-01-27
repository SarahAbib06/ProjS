 import React from 'react';

const MessageRequestBanner = ({ conversationName, conversationAvatar, onAccept, onDelete }) => {
  return (
    <div className="
      sticky top-0 z-40
      bg-myYellow2/95
      backdrop-blur-xl
      border-b border-myYellow2/40
      shadow-lg shadow-myYellow2/30
      px-4 py-3 sm:px-5 sm:py-3.5
    ">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5">
        
        {/* Avatar + texte */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-shrink-0">
            <img
              src={conversationAvatar || '/default-avatar.png'}
              alt={conversationName}
              className="
                w-12 h-12 sm:w-14 sm:h-14
                rounded-2xl 
                object-cover 
                border-3 border-white/60 
                shadow-md shadow-myYellow2/30
              "
            />
            
          </div>

          <div className="min-w-0">
            <p className="
              font-bold text-base sm:text-lg 
              text-myBlack tracking-tight truncate
            ">
              {conversationName}
            </p>
            <p className="
              text-xs sm:text-sm text-myBlack/90 
              mt-0.5 font-medium
            ">
              veut discuter avec toi ! 
            </p>
          </div>
        </div>

        {/* Boutons ENCORE PLUS PETITS */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={onAccept}
            className="
              bg-white hover:bg-gray-50
              text-myBlack font-semibold
              px-5 py-2 sm:px-6 sm:py-2.5
              rounded-xl text-sm sm:text-base
              shadow hover:shadow-md
              transition-all duration-300
              active:scale-95
              flex items-center gap-1.5 flex-1 sm:flex-none
              border-b-3 border-myYellow2/60
            "
          >
            Accepter
            
          </button>

          <button
            onClick={onDelete}
            className="
              bg-myBlack/10 hover:bg-myBlack/15
              backdrop-blur-sm
              border border-myBlack/25
              text-myBlack font-medium
              px-5 py-2 sm:px-6 sm:py-2.5
              rounded-xl text-sm sm:text-base
              transition-all duration-300
              active:scale-95
              hover:shadow-sm
              flex-1 sm:flex-none
            "
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageRequestBanner;