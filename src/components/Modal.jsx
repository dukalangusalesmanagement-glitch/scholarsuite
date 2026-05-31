import { X } from "lucide-react";

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl"
};

export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in"
      style={{ background: "rgba(2,44,30,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className={`w-full ${sizes[size]} max-h-[92vh] rounded-2xl bg-white shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-start justify-between border-b border-stone-100 px-6 py-4">
          <h3 className="display text-2xl" style={{ color: "var(--green-950)" }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex-shrink-0 border-t border-stone-100 px-6 py-3 bg-stone-50/50 rounded-b-2xl">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
