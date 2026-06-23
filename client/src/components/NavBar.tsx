import { Link, useLocation } from "wouter";
import Logo from "./Logo";

const navItems = [
  { href: "/", label: "🏠 Home", title: "Place Orders" },
  { href: "/dashboard", label: "📊 Dashboard", title: "Admin Panel" },
  { href: "/kitchen", label: "🍳 Kitchen", title: "Kitchen Queue" },
  { href: "/waiter", label: "🛎️ Waiter", title: "Serving Orders" },
];

export default function NavBar() {
  const [location] = useLocation();

  return (
    <nav
      style={{
        background: "linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(31,41,55,0.95) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(245,158,11,0.15)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
    >
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

        {/* Navigation Links */}
        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          {navItems.map(({ href, label, title }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <a
                  title={title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "0.6rem",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 700 : 500,
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.15))"
                      : "transparent",
                    color: isActive ? "#F59E0B" : "rgba(209,213,219,0.9)",
                    border: isActive
                      ? "1px solid rgba(245,158,11,0.35)"
                      : "1px solid transparent",
                    boxShadow: isActive ? "0 0 12px rgba(245,158,11,0.15)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.05)";
                      (e.currentTarget as HTMLElement).style.color = "#F9FAFB";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "rgba(209,213,219,0.9)";
                    }
                  }}
                >
                  {label}
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
