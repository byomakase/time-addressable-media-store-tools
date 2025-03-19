import { create } from "zustand";
import { Mode } from "@cloudscape-design/global-styles";

const useStore = create((set) => ({
  alertItems: [],
  addAlertItem: (alertItem) =>
    set((state) => ({
      alertItems: [...state.alertItems, alertItem],
    })),
  delAlertItem: (id) =>
    set((state) => ({
      alertItems: state.alertItems.filter((item) => item.id !== id),
    })),
  addAlertItems: (alertItems) =>
    set((state) => ({
      alertItems: [...state.alertItems, ...alertItems],
    })),

  themeMode: Mode.Dark,
  setDarkTheme: () => set({ themeMode: Mode.Dark }),
  setLightTheme: () => set({ themeMode: Mode.Light }),
}));

export default useStore;
