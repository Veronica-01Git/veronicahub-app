import { useEffect, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import "./wellness.css";
export function WellnessTheme({
  children,
  identity = "veronica",
}: {
  children: ReactNode;
  identity?: string;
}) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    try {
      setLight(localStorage.getItem(`wellness-theme-${identity}`) === "light");
    } catch {
      /* optional storage */
    }
  }, [identity]);
  return (
    <div className="wellness" data-theme={light ? "light" : "dark"} data-identity={identity}>
      <button
        className="wellness-theme"
        type="button"
        aria-label={light ? "Usar tema escuro" : "Usar tema claro"}
        aria-pressed={light}
        onClick={() => {
          const value = !light;
          setLight(value);
          try {
            localStorage.setItem(`wellness-theme-${identity}`, value ? "light" : "dark");
          } catch {
            /* optional storage */
          }
        }}
      >
        {light ? <Moon size={16} /> : <Sun size={16} />}
        <span>{light ? "Escuro" : "Claro"}</span>
      </button>
      {children}
    </div>
  );
}
