import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Past Analyses
        </p>
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your resume analyses on this device.
        </p>
      </div>
      <HistoryList />
    </div>
  );
}
