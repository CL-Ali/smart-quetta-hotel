import { useState } from "react";
import { Link, useLocation } from "wouter";
import Logo from "./Logo";

const navItems = [
  { href: "/", label: "Home", emoji: "🏠", title: "Place Orders" },
  { href: "/dashboard", label: "Dashboard", emoji: "📊", title: "Admin Panel" },
  { href: "/kitchen", label: "Kitchen", emoji: "🍳", title: "Kitchen Queue" },
  { href: "/waiter", label: "Waiter", emoji: "🛎️", title: "Serving Orders" },
];

export default function NavBar() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,0.97) 0%, rgba(31,41,55,0.97) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(245,158,11,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        {/* Logo */}
        <Logo size="md" showText={true} />

        {/* Desktop links */}
        <div
          className="nav-desktop-links"
          style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}
        >
          {navItems.map(({ href, label, emoji, title }) => (
            <NavLink key={href} href={href} label={`${emoji} ${label}`} title={title} active={location === href} />
          ))}
        </div>

        {/* Hamburger – mobile only */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            display: "none",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "5px",
            width: "40px",
            height: "40px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "8px",
            cursor: "pointer",
            padding: "8px",
          }}
        >
          <span style={barStyle(menuOpen, "top")} />
          <span style={barStyle(menuOpen, "mid")} />
          <span style={barStyle(menuOpen, "bot")} />
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      <div
        className="nav-mobile-menu"
        style={{
          display: menuOpen ? "flex" : "none",
          flexDirection: "column",
          gap: "0.35rem",
          padding: "0.75rem 1rem 1rem",
          borderTop: "1px solid rgba(245,158,11,0.1)",
        }}
      >
        {navItems.map(({ href, label, emoji, title }) => (
          <NavLink
            key={href}
            href={href}
            label={`${emoji}  ${label}`}
            title={title}
            active={location === href}
            block
            onClick={() => setMenuOpen(false)}
          />
        ))}
      </div>

      {/* Responsive styles injected as a <style> tag */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
          .nav-hamburger      { display: flex !important; }
        }
        @media (min-width: 641px) {
          .nav-mobile-menu    { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

/* ── Shared link ── */
function NavLink({
  href,
  label,
  title,
  active,
  block = false,
  onClick,
}: {
  href: string;
  label: string;
  title: string;
  active: boolean;
  block?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={href}>
      <a
        title={title}
        onClick={onClick}
        style={{
          display: block ? "block" : "inline-flex",
          alignItems: "center",
          padding: block ? "0.6rem 1rem" : "0.45rem 0.85rem",
          borderRadius: "0.6rem",
          fontSize: block ? "1rem" : "0.875rem",
          fontWeight: active ? 700 : 500,
          textDecoration: "none",
          transition: "all 0.2s ease",
          background: active
            ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.15))"
            : "transparent",
          color: active ? "#F59E0B" : "rgba(209,213,219,0.9)",
          border: active
            ? "1px solid rgba(245,158,11,0.35)"
            : "1px solid transparent",
          boxShadow: active ? "0 0 12px rgba(245,158,11,0.15)" : "none",
          width: block ? "100%" : undefined,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </a>
    </Link>
  );
}

/* ── Hamburger bar styles ── */
function barStyle(open: boolean, pos: "top" | "mid" | "bot"): React.CSSProperties {
  const base: React.CSSProperties = {
    display: "block",
    width: "20px",
    height: "2px",
    background: "#F59E0B",
    borderRadius: "2px",
    transition: "all 0.25s ease",
    transformOrigin: "center",
  };
  if (open) {
    if (pos === "top") return { ...base, transform: "translateY(7px) rotate(45deg)" };
    if (pos === "mid") return { ...base, opacity: 0 };
    if (pos === "bot") return { ...base, transform: "translateY(-7px) rotate(-45deg)" };
  }
  return base;
}
