'use client';

import React, { useState, useRef, useEffect } from 'react';

//Setting up the properties for the SelectBox component
interface SelectBoxProps {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSelect?: (value: string) => void;
  defaultValue?: string;
  value?: string;
}

//Make a select box component that allows users to select from a list of options
export default function SelectBox({
  label = 'Select',
  options,
  placeholder = 'Select an option',
  onSelect,
  defaultValue = '',
  value = ''
}: SelectBoxProps) { //All the work is done inside this component once user interacts with it
  //Set up the selection and dropdown states
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>(() => {
    //Initialize the selected label based on the default value
    //Use value if provided, otherwise use defaultValue
    const currentValue = value !== undefined && value !== '' ? value : defaultValue;
    const option = options.find((opt) => opt.value === currentValue);
    return option ? option.label : '';
  });

  const selectBoxRef = useRef<HTMLDivElement>(null); //Reference for the select box so it can be closed when clicking outside

  //Update selected label when value prop changes
  useEffect(() => {
    const currentValue = value !== undefined && value !== '' ? value : defaultValue;
    const option = options.find((opt) => opt.value === currentValue);
    setSelectedLabel(option ? option.label : '');
  }, [value, defaultValue, options]);

  //Effect to handle clicks outside the select box to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if(selectBoxRef.current && !selectBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    //Sets up an event listener which checks each mouse down to see if its outside the select box and cleans up after itself
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  //Selects an option from the dropdown and updates the selected label accordingly
  const handleSelect = (option: { value: string; label: string }) => {
    setSelectedLabel(option.label); //Update the selected label
    setIsOpen(false); //Close the dropdown since an option has been selected
    onSelect?.(option.value);
  };

  return (
    <div className="text-left" ref={selectBoxRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Container for "input" box and dropdown */}
      <div className="relative">
        {/* Visible selection box */}
        <div className="w-full px-4 py-3 border border-gray-900 rounded-xl bg-white text-gray-800
                     focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent
                     transition-all cursor-pointer flex justify-between items-center"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={selectedLabel ? '' : 'text-gray-400'}>
            {selectedLabel || placeholder}
          </span>

          {/* Dropdown arrow */}
          <svg
            className={`h-5 w-5 text-gray-400 transform transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl 
                       shadow-lg max-h-60 overflow-auto"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index === 0 ? 'rounded-t-xl' : ''
                } ${index === options.length - 1 ? 'rounded-b-xl' : ''}`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
