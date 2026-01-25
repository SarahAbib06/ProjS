 import React, { useState } from "react";
import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

function LockCustomIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#9E9E9E"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 1C9.24 1 7 3.24 7 6V9H6C4.9 9 4 9.9 4 11V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V11C20 9.9 19.1 9 18 9H17V6C17 3.24 14.76 1 12 1ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V9H9V6ZM12 14C10.9 14 10 14.9 10 16C10 16.74 10.4 17.38 11 17.72V19H13V17.72C13.6 17.38 14 16.74 14 16C14 14.9 13.1 14 12 14Z"/>
    </svg>
  );
}


export default function ModifierMotDePasse({ onClose }) {

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="bg-myGray4 dark:bg-mydarkGray3 rounded-xl p-8 w-full shadow-sm font-poppins">

      {/* TITRE */}
      <div className="flex items-center gap-2 mb-6">


        <svg
  xmlns="http://www.w3.org/2000/svg"
  width="28"
  height="28"
  viewBox="0 0 24 24"
  fill="none"
  stroke="black"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className="cursor-pointer"
  onClick={onClose} 
>
  <path d="M9 5l-7 7 7 7" />
  <path d="M2 12h16a4 4 0 0 1 4 4v3" />
</svg>
        <h2 className="text-xl font-bold">Modifier le mot de passe</h2>
      </div>

      <p className="text-sm mb-6 text-[#575757]">Changer votre mot de passe actuel</p>

      <div className="flex flex-col gap-5 max-w-lg">

        {/* INPUT 1 — Ancien mot de passe */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">
            
        <MdLock className="text-gray-400" size={24} />



            <input
              type={showOld ? "text" : "password"}
              placeholder="Mot de passe actuel"
              className="w-full p-3 bg-transparent outline-none"
            />

            <button type="button" onClick={() => setShowOld(!showOld)}>
              {showOld ? (
                <MdVisibilityOff size={22} className="text-gray-400"/>
              ) : (
                <MdVisibility size={22} className="text-gray-400"/>
              )}
            </button>
          </div>
        </div>

        {/* INPUT 2 — Nouveau mot de passe */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">
            
            <MdLock className="text-gray-400" size={24} />



            <input
              type={showNew ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              className="w-full p-3 bg-transparent outline-none"
            />

            <button type="button" onClick={() => setShowNew(!showNew)}>
              {showNew ? (
                <MdVisibilityOff size={22}className="text-gray-400" />
              ) : (
                <MdVisibility size={22}className="text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* INPUT 3 — Confirmer */}
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-myYellow to-myGray">
          <div className="relative flex items-center bg-white dark:bg-mydarkWhite rounded-xl px-4">
            
            <MdLock className="text-gray-400" size={24} />



            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmer votre mot de passe"
              className="w-full p-3 bg-transparent outline-none"
            />

            <button type="button" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? (
                <MdVisibilityOff size={22} className="text-gray-400"/>
              ) : (
                <MdVisibility size={22} className="text-gray-400"/>
              )}
            </button>
          </div>
        </div>

        {/* BOUTON */}
        <button className="bg-green-600 text-white py-2 px-6 rounded-xl w-fit font-semibold">
          Enregistrer
        </button>

      </div>
    </div>
  );
}
