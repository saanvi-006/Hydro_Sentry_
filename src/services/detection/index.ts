import { mockProvider } from "./mockProvider";
// import { liveProvider } from "./liveProvider";

// Swap this single line to go live: = liveProvider
export const detectionProvider = mockProvider;

export * from "./types";
export type { DetectionProvider } from "./provider";
