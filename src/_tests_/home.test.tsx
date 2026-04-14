/**
 * File to test the home page
 *
 * Test1 -> Hover over Create Test info icon shows description text
 * Test2 -> Mouse leave hides description for Create Test
 * Test3 -> Hover over View Your Questions info icon shows description text
 * Test4 -> Mouse leave hides description for View Your Questions
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import React from "react";

import Home from "../app/page";

// Mock the AuthContext
vi.mock("@/components/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false
  })
}));

describe("Home Page Info Icon Tests", () => {
    //1. Test for Create Test info icon to display the description only on hover
    test("Hovering over Create Test info icon shows description of the button", async () => {
        const user = userEvent.setup();
        render(<Home />);

        const infoIcon = screen.getByTestId("create-test-icon"); //Grab the create test SVG by using the test ID

        //Description should not be visible initially (user has not hovered yet)
        expect(
            screen.queryByText(/Click to create a new test by selecting saved questions/i)
        ).not.toBeInTheDocument();

        await user.hover(infoIcon); //Hover over the icon

        //Description should now be visible (user is hovering)
        expect(
            screen.getByText(/Click to create a new test by selecting saved questions/i)
        ).toBeInTheDocument();
    });

    //2. Test for Create Test info icon to hide the description on mouse leave
    test("Mouse leaving the icon hides the description of the button", async () => {
        const user = userEvent.setup();
        render(<Home />);

        const infoIcon = screen.getByTestId("create-test-icon");

        //Hover first
        await user.hover(infoIcon);

        expect(
            screen.getByText(/Click to create a new test by selecting saved questions/i)
        ).toBeInTheDocument();

        //Move mouse off of the icon
        await user.unhover(infoIcon);

        //Description should no longer be visible
        expect(
            screen.queryByText(/Click to create a new test by selecting saved questions/i)
        ).not.toBeInTheDocument();
    });

    //3. Test for View Your Questions info icon to display the description only on hover
    test("Hovering over View Your Questions info icon shows description of the button", async () => {
        const user = userEvent.setup();
        render(<Home />);

        const infoIcon = screen.getByTestId("view-questions-icon");

        expect(
            screen.queryByText(/Click to view and manage saved questions/i)
        ).not.toBeInTheDocument();

        await user.hover(infoIcon); 

        expect(
            screen.getByText(/Click to view and manage saved questions/i)
        ).toBeInTheDocument();
    });

    //4. Test for View Your Questions info icon to hide the description on mouse leave
    test("Mouse leaving the icon hides the description of the button", async () => {
        const user = userEvent.setup();
        render(<Home />);

        const infoIcon = screen.getByTestId("view-questions-icon");

        await user.hover(infoIcon);

        expect(
            screen.getByText(/Click to view and manage saved questions/i)
        ).toBeInTheDocument();

        await user.unhover(infoIcon);

        expect(
            screen.queryByText(/Click to view and manage saved questions/i)
        ).not.toBeInTheDocument();
    });
});
