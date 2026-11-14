import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

/// Languages ARUVI offers, with names written in their own script.
/// `en`, `si` and `ta` are fully translated; others fall back to English.
const curatedLocales = ['en', 'si', 'ta'];

const localeNames = <String, String>{
  'en': 'English', 'si': 'සිංහල', 'ta': 'தமிழ்',
  'hi': 'हिन्दी', 'bn': 'বাংলা', 'ur': 'اردو', 'ml': 'മലയാളം', 'te': 'తెలుగు', 'kn': 'ಕನ್ನಡ',
  'mr': 'मराठी', 'gu': 'ગુજરાતી', 'pa': 'ਪੰਜਾਬੀ', 'ne': 'नेपाली', 'dv': 'ދިވެހި',
  'zh': '中文', 'ja': '日本語', 'ko': '한국어', 'th': 'ไทย', 'vi': 'Tiếng Việt', 'id': 'Bahasa Indonesia',
  'ms': 'Bahasa Melayu', 'fil': 'Filipino', 'my': 'မြန်မာ', 'km': 'ខ្មែរ',
  'ar': 'العربية', 'fa': 'فارسی', 'he': 'עברית', 'tr': 'Türkçe', 'sw': 'Kiswahili', 'am': 'አማርኛ',
  'yo': 'Yorùbá', 'ha': 'Hausa', 'zu': 'isiZulu',
  'es': 'Español', 'fr': 'Français', 'de': 'Deutsch', 'pt': 'Português', 'it': 'Italiano', 'ru': 'Русский',
  'uk': 'Українська', 'pl': 'Polski', 'nl': 'Nederlands', 'sv': 'Svenska', 'ro': 'Română', 'el': 'Ελληνικά',
  'cs': 'Čeština', 'hu': 'Magyar',
};

const _rtl = {'ar', 'fa', 'he', 'ur', 'dv'};
bool isRtl(String locale) => _rtl.contains(locale);

/// Translation lookup over the same JSON files the website uses (synced into assets/i18n).
class I18n {
  I18n(this.locale, this._messages);

  final String locale;
  final Map<String, dynamic> _messages;

  static Future<Map<String, dynamic>> _load(String code) async {
    try {
      return jsonDecode(await rootBundle.loadString('assets/i18n/$code.json')) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  static Future<I18n> load(String locale) async {
    final en = await _load('en');
    final local = locale == 'en' ? <String, dynamic>{} : await _load(locale);
    return I18n(locale, _merge(en, local));
  }

  static Map<String, dynamic> _merge(Map<String, dynamic> base, Map<String, dynamic> over) {
    final out = Map<String, dynamic>.from(base);
    over.forEach((k, v) {
      out[k] = (v is Map<String, dynamic> && out[k] is Map<String, dynamic>)
          ? _merge(out[k] as Map<String, dynamic>, v)
          : v;
    });
    return out;
  }

  bool get isPartial => !curatedLocales.contains(locale);

  /// `t('mood.options.happy')`, `t('overview.greetingName', {'name': 'Ama'})`.
  String t(String key, [Map<String, Object?> args = const {}]) {
    dynamic node = _messages;
    for (final part in key.split('.')) {
      if (node is Map<String, dynamic> && node.containsKey(part)) {
        node = node[part];
      } else {
        return key;
      }
    }
    return node is String ? formatMessage(node, args) : key;
  }
}

/// Minimal ICU formatter: `{name}`, `{n, plural, =0 {…} one {…} other {…}}`, `{v, select, …}`.
String formatMessage(String msg, Map<String, Object?> args) {
  final out = StringBuffer();
  var i = 0;
  while (i < msg.length) {
    if (msg[i] == '{') {
      final end = _matching(msg, i);
      if (end < 0) {
        out.write(msg.substring(i));
        break;
      }
      out.write(_argument(msg.substring(i + 1, end), args));
      i = end + 1;
    } else {
      out.write(msg[i]);
      i++;
    }
  }
  return out.toString();
}

int _matching(String s, int start) {
  var depth = 0;
  for (var j = start; j < s.length; j++) {
    if (s[j] == '{') depth++;
    if (s[j] == '}' && --depth == 0) return j;
  }
  return -1;
}

String _num(Object? v) {
  if (v is double && v == v.roundToDouble()) return v.toInt().toString();
  return '${v ?? 0}';
}

String _argument(String inner, Map<String, Object?> args) {
  final first = inner.indexOf(',');
  if (first < 0) {
    final name = inner.trim();
    return args.containsKey(name) ? '${args[name]}' : '{$name}';
  }
  final name = inner.substring(0, first).trim();
  final second = inner.indexOf(',', first + 1);
  if (second < 0) return '${args[name] ?? ''}';
  final type = inner.substring(first + 1, second).trim();
  final options = _options(inner.substring(second + 1));
  if (type == 'plural') {
    final n = (args[name] as num?) ?? 0;
    final chosen = options['=${n.toInt()}'] ?? (n == 1 ? options['one'] : null) ?? options['other'] ?? '';
    return formatMessage(chosen.replaceAll('#', _num(n)), args);
  }
  if (type == 'select') {
    return formatMessage(options['${args[name]}'] ?? options['other'] ?? '', args);
  }
  return '${args[name] ?? ''}';
}

Map<String, String> _options(String s) {
  final map = <String, String>{};
  var i = 0;
  while (i < s.length) {
    final open = s.indexOf('{', i);
    if (open < 0) break;
    final end = _matching(s, open);
    if (end < 0) break;
    map[s.substring(i, open).trim()] = s.substring(open + 1, end);
    i = end + 1;
  }
  return map;
}
