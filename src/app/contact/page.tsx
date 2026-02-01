// app/contact/page.tsx
"use client";
import NavBar from "@/components/navbar";
import React, { useState } from "react";
import toast from "react-hot-toast";
import SelectBox from "@/components/SelectBox";
import { LightBackground } from "@/components/BackgroundModal";
import { useAuth } from "@/components/AuthContext";


export default function ContactPage() {
  //States for form fields
  const [issueType, setIssueType] = useState("");
  const [message, setMessage] = useState("");
  //State for stoping submission button spam
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //Set the data structure
    const data = {
      issueType,
      message
    };

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/send_email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success("Issue reported successfully!");
        //Clear the form
        setIssueType("");
        setMessage("");
      } else {
        console.error(result);
        toast.error(result.error || "Failed to send issue report");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network/Server error");
    } finally {
      // waits one sec before user can press the button again
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  }

  return (
    <LightBackground>
      <div className="flex flex-col justify-between min-h-screen p-4 text-center">
        <header>
          <NavBar />
        </header>
        <main className="flex flex-col items-center justify-center pt-8">
          {/* Prompt */}
          <h1 className="text-4xl font-bold mb-4 bg-linear-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Contact Us</h1>
          <p className="text-gray-600 mb-8 text-lg max-w-2xl">
            Want to report a issue? Please do not hesitate to contact us directly. Thank you for helping make Exam Genie better.
          </p>


          {/* Not logged in message */}
          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Login Required
              </h3>
              <p className="text-yellow-700">
                Please log in to report a issue
              </p>
            </div>
          )}


          {/* Contact Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">
              Report an Issue
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Issue Type */}
              <div className="space-y-2 text-left">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  Issue Type
                </label>
                <SelectBox
                  label=""
                  options={[
                    { value: "Functional Bug", label: "Functional Bug" },
                    { value: "UI/UX Issue", label: "UI/UX Issue" },
                    { value: "Performance Problem", label: "Performance Problem" },
                    { value: "Other", label: "Other" },
                  ]}
                  placeholder="Select issue type"
                  value={issueType}
                  onSelect={(value) => setIssueType(value)}
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label htmlFor="message" className="flex items-center text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  Issue Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none bg-gray-50 resize-vertical"
                  rows={6}
                  placeholder="Please describe the issue in detail."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSubmitting || !user}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  Submit Bug Report
                </button>
              </div>
            </form>

            {/* Next Steps */}
            {user && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-left">
                  What happens after you report?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-xl p-5 text-left">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-blue-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>

                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">Confirmation</h4>
                    <p className="text-sm text-gray-600">
                      You'll receive a confirmation message when your report is successfully submitted.
                    </p>
                  </div>

                  <div className="bg-cyan-50 rounded-xl p-5 text-left">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-cyan-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">Review</h4>
                    <p className="text-sm text-gray-600">
                      Our team will review your report and take action.
                    </p>
                  </div>


                  <div className="bg-gray-50 rounded-xl p-5 text-left">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">Updates</h4>
                    <p className="text-sm text-gray-600">
                      Major issues will be addressed in future updates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center text-gray-600 max-w-2xl">
            <p className="mb-2">
              Have additional questions or need immediate assistance?
            </p>
            <p className="text-sm">
              Email us at{" "}
              <a href="mailto:tgen57485@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
                tgen57485@gmail.com
              </a>
            </p>
          </div>
        </main>
      </div>
    </LightBackground>
  );
}