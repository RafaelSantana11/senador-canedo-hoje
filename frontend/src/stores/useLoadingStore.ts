import { create } from "zustand"

type LoadingState = {
  count: number
  showLoading: () => void
  hideLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
  count: 0,
  showLoading: () => set((state) => ({ count: state.count + 1 })),
  hideLoading: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
}))
