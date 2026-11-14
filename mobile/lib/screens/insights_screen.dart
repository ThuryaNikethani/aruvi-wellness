import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';

/// Descriptive summaries of the user's own records. Never causal, never a diagnosis.
class InsightsScreen extends StatefulWidget {
  const InsightsScreen({super.key});

  @override
  State<InsightsScreen> createState() => _InsightsScreenState();
}

class _InsightsScreenState extends State<InsightsScreen> {
  int _days = 30;
  Map<String, dynamic>? _data;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await context.app.api.get('/api/insights', {'days': '$_days'});
      if (mounted) setState(() => _data = r['insights'] as Map<String, dynamic>?);
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  String _describe(Map<String, dynamic> o) {
    switch (o['key']) {
      case 'topTrigger':
        return context.t('insights.obs.topTrigger', {
          'trigger': context.t('migraine.triggers.${(o['trigger'] as String).toLowerCase()}'),
          'count': o['count'],
          'total': o['total'],
        });
      case 'lowSleepMigraine':
        return context.t('insights.obs.lowSleepMigraine', {'share': o['lowSleepShare'], 'overall': o['overallLowSleepShare']});
      case 'steadyMood':
        return context.t('insights.obs.steadyMood', {'mood': context.t('mood.options.${(o['mood'] as String).toLowerCase()}'), 'count': o['count']});
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    if (!context.app.signedIn) return GuestGate(title: context.t('insights.title'));
    final tk = Tokens.of(context);
    final d = _data;
    final counts = (d?['mood']?['counts'] as Map<String, dynamic>?) ?? {};
    final maxCount = counts.values.fold<int>(1, (m, v) => (v as int) > m ? v : m);
    final daily = (d?['daily'] as List<dynamic>?) ?? [];
    final maxMigraine = daily.fold<int>(1, (m, x) => (x['migraines'] as int) > m ? x['migraines'] as int : m);

    return PageBody(
      title: context.t('insights.title'),
      subtitle: context.t('insights.subtitle'),
      onRefresh: _load,
      children: [
        SegmentedButton<int>(
          segments: [for (final r in const [7, 30, 90]) ButtonSegment(value: r, label: Text(context.t('insights.range', {'days': r})))],
          selected: {_days},
          onSelectionChanged: (s) {
            setState(() => _days = s.first);
            _load();
          },
        ),
        Notice(context.t('insights.disclaimer')),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _Stat(context.t('insights.stats.checkIns'), '${d?['mood']?['total'] ?? '—'}'),
            _Stat(context.t('insights.stats.migraines'), '${d?['migraine']?['count'] ?? '—'}'),
            _Stat(context.t('insights.stats.avgDuration'), '${d?['migraine']?['avgDurationHours'] ?? '—'}'),
            _Stat(context.t('insights.stats.avgSleep'), '${d?['sleep']?['avgHours'] ?? '—'}'),
          ],
        ),
        SectionCard(
          title: context.t('insights.observationsTitle'),
          child: (d?['observations'] as List?)?.isNotEmpty == true
              ? Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  for (final o in d!['observations'] as List)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text('•  ${_describe(o as Map<String, dynamic>)}'),
                    ),
                ])
              : Text(context.t('insights.notEnough'), style: TextStyle(color: tk.inkSoft)),
        ),
        SectionCard(
          title: context.t('insights.moodChart'),
          child: counts.isEmpty
              ? Text(context.t('insights.noData'), style: TextStyle(color: tk.inkSoft))
              : Column(children: [
                  for (final m in moods)
                    if ((counts[m.$1.toUpperCase()] ?? 0) as int > 0)
                      _Bar(
                        label: context.t('mood.options.${m.$1}'),
                        value: counts[m.$1.toUpperCase()] as int,
                        fraction: (counts[m.$1.toUpperCase()] as int) / maxCount,
                        color: tk.leaf,
                      ),
                ]),
        ),
        SectionCard(
          title: context.t('insights.migraineChart'),
          child: Semantics(
            label: context.t('insights.migraineChart'),
            value: '${d?['migraine']?['count'] ?? 0}',
            child: SizedBox(
              height: 90,
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                for (final x in daily)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 1),
                      child: Container(
                        height: (x['migraines'] as int) == 0 ? 2 : 86 * (x['migraines'] as int) / maxMigraine,
                        decoration: BoxDecoration(
                          color: (x['migraines'] as int) == 0 ? tk.line : tk.stream,
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        ),
                      ),
                    ),
                  ),
              ]),
            ),
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);

  final String label, value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: TextStyle(color: Tokens.of(context).inkSoft, fontSize: 13), maxLines: 2),
          Text(value, style: Theme.of(context).textTheme.headlineMedium),
        ]),
      ),
    );
  }
}

class _Bar extends StatelessWidget {
  const _Bar({required this.label, required this.value, required this.fraction, required this.color});

  final String label;
  final int value;
  final double fraction;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$label: $value',
      excludeSemantics: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          SizedBox(width: 110, child: Text(label, style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis)),
          Expanded(
            child: LayoutBuilder(
              builder: (_, c) => Align(
                alignment: AlignmentDirectional.centerStart,
                child: Container(
                  width: c.maxWidth * fraction,
                  height: 14,
                  decoration: BoxDecoration(color: color, borderRadius: const BorderRadius.horizontal(right: Radius.circular(4))),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text('$value', style: const TextStyle(fontSize: 13)),
        ]),
      ),
    );
  }
}
