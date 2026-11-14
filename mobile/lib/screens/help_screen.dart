import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/common.dart';

class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  static const _lines = [('national', '1926'), ('ambulance', '1990'), ('police', '119')];

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    return PageBody(
      title: context.t('help.title'),
      subtitle: context.t('help.body'),
      children: [
        for (final (key, number) in _lines)
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              title: Text(context.t('help.lines.$key'), style: TextStyle(color: tk.inkSoft, fontSize: 14)),
              subtitle: Text(number, style: Theme.of(context).textTheme.headlineMedium),
              trailing: CallButton(number: number, label: context.t('help.lines.$key')),
            ),
          ),
        Notice(context.t('help.note'), warm: true, icon: Icons.support),
        Text(context.t('footer.disclaimer'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
      ],
    );
  }
}
