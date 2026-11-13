import { Suspense } from "react";
import { TvTimerView } from "@/components/TvTimerView";

export default function TvPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black text-sm text-zinc-500">
          Cargando vista TV…
        </div>
      }
    >
      <TvTimerView />
    </Suspense>
  );
}
