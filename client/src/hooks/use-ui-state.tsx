import { createContext, useContext, useState } from "react";

interface UIState {
  settingsPanelOpen: boolean;
  headerTitle: string;
}

interface UIStateContextType {
  uiState: UIState;
  updateUIState: (newState: Partial<UIState>) => void;
}

const defaultUIState: UIState = {
  settingsPanelOpen: false,
  headerTitle: "Ascend UPSC",
};

const UIStateContext = createContext<UIStateContextType>({
  uiState: defaultUIState,
  updateUIState: () => {},
});

export function UIStateProvider({ children }: { children: React.ReactNode }) {
  const [uiState, setUIState] = useState<UIState>(defaultUIState);

  const updateUIState = (newState: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...newState }));
  };

  return (
    <UIStateContext.Provider value={{ uiState, updateUIState }}>
      {children}
    </UIStateContext.Provider>
  );
}

export const useUIState = () => useContext(UIStateContext);
