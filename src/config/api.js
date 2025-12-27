import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const API_BASE = isNative
  ? 'https://cravemate.onrender.com'
  : 'http://localhost:5000';
