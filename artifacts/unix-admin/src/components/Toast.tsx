import type { ToastMsg } from "@/App";

export default function Toast({ toast }: { toast: ToastMsg }) {
  const colors = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  };
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[280px] ${colors[toast.type]}`}>
      <span className="text-lg font-bold">{icons[toast.type]}</span>
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}
