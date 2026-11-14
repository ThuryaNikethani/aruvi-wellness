import 'dart:async';

import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';

enum _Status { idle, running, paused }

class _Step {
  const _Step(this.phase, this.seconds);
  final String phase;
  final int seconds;
}

const _patterns = <String, List<_Step>>{
  'gentle': [_Step('in', 4), _Step('out', 6)],
  'box': [_Step('in', 4), _Step('hold', 4), _Step('out', 4), _Step('rest', 4)],
};

/// Breathing exercise. One tick per second; the circle eases between sizes and
/// stays still when the system asks for reduced motion. Pause or stop at any time.
class CalmScreen extends StatefulWidget {
  const CalmScreen({super.key});

  @override
  State<CalmScreen> createState() => _CalmScreenState();
}

class _CalmScreenState extends State<CalmScreen> {
  static const _min = 0.62, _max = 1.0;

  String _pattern = 'gentle';
  String _scene = 'forest';
  _Status _status = _Status.idle;
  int _step = 0, _elapsed = 0, _rounds = 0;
  double _scale = _min;
  Timer? _timer;

  List<_Step> get _steps => _patterns[_pattern]!;

  void _start() {
    setState(() => _status = _Status.running);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
    _updateScale();
  }

  void _pause() {
    _timer?.cancel();
    setState(() => _status = _Status.paused);
  }

  void _stop() {
    _timer?.cancel();
    setState(() {
      _status = _Status.idle;
      _step = 0;
      _elapsed = 0;
      _scale = _min;
    });
  }

  void _tick() {
    setState(() {
      if (_elapsed + 1 < _steps[_step].seconds) {
        _elapsed++;
      } else {
        _step = (_step + 1) % _steps.length;
        if (_step == 0) _rounds++;
        _elapsed = 0;
      }
    });
    _updateScale();
  }

  void _updateScale() {
    final s = _steps[_step];
    final p = ((_elapsed + 1) / s.seconds).clamp(0.0, 1.0);
    setState(() {
      if (s.phase == 'in') _scale = _min + (_max - _min) * p;
      if (s.phase == 'out') _scale = _max - (_max - _min) * p;
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    final reduce = MediaQuery.of(context).disableAnimations;
    final step = _steps[_step];
    final colors = tk.scenes[_scene]!;

    return Scaffold(
      appBar: AppBar(),
      body: PageBody(
        title: context.t('calm.title'),
        subtitle: context.t('calm.subtitle'),
        children: [
          Container(
            height: 320,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: tk.line),
            ),
            child: Stack(alignment: Alignment.center, children: [
              ExcludeSemantics(
                child: AnimatedScale(
                  scale: reduce ? 1 : _scale,
                  duration: reduce ? Duration.zero : const Duration(seconds: 1),
                  curve: Curves.linear,
                  child: Container(
                    width: 230,
                    height: 230,
                    decoration: BoxDecoration(shape: BoxShape.circle, color: tk.surface.withValues(alpha: 0.7)),
                  ),
                ),
              ),
              Semantics(
                liveRegion: true,
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(
                    _status == _Status.idle ? context.t('calm.idle') : context.t('calm.phases.${step.phase}'),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontSize: 24),
                  ),
                  if (_status != _Status.idle)
                    Text(context.t('calm.seconds', {'seconds': step.seconds - _elapsed}), style: TextStyle(color: tk.inkSoft, fontSize: 17)),
                  if (_status == _Status.paused)
                    Text(context.t('calm.pausedLabel'), style: TextStyle(color: tk.inkSoft, fontWeight: FontWeight.w600)),
                ]),
              ),
            ]),
          ),
          Wrap(spacing: 12, runSpacing: 12, children: [
            if (_status != _Status.running)
              FilledButton.icon(
                onPressed: _start,
                icon: const Icon(Icons.play_arrow),
                label: Text(_status == _Status.paused ? context.t('calm.resume') : context.t('calm.start')),
              )
            else
              FilledButton.icon(onPressed: _pause, icon: const Icon(Icons.pause), label: Text(context.t('calm.pause'))),
            OutlinedButton.icon(
              onPressed: _status == _Status.idle ? null : _stop,
              icon: const Icon(Icons.stop),
              label: Text(context.t('calm.stop')),
            ),
          ]),
          SectionCard(
            title: context.t('calm.patternLabel'),
            child: RadioGroup<String>(
              groupValue: _pattern,
              onChanged: (v) {
                _stop();
                setState(() {
                  _pattern = v!;
                  _rounds = 0;
                });
              },
              child: Column(children: [
                for (final p in _patterns.keys)
                  RadioListTile<String>(contentPadding: EdgeInsets.zero, value: p, title: Text(context.t('calm.patterns.$p'))),
              ]),
            ),
          ),
          SectionCard(
            title: context.t('calm.sceneLabel'),
            child: Wrap(spacing: 8, children: [
              for (final s in tk.scenes.keys)
                ChoiceChip(label: Text(context.t('calm.scenes.$s')), selected: _scene == s, onSelected: (_) => setState(() => _scene = s)),
            ]),
          ),
          Text(context.t('calm.rounds', {'count': _rounds}), style: TextStyle(color: tk.inkSoft)),
          Text(context.t('calm.note'), style: TextStyle(color: tk.inkSoft, fontSize: 14)),
        ],
      ),
    );
  }
}
