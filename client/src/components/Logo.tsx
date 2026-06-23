import { Link } from "wouter";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizes = {
    sm: { img: 32, text: "text-sm" },
    md: { img: 44, text: "text-base" },
    lg: { img: 64, text: "text-xl" },
  };

  const { img, text } = sizes[size];

  return (
    <Link href="/">
      <a className={`flex items-center gap-2 select-none group ${className}`}>
        <img
          src="/logo.png"
          alt="Smart Quetta Hotel Logo"
          width={img}
          height={img}
          className="rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200"
          style={{ objectFit: "contain" }}
        />
        {showText && (
          <span
            className={`font-bold tracking-wide ${text}`}
            style={{
              background: "linear-gradient(90deg, #F59E0B, #FDE68A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Smart Quetta Hotel
          </span>
        )}
      </a>
    </Link>
  );
}
