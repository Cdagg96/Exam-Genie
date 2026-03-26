"use client";
import React, { useState, useRef, ChangeEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { signIn } from "next-auth/react";
import StatusModal from "./StatusModal";

export default function LoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {

  //State to switch between login and register modals (default to login)
  const [currentModal, setCurrentModal] = useState<"login" | "register">("login");
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userStatus, setUserStatus] = useState<'Pending' | 'Denied' | null>(null);

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
    institution: "",
    department: "",
    tSubject: "",
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

  //State to show/hide the password
  const [showPassword, setShowPassword] = useState(false);

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

    //Check to see users status
    try {
      const statusRes = await fetch(`/api/user/status?email=${encodeURIComponent(loginData.email)}`);
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        
        //If user is found, check their status and show popup if needed
        if (statusData.status === 'Pending') {
          setUserStatus('Pending');
          setShowStatusModal(true);
          return;
        } else if (statusData.status === 'Denied') {
          setUserStatus('Denied');
          setShowStatusModal(true);
          return;
        }
      }
    } catch (error) {
      console.error("Status check failed:", error);
    }

    const res = await signIn("credentials", {
      redirect: false,
      email: loginData.email,
      password: loginData.password,
    });

    if (!res?.ok) {
      toast.error("Login failed. " + (res?.error || ""));
      return;
    }

    toast.success("Login successful!");
    setLoginData({ email: "", password: "" });
    setShowPassword(false);
    onClose();
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

    //Check if at least one proof method is provided
    if (!registerData.proofLink && !registerData.proofFile) {
      toast.error("Please provide either a proof link or upload a document.");
      return;
    }

    //Check if both proof methods are provided
    if (registerData.proofLink && registerData.proofFile) {
      toast.error("Please provide only one proof method (either a link or a file).");
      return;
    }

    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName || !registerData.phone || !registerData.institution || !registerData.department || !registerData.tSubject) {
      //Show error if not all fields are filled out
      toast.error("Not all registration fields are filled out.");
    } else {
      try {
        // Convert Subjects to an array
        const parsedSubjects = registerData.tSubject
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        //Prepare form data for file upload
        const formData = new FormData();

        //Append all register data to formData
        Object.entries(registerData).forEach(([key, value]) => {
          if (key === 'proofFile' && value instanceof File) {
            formData.append('proofFile', value);
          }else if (key === "tSubject") {
            parsedSubjects.forEach(subject => formData.append("tSubject", subject))
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
          toast.success("Registration successful! Your account is pending approval. You will receive an email once approved.", {duration: 5000});

          // const loginResult = await fetch("/api/login", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     email: registerData.email,
          //     password: registerData.password
          //   }),
          // });

          // const loginData = await loginResult.json();

          // //If login after registration fails, show error
          // if (!loginResult.ok) {
          //   toast.error(loginData.message || "Login after registration failed.");
          // } else {
          //   //Successful login after registration
          //   login(loginData.user); //Update auth context
          // }

          setRegisterData({ role: "", email: "", password: "", institution: "", department: "", tSubject: "", proofLink: "", proofFile: null, firstName: "", lastName: "", phone: "" }); //Clear the form
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setLoginData({ email: "", password: "" });
          setCurrentModal("login"); //Reset to login modal
          setShowPassword(false);
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
      institution: "",
      department: "",
      tSubject: "",
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
      <div className={`card-primary text-black rounded-2xl shadow-2xl w-[40rem] flex relative`} style={{ height: modalHeight }}>

        {/* Close button */}
        <button
          onClick={() => {
            resetRegisterData();
            setLoginData({ email: "", password: "" });
            setShowPassword(false);
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
              <h2 className="text-4xl mb-10 p-2 text-blue-gradient">Login</h2>

              {/* Email Box */}
              <input
                type="text"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginChange}
                className="w-3/4 rounded-xl border-primary text-secondary px-3 py-2 mb-4"
              />
                
              {/* Password Box */}
              <div className="w-3/4 flex flex-col relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-xl border-primary text-secondary px-4 py-2 pr-10 mb-4"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-2/9 -translate-y-1/2 text-secondary hover:text-gray-700"
                >
                  {showPassword ? (
                    //Display the open visibility icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    //Display the closed visibility icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>

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
                className="btn btn-primary-blue w-3/4 mt-4 py-2 rounded-xl text-lg font-medium"
              >
                Sign In
              </button>

              {/* Sign Up */}
              <div className="mt-4 text-sm text-secondary">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetRegisterData();
                    setLoginData({ email: "", password: "" });
                    setCurrentModal("register");
                    setShowPassword(false);
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
              <h2 className="text-4xl mb-3 p-2 text-blue-gradient">Register</h2>
              <div className="w-3/4 grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={registerData.firstName}
                  onChange={handleRegisterChange}
                  className="rounded-xl border w-full border-primary text-secondary px-4 py-2"
                  maxLength={100}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={registerData.lastName}
                  onChange={handleRegisterChange}
                  className="rounded-xl border w-full border-primary text-secondary px-4 py-2"
                  maxLength={100}
                />
              </div>

              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={registerData.phone}
                onChange={handleRegisterChange}
                className="rounded-xl border w-3/4 border-primary text-secondary px-4 py-2 mb-2"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={registerData.email}
                onChange={handleRegisterChange}
                className="rounded-xl border w-3/4 border-primary text-secondary px-4 py-2 mb-2"
              />

              <div className="w-3/4 relative">
                <input
                  type={showPassword ? "text" : "password"} //Switch between text(visible) and password(hidden)
                  name="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className="rounded-xl border w-full border-primary text-secondary px-4 py-2 mb-2"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-4/10 -translate-y-1/2 text-secondary hover:text-gray-700"
                >
                  {showPassword ? (
                    //Display the open visibility icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ) : (
                    //Display the closed visibility icon
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>

              <input
                type="text"
                name="institution"
                placeholder="Institution (School)"
                value={registerData.institution}
                onChange={handleRegisterChange}
                className="rounded-xl border w-3/4 border-primary text-secondary px-4 py-2 mb-2"
                maxLength={100}
                required
              />
              
              <input
                type="text"
                name="department"
                placeholder="Department"
                value={registerData.department}
                onChange={handleRegisterChange}
                className="rounded-xl border w-3/4 border-primary text-secondary px-4 py-2 mb-2"
                maxLength={100}
                required
              />

              <input
                type="text"
                name="tSubject"
                placeholder="Teaching Subject(s) - Comma Seperated"
                value={registerData.tSubject}
                onChange={handleRegisterChange}
                className="rounded-xl border w-3/4 border-primary text-secondary px-4 py-2 mb-2"
                maxLength={200}
                required
              />

              {/* Proof Section */}
              <div className="w-3/4 p-3 bg-primary border-primary rounded-lg mb-2">
                <p className="text-xs font-medium text-primary mb-1">
                  Proof (provide either a link or upload a document to prove affiliation):
                </p>

                {/* Proof Link */}
                <input
                  type="url"
                  name="proofLink"
                  placeholder="Proof Link"
                  value={registerData.proofLink}
                  onChange={handleRegisterChange}
                  className="w-full rounded-xl border-primary text-secondary px-3 py-1.5 focus:outline-none focus:ring-2 text-xs mb-1.5"
                />

                <div className="text-center text-sm text-primary">OR</div>

                {/* File Upload */}
                <div className="flex flex-col items-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full text-xs text-secondary file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-secondary mt-1">
                    Upload PDF, DOC, DOCX, JPG, or PNG files
                  </p>
                  {registerData.proofFile && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {registerData.proofFile.name}
                    </p>
                  )}
                </div>
              </div>

              <button onClick={handleRegister} className="btn btn-primary-blue w-3/4 rounded-xl text-lg font-medium">
                Register
              </button>

              {/* Sign In */}
              <div className="mt-2 text-sm text-secondary">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    resetRegisterData();
                    setLoginData({ email: "", password: "" });
                    setCurrentModal("login");
                    setShowPassword(false);
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
      {/* Status Modal */}
      {showStatusModal && (
        <StatusModal
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setUserStatus(null);
          }}
          status={userStatus}
          email={loginData.email}
        />
      )}
    </div>
  );
}
