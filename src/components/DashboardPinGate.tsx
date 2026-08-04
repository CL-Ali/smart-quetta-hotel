import { useState, useRef } from "react";
import { Lock, Eye, EyeOff, Hotel } from "lucide-react";
import { Input } from "@/components/ui/input";
import { hashAndSavePin } from "@/lib/dashboardAuth";

interface Props {
  onUnlocked: (onError: (msg: string) => void) => void;
}

/**
 * PIN entry screen shown before Dashboard/Kitchen/Waiter content loads.
 *
 * The raw PIN is hashed client-side with SHA-256 before being stored or sent.
 * The plaintext PIN never touches sessionStorage or the network.
 *
 * Phase 6: replace with per-staff OAuth login.
 */
export function DashboardPinGate({ onUnlocked }: Props) {
  const [pin, setPin]     = useState("");
  const [show, setShow]   = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy]   = useState(false);
  const inputRef          = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin.trim()) { setError("Enter the dashboard PIN"); return; }
    setBusy(true);
    setError("");

    // Hash and AWAIT — sessionStorage must be written before onUnlocked()
    // triggers the first tRPC query that reads getDashboardPin()
    await hashAndSavePin(pin.trim());
    // Pass a callback so the parent can push "Incorrect PIN" back here
    onUnlocked((msg: string) => { setError(msg); setBusy(false); });
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-3 shadow-inner">
            <Hotel className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 justify-center">
            <Lock className="w-3.5 h-3.5" />
            Enter dashboard PIN to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              type={show ? "text" : "password"}
              inputMode="numeric"
              placeholder="PIN"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(""); }}
              className={`h-14 text-2xl text-center tracking-widest pr-12 ${error ? "border-red-400 bg-red-50" : ""}`}
              autoFocus
              disabled={busy}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !pin.trim()}
            className="w-full h-14 bg-black hover:bg-black/90 active:scale-[0.98] transition-transform text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Lock className="w-5 h-5" />
            Unlock Dashboard
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          PIN is set by the restaurant owner in server configuration.
        </p>
      </div>
    </div>
  );
}
