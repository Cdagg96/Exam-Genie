type MemberCardProps = {
  name: string;
  school: string;
  subjects: string[];
  department?: string;
  page?: "cooperate" | "connections";
  onView?: () => void;
  onMessage?: () => void;
};

export default function MemberCard({
  name,
  school,
  subjects,
  department,
  page,
  onView,
  onMessage
}: MemberCardProps) {
  const initials = name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="card-primary p-5 rounded-2xl shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
          {initials}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-primary">
            {name}
          </h3>
          <p className="text-sm text-secondary">
            {school}
          </p>
        </div>
      </div>

      <div className="mt-4 text-sm text-secondary">
        <p>
          <span className="font-medium">Subjects:</span>{" "}
          {subjects.join(", ")}
        </p>

        {department && (
          <p>
            <span className="font-medium">Department:</span>{" "}
            {department}
          </p>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {page !== "connections" && (
          <button className="btn btn-ghost w-full" onClick={onView}>
            View
          </button>
        )}

        {page === "connections" && (
          <button className="btn btn-ghost w-full" onClick={onView}>
            View Questions
          </button>
        )}

        {page !== "connections" && (
          <button className="btn btn-primary-blue w-full" onClick={onMessage}>
            Message
          </button>
        )}
      </div>
    </div>
  );
}