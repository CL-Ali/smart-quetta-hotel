import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

/**
 * Captive portal landing page.
 *
 * The vendor portal (MikroTik / UniFi / OpenWRT) redirects the guest browser
 * to GET /api/portal/entry, which in turn redirects here: /portal?source=X
 *
 * This component has one job: forward the guest to the Home page, preserving
 * any URL params that Home may want to act on (e.g. ?ticket=VIS-3-ABC...).
 *
 * Intentionally no business logic — spec 009 rule: portal handles network
 * entry only, not ordering/billing.
 */
export default function Portal() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Forward all query params intact so Home can read ?ticket= if present
    const search = window.location.search;
    navigate(`/${search}`, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
    </div>
  );
}
