import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const InputField = ({ 
  type, 
  name,
  placeholder, 
  icon, 
  value, 
  onChange,
  onFocus, 
  disabled = false 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="relative mb-4 w-full">
      {/* Conteneur avec dégradé en bordure */}
      <div 
        className="absolute inset-0 rounded-md" 
        style={{ 
          padding: '2px',
          background: 'linear-gradient(to right, #F9EE34, transparent)'
        }}
      >
        <div className="bg-white dark:bg-mydarkGray3 rounded-md h-full w-full"></div>
      </div>
      
      {/* Input par-dessus */}
      <div className="relative flex items-center px-4 py-3">
        {icon && <span className="text-myGray2 dark:text-myGray2 mr-2 text-lg">{icon}</span>}
        <input
          type={inputType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus} // <-- AJOUTEZ CETTE LIGNE
          disabled={disabled}
          className="text-[11px] bg-transparent focus:outline-none flex-1 text-myBlack dark:text-myWhite placeholder:text-myGray2 dark:placeholder:text-myGray2 disabled:opacity-50"
        />
        
        {/* Icône de visualisation du mot de passe */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="ml-2 text-myGray2 dark:text-myGray2 hover:text-myBlack dark:hover:text-myWhite transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? (
              <FaEyeSlash size={14} />
            ) : (
              <FaEye size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;