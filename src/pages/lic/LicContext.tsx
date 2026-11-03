import { createContext, useContext } from "react";

export interface LicContextValue {
  mode: "prospect" | "active";
  toggleMode: () => void;
  setMode: (m: "prospect" | "active") => void;
}

export const LicContext = createContext<LicContextValue>({
  mode: "prospect",
  toggleMode: () => {},
  setMode: () => {},
});

export function useLic() {
  return useContext(LicContext);
}

