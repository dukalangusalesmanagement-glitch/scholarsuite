import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../lib/i18n";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Try to recover saved preference (sessionStorage allowed in Vite dev)
    try {
      return localStorage.getItem("scholarsuite_lang") || "sw";
    } catch {
      return "sw";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("scholarsuite_lang", lang);
    } catch {
      // ignore
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.sw;

  const toggleLang = () => setLang((l) => (l === "en" ? "sw" : "en"));

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
};

export default LangContext;
