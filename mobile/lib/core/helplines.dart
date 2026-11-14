import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

/// Crisis lines by country — the same data as the website (data/helplines.json).
class Helpline {
  Helpline(this.number, this.tel, this.names);
  final String number, tel;
  final Map<String, String> names;
  String name(String locale) => names[locale] ?? names['en'] ?? number;
}

class Helplines {
  Helplines._(this.directory, this._countries, this._localeCountry, this.defaultCountry, [this._names = const {}]);

  static const other = 'OTHER';

  final String directory;
  final Map<String, List<Helpline>> _countries;
  final Map<String, String> _localeCountry;
  final String defaultCountry;
  final Map<String, Map<String, String>> _names;

  static Future<Helplines> load() async {
    try {
      final j = jsonDecode(await rootBundle.loadString('assets/data/helplines.json')) as Map<String, dynamic>;
      final countries = <String, List<Helpline>>{};
      final names = <String, Map<String, String>>{};
      (j['countries'] as Map<String, dynamic>).forEach((code, v) {
        names[code] = (v['name'] as Map).cast<String, String>();
        countries[code] = [
          for (final l in (v['lines'] as List))
            Helpline(l['number'] as String, l['tel'] as String, (l['name'] as Map).cast<String, String>()),
        ];
      });
      return Helplines._(
        j['directory'] as String,
        countries,
        (j['localeCountry'] as Map).cast<String, String>(),
        j['defaultCountry'] as String,
        names,
      );
    } catch (_) {
      // Should never happen (bundled asset), but never leave a crisis screen empty.
      return Helplines._('https://findahelpline.com', {
        'LK': [Helpline('1926', '1926', {'en': 'National Mental Health Helpline'}), Helpline('1990', '1990', {'en': 'Ambulance'})],
      }, {}, 'LK');
    }
  }

  List<String> get countries => _countries.keys.toList();

  String countryName(String code, String locale) => _names[code]?[locale] ?? _names[code]?['en'] ?? code;

  List<Helpline> linesFor(String country) => _countries[country] ?? const [];

  /// Device region → language → default.
  String guess(String locale, String? deviceCountry) {
    final c = deviceCountry?.toUpperCase();
    if (c != null && c.length == 2) return _countries.containsKey(c) ? c : other;
    return _localeCountry[locale] ?? defaultCountry;
  }
}
