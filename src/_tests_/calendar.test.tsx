import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

//Mock the component that contains the calendar functionality
const TestCalendarComponent = ({ 
  onDateChange,
  initialDate = null 
}: { 
  onDateChange?: (date: any) => void;
  initialDate?: any;
}) => {
  const [lastUsedDate, setLastUsedDate] = React.useState(initialDate);
  const [dateInputValue, setDateInputValue] = React.useState(initialDate ? initialDate.format('MM/DD/YYYY') : '');
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [calendarAnchorEl, setCalendarAnchorEl] = React.useState<HTMLDivElement | null>(null);

  const handleDateInputChange = (inputValue: string) => {
    setDateInputValue(inputValue);
    const parsedDate = dayjs(inputValue, 'MM/DD/YYYY', true);
    if (parsedDate.isValid()) {
      setLastUsedDate(parsedDate);
      onDateChange?.(parsedDate);
    } else {
      setLastUsedDate(null);
      onDateChange?.(null);
    }
  };

  const handleCalendarChange = (newValue: any) => {
    setLastUsedDate(newValue);
    setDateInputValue(newValue ? newValue.format('MM/DD/YYYY') : '');
    setCalendarOpen(false);
    onDateChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="relative" ref={setCalendarAnchorEl}>
        <input
          type="text"
          placeholder="Ex: 01/01/2025"
          value={dateInputValue}
          onChange={(e) => handleDateInputChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
          data-testid="date-input"
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center pr-3"
          onClick={() => setCalendarOpen(true)}
          data-testid="calendar-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.994v2.25m10.5-2.25v2.25m-14.252 13.5V7.491a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v11.251m-18 0a2.25 2.25 0 0 0 2.25 2.25h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5a2.25 2.25 0 0 1 2.25-2.25h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-6.75-6h2.25m-9 2.25h4.5m.002-2.25h.005v.006H12v-.006Zm-.001 4.5h.006v.006h-.006v-.005Zm-2.25.001h.005v.006H9.75v-.006Zm-2.25 0h.005v.005h-.006v-.005Zm6.75-2.247h.005v.005h-.005v-.005Zm0 2.247h.006v.006h-.006v-.006Zm2.25-2.248h.006V15H16.5v-.005Z" />
          </svg>
        </button>
      </div>
      
      {/* Simplified DatePicker for testing */}
      {calendarOpen && (
        <div data-testid="calendar-popover" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}>
          <div className="bg-white border rounded-lg shadow-lg p-4">
            <button 
              onClick={() => handleCalendarChange(dayjs('2025-01-15'))}
              data-testid="calendar-date-15"
            >
              15
            </button>
            <button 
              onClick={() => setCalendarOpen(false)}
              data-testid="calendar-close"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </LocalizationProvider>
  );
};

describe("Calendar Component Tests", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  //1. Test if clicking the calendar icon opens the date picker
  test("Clicking the calendar icon opens the date picker", async () => {
    render(<TestCalendarComponent />);
    
    const calendarButton = screen.getByTestId("calendar-button");
    
    //Calendar should not be visible initially
    expect(screen.queryByTestId("calendar-popover")).not.toBeInTheDocument();
    
    await user.click(calendarButton);
    
    //Calendar should now be visible
    expect(screen.getByTestId("calendar-popover")).toBeInTheDocument();
  });

  //2. Test if selecting a date from the calendar updates the input field
  test("Selecting a date from the calendar updates the input field", async () => {
    const mockOnDateChange = vi.fn();
    render(<TestCalendarComponent onDateChange={mockOnDateChange} />);
    
    const calendarButton = screen.getByTestId("calendar-button");
    await user.click(calendarButton);
    
    const dateButton = screen.getByTestId("calendar-date-15");
    await user.click(dateButton);
    
    const input = screen.getByTestId("date-input") as HTMLInputElement;
    
    //Input should be updated with the selected date in MM/DD/YYYY format
    expect(input.value).toBe("01/15/2025");
    expect(mockOnDateChange).toHaveBeenCalledWith(expect.any(dayjs));
  });

  //3. Test if typing a valid date manually updates the state
  test("Typing a valid date manually updates the state", async () => {
    const mockOnDateChange = vi.fn();
    render(<TestCalendarComponent onDateChange={mockOnDateChange} />);
    
    const input = screen.getByTestId("date-input");
    
    await user.clear(input);
    await user.type(input, "12/25/2024");
    
    //Should call onDateChange with valid dayjs object
    expect(mockOnDateChange).toHaveBeenCalledWith(expect.any(dayjs));
    
    //Input should maintain the typed value
    expect((input as HTMLInputElement).value).toBe("12/25/2024");
  });

  //4. Test if typing an invalid date shows no validation error but sets date to null
  test("Typing an invalid date sets date to null", async () => {
    const mockOnDateChange = vi.fn();
    render(<TestCalendarComponent onDateChange={mockOnDateChange} />);
    
    const input = screen.getByTestId("date-input");
    
    await user.clear(input);
    await user.type(input, "invalid-date");
    
    //Should call onDateChange with null for invalid dates
    expect(mockOnDateChange).toHaveBeenCalledWith(null);
    
    //Input should still show the typed value (no validation error displayed)
    expect((input as HTMLInputElement).value).toBe("invalid-date");
  });

  //5. Test if closing the calendar without selection keeps previous value
  test("Closing the calendar without selection keeps previous value", async () => {
    const initialDate = dayjs('2024-06-15');
    render(<TestCalendarComponent initialDate={initialDate} />);
    
    const input = screen.getByTestId("date-input") as HTMLInputElement;
    const initialValue = input.value;
    
    const calendarButton = screen.getByTestId("calendar-button");
    await user.click(calendarButton);
    
    const closeButton = screen.getByTestId("calendar-close");
    await user.click(closeButton);
    
    //Value should remain unchanged after closing without selection
    expect(input.value).toBe(initialValue);
  });

  //6. Test date format in input field is MM/DD/YYYY
  test("Date format in input field is MM/DD/YYYY", async () => {
    const initialDate = dayjs('2024-06-15');
    render(<TestCalendarComponent initialDate={initialDate} />);
    
    const input = screen.getByTestId("date-input") as HTMLInputElement;
    
    //Should display date in MM/DD/YYYY format
    expect(input.value).toBe("06/15/2024");
    
    //Test manual entry format
    await user.clear(input);
    await user.type(input, "03/08/2025");
    
    expect(input.value).toBe("03/08/2025");
  });

  //7. Test that placeholder text is correct
  test("Input has correct placeholder text", () => {
    render(<TestCalendarComponent />);
    
    const input = screen.getByPlaceholderText("Ex: 01/01/2025");
    expect(input).toBeInTheDocument();
  });
});