export interface AdsProvider {
  isAvailable(): boolean;
  showInterstitial(): Promise<boolean>;
  showRewarded(): Promise<boolean>;
}

// No SDK is configured. False means no impression and no reward is issued.
export const adsProvider: AdsProvider = {
  isAvailable: () => false,
  showInterstitial: async () => false,
  showRewarded: async () => false,
};
