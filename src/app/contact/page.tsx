// app/contact/page.tsx
"use client";
import NavBar from "@/components/navbar";
import React, { useState } from "react";
import toast from "react-hot-toast";
import SelectBox from "@/components/SelectBox";
import {LightBackground} from "@/components/BackgroundModal";

export default function ContactPage() {
  //States for form fields
  const [issueType, setIssueType] = useState("");
  const [message, setMessage] = useState("");
  //State for stoping submission button spam
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }finally {
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
        <div className="max-w-4xl mx-auto">
          {/* Prompt */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 pt-8">Report a issue</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Want to report a issue? Please do not hesitate to contact us directly. Thank you for helping make Exam Genie better.
            </p>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Issue Type */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  Issue Type
                </label>
                <SelectBox
                  label=""
                  placeholder="Select issue type"
                  options={[
                    { value: "Functional Bug", label: "Functional Bug" },
                    { value: "UI/UX Issue", label: "UI/UX Issue" },
                    { value: "Performance Problem", label: "Performance Problem" },
                    { value: "Other", label: "Other" },
                  ]}
                  onSelect={(value) => setIssueType(value)}
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label htmlFor="message" className="flex items-center text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
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
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  Submit Bug Report
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LightBackground>
  );
}