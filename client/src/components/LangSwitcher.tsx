import { useLang, LANG_OPTIONS } from "@/contexts/LangContext";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LangSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  
  const currentOpt = LANG_OPTIONS.find(opt => opt.value === lang) || LANG_OPTIONS[0];

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent text-sm font-semibold transition cursor-pointer select-none focus:outline-none border-border">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="flex items-center gap-1.5">
              <span>{currentOpt.flag}</span>
              <span>{currentOpt.label}</span>
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
          {LANG_OPTIONS.map(opt => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setLang(opt.value)}
              className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition hover:bg-accent focus:bg-accent rounded-md"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base leading-none">{opt.flag}</span>
                <span className="font-medium text-foreground">{opt.label}</span>
              </div>
              {lang === opt.value && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
