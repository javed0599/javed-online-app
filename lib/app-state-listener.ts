import { AppState, type AppStateStatus } from "react-native";

export type AppStateCallback = (state: "active" | "background" | "inactive") => void;

class AppStateManager {
  private listeners: Set<AppStateCallback> = new Set();
  private currentState: AppStateStatus = "active";
  private subscription: any = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    this.subscription = AppState.addEventListener("change", this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === "active") {
      this.currentState = "active";
      this.notifyListeners("active");
    } else if (nextAppState === "background") {
      this.currentState = "background";
      this.notifyListeners("background");
    } else if (nextAppState === "inactive") {
      this.currentState = "inactive";
      this.notifyListeners("inactive");
    }
  };

  private notifyListeners(state: "active" | "background" | "inactive") {
    this.listeners.forEach((callback) => {
      callback(state);
    });
  }

  subscribe(callback: AppStateCallback) {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  getCurrentState(): "active" | "background" | "inactive" {
    if (this.currentState === "active") return "active";
    if (this.currentState === "background") return "background";
    return "inactive";
  }

  destroy() {
    if (this.subscription) {
      this.subscription.remove();
    }
    this.listeners.clear();
  }
}

export const appStateManager = new AppStateManager();
