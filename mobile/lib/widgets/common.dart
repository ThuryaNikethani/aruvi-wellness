import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';

/// Shorthand for translations inside widgets.
extension Tr on BuildContext {
  String t(String key, [Map<String, Object?> args = const {}]) => read<AppState>().t(key, args);
  AppState get app => read<AppState>();
}

const moods = <(String, IconData)>[
  ('happy', Icons.wb_sunny_outlined),
  ('calm', Icons.spa_outlined),
  ('sad', Icons.cloudy_snowing),
  ('anxious', Icons.air),
  ('overwhelmed', Icons.waves),
  ('irritated', Icons.local_fire_department_outlined),
  ('exhausted', Icons.battery_1_bar),
  ('lonely', Icons.nightlight_outlined),
  ('numb', Icons.blur_circular),
];

IconData moodIcon(String key) =>
    moods.firstWhere((m) => m.$1 == key.toLowerCase(), orElse: () => moods[1]).$2;

/// Page body with consistent padding and a large title.
class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.title, this.subtitle, required this.children, this.onRefresh});

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final list = ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        Text(title, style: Theme.of(context).textTheme.headlineMedium),
        if (subtitle != null) ...[
          const SizedBox(height: 4),
          Text(subtitle!, style: TextStyle(color: Tokens.of(context).inkSoft)),
        ],
        const SizedBox(height: 20),
        ...children.expand((w) => [w, const SizedBox(height: 16)]),
      ],
    );
    return onRefresh == null ? list : RefreshIndicator(onRefresh: onRefresh!, child: list);
  }
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, this.title, required this.child, this.color});

  final String? title;
  final Widget child;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: color,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null) ...[
              Text(title!, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
            ],
            child,
          ],
        ),
      ),
    );
  }
}

class Notice extends StatelessWidget {
  const Notice(this.text, {super.key, this.icon = Icons.info_outline, this.warm = false});

  final String text;
  final IconData icon;
  final bool warm;

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: warm ? tk.claySoft : tk.streamSoft, borderRadius: BorderRadius.circular(18)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: tk.ink),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}

/// A labelled 1–N slider with low/high captions.
class ScaleField extends StatelessWidget {
  const ScaleField({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.max = 5,
    this.low,
    this.high,
  });

  final String label;
  final int value;
  final int min, max;
  final String? low, high;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final soft = TextStyle(color: Tokens.of(context).inkSoft, fontSize: 13);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: $value / $max', style: const TextStyle(fontWeight: FontWeight.w600)),
        Slider(
          value: value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: max - min,
          label: '$value',
          semanticFormatterCallback: (v) => '${v.round()} / $max',
          onChanged: (v) => onChanged(v.round()),
        ),
        if (low != null && high != null)
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text(low!, style: soft), Text(high!, style: soft)]),
      ],
    );
  }
}

/// Multi-select chips.
class ChipGroup extends StatelessWidget {
  const ChipGroup({super.key, required this.label, required this.options, required this.selected, required this.labelOf, required this.onToggle});

  final String label;
  final List<String> options;
  final Set<String> selected;
  final String Function(String) labelOf;
  final ValueChanged<String> onToggle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final o in options)
              FilterChip(label: Text(labelOf(o)), selected: selected.contains(o), onSelected: (_) => onToggle(o)),
          ],
        ),
      ],
    );
  }
}

/// Shown instead of a feature that needs an account.
class GuestGate extends StatelessWidget {
  const GuestGate({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return PageBody(title: title, children: [
      SectionCard(
        title: context.t('mobile.guestTitle'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.t('mobile.guestBody')),
            const SizedBox(height: 16),
            FilledButton(onPressed: () => Navigator.of(context).pushNamed('/auth'), child: Text(context.t('auth.signIn'))),
          ],
        ),
      ),
    ]);
  }
}

/// Human-support card with tap-to-call numbers.
class CrisisCard extends StatelessWidget {
  const CrisisCard({super.key, this.title, this.body});

