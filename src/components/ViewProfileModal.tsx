"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";

type ViewProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  member: any | null;
};

export default function ViewProfileModal({
  isOpen,
  onClose,
  member,
}: ViewProfileModalProps) {
  if (!isOpen || !member) return null;

  const fullName =
    `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unknown User";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const subjects = Array.isArray(member.tSubject) ? member.tSubject : [];

    //Helper function to format the date
  const formatDateJoined = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card-primary w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl text-black hover:text-gray-500"
        >
          &times;
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-primary">{fullName}</h2>
            <p className="text-secondary">{member.institution || "No institution listed"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary">
          <div>
            <p className="font-semibold text-primary mb-1">Department</p>
            <p>{member.department || "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-primary mb-1">Email</p>
            <p>{member.email || "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-primary mb-1">Phone Number</p>
            <p>{member.phone || "N/A"}</p>
          </div>

          <div>
            <p className="font-semibold text-primary mb-1">Date Joined</p>
            <p>{formatDateJoined(member.createdOn) || "N/A"}</p>
          </div>

          <div className="md:col-span-2">
            <p className="font-semibold text-primary mb-1">Teaching Subjects</p>
            <p>{subjects.length ? subjects.join(", ") : "N/A"}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-ghost px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
