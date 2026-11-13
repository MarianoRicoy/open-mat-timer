import { Suspense } from "react";
import { MatTimer } from "@/components/MatTimer";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <main className="min-h-full">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
              Cargando cronómetro…
            </div>
          }
        >
          <MatTimer />
        </Suspense>
      </main>
    </div>
  );
}
