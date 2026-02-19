# BRAJ Consultancy — Android App (command line only)

This project uses **Capacitor** to run the same web app as a native Android app. You can build and run it **without Android Studio**, using only the command line.

## Prerequisites

- **Node.js** (v18+)
- **Java 17** (JDK)
- **Android SDK** (command-line tools only — no Android Studio required)
  - Download: [Android command line tools](https://developer.android.com/studio#command-tools)
  - Set **ANDROID_HOME** (or **ANDROID_SDK_ROOT**) to the SDK folder
  - Install: `sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"`
  - Optional (for emulator): `sdkmanager "emulator" "system-images;android-34;google_apis;x86_64"`

## Setup (first time)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the web app**
   ```bash
   npm run build
   ```

3. **Add the Android platform** (creates the `android` folder)
   ```bash
   npx cap add android
   ```

4. **Sync web build into the Android project**
   ```bash
   npx cap sync android
   ```

## Build and run (no Android Studio)

1. **Build the web app and sync to Android**
   ```bash
   npm run android
   ```
   (Or: `npm run build` then `npx cap sync android`.)

2. **Connect a device** (USB debugging on) or **start an emulator**:
   ```bash
   emulator -avd Your_AVD_Name
   ```
   (Create an AVD with `avdmanager create avd -n Your_AVD_Name -k "system-images;android-34;google_apis;x86_64"` if needed.)

3. **Build the Android app and run it on the device/emulator**
   ```bash
   npx cap run android
   ```
   This builds the APK, installs it, and launches the app. No Android Studio required.

## Build a debug APK only

To produce an APK file without installing/running:

**Windows (cmd):**
```bash
cd android
gradlew.bat assembleDebug
```

**Mac / Linux:**
```bash
cd android
./gradlew assembleDebug
```

The APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on a device with:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Useful commands

| Command | Description |
|--------|-------------|
| `npm run build` | Build the web app (output in `dist/`) |
| `npm run android` | Build web app + sync into `android/` |
| `npm run android:build` | Same as `npm run android` |
| `npx cap sync android` | Copy `dist/` into Android project only |
| `npx cap run android` | Build native app and run on device/emulator |

## App configuration

- **App ID:** `com.braj.consultancy`
- **App name:** BRAJ Consultancy
- **Web assets:** `dist/` (Vite build output)

To change app name or ID, edit `capacitor.config.ts` and run `npx cap sync android`.

## Building a release APK/AAB (signed)

From the `android` folder, use Gradle with a keystore:

1. Create a keystore (once):  
   `keytool -genkey -v -keystore my-release-key.keystore -alias my-key -keyalg RSA -keysize 2048 -validity 10000`

2. Configure signing in `android/app/build.gradle` (signingConfigs with your keystore).

3. Run:  
   **Windows:** `gradlew.bat assembleRelease` or `bundleRelease`  
   **Mac/Linux:** `./gradlew assembleRelease` or `./gradlew bundleRelease`

Outputs: `app/build/outputs/apk/release/` or `app/build/outputs/bundle/release/`.

## Notes

- After any change to the web app, run `npm run build` then `npx cap sync android` (or `npm run android`) before running the app again.
- The Android app uses the same Supabase backend; ensure the device has internet access.