  final String? title, body;

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(color: tk.claySoft, borderRadius: BorderRadius.circular(24), border: Border.all(color: tk.clay)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(Icons.support, color: tk.clay),
              const SizedBox(width: 8),
              Expanded(child: Text(title ?? context.t('help.title'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16))),
            ]),
            const SizedBox(height: 8),
            Text(body ?? context.t('help.body')),
            const SizedBox(height: 12),
            const HelplineButtons(),
            const SizedBox(height: 8),
            const CountryTile(),
          ],
        ),
      ),
    );
  }
}

/// Call buttons for the chosen country, or the international directory.
class HelplineButtons extends StatelessWidget {
  const HelplineButtons({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final lines = app.lines.take(2).toList();
    if (lines.isEmpty) {
      return FilledButton.icon(
        onPressed: () => launchUrl(Uri.parse(app.helplines.directory), mode: LaunchMode.externalApplication),
        icon: const Icon(Icons.open_in_new, size: 18),
        label: Text(context.t('help.findMore')),
      );
    }
    return Wrap(spacing: 8, runSpacing: 8, children: [
      for (final l in lines) CallButton(number: l.number, tel: l.tel, label: l.name(app.locale)),
    ]);
  }
}

/// Shows the helpline country and lets the user change it.
class CountryTile extends StatelessWidget {
  const CountryTile({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final name = app.country == 'OTHER' ? context.t('help.otherCountry') : app.helplines.countryName(app.country, app.locale);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      leading: const Icon(Icons.public),
      title: Text(context.t('help.countryLabel')),
      subtitle: Text(name),
      trailing: const Icon(Icons.expand_more),
      onTap: () => pickCountry(context),
    );
  }
}

Future<void> pickCountry(BuildContext context) async {
  final app = context.read<AppState>();
  final codes = app.helplines.countries..sort((a, b) => app.helplines.countryName(a, app.locale).compareTo(app.helplines.countryName(b, app.locale)));
  final code = await showModalBottomSheet<String>(
    context: context,
    builder: (c) => SafeArea(
      child: RadioGroup<String>(
        groupValue: app.country,
        onChanged: (v) => Navigator.pop(c, v),
        child: ListView(shrinkWrap: true, children: [
          ListTile(title: Text(context.t('help.countryLabel'), style: const TextStyle(fontWeight: FontWeight.w700))),
          for (final cc in codes) RadioListTile<String>(value: cc, title: Text(app.helplines.countryName(cc, app.locale))),
          RadioListTile<String>(value: 'OTHER', title: Text(context.t('help.otherCountry'))),
        ]),
      ),
    ),
  );
  if (code != null) await app.setCountry(code);
}

class CallButton extends StatelessWidget {
  const CallButton({super.key, required this.number, required this.tel, required this.label});

  final String number, tel, label;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      onPressed: () => launchUrl(Uri.parse('tel:$tel')),
      icon: const Icon(Icons.phone, size: 18),
      label: Text(number),
      style: FilledButton.styleFrom(),
    ).withSemantics(context.t('help.call', {'name': label, 'number': number}));
  }
}

extension on Widget {
  Widget withSemantics(String label) => Semantics(label: label, button: true, excludeSemantics: true, child: this);
}

/// Translates an API error into a gentle message.
String errorText(BuildContext context, Object e) {
  if (e is ApiException) {
    if (e.status == 0) return context.t('mobile.offline');
    if (e.status == 429) return context.t('auth.errors.rateLimited');
  }
  return context.t('common.error');
}

void toast(BuildContext context, String text) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text), behavior: SnackBarBehavior.floating));
}

/// Two-step delete confirmation.
Future<bool> confirmDelete(BuildContext context) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      content: Text(context.t('common.confirmDelete')),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c, false), child: Text(context.t('common.cancel'))),
        FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(context.t('common.yes'))),
      ],
    ),
  );
  return ok ?? false;
}

String fmtDate(DateTime d, {bool time = false}) {
  final local = d.toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  final date = '${local.year}-${two(local.month)}-${two(local.day)}';
  return time ? '$date  ${two(local.hour)}:${two(local.minute)}' : date;
}

String isoDay(DateTime d) => fmtDate(d);
