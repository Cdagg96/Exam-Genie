import ExamForm from "../../components/examForm";
import NavBar from "@/components/navbar";
import { LightBackground, DarkBackground } from "@/components/BackgroundModal";

export default function examGen(){
    return(
        <LightBackground>
        <div className="flex flex-col justify-between min-h-screen p-4 text-center">
            <header>
                <NavBar />
            </header>
            <main className="flex flex-col items-center justify-center">
                <h1 className="text-4xl pt-8 pb-4 font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                    Generate Exam
                </h1>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                    Build ready-to-go exams in minutes — pick your topics, difficulty, and question types, and Exam Genie handles the rest.
                </p>
                <ExamForm />
            </main>
        </div>
        </LightBackground>
    );
}