'use client'

import { create } from "zustand";

export interface walkThroughData {
    showWalkThrough?: boolean;
}

interface walkThroughStore {
    data: walkThroughData;
    setData: (data: walkThroughData) => void;
    loadData: () => void;
}

export const useWalkThrough = create<walkThroughStore>((set) => ({
    data: {
        showWalkThrough: true,
    },
    setData: (data: walkThroughData) => {
        set({ data });

        localStorage.setItem("walkThroughData", JSON.stringify(data));
    },
    loadData: () => {
        try {
            const isFirstLoad = localStorage.getItem("isFirstSignIn");

            if (isFirstLoad === "true") {
                set({ data: { showWalkThrough: true } });
            } else {
                set({ data: { showWalkThrough: false } });
            }

            if (isFirstLoad === null) {
                localStorage.setItem("isFirstSignIn", "true");
            }
        } catch (error) {
            console.error("Error loading walkThrough data from AsyncStorage", error);
        }
    },
}));

useWalkThrough.getState().loadData();
