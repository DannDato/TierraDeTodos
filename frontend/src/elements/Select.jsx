import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const Select = ({
  value,
  onChange,
  options = [],
  placeholder = "Seleccionar",
  className = "",
  searchable = false,
  searchPlaceholder = "Escribe para filtrar...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 240, maxHeight: 256 });

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = searchable
    ? options.filter((option) => String(option?.label || "").toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : options;

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
      return next;
    });
  };

  const openAndHighlightFirst = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyboardNavigation = (event) => {
    const hasOptions = filteredOptions.length > 0;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openAndHighlightFirst();
        return;
      }

      if (!hasOptions) return;
      setHighlightedIndex((prev) => (prev + 1 >= filteredOptions.length ? 0 : prev + 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openAndHighlightFirst();
        return;
      }

      if (!hasOptions) return;
      setHighlightedIndex((prev) => (prev <= 0 ? filteredOptions.length - 1 : prev - 1));
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) {
        event.preventDefault();
        openAndHighlightFirst();
        return;
      }

      if (hasOptions && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        event.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
      return;
    }

    if (event.key === "Tab" && isOpen) {
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (!isOpen || !selectRef.current) return;

    const updateDropdownPosition = () => {
      if (!selectRef.current) return;

      const rect = selectRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const desiredHeight = 256;
      const gap = 6;
      const margin = 8;
      const width = rect.width;

      const shouldOpenUp = spaceBelow < 200 && rect.top > spaceBelow;
      const maxHeight = Math.max(
        120,
        Math.floor(shouldOpenUp ? rect.top - gap : viewportHeight - rect.bottom - gap)
      );

      let left = rect.left;
      if (left + width > viewportWidth - margin) {
        left = viewportWidth - width - margin;
      }
      left = Math.max(margin, left);

      setDropdownPosition({
        top: shouldOpenUp ? Math.max(gap, rect.top - Math.min(desiredHeight, maxHeight) - gap) : rect.bottom + gap,
        left,
        width,
        maxHeight,
      });
    };

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideSelect = selectRef.current?.contains(event.target);
      const isInsideDropdown = dropdownRef.current?.contains(event.target);

      if (!isInsideSelect && !isInsideDropdown) {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = filteredOptions.findIndex((option) => option.value === value);
    if (selectedIndex >= 0) {
      setHighlightedIndex(selectedIndex);
      return;
    }

    setHighlightedIndex(filteredOptions.length ? 0 : -1);
  }, [isOpen, value, filteredOptions]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) return;

    const optionNode = optionRefs.current[highlightedIndex];
    optionNode?.scrollIntoView({ block: "nearest" });
  }, [isOpen, highlightedIndex]);

  return (

    <div className={`relative ${className}`} ref={selectRef}>
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyboardNavigation}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        className="px-4 py-3 mt-1 border-b-1 border-[var(--ins-text-gray)] text-sm font-medium text-[var(--ins-text-white)] cursor-pointer flex justify-between items-center"
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className="ml-2">▼</span>
      </div>
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-[var(--ins-background)] text-[var(--ins-text-white)] shadow-2xl z-[9999] border border-white/10 rounded-lg overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {searchable ? (
            <div className="px-3 pt-3 pb-2 border-b border-white/10">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={handleKeyboardNavigation}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm text-[var(--ins-text-white)] placeholder:text-white/45 outline-none focus:ring-2 focus:ring-[var(--secondary-color)]/45"
                autoFocus
              />
            </div>
          ) : null}

          <div className="overflow-y-auto" style={{ maxHeight: `${dropdownPosition.maxHeight}px` }}>
            {filteredOptions.length ? filteredOptions.map((option) => (
              <div
                key={option.value}
                ref={(node) => {
                  const index = filteredOptions.findIndex((item) => item.value === option.value);
                  optionRefs.current[index] = node;
                }}
                onClick={() => handleSelect(option)}
                className={`px-4 py-2 text-sm cursor-pointer transition ${
                  filteredOptions[highlightedIndex]?.value === option.value
                    ? "bg-white/15"
                    : "hover:bg-white/10"
                }`}
              >
                {option.label}
              </div>
            )) : (
              <div className="px-4 py-3 text-sm text-[var(--ins-text-gray)]">Sin resultados</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Select;