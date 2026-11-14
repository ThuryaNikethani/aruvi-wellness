import 'package:flutter/material.dart';

import '../widgets/common.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.spa_outlined, context.t('dash.nav.calm'), '/calm'),
      (Icons.bedtime_outlined, context.t('dash.nav.sleep'), '/sleep'),
      (Icons.bar_chart, context.t('dash.nav.insights'), '/insights'),
      (Icons.support, context.t('nav.support'), '/help'),
      (Icons.settings_outlined, context.t('dash.nav.settings'), '/settings'),
    ];
    return PageBody(
      title: context.t('mobile.more'),
      children: [
        Card(
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            for (final (icon, label, route) in items)
              ListTile(
                leading: Icon(icon),
                title: Text(label),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).pushNamed(route),
              ),
          ]),
        ),
      ],
    );
  }
}
