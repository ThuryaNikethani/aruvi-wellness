import 'package:flutter/material.dart';

import '../core/theme.dart';
import 'common.dart';

/// Mood check-in. Signed in: saved to the account. Guest: kept on this phone.
class MoodLogger extends StatefulWidget {
  const MoodLogger({super.key, this.onSaved});

  final VoidCallback? onSaved;

  @override
  State<MoodLogger> createState() => _MoodLoggerState();
}

class _MoodLoggerState extends State<MoodLogger> {
  String? _mood;
  int _intensity = 3;
  final _note = TextEditingController();
  bool _saving = false;
  String? _savedFor;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final mood = _mood;
    if (mood == null) return;
    setState(() => _saving = true);
    final app = context.app;
    try {
      if (app.signedIn) {
        await app.api.post('/api/mood', {
          'mood': mood,
          'intensity': _intensity,
          if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
        });
      } else {
        await app.saveLocalCheckIn(mood, _intensity);
      }
      if (!mounted) return;
      setState(() {
        _savedFor = mood;
        _mood = null;
        _intensity = 3;
        _note.clear();
      });
      widget.onSaved?.call();
    } catch (e) {
      if (mounted) toast(context, errorText(context, e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    final saved = _savedFor;

    if (saved != null) {
      return SectionCard(
        child: Semantics(
          liveRegion: true,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(context.t('mood.saved'), style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(context.t('mood.responses.$saved')),
            const SizedBox(height: 12),
            if (!context.app.signedIn) Text(context.t('mood.savedNote'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              if (const {'anxious', 'overwhelmed', 'irritated'}.contains(saved))
                FilledButton(onPressed: () => Navigator.of(context).pushNamed('/calm'), child: Text(context.t('mood.suggestBreathe'))),
              OutlinedButton(onPressed: () => setState(() => _savedFor = null), child: Text(context.t('mood.again'))),
            ]),
          ]),
        ),
      );
    }

    return SectionCard(
      title: context.t('mood.title'),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(context.t('mood.subtitle'), style: TextStyle(color: tk.inkSoft)),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: [
          for (final (key, icon) in moods)
            ChoiceChip(
              avatar: Icon(icon, size: 18),
              label: Text(context.t('mood.options.$key')),
              selected: _mood == key,
              onSelected: (_) => setState(() => _mood = key),
            ),
        ]),
        if (_mood != null) ...[
          const SizedBox(height: 16),
          ScaleField(
            label: context.t('mood.intensity'),
            value: _intensity,
            onChanged: (v) => setState(() => _intensity = v),
            low: context.t('mood.intensityLow'),
            high: context.t('mood.intensityHigh'),
          ),
          if (context.app.signedIn) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _note,
              maxLength: 1000,
              decoration: InputDecoration(labelText: '${context.t('journal.moodNote')} (${context.t('common.optional')})'),
            ),
          ],
        ],
        const SizedBox(height: 12),
        FilledButton(onPressed: _mood == null || _saving ? null : _save, child: Text(_saving ? context.t('common.saving') : context.t('mood.save'))),
        if (!context.app.signedIn) ...[
          const SizedBox(height: 8),
          Text(context.t('mood.privacy'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
        ],
      ]),
    );
  }
}
