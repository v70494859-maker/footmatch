import Link from "next/link";

type AvatarSize = "xs" | "sm" | "md" | "lg";

interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  country?: string | null;
  clubSlug?: string | null;
  size?: AvatarSize;
  href?: string;
}

const SIZE_CONFIG: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "w-7 h-7", text: "text-[10px]" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-24 h-24", text: "text-2xl" },
};

// iOS-style avatar background colors
const AVATAR_COLORS = [
  "#FF6B6B", // red
  "#FF8E53", // orange
  "#FFA726", // amber
  "#66BB6A", // green
  "#26A69A", // teal
  "#42A5F5", // blue
  "#5C6BC0", // indigo
  "#7E57C2", // purple
  "#EC407A", // pink
  "#78909C", // blue-grey
];

function getColorForName(firstName: string, lastName: string): string {
  const str = `${firstName}${lastName}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function AvatarWrapper({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return <Link href={href}>{children}</Link>;
}

export default function ProfileAvatar({
  firstName,
  lastName,
  size = "sm",
  href,
}: ProfileAvatarProps) {
  const config = SIZE_CONFIG[size];
  const initials =
    `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`.toUpperCase();
  const bgColor = getColorForName(firstName ?? "", lastName ?? "");

  return (
    <AvatarWrapper href={href}>
      <div
        className={`relative ${config.container} rounded-full overflow-hidden shrink-0 flex items-center justify-center${href ? " cursor-pointer" : ""}`}
        style={{ backgroundColor: bgColor }}
      >
        <span className={`${config.text} font-semibold text-white leading-none`}>
          {initials}
        </span>
      </div>
    </AvatarWrapper>
  );
}
