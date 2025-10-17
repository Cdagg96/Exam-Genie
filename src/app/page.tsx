import Image from "next/image";
import NavBar from "@/components/navbar";

export default function Home() {
  return (
    <div className="items-center justify-items-center min-h-screen p-8 bg-gradient-to-b from-[#EFF6FF] to-white">
      <NavBar />
      <h1 className="text-7xl text-center pt-40 font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">Exam Genie</h1>

      <div className="space-y-10 pt-20">
        <button className="block w-110 h-15 bg-stone-800 text-white text-xl rounded-2xl shadow hover:bg-black">Create Test</button>
        <button className="block w-110 h-15 bg-stone-800 text-white text-xl rounded-2xl shadow hover:bg-black">View Your Questions</button>
      </div>
    </div>
  );
}
