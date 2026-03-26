"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";


// User Object 
type User = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  institution: string;
  department: string;
  tSubject: string[];
  role?: string;
  createdOn?: string | Date;
};

// Auth Struct
type AuthContextType = {
  user: User | null; 
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (user: User) => setUser(user);
  const logout = () => setUser(null);

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
