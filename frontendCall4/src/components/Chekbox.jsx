// frontend/src/components/Checkbox.jsx
const Checkbox = ({ label, checked, onChange }) => (
  <div className="flex items-center mb-4">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 text-myYellow bg-gray-100 border-gray-300 rounded focus:ring-myYellow focus:ring-2"
    />
    <label className="ml-2 text-[11px] text-myBlack dark:text-myWhite ">
      {label}
    </label>
  </div>
);

export default Checkbox;