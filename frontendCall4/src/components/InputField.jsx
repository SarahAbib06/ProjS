// frontend/src/components/InputField.jsx
const InputField = ({ 
  type, 
  name,
  placeholder, 
  icon, 
  value, 
  onChange,
  disabled = false 
}) => (
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
      {icon && <span className="text-myGray2 mr-2 text-lg">{icon}</span>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="text-[11px] bg-transparent focus:outline-none w-full text-myBlack placeholder:text-myGray2 disabled:opacity-50"
      />
    </div>
  </div>
);

export default InputField;