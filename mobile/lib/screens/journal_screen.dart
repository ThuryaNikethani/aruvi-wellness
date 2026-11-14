import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';
import '../widgets/mood_logger.dart';

class JournalScreen extends StatefulWidget {
  const JournalScreen({super.key});

  @override
  State<JournalScreen> createState() => _JournalScreenState();
}

class _JournalScreenState extends State<JournalScreen> {
  List<dynamic> _entries = [];
  List<dynamic> _moods = [];
  int _prompt = DateTime.now().day % 8;
  bool _usePrompt = true;
  bool _saving = false;
  final _title = TextEditingController();
  final _content = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await Future.wait([
        context.app.api.get('/api/journal', {'days': '366', 'limit': '30'}),
        context.app.api.get('/api/mood', {'days': '60', 'limit': '14'}),
      ]);
      if (!mounted) return;
      setState(() {
        _entries = r[0]['entries'] as List<dynamic>? ?? [];
        _moods = r[1]['entries'] as List<dynamic>? ?? [];
      });
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  Future<void> _save() async {
    if (_content.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      await context.app.api.post('/api/journal', {
        if (_title.text.trim().isNotEmpty) 'title': _title.text.trim(),
        'content': _content.text,
        if (_usePrompt) 'prompt': context.t('journal.prompts.$_prompt'),
      });
      _title.clear();
      _content.clear();
      if (mounted) toast(context, context.t('common.saved'));
      await _load();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _delete(String path) async {
    if (!await confirmDelete(context) || !mounted) return;
    final api = context.app.api;
    try {
      await api.delete(path);
      await _load();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!context.app.signedIn) return GuestGate(title: context.t('journal.title'));
    final tk = Tokens.of(context);

    return PageBody(
      title: context.t('journal.title'),
      subtitle: context.t('journal.subtitle'),
      onRefresh: _load,
      children: [
        MoodLogger(onSaved: _load),
        if (_moods.isNotEmpty)
          SectionCard(
            title: context.t('journal.moodHistory'),
            child: Column(children: [
              for (final m in _moods)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(moodIcon(m['mood'] as String), color: tk.leaf),
                  title: Text('${context.t('mood.options.${(m['mood'] as String).toLowerCase()}')}  ·  ${m['intensity']}/5'),
                  subtitle: Text([fmtDate(DateTime.parse(m['recordedAt'] as String), time: true), if (m['note'] != null) m['note']].join('\n')),
                  trailing: IconButton(
                    tooltip: context.t('journal.deleteMood'),
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => _delete('/api/mood/${m['id']}'),
                  ),
                ),
            ]),
          ),
        SectionCard(
          title: context.t('journal.writeTitle'),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (_usePrompt)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: tk.streamSoft, borderRadius: BorderRadius.circular(18)),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(context.t('journal.promptLabel'), style: TextStyle(color: tk.inkSoft, fontSize: 13, fontWeight: FontWeight.w600)),
                      Text(context.t('journal.prompts.$_prompt')),
                    ]),
                  ),
                  IconButton(
                    tooltip: context.t('journal.newPrompt'),
                    icon: const Icon(Icons.refresh),
                    onPressed: () => setState(() => _prompt = (_prompt + 1) % 8),
                  ),
                ]),
              ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _usePrompt,
              onChanged: (v) => setState(() => _usePrompt = v),
              title: Text(context.t('journal.showPrompt'), style: const TextStyle(fontSize: 14)),
            ),
            TextField(
              controller: _title,
              maxLength: 120,
              decoration: InputDecoration(labelText: '${context.t('journal.titleLabel')} (${context.t('common.optional')})'),
            ),
            TextField(
              controller: _content,
              minLines: 5,
              maxLines: 12,
              maxLength: 20000,
              decoration: InputDecoration(labelText: context.t('journal.contentLabel'), helperText: context.t('journal.privateNote'), alignLabelWithHint: true),
            ),
            const SizedBox(height: 8),
            FilledButton(onPressed: _saving ? null : _save, child: Text(_saving ? context.t('common.saving') : context.t('common.save'))),
          ]),
        ),
        Text(context.t('journal.entries'), style: Theme.of(context).textTheme.titleLarge),
        if (_entries.isEmpty) Text(context.t('journal.empty'), style: TextStyle(color: tk.inkSoft)),
        for (final e in _entries)
          SectionCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(fmtDate(DateTime.parse(e['createdAt'] as String), time: true), style: TextStyle(color: tk.inkSoft, fontSize: 13))),
                IconButton(
                  tooltip: context.t('journal.deleteEntry'),
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () => _delete('/api/journal/${e['id']}'),
                ),
              ]),
              if ((e['title'] as String?)?.isNotEmpty == true) Text(e['title'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 17)),
              if (e['prompt'] != null) Text(e['prompt'] as String, style: TextStyle(color: tk.inkSoft, fontStyle: FontStyle.italic, fontSize: 14)),
              const SizedBox(height: 4),
              SelectableText(e['content'] as String),
            ]),
          ),
      ],
    );
  }
}
