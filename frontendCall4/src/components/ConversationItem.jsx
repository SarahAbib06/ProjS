


export default function ConversationItem({
  avatar,
  name,
  lastMessage,
  time,
  unread,
  selected,
}) {
  return (
    <div className="relative">

      <div
        className={`
          ml-2 mr-3 px-3 py-4
          md:ml-3 md:mr-4 md:px-3 md:py-2.5   /* 🖥 desktop réduit */
          flex items-center 
          gap-2 md:gap-2.5
          cursor-pointer rounded-xl overflow-hidden
          ${selected 
            ? "bg-myYellow2 dark:bg-myYellow" 
            : "bg-[#F3F3F3] hover:bg-[#e9e9e9] dark:bg-[#2E2F2F]"
          }
        `}
      >

        {/* === AVATAR === */}
        <img
          src={avatar}
          alt={name}
          className="
            w-10 h-10 
            md:w-11 md:h-11    /* 🖥 avatar réduit */
            rounded-full object-cover shadow-sm
          "
        />

        {/* === TEXT === */}
        <div className="flex-1 min-w-0">

          <div className="flex items-center justify-between">
            <h4
              className={`
                text-sm 
                md:text-sm        /* 🖥 texte titre réduit */
                font-semibold truncate
                ${selected 
                  ? "text-myBlack dark:text-myBlack" 
                  : "text-myBlack dark:text-white"
                }
              `}
            >
              {name}
            </h4>

            <span className="text-[10px] md:text-[11px] text-gray-500 ml-2 md:ml-3">
              {time}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1 md:gap-1.5 mt-0.5 md:mt-1">
            <p className="text-[10px] md:text-[11px] text-myGray2 truncate">
              {lastMessage}
            </p>

            {unread > 0 && (
              <span
                className="
                  inline-flex items-center justify-center 
                  bg-myYellow text-myBlack
                  text-[9px] md:text-[10px] font-semibold 
                  px-1.5 py-[2px] md:px-1.5 md:py-[2px]
                  rounded-full
                "
              >
                {unread}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
