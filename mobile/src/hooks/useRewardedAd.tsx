import { useState, useCallback, useRef } from 'react';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { Platform, Alert } from 'react-native';
import { useAdVisibility } from './useAdVisibility';
import * as api from '../lib/api';

const adUnitId = Platform.OS === 'ios'
  ? (process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS || 'ca-app-pub-3940256099942544/1712485313')
  : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID || 'ca-app-pub-3940256099942544/5224354917');

export function useRewardedAd() {
  const { canRequestAds, isAdFree } = useAdVisibility();
  const [isShowing, setIsShowing] = useState(false);

  // We keep a ref to avoid stale closures in listeners
  const currentIntentRef = useRef<string | null>(null);

  const showRewardedAd = useCallback(async (
    action: 'create_arena' | 'create_wager' | 'claim_reward',
    onSuccess: (intentId: string) => void,
    onError: (err: any) => void
  ) => {
    try {
      if (!canRequestAds) {
        throw new Error('Ads are currently unavailable or consent is missing.');
      }

      setIsShowing(true);

      // 1. Create intent securely on the backend
      const intentRes = await api.createAdIntent(action);
      const intentId = intentRes.id;
      currentIntentRef.current = intentId;

      // 2. Create RewardedAd instance with Server-Side Verification options
      const rewarded = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        serverSideVerificationOptions: {
          customData: intentId
        }
      });

      let hasEarnedReward = false;

      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        rewarded.show();
      });

      const unsubscribeEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          hasEarnedReward = true;
        }
      );

      const unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        cleanup();
        setIsShowing(false);
        if (hasEarnedReward) {
          onSuccess(intentId);
        } else {
          onError(new Error('Ad was closed before completion.'));
        }
      });

      const unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, (err) => {
        cleanup();
        setIsShowing(false);
        onError(err);
      });

      const cleanup = () => {
        unsubscribeLoaded();
        unsubscribeEarned();
        unsubscribeClosed();
        unsubscribeError();
      };

      // Load the ad. Once loaded, the event listener will call .show()
      rewarded.load();

    } catch (e) {
      setIsShowing(false);
      onError(e);
    }
  }, [canRequestAds]);

  return { showRewardedAd, isShowing };
}
