import { Suspense } from "react";
import { ControlTimerView } from "@/components/ControlTimerView";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
            Cargando…
          </div>
        }
      >
        <ControlTimerView />
      </Suspense>
    </div>
  );
}
