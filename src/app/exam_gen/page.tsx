"use client";

import ExamForm from "../../components/examForm";
import NavBar from "@/components/navbar";
import { Background } from "@/components/BackgroundModal";
import { useAuth } from "@/components/AuthContext";

export default function examGen(){
    const { user } = useAuth();
    return(
        <Background>
        <div className="flex flex-col justify-between min-h-screen p-4 text-center">
            <header>
                <NavBar />
            </header>
            <main className="flex flex-col items-center justify-center">
                <h1 className="text-4xl pt-8 pb-4 font-bold text-blue-gradient">
                    Generate Exam
                </h1>
                <p className="text-secondary mb-8 text-lg max-w-2xl">
                    Build ready-to-go exams in minutes — pick your topics, difficulty, and question types, and Exam Genie handles the rest.
                </p>
                {/* Not logged in message */}
                    {!user && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center mb-8 mx-auto w-full">
                            <h3 className="font-semibold text-yellow-800 mb-2">
                                Login Required
                            </h3>
                            <p className="text-yellow-700">
                                Please log in to generate exams from your questions
                            </p>
                        </div>
                    )}
                <ExamForm />
            </main>
        </div>
        </Background>
    );
}