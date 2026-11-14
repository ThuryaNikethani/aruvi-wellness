/// Build-time configuration.
///
/// Point the app at your ARUVI server with:
///   flutter run --dart-define=API_BASE_URL=https://your-aruvi-site.example
/// The default reaches `npm run dev` on the host machine from the Android emulator.
class Config {
  static const apiBase = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');
}
