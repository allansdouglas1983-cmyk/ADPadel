# Building a sideloadable Android APK

The **Android APK (sideload)** GitHub Actions workflow
(`.github/workflows/android-apk.yml`) builds a production-variant `.apk` you can
install directly on a device for testing — no EAS cloud, no Play Store, no local
Android toolchain required. The release build embeds the minified production JS
bundle (not a dev client), so it behaves like a real store build.

## Run it

1. GitHub → **Actions** → **Android APK (sideload)** → **Run workflow**.
   - Optionally set a **version name** (e.g. `0.1.0-rc1`) to stamp the build.
   - Pushing a tag matching `v*` also triggers a build.
2. When the run finishes, open it and download the **`marque-release-<n>`**
   artifact from the *Artifacts* section — that zip contains `app-release.apk`.
3. On your Android phone, enable **Install unknown apps** for your browser/Files
   app, then open the APK to install.

## Signing

- **No setup:** the APK is signed with the auto-generated Android **debug key**.
  It installs and runs fine, but the signature differs between runs — to install
  a newer build you must first uninstall the previous one.
- **Stable signature (recommended for iterative testing):** add a repository
  secret **`ANDROID_KEYSTORE_BASE64`** so every build is signed with the same
  key and installs *over* the previous one. Create it with the standard debug
  alias/passwords so no Gradle config changes are needed:

  ```bash
  keytool -genkeypair -v -keystore marque.keystore -alias androiddebugkey \
    -storepass android -keypass android -keyalg RSA -keysize 2048 \
    -validity 10000 -dname "CN=Marque, O=Marque, L=London, C=GB"
  base64 -w0 marque.keystore   # paste the output as the ANDROID_KEYSTORE_BASE64 secret
  ```

  > This is a *test* signing key, not a Play Store upload key. Production Play
  > releases use Play App Signing (managed separately).

## Optional runtime config

These repository secrets are injected at bundle time if present, and are safe to
omit — the app runs fully offline without them:

| Secret | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cloud backup / sync |
| `EXPO_PUBLIC_RC_ANDROID` | RevenueCat (Pro entitlement) |
| `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | Crash reporting + source maps |

## How it works

`pnpm install` → build the `@padel/*` workspace packages (the app resolves them
to `dist/`, so they must exist before Metro bundles) → `expo prebuild` generates
the native Android project → `./gradlew :app:assembleRelease` produces the APK →
uploaded as a build artifact. `versionCode` is set from the workflow run number
so each build is upgradeable.
