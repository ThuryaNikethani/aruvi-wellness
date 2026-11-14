import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';
import '../widgets/mood_logger.dart';

class TodayScreen extends StatefulWidget {
  const TodayScreen({super.key, required this.onOpenTab});

  final ValueChanged<int> onOpenTab;

  @override
  State<TodayScreen> createState() => _TodayScreenState();
}

class _TodayScreenState extends State<TodayScreen> {
  Map<String, dynamic>? _insights;
  List<dynamic> _journal = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final app = context.app;
    if (!app.signedIn) return;
    try {
      final results = await Future.wait([
        app.api.get('/api/insights', {'days': '30'}),
        app.api.get('/api/journal', {'limit': '3'}),
      ]);
      if (!mounted) return;
      setState(() {
        _insights = results[0]['insights'] as Map<String, dynamic>?;
        _journal = results[1]['entries'] as List<dynamic>? ?? [];
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final tk = Tokens.of(context);
    final name = (app.user?['preferences']?['displayName'] ?? app.user?['name']) as String?;
    final day = DateTime.now().difference(DateTime(2026)).inDays;

    return PageBody(
      title: app.signedIn
          ? (name != null && name.isNotEmpty ? context.t('overview.greetingName', {'name': name}) : context.t('overview.greeting'))
          : context.t('hero.title'),
      subtitle: app.signedIn ? context.t('overview.subtitle') : context.t('hero.body'),
      onRefresh: _load,
      children: [
        if (app.i18n.isPartial) Notice(context.t('i18n.partial', {'language': app.locale}), icon: Icons.translate),
        if (!app.signedIn)
          Wrap(spacing: 8, runSpacing: 8, children: [
            FilledButton(onPressed: () => Navigator.of(context).pushNamed('/auth'), child: Text(context.t('auth.signUp'))),
            OutlinedButton(onPressed: () => Navigator.of(context).pushNamed('/auth'), child: Text(context.t('auth.signIn'))),
          ]),
        MoodLogger(onSaved: _load),
        _ActionCard(
          icon: Icons.spa_outlined,
          color: tk.leaf,
          title: context.t('overview.calmTitle'),
          body: context.t('overview.calmBody'),
          onTap: () => Navigator.of(context).pushNamed('/calm'),
        ),
        _ActionCard(
          icon: Icons.chat_bubble_outline,
          color: tk.stream,
          title: context.t('overview.companionTitle'),
          body: context.t('overview.companionBody'),
          onTap: () => widget.onOpenTab(2),
        ),
        SectionCard(
          color: tk.surface2,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(context.t('overview.suggestionTitle'), style: TextStyle(color: tk.inkSoft, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(context.t('overview.suggestions.${day % 6}'), style: const TextStyle(fontSize: 17)),
          ]),
        ),
        if (app.signedIn) ...[
          SectionCard(
            title: context.t('overview.summaryTitle'),
            child: Row(children: [
              Expanded(child: _Stat(label: context.t('overview.migraine30'), value: '${_insights?['migraine']?['count'] ?? '—'}')),
              Expanded(child: _Stat(label: context.t('insights.stats.avgSleep'), value: '${_insights?['sleep']?['avgHours'] ?? '—'}')),
            ]),
          ),
          SectionCard(
            title: context.t('overview.recentJournal'),
            child: _journal.isEmpty
                ? Text(context.t('overview.noJournal'), style: TextStyle(color: tk.inkSoft))
                : Column(children: [
                    for (final j in _journal)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text((j['title'] as String?)?.isNotEmpty == true ? j['title'] as String : (j['content'] as String), maxLines: 1, overflow: TextOverflow.ellipsis),
                        subtitle: Text(fmtDate(DateTime.parse(j['createdAt'] as String))),
                      ),
                  ]),
          ),
        ],
        const CrisisCard(),
      ],
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({required this.icon, required this.color, required this.title, required this.body, required this.onTap});

  final IconData icon;
  final Color color;
  final String title, body;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
        leading: Icon(icon, color: color, size: 28),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(body),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});

  final String label, value;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(color: Tokens.of(context).inkSoft, fontSize: 13)),
      Text(value, style: Theme.of(context).textTheme.headlineMedium),
    ]);
  }
}
