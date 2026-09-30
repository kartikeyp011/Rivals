import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  // Use Google Test App IDs in development, or if missing in production
  const ADMOB_ANDROID_APP_ID = process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713';
  const ADMOB_IOS_APP_ID = process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS || 'ca-app-pub-3940256099942544~1458002511';

  return {
    ...config,
    name: "Rivals",
    slug: "rivals",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/rivals-logo.png",
    scheme: "rivals",
    userInterfaceStyle: "dark",
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.kartikeyp011.rivals",
      icon: "./assets/images/rivals-logo.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIRequiresFullScreen: true,
        NSUserTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you.",
        UIApplicationSceneManifest: {
          UIApplicationSupportsMultipleScenes: false,
          UISceneConfigurations: {
            UIWindowSceneSessionRoleApplication: [
              {
                UISceneConfigurationName: "Default Configuration",
                UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate"
              }
            ]
          }
        }
      },
      googleServicesFile: "./GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/rivals-logo.png",
        backgroundColor: "#0a0a1a"
      },
      predictiveBackGestureEnabled: false,
      package: "com.kartikeyp011.rivals",
      permissions: [],
      versionCode: 1,
      googleServicesFile: "./google-services.json"
    },
    web: {
      output: "static",
      favicon: "./assets/images/rivals-logo.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#0a0a1a",
          image: "./assets/images/rivals-logo.png",
          resizeMode: "contain"
        }
      ],
      "expo-image",
      "@react-native-firebase/app",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static"
          }
        }
      ],
      [
        "@sentry/react-native/expo",
        {
          organization: process.env.SENTRY_ORG || "sentry",
          project: process.env.SENTRY_PROJECT || "sentry-react-native",
        }
      ],
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: ADMOB_ANDROID_APP_ID,
          iosAppId: ADMOB_IOS_APP_ID,
          userTrackingUsageDescription: "This identifier will be used to deliver personalized ads to you."
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "59de9f91-14c9-4612-a48c-62caf9cae536"
      },
      EXPO_PUBLIC_ADMOB_REWARDED_ANDROID: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID,
      EXPO_PUBLIC_ADMOB_REWARDED_IOS: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS,
    },
    owner: "sentinels"
  };
};
