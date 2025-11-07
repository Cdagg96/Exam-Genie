"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {

  //Login states
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  //Register states
  const [registerData, setRegisterData] = useState({
    role: "",
    email: "",
    password: ""
  });

  //gets the users log in information
  const { login } = useAuth();

  //Alert states
  const [loginAlert, setLoginAlert] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [registerAlert, setRegisterAlert] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  // Don’t render anything if not open
  if (!isOpen) return null;

  //Handle login input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  //Handle register input changes
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  //Handle login submission
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setLoginAlert({
        type: "error",
        message: "Not all login fields are filled out."
      });
      //Clear Alert 3 seconds
      setTimeout(() => {
        setLoginAlert({ type: null, message: "" });
      }, 3000);
      return;
    } 

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginAlert({ type: "error", message: data.message || "Login failed." });
      } else {
        setLoginAlert({ type: "success", message: "Login successful!" });
        login(data.user);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setLoginAlert({ type: "error", message: "Server error. Try again later." });
    }

    setTimeout(() => {
      setLoginAlert({ type: null, message: "" });
    }, 3000);
  };

  //Handle register submission
  const handleRegister = async () => {
    if (!registerData.role || !registerData.email || !registerData.password) {
      setRegisterAlert({
        type: "error",
        message: "Not all register fields are filled out."
      });
      //Clear Alert 3 seconds
      setTimeout(() => {
        setRegisterAlert({ type: null, message: "" });
      }, 3000);
    } else {
      try {
        const res = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData),
        });

        const data = await res.json();

        if (!res.ok) {
          setRegisterAlert({ type: "error", message: data.message || "Registration failed." });
        } else {
          setRegisterAlert({ type: "success", message: "User registered successfully!" });
          setRegisterData({ role: "", email: "", password: "" }); // clear inputs
        }
      } catch (err) {
        console.error(err);
        setRegisterAlert({ type: "error", message: "Server error. Try again later." });
      }

      //Clear Alert 3 seconds
      setTimeout(() => {
        setRegisterAlert({ type: null, message: "" });
      }, 3000);
    }
  };

  //Alert component based on type
  const renderAlert = (type: "success" | "error" | null, message: string) => {
    if (!type || !message) return null;

    const alertConfig = {
      success: {
        className: "text-green-800 bg-green-50 dark:bg-gray-800 dark:text-green-400",
        text: "Success!"
      },
      error: {
        className: "text-red-800 bg-red-50 dark:bg-gray-800 dark:text-red-400",
        text: "Error!"
      }
    };

    const config = alertConfig[type]

    return (
      <div className={`w-3/4 p-4 mb-4 text-sm rounded-lg ${config.className}`} role="alert">
        <span className="font-medium">{config.text}</span> {message}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black rounded-2xl shadow-2xl w-[70rem] h-[30rem] flex relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-500 text-2xl"
        >
          {/*means the x*/}
          &times;
        </button>

        {/* Login Section */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-4 px-10">
          <h2 className="text-3xl font-semibold mb-15">Login</h2>

          {/* Login Alert */}
          {renderAlert(loginAlert.type, loginAlert.message)}

          <input
            type="text"
            name="email"
            placeholder="Email"
            value={loginData.email}
            onChange={handleLoginChange}
            className="w-90 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleLoginChange}
            className="w-90 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
          />
          <button onClick={handleLogin} className="w-3/4 p-3 btn btn-primary-dark-blue">
            Sign In
          </button>
        </div>

        {/* Divider */}
        <div className="w-[2px] bg-stone-900 my-16"></div>

        {/* Register Section */}
        <div className="flex-1 flex flex-col justify-center items-center space-y-4 px-10">
          <h2 className="text-3xl font-semibold mb-4">Register</h2>

          {/* Register Alert */}
          {renderAlert(registerAlert.type, registerAlert.message)}

          <div className="flex justify-center gap-4 mb-2">
            <button
              type="button"
              onClick={() => setRegisterData(prev => ({ ...prev, role: "teacher" }))}
              className={`px-4 py-2 rounded-xl ${registerData.role === "teacher"
                  ? "btn btn-primary-dark-blue"
                  : "btn btn-ghost"
                }`}
            >
              Teacher
            </button>

            <button
              type="button"
              onClick={() => setRegisterData(prev => ({ ...prev, role: "student" }))}
              className={`px-4 py-2 rounded-xl border transition ${registerData.role === "student"
                  ? "btn btn-primary-dark-blue"
                  : "btn btn-ghost"
                }`}
            >
              Student
            </button>
          </div>


          <input
            type="email"
            name="email"
            placeholder="Email"
            value={registerData.email}
            onChange={handleRegisterChange}
            className="w-90 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={registerData.password}
            onChange={handleRegisterChange}
            className="w-90 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
          />
          <button onClick={handleRegister} className="w-3/4 p-3 btn btn-primary-dark-blue">
            Register
          </button>
        </div>
      </div>
    </div>
  );
}
