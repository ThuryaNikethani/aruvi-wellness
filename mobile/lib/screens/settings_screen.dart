import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_state.dart';
import '../core/i18n.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Map<String, dynamic>? _prefs;
  final _name = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false, _deleting = false;

  @override
  void initState() {
    super.initState();
    final p = context.app.user?['preferences'] as Map<String, dynamic>?;
    _prefs = p == null ? null : Map.of(p);
    _name.text = (p?['displayName'] ?? context.app.user?['name'] ?? '') as String;
  }

  @override
  void dispose() {
    _name.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _savePrefs() async {
    setState(() => _saving = true);
    final app = context.app;
    try {
      await app.api.patch('/api/preferences', {
        'displayName': _name.text.trim().isEmpty ? null : _name.text.trim(),
        'trackMigraine': _prefs?['trackMigraine'] == true,
        'trackMenstrual': _prefs?['trackMenstrual'] == true,
        'keepAiHistory': _prefs?['keepAiHistory'] == true,
        'locale': app.locale,
      }..removeWhere((k, v) => v == null));
      await app.refreshUser();
      if (mounted) toast(context, context.t('common.saved'));
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _deleteAccount() async {
    setState(() => _deleting = true);
    final app = context.app;
    try {
      await app.api.delete('/api/account', {'confirm': 'DELETE'});
      await app.signOut();
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _pickLanguage() async {
    final app = context.app;
    final others = localeNames.keys.where((k) => !curatedLocales.contains(k)).toList()
      ..sort((a, b) => localeNames[a]!.compareTo(localeNames[b]!));
    final code = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (c) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        builder: (_, scroll) => RadioGroup<String>(
          groupValue: app.locale,
          onChanged: (v) => Navigator.pop(c, v),
          child: ListView(controller: scroll, children: [
            ListTile(title: Text(context.t('nav.languagesFull'), style: const TextStyle(fontWeight: FontWeight.w700))),
            for (final l in curatedLocales) RadioListTile<String>(value: l, title: Text(localeNames[l]!)),
            ListTile(title: Text(context.t('nav.languagesMore'), style: const TextStyle(fontWeight: FontWeight.w700))),
            for (final l in others) RadioListTile<String>(value: l, title: Text(localeNames[l]!)),
          ]),
        ),
      ),
    );
    if (code != null) await app.setLocale(code);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final tk = Tokens.of(context);

    return PageBody(
      title: context.t('settings.title'),
      subtitle: app.signedIn ? context.t('mobile.signedInAs', {'email': app.user?['email'] ?? ''}) : null,
      children: [
        SectionCard(
          title: context.t('mobile.appearance'),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.language),
              title: Text(context.t('nav.language')),
              subtitle: Text(localeNames[app.locale] ?? app.locale),
              onTap: _pickLanguage,
            ),
            const CountryTile(),
            const SizedBox(height: 8),
            SegmentedButton<ThemeMode>(
              segments: [
                ButtonSegment(value: ThemeMode.system, label: Text(context.t('mobile.themeSystem'))),
                ButtonSegment(value: ThemeMode.light, label: Text(context.t('mobile.themeLight'))),
                ButtonSegment(value: ThemeMode.dark, label: Text(context.t('mobile.themeDark'))),
              ],
              selected: {app.themeMode},
              onSelectionChanged: (s) => app.setThemeMode(s.first),
            ),
            const SizedBox(height: 16),
            Text(context.t('mobile.textSize'), style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SegmentedButton<double>(
              segments: [
                ButtonSegment(value: 1.0, label: Text(context.t('comfort.sizes.normal'))),
                ButtonSegment(value: 1.125, label: Text(context.t('comfort.sizes.large'))),
                ButtonSegment(value: 1.25, label: Text(context.t('comfort.sizes.larger'))),
              ],
              selected: {app.textScale},
              onSelectionChanged: (s) => app.setTextScale(s.first),
            ),
          ]),
        ),
        if (app.signedIn && _prefs != null) ...[
          SectionCard(
            title: context.t('settings.prefsTitle'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              TextField(controller: _name, maxLength: 80, decoration: InputDecoration(labelText: context.t('settings.displayName'))),
              for (final key in const ['trackMigraine', 'trackMenstrual', 'keepAiHistory'])
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _prefs![key] == true,
                  onChanged: (v) => setState(() => _prefs![key] = v),
                  title: Text(context.t('settings.$key.title')),
                  subtitle: Text(context.t('settings.$key.body')),
                ),
              const SizedBox(height: 8),
              FilledButton(onPressed: _saving ? null : _savePrefs, child: Text(_saving ? context.t('common.saving') : context.t('common.save'))),
            ]),
          ),
          SectionCard(
            title: context.t('mobile.account'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              OutlinedButton.icon(
                onPressed: () async {
                  await app.signOut();
                  if (context.mounted) Navigator.of(context).popUntil((r) => r.isFirst);
                },
                icon: const Icon(Icons.logout),
                label: Text(context.t('dash.nav.signOut')),
              ),
            ]),
          ),
          SectionCard(
            color: tk.claySoft,
            title: context.t('settings.deleteTitle'),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(context.t('settings.deleteBody')),
              const SizedBox(height: 12),
              TextField(
                controller: _confirm,
                autocorrect: false,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(labelText: context.t('settings.deleteConfirmLabel')),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                style: OutlinedButton.styleFrom(foregroundColor: tk.clay, side: BorderSide(color: tk.clay)),
                onPressed: _confirm.text == 'DELETE' && !_deleting ? _deleteAccount : null,
                child: Text(_deleting ? context.t('common.saving') : context.t('settings.deleteButton')),
              ),
            ]),
          ),
        ] else if (!app.signedIn)
          FilledButton(onPressed: () => Navigator.of(context).pushNamed('/auth'), child: Text(context.t('auth.signIn'))),
        Text(context.t('footer.disclaimer'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
      ],
    );
  }
}
