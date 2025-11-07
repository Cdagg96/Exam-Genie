/**
 * File to test the SelectBox component
 *
 * Test1 -> Clicking the input opens the dropdown with all options
 * Test2 -> Selecting an option closes the dropdown
 * Test3 -> Displays default value correctly when provided
 */

import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import SelectBox from "../components/SelectBox";

describe("SelectBox Component Tests", () => {
    const options = [
        { value: "math", label: "Mathematics" },
        { value: "science", label: "Science" },
        { value: "history", label: "History" },
    ];

    //1. Test if clicking the box opens the dropdown with all options
    test("Clicking the box opens the dropdown and displays all options", async () => {

        const user = userEvent.setup();
        render(<SelectBox options={options} />);
        const box = screen.getByText("Select an option"); //Get the select box

        //Dropdown should not be visible initially
        expect(screen.queryByText("Mathematics")).not.toBeInTheDocument();

        await user.click(box); //Click the box to open the dropdown options

        //All options should now be visible
        expect(screen.getByText("Mathematics")).toBeInTheDocument();
        expect(screen.getByText("Science")).toBeInTheDocument();
        expect(screen.getByText("History")).toBeInTheDocument();
    });

    //2. Test if selecting an option closes the dropdown
    test("Selecting an option closes the dropdown", async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn(); //Mock function to test clicking the option

        render(<SelectBox options={options} onSelect={onSelect} />);
        const box = screen.getByText("Select an option");
        await user.click(box); //Open the dropdown
        const option = screen.getByText("Mathematics");
        await user.click(option); //Select the option

        //Dropdown should be closed now
        expect(screen.queryByText("Science")).not.toBeInTheDocument();
        expect(onSelect).toHaveBeenCalledWith("math"); //Ensure onSelect was called with correct value
    });

    //3. Test if default value is displayed correctly
    test("Displays default value correctly when provided", () => {
        render(<SelectBox options={options} defaultValue="science" />);

        expect(screen.getByText("Science")).toBeInTheDocument();
    });
});