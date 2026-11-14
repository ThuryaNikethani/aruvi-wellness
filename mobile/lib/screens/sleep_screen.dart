import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';

class SleepScreen extends StatefulWidget {
  const SleepScreen({super.key});

  @override
  State<SleepScreen> createState() => _SleepScreenState();
}

class _SleepScreenState extends State<SleepScreen> {
  DateTime _date = DateTime.now();
  double _hours = 7;
  int _quality = 3, _energy = 3, _fatigue = 3;
  final _rest = TextEditingController();
  final _note = TextEditingController();
  bool _saving = false;
  Map<String, Map<String, dynamic>> _sleep = {}, _energyByDay = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _rest.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await Future.wait([
        context.app.api.get('/api/sleep', {'days': '30', 'limit': '14'}),
        context.app.api.get('/api/energy', {'days': '30', 'limit': '14'}),
      ]);
      Map<String, Map<String, dynamic>> byDay(List<dynamic> xs) =>
          {for (final x in xs) (x['date'] as String).substring(0, 10): x as Map<String, dynamic>};
      if (mounted) {
        setState(() {
          _sleep = byDay(r[0]['entries'] as List<dynamic>? ?? []);
          _energyByDay = byDay(r[1]['entries'] as List<dynamic>? ?? []);
        });
      }
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final day = isoDay(_date);
    try {
      await Future.wait([
        context.app.api.post('/api/sleep', {
          'date': day,
          'hours': _hours,
          'quality': _quality,
          if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
        }),
        context.app.api.post('/api/energy', {
          'date': day,
          'energy': _energy,
          'fatigue': _fatigue,
          if (int.tryParse(_rest.text) != null) 'restMinutes': int.parse(_rest.text),
        }),
      ]);
      if (mounted) toast(context, context.t('common.saved'));
      await _load();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!context.app.signedIn) return GuestGate(title: context.t('sleep.title'));
    final tk = Tokens.of(context);
    final days = {..._sleep.keys, ..._energyByDay.keys}.toList()..sort((a, b) => b.compareTo(a));

    return PageBody(
        title: context.t('sleep.title'),
        subtitle: context.t('sleep.subtitle'),
        onRefresh: _load,
        children: [
          SectionCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today_outlined),
                title: Text(context.t('sleep.date')),
                subtitle: Text('${isoDay(_date)}\n${context.t('sleep.dateHint')}'),
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) setState(() => _date = d);
                },
              ),
              const Divider(),
              Text(context.t('sleep.sleepTitle'), style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text('${context.t('sleep.hours')}: ${_hours.toStringAsFixed(1)}', style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(value: _hours, min: 0, max: 14, divisions: 28, label: _hours.toStringAsFixed(1), onChanged: (v) => setState(() => _hours = v)),
              ScaleField(label: context.t('sleep.quality'), value: _quality, onChanged: (v) => setState(() => _quality = v), low: context.t('sleep.poor'), high: context.t('sleep.restful')),
              const Divider(height: 32),
              Text(context.t('sleep.energyTitle'), style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              ScaleField(label: context.t('sleep.energy'), value: _energy, onChanged: (v) => setState(() => _energy = v), low: context.t('sleep.veryLow'), high: context.t('sleep.high')),
              ScaleField(label: context.t('sleep.fatigue'), value: _fatigue, onChanged: (v) => setState(() => _fatigue = v), low: context.t('sleep.little'), high: context.t('sleep.aLot')),
              const SizedBox(height: 8),
              TextField(
                controller: _rest,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: '${context.t('sleep.rest')} (${context.t('common.optional')})'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _note,
                maxLength: 500,
                decoration: InputDecoration(labelText: '${context.t('sleep.note')} (${context.t('common.optional')})'),
              ),
              FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? context.t('common.saving') : context.t('common.save'))),
            ]),
          ),
          SectionCard(
            title: context.t('sleep.history'),
            child: days.isEmpty
                ? Text(context.t('sleep.empty'), style: TextStyle(color: tk.inkSoft))
                : Column(children: [
                    for (final d in days)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(d),
                        subtitle: Text([
                          if (_sleep[d] != null) '${context.t('sleep.hours')}: ${_sleep[d]!['hours']} · ${context.t('sleep.quality')}: ${_sleep[d]!['quality']}/5',
                          if (_energyByDay[d] != null) '${context.t('sleep.energy')}: ${_energyByDay[d]!['energy']}/5',
                        ].join('\n')),
                      ),
                  ]),
          ),
        ],
    );
  }
}
