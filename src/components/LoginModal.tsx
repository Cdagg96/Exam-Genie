"use client";
import React, { useState, useRef, ChangeEvent } from "react";
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
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    proofLink: "",
    proofFile: null as File | null
  });

  //Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  //makes sure that the email comes in valid format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  //makes sure that the phone number comes in valid format
  // 3303278011
  // 330-327-8011
  // (330) 327-8011
  const isValidPhone = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
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

  //Handle file upload for proof document
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      //Validate file type (PDF, DOC, DOCX, PNG, JPG)
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];

      //File is valid, update state 
      if (validTypes.includes(file.type)) {
        setRegisterData(prev => ({ ...prev, proofFile: file }));
        toast.success("File uploaded successfully!");
      } else {
        //Error and reset file input
        toast.error("Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.");
        e.target.value = '';
      }
    }
  };

  //Handle register submission
  const handleRegister = async () => {
    if (!isValidEmail(registerData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (registerData.phone && !isValidPhone(registerData.phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (!registerData.role || !registerData.email || !registerData.password || (!registerData.proofLink && !registerData.proofFile) || !registerData.firstName || !registerData.lastName || !registerData.phone) {
      //Show error if not all fields are filled out
      toast.error("Not all registration fields are filled out.");
    } else {
      try {
        //Prepare form data for file upload
        const formData = new FormData();

        //Append all register data to formData
        Object.entries(registerData).forEach(([key, value]) => {
          if (key === 'proofFile' && value instanceof File) {
            formData.append('proofFile', value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        //Send registration data to the server
        const res = await fetch('/api/user', {
          method: 'POST',
          body: formData,
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

          setRegisterData({ role: "", email: "", password: "", proofLink: "", proofFile: null, firstName: "", lastName: "", phone: "" }); //Clear the form
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setLoginData({ email: "", password: "" });
          setCurrentModal("login"); //Reset to login modal
          onClose(); //Immeditately close the modal when user registers successfully
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error. Try again later.");
      }
    }
  };

  //Reset register data
  const resetRegisterData = () => {
    setRegisterData({
      firstName: "",
      lastName: "",
      role: "",
      email: "",
      phone: "",
      password: "",
      proofLink: "",
      proofFile: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  //Heights and padding for login vs register modals
  const modalHeight = currentModal === "login" ? "30rem" : "35rem";
  const paddingTop = currentModal === "login" ? "pt-16" : "pt-6";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className={`bg-white text-black rounded-2xl shadow-2xl w-[40rem] flex relative`} style={{ height: modalHeight }}>

        {/* Close button */}
        <button
          onClick={() => {
            resetRegisterData();
            setLoginData({ email: "", password: "" });
            onClose();
            setCurrentModal("login"); //Reset to login modal on close
          }}
          className="absolute top-4 right-4 text-black hover:text-gray-500 text-2xl"
        >
          &times;
        </button>

        <div className={`flex-1 flex flex-col justify-start items-center ${paddingTop} px-10 overflow-y-auto`}>
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
                className="w-3/4 rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 mb-4"
              />

              {/* Password Box */}
              <div className="w-3/4 flex flex-col">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 mb-4"
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
                    resetRegisterData();
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
              <h2 className="text-4xl font-semibold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Register</h2>
              <div className="flex justify-center gap-4 mb-3">
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

              <div className="w-3/4 grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={registerData.firstName}
                  onChange={handleRegisterChange}
                  className="rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={registerData.lastName}
                  onChange={handleRegisterChange}
                  className="rounded-xl border px-4 py-2 focus:outline-none focus:ring-2"
                />
              </div>

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={registerData.phone}
                onChange={handleRegisterChange}
                className="w-3/4 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 mb-2"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="w-3/4 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 mb-2"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={registerData.password}
                onChange={handleRegisterChange}
                className="w-3/4 rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 mb-2"
              />

              {/* Proof Section */}
              <div className="w-3/4 p-3 border rounded-lg bg-gray-50 mb-2">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Proof (provide either a link or upload a document to prove affiliation):
                </p>

                {/* Proof Link */}
                <input
                  type="url"
                  name="proofLink"
                  placeholder="Proof Link"
                  value={registerData.proofLink}
                  onChange={handleRegisterChange}
                  className="w-full rounded-xl border px-3 py-1.5 focus:outline-none focus:ring-2 text-xs mb-1.5"
                />

                <div className="text-center text-sm text-gray-500">OR</div>

                {/* File Upload */}
                <div className="flex flex-col items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload PDF, DOC, DOCX, JPG, or PNG files
                  </p>
                  {registerData.proofFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {registerData.proofFile.name}
                    </p>
                  )}
                </div>
              </div>

              <button onClick={handleRegister} className="btn btn-primary-dark-blue w-3/4 rounded-xl text-lg font-medium">
                Register
              </button>

              {/* Sign In */}
              <div className="mt-2 text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetRegisterData();
                    setLoginData({ email: "", password: "" });
                    setCurrentModal("login");
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium mb-1"
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
