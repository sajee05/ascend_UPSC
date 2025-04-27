import { createContext, useContext, useState } from "react";

interface UIState {
  settingsPanelOpen: boolean;
  headerTitle: string;
  historyModalOpen: boolean; // Add state for history modal
  wrongsModalOpen: boolean; // Add state for wrongs modal
  notesModalOpen: boolean; // Add state for the centralized notes modal
}

interface UIStateContextType {
  uiState: UIState;
  updateUIState: (newState: Partial<UIState>) => void;
}

const defaultUIState: UIState = {
  settingsPanelOpen: false,
  headerTitle: "Ascend UPSC",
  historyModalOpen: false, // Default to closed
  wrongsModalOpen: false, // Default to closed
  notesModalOpen: false, // Default to closed
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
