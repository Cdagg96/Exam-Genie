"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {

  //State to switch between login and register modals (default to login)
  const [currentModal, setCurrentModal] = useState<"login" | "register">("login");

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
  //makes sure that the email comes in valid format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  //State to show/hide forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  //gets the users log in information
  const { login } = useAuth();

  // Don’t render anything if not open
  if (!isOpen) return null;

  //Handle login input changes
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
  };

  //When the user types into one of the register input fields, update the corresponding state
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  //Handle login submission
  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast.error("Not all login fields are filled out.");
      return;
    }
    if (!isValidEmail(loginData.email)) {
      toast.error("Please enter a valid email address.");
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
        toast.error("Login failed.");
      } else {
        //Successful login alert
        toast.success("Login successful!");
        login(data.user); //Update auth context
        setLoginData({ email: "", password: "" }); //Clear the form
        onClose(); //Close the modal
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error. Try again later.");
    }
  };


  //Handle register submission
  const handleRegister = async () => {
    if (!isValidEmail(registerData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!registerData.role || !registerData.email || !registerData.password) {
      //Show error if not all fields are filled out
      toast.error("Not all registration fields are filled out.");
    } else {
      try {
        //Send registration data to the server
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerData),
        });

        //Turn the response into a JavaScript object
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Registration failed.");
        } else {
          toast.success("Registration successful! Signing you in...");

          const loginResult = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: registerData.email,
              password: registerData.password
            }),
          });

          const loginData = await loginResult.json();

          //If login after registration fails, show error
          if (!loginResult.ok) {
            toast.error(loginData.message || "Login after registration failed.");
          } else {
            //Successful login after registration
            login(loginData.user); //Update auth context
          }

          setRegisterData({ role: "", email: "", password: "" });
          setLoginData({ email: "", password: "" });
          setCurrentModal("login"); //Reset to login modal
          onClose(); //Immeditately close the modal when user registers successfully
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error. Try again later.");
      }
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black rounded-2xl shadow-2xl w-[40rem] h-[30rem] flex relative">

        {/* Close button */}
        <button
          onClick={() => {
            setRegisterData({ role: "", email: "", password: "" });
            setLoginData({ email: "", password: "" });
            onClose();
            setCurrentModal("login"); //Reset to login modal on close
          }}
          className="absolute top-4 right-4 text-black hover:text-gray-500 text-2xl"
        >
          &times;
        </button>

        <div className="flex-1 flex flex-col justify-start items-center pt-16 space-y-5 px-10">
          {/* If current modal is login, show Login Modal */}
          {currentModal === "login" ? (
            <>
              <h2 className="text-4xl font-semibold mb-15 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Login</h2>

              {/* Email Box */}
              <input
                type="text"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="w-3/4 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2"
              />

              {/* Password Box */}
              <div className="w-3/4 flex flex-col">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
                />

                {/* Forgot Password link */}
                <button
                  type="button"
                  className="self-end mt-1 text-sm text-blue-500 hover:text-blue-800 py-1"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>

              {/* Sign In Button */}
              <button
                onClick={handleLogin}
                className="btn btn-primary-dark-blue w-3/4 mt-4 py-2 rounded-xl text-lg font-medium"
              >
                Sign In
              </button>

              {/* Sign Up */}
              <div className="mt-4 text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterData({ role: "", email: "", password: "" });
                    setLoginData({ email: "", password: "" });
                    setCurrentModal("register");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
            //If current modal is register, show Register Modal
          ) : (
            <>
              <h2 className="text-4xl font-semibold mb-15 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Register</h2>
              <div className="flex justify-center gap-4 mb-4">
                {/* Role selection radio buttons */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={registerData.role === "teacher"}
                    onChange={(e) =>
                      setRegisterData(prev => ({ ...prev, role: e.target.value }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  Teacher
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={registerData.role === "student"}
                    onChange={(e) =>
                      setRegisterData(prev => ({ ...prev, role: e.target.value }))
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  Student
                </label>
              </div>


              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="w-3/4 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterChange}
                className="w-3/4 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
              />
              <button onClick={handleRegister} className="btn btn-primary-dark-blue w-3/4 mt-4 py-2 rounded-xl text-lg font-medium">
                Register
              </button>

              {/* Sign In */}
              <div className="mt-4 text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRegisterData({ role: "", email: "", password: "" });
                    setLoginData({ email: "", password: "" });
                    setCurrentModal("login");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign in
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
}
