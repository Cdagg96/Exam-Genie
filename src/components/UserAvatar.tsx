import Image from "next/image";

type Props = {
  user?: any;
  size?: number;
};

export default function UserAvatar({ user, size = 40 }: Props) {
  const hasImage = user?.profileImage;

  //Default the user icon to their initials instead of a picture
  const getInitials = () => {
    if (!user) return "U";

    //Build the profile image of the users full name initials
    const first = user.firstName?.trim()?.[0] || "";
    const last = user.lastName?.trim()?.[0] || "";

    if (first || last) return (first + last).toUpperCase();
  };

  //Prioritize uploaded profile picture first
  if (hasImage) {
    return (
        <div
            style={{ width: size, height: size }}
            className="rounded-full overflow-hidden relative"
        >
            <Image
            src={user.profileImage}
            alt="Profile"
            fill
            className="object-cover"
            />
        </div>
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(to right, #60a5fa, #22d3ee, #2563eb)",
      }}
    >
      {getInitials()}
    </div>
  );
}