import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';

const _locations = ['left', 'right', 'both_sides', 'forehead', 'temples', 'behind_eyes', 'back_of_head', 'neck'];
const _characteristics = ['throbbing', 'pressing', 'stabbing', 'dull'];
const _symptoms = [
  'nausea', 'vomiting', 'light_sensitivity', 'sound_sensitivity', 'smell_sensitivity', 'aura', 'dizziness', 'fatigue', 'blurred_vision',
];
const _triggers = ['sleep', 'stress', 'weather', 'dehydration', 'meal_timing', 'screen', 'environment', 'menstrual', 'other'];

class MigraineScreen extends StatefulWidget {
  const MigraineScreen({super.key});

  @override
  State<MigraineScreen> createState() => _MigraineScreenState();
}

class _MigraineScreenState extends State<MigraineScreen> {
  List<dynamic> _episodes = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await context.app.api.get('/api/migraine', {'days': '366', 'limit': '30'});
      if (mounted) setState(() => _episodes = r['episodes'] as List<dynamic>? ?? []);
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  Future<void> _delete(String id) async {
    if (!await confirmDelete(context) || !mounted) return;
    final api = context.app.api;
    try {
      await api.delete('/api/migraine/$id');
      await _load();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!context.app.signedIn) return GuestGate(title: context.t('migraine.title'));
    final tk = Tokens.of(context);
    final menstrual = context.app.user?['preferences']?['trackMenstrual'] == true;

    return PageBody(
      title: context.t('migraine.title'),
      subtitle: context.t('migraine.subtitle'),
      onRefresh: _load,
      children: [
        Notice(context.t('migraine.disclaimer')),
        _EpisodeForm(showMenstrual: menstrual, onSaved: _load),
        Text(context.t('migraine.history'), style: Theme.of(context).textTheme.titleLarge),
        if (_episodes.isEmpty) Text(context.t('migraine.empty'), style: TextStyle(color: tk.inkSoft)),
        for (final e in _episodes) _EpisodeCard(episode: e as Map<String, dynamic>, onDelete: () => _delete(e['id'] as String)),
        Text(context.t('mobile.reportOnWeb'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
      ],
    );
  }
}

class _EpisodeCard extends StatelessWidget {
  const _EpisodeCard({required this.episode, required this.onDelete});

  final Map<String, dynamic> episode;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    final start = DateTime.parse(episode['startedAt'] as String);
    final end = episode['endedAt'] == null ? null : DateTime.parse(episode['endedAt'] as String);
    final hours = end == null ? null : (end.difference(start).inMinutes / 60 * 10).round() / 10;

    Widget chip(String text, Color bg) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
          child: Text(text, style: const TextStyle(fontSize: 13)),
        );

    return SectionCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(fmtDate(start, time: true), style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(
                '${context.t('migraine.intensity')}: ${episode['intensity']}/10 · ${hours == null ? context.t('migraine.ongoingShort') : context.t('migraine.duration', {'hours': hours})}',
                style: TextStyle(color: tk.inkSoft, fontSize: 14),
              ),
            ]),
          ),
          IconButton(tooltip: context.t('migraine.deleteEpisode'), icon: const Icon(Icons.delete_outline), onPressed: onDelete),
        ]),
        const SizedBox(height: 8),
        Wrap(spacing: 6, runSpacing: 6, children: [
          for (final l in (episode['locations'] as List? ?? [])) chip(context.t('migraine.locations.$l'), tk.surface2),
          for (final s in (episode['symptoms'] as List? ?? [])) chip(context.t('migraine.symptoms.${s['symptom']}'), tk.streamSoft),
          for (final tr in (episode['triggers'] as List? ?? []))
            chip(context.t('migraine.triggers.${(tr['category'] as String).toLowerCase()}'), tk.claySoft),
        ]),
        if (episode['medicationNote'] != null) ...[
          const SizedBox(height: 8),
          Text('${context.t('migraine.medication')}: ${episode['medicationNote']}', style: TextStyle(color: tk.inkSoft, fontSize: 14)),
        ],
        if (episode['recoveryNote'] != null)
          Text('${context.t('migraine.recovery')}: ${episode['recoveryNote']}', style: TextStyle(color: tk.inkSoft, fontSize: 14)),
      ]),
    );
  }
}

class _EpisodeForm extends StatefulWidget {
  const _EpisodeForm({required this.showMenstrual, required this.onSaved});

  final bool showMenstrual;
  final VoidCallback onSaved;

  @override
  State<_EpisodeForm> createState() => _EpisodeFormState();
}

