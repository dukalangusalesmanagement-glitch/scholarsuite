import { Search, Filter, Download } from "lucide-react";
import { useLang } from "../contexts/LangContext";

export default function Toolbar({ onSearch, right, showExport = true }) {
  const { t } = useLang();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          placeholder={t.search}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
        />
      </div>
      <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-700 hover:bg-stone-50">
        <Filter className="h-4 w-4" /> {t.filter}
      </button>
      {showExport && (
        <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-700 hover:bg-stone-50">
          <Download className="h-4 w-4" /> {t.export}
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  );
}
