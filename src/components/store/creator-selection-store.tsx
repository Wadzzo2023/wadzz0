import { Creator } from "@prisma/client";
import { create } from "zustand";
interface selectCreatorProps { data?: Creator; setData: (data: Creator) => void; }

export const useSelectCreatorStore = create<selectCreatorProps>((set) => ({ data: undefined, setData: (data) => set({ data }), }));