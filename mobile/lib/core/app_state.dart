import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'helplines.dart';
import 'i18n.dart';

/// App-wide state: language, comfort settings and the signed-in user.
class AppState extends ChangeNotifier {
  AppState._(this._prefs, this.i18n, this._token, this.helplines);

  static const _secure = FlutterSecureStorage();
  static const _tokenKey = 'aruvi_token';

  final SharedPreferences _prefs;
  final Helplines helplines;
  I18n i18n;
  String? _token;
  Map<String, dynamic>? user;
  late final Api api = Api(token: _token, onUnauthorized: _expire);

  static Future<AppState> init() async {
    final prefs = await SharedPreferences.getInstance();
    final device = WidgetsBinding.instance.platformDispatcher.locale.languageCode;
    final locale = prefs.getString('locale') ?? (localeNames.containsKey(device) ? device : 'en');
    String? token;
    try {
      token = await _secure.read(key: _tokenKey);
    } catch (_) {}
    final state = AppState._(prefs, await I18n.load(locale), token, await Helplines.load());
    if (token != null) await state.refreshUser();
    return state;
  }

  String t(String key, [Map<String, Object?> args = const {}]) => i18n.t(key, args);
  String get locale => i18n.locale;
  bool get signedIn => _token != null;

  // ───── Comfort ─────
  ThemeMode get themeMode => ThemeMode.values.byName(_prefs.getString('theme') ?? 'system');
  Future<void> setThemeMode(ThemeMode mode) async {
    await _prefs.setString('theme', mode.name);
    notifyListeners();
  }

  /// 1.0, 1.125 or 1.25 — the same steps as the website.
  double get textScale => _prefs.getDouble('textScale') ?? 1.0;
  Future<void> setTextScale(double value) async {
    await _prefs.setDouble('textScale', value);
    notifyListeners();
  }

  Future<void> setLocale(String code) async {
    i18n = await I18n.load(code);
    await _prefs.setString('locale', code);
    notifyListeners();
  }

  // ───── Helpline country ─────
  /// The user's pick for this language, else the language's country, else the phone's region.
  /// Remembered per language, so switching language switches country.
  String get country =>
      _prefs.getString('country_$locale') ??
      helplines.guess(locale, WidgetsBinding.instance.platformDispatcher.locale.countryCode);
  List<Helpline> get lines => helplines.linesFor(country);
  Future<void> setCountry(String code) async {
    await _prefs.setString('country_$locale', code);
    notifyListeners();
  }

  // ───── Account ─────
  Future<void> signIn(String email, String password) async {
    final res = await api.post('/api/mobile/auth/login', {'email': email, 'password': password});
    await _setToken(res['token'] as String);
    await refreshUser();
  }

  Future<void> register({required String name, required String email, required String password}) async {
    await api.post('/api/mobile/auth/register', {
      if (name.isNotEmpty) 'name': name,
      'email': email,
      'password': password,
      'locale': locale,
      'acceptTerms': true,
      'acceptHealthData': true,
    });
    await signIn(email, password);
  }

  Future<void> refreshUser() async {
    try {
      final res = await api.get('/api/mobile/me');
      user = res['user'] as Map<String, dynamic>?;
      notifyListeners();
    } on ApiException catch (e) {
      if (e.status == 401) await signOut();
    }
  }

  Future<void> signOut() async {
    await _setToken(null);
    user = null;
    notifyListeners();
  }

  void _expire() {
    signOut();
  }

  Future<void> _setToken(String? token) async {
    _token = token;
    api.token = token;
    try {
      if (token == null) {
        await _secure.delete(key: _tokenKey);
      } else {
        await _secure.write(key: _tokenKey, value: token);
      }
    } catch (_) {}
    notifyListeners();
  }

  // ───── Guest mood check-ins (kept on this phone only) ─────
  Future<void> saveLocalCheckIn(String mood, int intensity) async {
    final list = (jsonDecode(_prefs.getString('checkins') ?? '[]') as List).cast<Map<String, dynamic>>();
    list.add({'mood': mood, 'intensity': intensity, 'at': DateTime.now().toIso8601String()});
    await _prefs.setString('checkins', jsonEncode(list.length > 60 ? list.sublist(list.length - 60) : list));
  }
}
