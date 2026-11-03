import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from '@firebase/auth';

let firebaseAuth: Auth | undefined;

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const variableNames = {
    apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
  } as const;
  const missingKeys = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => variableNames[key as keyof typeof variableNames]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Faltan variables de Firebase: ${missingKeys.join(', ')}`,
    );
  }

  return config;
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) {
    return firebaseAuth;
  }

  const app =
    getApps().find((firebaseApp) => firebaseApp.name === '[DEFAULT]') ??
    initializeApp(getFirebaseConfig());

  firebaseAuth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  firebaseAuth.languageCode = 'es';
  return firebaseAuth;
}
