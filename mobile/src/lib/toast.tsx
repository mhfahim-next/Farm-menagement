// One message bar for the whole app, so a form can close and still say "Saved".
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Snackbar } from "react-native-paper";

const Ctx = createContext<(text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null);
  const show = useCallback((t: string) => setText(t), []);
  const value = useMemo(() => show, [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <Snackbar visible={text !== null} onDismiss={() => setText(null)} duration={3500} testID="toast">
        {text ?? ""}
      </Snackbar>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
