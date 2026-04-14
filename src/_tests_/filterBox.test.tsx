/**
 * File to test the filter box component
 *
 * Test1 -> Clicking the input opens the dropdown with all options
 * Test2 -> Typing in input filters options
 * Test3 -> Selecting an option closes the dropdown
 * Test4 -> Displays that no options were found when no option can be found in database
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import FilterBox from "../components/filterBox";

describe("FilterBox Component Tests", () => {
    const options = [
        { value: "math", label: "Mathematics" },
        { value: "science", label: "Science" },
        { value: "history", label: "History" },
    ];

    //1. Test if clicking the input opens the dropdown with all options
    test("Clicking the input opens the dropdown and displays all options", async () => {
        const user = userEvent.setup();

        render(<FilterBox options={options} />);
        const input = screen.getByPlaceholderText("All Topics"); //Get the input box

        //Dropdown should not be visible initially
        expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();

        await user.click(input); //Click the box to open the dropdown options

        //All options should now be visible
        expect(screen.getByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("Science")).toBeInTheDocument();
        expect(screen.getByText("History")).toBeInTheDocument();
    });

    //2. Test if typing filters the options
    test("Typing in input filters options", async () => {
        const user = userEvent.setup();
        render(<FilterBox options={options} />);
        const input = screen.getByPlaceholderText("All Topics");

        await user.type(input, "science"); //Type to filter options

        //Expecting only "Science" to be visible
        expect(screen.getByText("Science")).toBeInTheDocument();
        expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
        expect(screen.queryByText("History")).not.toBeInTheDocument();
    });

    //3. Test if selecting an option closes the dropdown
    test("Selecting an option closes the dropdown", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn(); //Mock function to test clicking the option

        render(<FilterBox options={options} onSelect={onSelect} />);
        const input = screen.getByPlaceholderText("All Topics");

        await user.click(input); //Open dropdown
        const option = screen.getByText("Mathematics"); //Get an option
        await user.click(option); //Click the option

        //onSelect should be called with correct value
        expect(onSelect).toHaveBeenCalledWith("math");

        //Dropdown should now close
        expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();
        expect(screen.queryByText("Science")).not.toBeInTheDocument();
        expect(screen.queryByText("History")).not.toBeInTheDocument();
    });

    //4. Test if message displays when input doesn't match
    test("Displays 'No options found' when no option can be found in database", async () => {
        const user = userEvent.setup();
        render(<FilterBox options={options} />);
        const input = screen.getByPlaceholderText("All Topics");

        await user.type(input, "xyz"); //Type a string that matches no options

        expect(screen.getByText("No options found")).toBeInTheDocument(); //Expect the no options message
    });
});