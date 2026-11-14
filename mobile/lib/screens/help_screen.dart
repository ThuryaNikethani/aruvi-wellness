import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

/// Crisis and emergency lines for the user's country.
class HelpScreen extends StatelessWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final tk = Tokens.of(context);
    final lines = app.lines;
    return PageBody(
      title: context.t('help.title'),
      subtitle: context.t('help.body'),
      children: [
        const Card(child: Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: CountryTile())),
        if (lines.isEmpty)
          SectionCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(context.t('help.noList')),
              const SizedBox(height: 12),
              const HelplineButtons(),
            ]),
          ),
        for (final l in lines)
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              title: Text(l.name(app.locale), style: TextStyle(color: tk.inkSoft, fontSize: 14)),
              subtitle: Text(l.number, style: Theme.of(context).textTheme.headlineMedium),
              trailing: CallButton(number: l.number, tel: l.tel, label: l.name(app.locale)),
            ),
          ),
        Notice(context.t('help.note'), warm: true, icon: Icons.support),
        TextButton.icon(
          onPressed: () => launchUrl(Uri.parse(app.helplines.directory), mode: LaunchMode.externalApplication),
          icon: const Icon(Icons.open_in_new),
          label: Text(context.t('help.findMore')),
        ),
        Text(context.t('footer.disclaimer'), style: TextStyle(color: tk.inkSoft, fontSize: 13)),
      ],
    );
  }
}