class _EpisodeFormState extends State<_EpisodeForm> {
  DateTime _start = DateTime.now();
  DateTime? _end;
  bool _ongoing = true;
  int _intensity = 5;
  final _locs = <String>{}, _chars = <String>{}, _symps = <String>{}, _trigs = <String>{};
  final _med = TextEditingController();
  final _rec = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _med.dispose();
    _rec.dispose();
    super.dispose();
  }

  Future<DateTime?> _pick(DateTime initial) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      helpText: context.t('mobile.pickDate'),
    );
    if (date == null || !mounted) return null;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial), helpText: context.t('mobile.pickTime'));
    if (time == null) return null;
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  void _toggle(Set<String> set, String v) => setState(() => set.contains(v) ? set.remove(v) : set.add(v));

  Future<void> _save() async {
    if (!_ongoing && _end != null && _end!.isBefore(_start)) {
      toast(context, context.t('auth.errors.checkFields'));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.app.api.post('/api/migraine', {
        'startedAt': _start.toUtc().toIso8601String(),
        if (!_ongoing && _end != null) 'endedAt': _end!.toUtc().toIso8601String(),
        'intensity': _intensity,
        'locations': _locs.toList(),
        'characteristics': _chars.toList(),
        'symptoms': _symps.toList(),
        'triggers': [for (final t in _trigs) {'category': t}],
        if (_med.text.trim().isNotEmpty) 'medicationNote': _med.text.trim(),
        if (_rec.text.trim().isNotEmpty) 'recoveryNote': _rec.text.trim(),
      });
      if (!mounted) return;
      setState(() {
        _locs.clear();
        _chars.clear();
        _symps.clear();
        _trigs.clear();
        _med.clear();
        _rec.clear();
        _start = DateTime.now();
        _end = null;
        _ongoing = true;
      });
      toast(context, context.t('common.saved'));
      widget.onSaved();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final triggers = _triggers.where((t) => t != 'menstrual' || widget.showMenstrual).toList();
    final soft = TextStyle(color: Tokens.of(context).inkSoft, fontSize: 13);

    return SectionCard(
      title: context.t('migraine.formTitle'),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.schedule),
          title: Text(context.t('migraine.start')),
          subtitle: Text(fmtDate(_start, time: true)),
          onTap: () async {
            final d = await _pick(_start);
            if (d != null) setState(() => _start = d);
          },
        ),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          value: _ongoing,
          onChanged: (v) => setState(() => _ongoing = v),
          title: Text(context.t('migraine.ongoing')),
        ),
        if (!_ongoing)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.schedule_outlined),
            title: Text(context.t('migraine.end')),
            subtitle: Text(_end == null ? '—' : fmtDate(_end!, time: true)),
            onTap: () async {
              final d = await _pick(_end ?? DateTime.now());
              if (d != null) setState(() => _end = d);
            },
          ),
        ScaleField(label: context.t('migraine.intensity'), value: _intensity, min: 0, max: 10, onChanged: (v) => setState(() => _intensity = v)),
        Text(context.t('migraine.intensityHint'), style: soft),
        const SizedBox(height: 16),
        ChipGroup(label: context.t('migraine.locationsLabel'), options: _locations, selected: _locs, labelOf: (v) => context.t('migraine.locations.$v'), onToggle: (v) => _toggle(_locs, v)),
        const SizedBox(height: 16),
        ChipGroup(label: context.t('migraine.characteristicsLabel'), options: _characteristics, selected: _chars, labelOf: (v) => context.t('migraine.characteristics.$v'), onToggle: (v) => _toggle(_chars, v)),
        const SizedBox(height: 16),
        ChipGroup(label: context.t('migraine.symptomsLabel'), options: _symptoms, selected: _symps, labelOf: (v) => context.t('migraine.symptoms.$v'), onToggle: (v) => _toggle(_symps, v)),
        const SizedBox(height: 16),
        ChipGroup(label: context.t('migraine.triggersLabel'), options: triggers, selected: _trigs, labelOf: (v) => context.t('migraine.triggers.$v'), onToggle: (v) => _toggle(_trigs, v)),
        const SizedBox(height: 4),
        Text(context.t('migraine.triggersHint'), style: soft),
        const SizedBox(height: 16),
        TextField(
          controller: _med,
          maxLength: 1000,
          maxLines: 3,
          minLines: 1,
          decoration: InputDecoration(labelText: '${context.t('migraine.medication')} (${context.t('common.optional')})', helperText: context.t('migraine.medicationHint'), helperMaxLines: 2),
        ),
        TextField(
          controller: _rec,
          maxLength: 2000,
          maxLines: 3,
          minLines: 1,
          decoration: InputDecoration(labelText: '${context.t('migraine.recovery')} (${context.t('common.optional')})'),
        ),
        const SizedBox(height: 8),
        FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? context.t('common.saving') : context.t('migraine.save'))),
      ]),
    );
  }
}
