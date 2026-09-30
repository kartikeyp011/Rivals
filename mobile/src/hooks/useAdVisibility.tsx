import React, { createContext, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import mobileAds, { AdsConsent, AdsConsentStatus, AdsConsentPrivacyOptionsRequirementStatus } from 'react-native-google-mobile-ads';

interface AdVisibilityContextType {
  isAdFree: boolean;
  canRequestAds: boolean;
  isPrivacyOptionsRequired: boolean;
  showPrivacyOptions: () => Promise<void>;
}

const AdVisibilityContext = createContext<AdVisibilityContextType>({
  isAdFree: false,
  canRequestAds: false,
  isPrivacyOptionsRequired: false,
  showPrivacyOptions: async () => {}
});

export const useAdVisibility = () => useContext(AdVisibilityContext);

export const AdVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdFree, setIsAdFree] = useState(false);
  const [canRequestAds, setCanRequestAds] = useState(false);
  const [isPrivacyOptionsRequired, setIsPrivacyOptionsRequired] = useState(false);

  // 1. Handle Consent and AdMob Initialization
  useEffect(() => {
    let isMounted = true;

    const initConsent = async () => {
      try {
        const consentInfo = await AdsConsent.requestInfoUpdate();
        const formResult = await AdsConsent.loadAndShowConsentFormIfRequired();

        if (isMounted) {
          if (formResult.canRequestAds) {
            setCanRequestAds(true);
            // Initialize AdMob when permitted
            mobileAds().initialize().catch(console.error);
          }

          if (formResult.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED) {
            setIsPrivacyOptionsRequired(true);
          }
        }
      } catch (e) {
        console.error('Consent initialization error', e);
      }
    };

    initConsent();

    return () => {
      isMounted = false;
    };
  }, []);

  const showPrivacyOptions = async () => {
    try {
      await AdsConsent.showPrivacyOptionsForm();
    } catch (e) {
      console.error('Show privacy options error', e);
    }
  };

  // 2. Handle RevenueCat Ad-Free Entitlement
  useEffect(() => {
    let isMounted = true;

    const checkEntitlements = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (isMounted) {
          setIsAdFree(typeof customerInfo.entitlements.active['rivals_plus'] !== 'undefined');
        }
      } catch (e) {
        console.error('Failed to get customer info:', e);
        if (isMounted) setIsAdFree(false);
      }
    };

    checkEntitlements();

    // Listen for CustomerInfo updates (fires on purchase, restore, and login/logout syncing)
    Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
      if (isMounted) {
        setIsAdFree(typeof customerInfo.entitlements.active['rivals_plus'] !== 'undefined');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        if (isMounted) setIsAdFree(false); // Immediate visual feedback
      } else if (_event === 'SIGNED_IN') {
        // Purchases.logIn() will trigger addCustomerInfoUpdateListener automatically,
        // but to be absolutely safe we manually poll entitlements
        checkEntitlements();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AdVisibilityContext.Provider value={{ isAdFree, canRequestAds, isPrivacyOptionsRequired, showPrivacyOptions }}>
      {children}
    </AdVisibilityContext.Provider>
  );
};
