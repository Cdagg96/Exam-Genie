import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import clientPromise from "@/libs/mongo";
import AdminDashboard from "@/components/AdminDashboard";
import { Background } from "@/components/BackgroundModal";
import NavBar from "@/components/navbar";

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/");
  }
  
  //Server-side admin check
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);
  
  const user = await db.collection("users").findOne({ 
    email: session.user.email 
  });
  
  if (!user?.isAdmin) {
    redirect("/");
  }
  
  return (
    <Background>
          <div className="items-center justify-items-center min-h-screen p-4">
            <NavBar />
            <AdminDashboard />
          </div>
    </Background>
  );
}