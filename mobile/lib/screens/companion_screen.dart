import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

class _Turn {
  _Turn(this.role, this.content);
  final String role;
  String content;
  Map<String, String> toJson() => {'role': role, 'content': content};
}

const _sentinels = {'refusal', 'unavailable', 'error'};

class CompanionScreen extends StatefulWidget {
  const CompanionScreen({super.key});

  @override
  State<CompanionScreen> createState() => _CompanionScreenState();
}

class _CompanionScreenState extends State<CompanionScreen> {
  final _turns = <_Turn>[];
  final _input = TextEditingController();
  final _scroll = ScrollController();
  String? _conversationId;
  bool _busy = false, _crisis = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _toBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  Future<void> _send() async {
    final message = _input.text.trim();
    if (message.isEmpty || _busy) return;
    final history = _turns.where((t) => t.content.isNotEmpty).map((t) => t.toJson()).toList();
    final reply = _Turn('assistant', '');
    setState(() {
      _busy = true;
      _input.clear();
      _turns
        ..add(_Turn('user', message))
        ..add(reply);
    });
    _toBottom();

    try {
      final stream = await context.app.api.chat({
        if (_conversationId != null) 'conversationId': _conversationId,
        'locale': context.app.locale,
        'history': history,
        'message': message,
      });
      if (stream.crisis) setState(() => _crisis = true);
      _conversationId = stream.conversationId ?? _conversationId;
      await for (final chunk in stream.chunks) {
        setState(() => reply.content += chunk);
        _toBottom();
      }
      if (reply.content.startsWith('\u0000')) {
        final s = reply.content.substring(1);
        setState(() => reply.content = context.t('companion.errors.${_sentinels.contains(s) ? s : 'error'}'));
      }
    } on ApiException catch (e) {
      setState(() {
        _turns.removeLast();
        _turns.removeLast();
        _input.text = message;
      });
      if (mounted) {
        toast(context, e.status == 429 ? context.t('companion.errors.limit') : e.status == 0 ? context.t('companion.errors.network') : context.t('companion.errors.generic'));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!context.app.signedIn) return GuestGate(title: context.t('companion.title'));
    final tk = Tokens.of(context);
    final keep = context.app.user?['preferences']?['keepAiHistory'] == true;

    return Column(children: [
      Expanded(
        child: ListView(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
          children: [
            Text(context.t('companion.title'), style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(context.t('companion.subtitle'), style: TextStyle(color: tk.inkSoft)),
            const SizedBox(height: 12),
            Notice(context.t('companion.disclaimer')),
            const SizedBox(height: 12),
            if (_crisis) ...[
              CrisisCard(title: context.t('companion.crisisTitle'), body: context.t('companion.crisisBody')),
              const SizedBox(height: 12),
            ],
            if (_turns.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Column(children: [
                  Text(context.t('companion.emptyTitle'), style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
                  const SizedBox(height: 4),
                  Text(context.t('companion.emptyBody'), style: TextStyle(color: tk.inkSoft), textAlign: TextAlign.center),
                ]),
              ),
            for (final m in _turns)
              Align(
                alignment: m.role == 'user' ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                child: Semantics(
                  label: m.role == 'user' ? context.t('companion.you') : context.t('companion.companion'),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
                    decoration: BoxDecoration(
                      color: m.role == 'user' ? tk.leaf : tk.surface2,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: SelectableText(
                      m.content.isEmpty ? '…' : m.content,
                      style: TextStyle(color: m.role == 'user' ? tk.onLeaf : tk.ink),
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 8),
            Text(keep ? context.t('companion.historyOn') : context.t('companion.historyOff'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
            TextButton.icon(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _turns.clear();
                        _conversationId = null;
                        _crisis = false;
                      }),
              icon: const Icon(Icons.add),
              label: Text(context.t('companion.newChat')),
            ),
          ],
        ),
      ),
      SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
          decoration: BoxDecoration(color: tk.surface, border: Border(top: BorderSide(color: tk.line))),
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Expanded(
              child: TextField(
                controller: _input,
                minLines: 1,
                maxLines: 5,
                maxLength: 4000,
                textInputAction: TextInputAction.newline,
                decoration: InputDecoration(hintText: context.t('companion.placeholder'), counterText: '', labelText: null),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filled(
              tooltip: context.t('companion.send'),
              onPressed: _busy ? null : _send,
              icon: const Icon(Icons.send),
            ),
          ]),
        ),
      ),
    ]);
  }
}
