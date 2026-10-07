import { LabsTabs } from "@/components/labs/LabsTabs";

export default function LabsLayout({ children }: LayoutProps<"/labs">) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">🧪 Labs</h1>
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">Experimental</span>
        </div>
        <LabsTabs />
      </div>
      {children}
    </div>
  );
}
