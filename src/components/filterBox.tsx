'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';

//Setting up the properties for the FilterBox component (Only works with searching for topics right now)
interface FilterBoxProps {
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
  onSelect?: (value: string) => void;
  value?: string;
  page?: string;
  allowCustom?: boolean;
}

//Make a filter box component that allows users to filter through a list of options
export default function FilterBox({
  options,
  label = "Topic",
  placeholder = "All Topics",
  onSelect,
  value = '',
  page = '',
  allowCustom = false
}: FilterBoxProps) { //All the work is done inside this component once user interacts with it
  //Set up the selection and input states
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [lastSelectedValue, setLastSelectedValue] = useState(value);
  const filterBoxRef = useRef<HTMLDivElement>(null); //Reference for the filter box so it can be closed when clicking outside
  const [customValue, setCustomValue] = useState('');

  //Keep the input value in sync with the value prop
  useEffect(() => {
    setInputValue(value);
    setLastSelectedValue(value);
  }, [value]);

  //Compares the input value to the options and filters them accordingly disregarding case sensitivity
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  useEffect(() => {
    //If the user clicks outside the filter box, close the dropdown
    function clickOutside(event: MouseEvent) {
      if (filterBoxRef.current && !filterBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    //Sets up an event listener which checks each mouse down to see if its outside the filter box and cleans up after itself
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  //Selects an option from the dropdown and updates the input value accordingly
  const select = (option: { value: string; label: string }) => {
    setInputValue(option.value === '' ? '' : option.label); //Update the input value
    setLastSelectedValue(option.value);
    setCustomValue('');
    setIsOpen(false); //Close the dropdown since an option has been made
    onSelect?.(option.value);
  };

  //Handles changes to the input field
  const inputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    //Open the dropdown when typing
    if (!isOpen) {
      setIsOpen(true);
    }

    //If we have a custom entry, set it as a custom value
    const matchingOption = options.find(opt =>
      opt.label.toLowerCase() === newValue.toLowerCase() ||
      opt.value === newValue
    );

    if (!matchingOption && newValue.trim() !== '') {
      setCustomValue(newValue);
    } else {
      setCustomValue('');
    }

    //If the input clears, clear the selection
    if (newValue === '') {
      setLastSelectedValue('');
      onSelect?.('');
    }
    else {
      //If we are typing and had a previous selection clear it
      if (lastSelectedValue && newValue != options.find(opt => opt.value === lastSelectedValue)?.label) {
        setLastSelectedValue('');
        onSelect?.('');
      }
    }
  };

  //Handles focus on the input field
  const inputFocus = () => {
    setIsOpen(true);
  };

  //Handle blur on the input field
  const inputBlur = () => {
    setTimeout(() => {
      if (customValue.trim() !== '' && allowCustom) {
        setInputValue(customValue);
        onSelect?.(customValue);
      }
      setIsOpen(false);
    }, 200);
  };

  //Clear button 
  const handleClear = () => {
    setInputValue('');
    setLastSelectedValue('');
    setCustomValue('');
    onSelect?.('');
    setIsOpen(false);
  };

  //Handle use custom option click
  const handleUseCustom = () => {
    const customVal = inputValue.trim();
    if (customVal !== '' && allowCustom) {
      setCustomValue(customVal);
      onSelect?.(customVal);
      setIsOpen(false);
    }
  };

  return (
    //Filter box using reference for detecting clicks
    <div className="text-left" ref={filterBoxRef}>
      {page === "questionForm" ? (
        <label className="block text-sm font-medium text-gray-700">
        </label>
      ) : (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Container for input and dropdown */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={inputChange}
          onFocus={inputFocus}
          onBlur={inputBlur}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-text"
        />

        {/* Clear button (X) when there's text */}
        {inputValue && page !== "questionForm" && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-6 flex items-center pr-1 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
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

        {/* Dropdown choices */}
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            { /* Render filtered options if any exist, otherwise display a message for no options found */}
            {filteredOptions.length > 0 ? (
              <>
                {/*Each option in the dropdown*/}
                {filteredOptions.map((option, index) => (
                  //Each option is clickable and edges are rounded appropriately for the options
                  <div
                    key={option.value}
                    onClick={() => select(option)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${index === 0 ? 'rounded-t-xl' : ''
                      } ${index === filteredOptions.length - 1 ? 'rounded-b-xl' : ''
                      } ${filteredOptions.length === 1 ? 'rounded-xl' : ''
                      }`}
                  >
                    {option.label}
                  </div>
                ))}
                {allowCustom && inputValue.trim() !== '' &&
                  !filteredOptions.some(opt =>
                    opt.label.toLowerCase() === inputValue.toLowerCase() ||
                    opt.value.toLowerCase() === inputValue.toLowerCase()
                  ) && (
                    <div
                      onClick={handleUseCustom}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors bg-blue-50 text-blue-600 rounded-b-xl border-t border-gray-200"
                    >
                      Use custom: "{inputValue}"
                    </div>
                  )}
              </>
            ) : page !== "questionForm" ? (
              <div className="px-4 py-3 text-gray-500 rounded-xl">
                No options found
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}