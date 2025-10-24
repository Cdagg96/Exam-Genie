import ExamForm from "../../components/examForm";
import NavBar from "@/components/navbar";

export default function examGen(){
    return(
      <div className="flex flex-col justify-between min-h-screen p-8 text-center bg-gradient-to-b from-[#EFF6FF] to-white">
        <header>
            <NavBar />
        </header>
          <main className="flex flex-col items-center justify-center">
              <h1 className="text-5xl pt-8 pb-4 font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
                  Generate Exam
              </h1>
              <ExamForm />
          </main>
    </div>
    );
}