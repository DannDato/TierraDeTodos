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
              className="px-4 py-2 text-sm cursor-pointer hover:bg-white/10 transition z-50"
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