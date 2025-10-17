import ExamForm from "../../components/examForm";

export default function examGen(){
    return(
        <div>
      <div className="flex flex-col justify-between min-h-screen p-8 text-center">
          <main className="flex flex-col items-center justify-center">
              <h1 className="text-5xl font-semibold mb-10">
                  Generate Exam
              </h1>
              <ExamForm />
          </main>
        </div>
    </div>
    );
}