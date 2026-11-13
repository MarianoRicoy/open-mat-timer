import { LocalTimerProvider } from "@app/providers/LocalTimerProvider";
import { MobileControlView } from "@app/components/MobileControlView";

export function App() {
  return (
    <LocalTimerProvider>
      <MobileControlView />
    </LocalTimerProvider>
  );
}
