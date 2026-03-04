import React, { useState, useRef, useEffect } from "react";

const Select = ({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar",
  className = "",
}) => {
    const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    // <select
    //   className={`px-4 py-3 border-b border-[var(--white-color)] text-sm font-medium text-[var(--ins-text-white)] outline-none focus:border-[var(--secondary-color)] shadow-sm cursor-pointer ${className}`}
    //   value={value}
    //   onChange={onChange}
    // >
    //   {placeholder && (
    //     <option value="">{placeholder}</option>
    //   )}

    //   {options.map((option) => (
    //     <option key={option.value} value={option.value} className="bg-[var(--ins-background-color)]">
    //       {option.label}
    //     </option>
    //   ))}
    // </select>

    // Se hizo asi porque el anterior no se puede modificar el estilo de cada option, y se necesita un fondo oscuro para el dropdown

    <div className="relative w-60 " ref={selectRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className=" px-4 py-3 mt-1 border-b-1 border-[var(--ins-text-gray)] text-sm font-medium text-[var(--ins-text-white)] cursor-pointer flex justify-between items-center"
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className="ml-2">▼</span>
      </div>
      {isOpen && (
        <div className="absolute mt-2 w-full bg-[var(--ins-background)] text-[var(--ins-text-white)] shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 text-sm cursor-pointer hover:bg-white/10 transition"
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;