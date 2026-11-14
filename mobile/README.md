# ARUVI mobile (Flutter)

The ARUVI app for Android and iOS. It uses the same backend as the website (the Next.js API in the repository root), so accounts, journals, diaries and the AI companion are shared between web and mobile.

## Features

- Today: greeting, mood check-in, Calm Space and companion shortcuts, a daily gentle idea, a 30-day summary
- Calm Space breathing (gentle 4·6 and box rhythms, three backgrounds, pause/resume/stop, respects "remove animations")
- Mood & journal with writing prompts
- AI companion (streamed replies, crisis support card with tap-to-call 1926 / 1990)
- Migraine diary (time, intensity, location, symptoms, possible triggers, medication note)
- Sleep & energy, wellness insights
- Settings: language (English, සිංහල, தமிழ் + 44 more), light/dark theme, text size, preferences, sign out, permanent account deletion
- Works without an account for check-ins (stored on the phone), Calm Space and help numbers

## Run it

1. Start the backend from the repository root: `npm run dev` (see the main README for the database and keys).
2. In this folder:

```bash
flutter pub get
flutter run                     # Android emulator → talks to http://10.0.2.2:3000
```

On a real phone, point the app at your computer's address on the same Wi-Fi, or at a deployed site:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000
flutter run --dart-define=API_BASE_URL=https://your-aruvi-site.example
```

Plain `http://` is allowed only in debug builds. Release builds need an `https://` server.

## Build an APK

Android builds need **JDK 17**. Then:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://your-aruvi-site.example
# → build/app/outputs/flutter-apk/app-release.apk
```

For the Play Store, use `flutter build appbundle` and set up release signing (see https://docs.flutter.dev/deployment/android).

## Translations

The app reads the same files as the website. After editing anything in `/messages`, run from the repository root:

```bash
npm run mobile:i18n
```

Mobile-only text lives in the `mobile` section of those files.

## Tests

```bash
flutter analyze
flutter test
```

The widget tests render the app in English, Sinhala, Tamil and Arabic (RTL) at phone size and run the breathing exercise.

## Auth

The app signs in with `POST /api/mobile/auth/login` and gets a 30-day bearer token, stored in the platform's secure storage (Android Keystore / iOS Keychain). Every API call sends `Authorization: Bearer <token>`.
