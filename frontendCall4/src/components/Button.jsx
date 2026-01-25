// src/components/Button.jsx
const Button = ({ type = "button", label, onClick, className = "" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        relative overflow-hidden
        cursor-pointer
        bg-myBlack text-myWhite 
        text[14px]
        w-full md:w-[320px] py-3 rounded-lg 
        font-semibold text-[12px]
        transition-all duration-300 
        hover:scale-[1.01] hover:shadow-xl
        active:scale-[0.98]
        group
        ${className}
      `}
    > 
      {/* Effet de brillance au survol */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                       translate-x-[-100%] group-hover:translate-x-[100%] 
                       transition-transform duration-700 ease-in-out"></span>
      
      
      {/* Texte */}
      <span className="relative z-10">{label}</span>
    </button>
  );
};

export default Button;