import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
    <div className="w-full h-20 bg-white flex items-center justify-between px-10 rounded-2xl shadow-md">
        <Link href="/">
            <Image 
                className="rounded-full" 
                src="/logo.png" 
                alt="Logo" 
                width={75} 
                height={75} 
            />
        </Link>
        <div className="flex space-x-8">
            <Link href="../data_view/" className="text-stone-800 hover:text-black">Questions</Link>
            <Link href="../exam_gen/" className="text-stone-800 hover:text-black">Generator</Link>
            <Link href="#" className="text-stone-800 hover:text-black">Help</Link>
            <Link href="../contact/" className="text-stone-800 hover:text-black">Contact</Link>
            <Link href="#" className="w-20 h-8 bg-stone-800 text-white text-sm rounded-2xl shadow hover:bg-black flex items-center justify-center">Sign in</Link>
        </div>
    </div>
    );
}