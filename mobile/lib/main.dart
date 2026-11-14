import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'core/app_state.dart';
import 'core/i18n.dart';
import 'core/theme.dart';
import 'screens/auth_screen.dart';
import 'screens/calm_screen.dart';
import 'screens/companion_screen.dart';
import 'screens/help_screen.dart';
import 'screens/insights_screen.dart';
import 'screens/journal_screen.dart';
import 'screens/migraine_screen.dart';
import 'screens/more_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/sleep_screen.dart';
import 'screens/today_screen.dart';
import 'widgets/logo.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final state = await AppState.init();
  runApp(ChangeNotifierProvider.value(value: state, child: const AruviApp()));
}

class AruviApp extends StatelessWidget {
  const AruviApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final code = app.locale;
    // Material widgets (date pickers etc.) use the app language when Flutter supports it.
    final materialLocale = GlobalMaterialLocalizations.delegate.isSupported(Locale(code)) ? Locale(code) : const Locale('en');

    Widget sub(Widget child) => Scaffold(appBar: AppBar(), body: child);

    return MaterialApp(
      title: 'ARUVI',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: app.themeMode,
      locale: materialLocale,
      supportedLocales: {const Locale('en'), materialLocale},
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      builder: (context, child) => Directionality(
        textDirection: isRtl(code) ? TextDirection.rtl : TextDirection.ltr,
        child: MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(app.textScale)),
          child: child!,
        ),
      ),
      routes: {
        '/': (_) => const HomeShell(),
        '/auth': (_) => const AuthScreen(),
        '/calm': (_) => const CalmScreen(),
        '/sleep': (_) => sub(const SleepScreen()),
        '/insights': (_) => sub(const InsightsScreen()),
        '/settings': (_) => sub(const SettingsScreen()),
        '/help': (_) => sub(const HelpScreen()),
      },
    );
  }
}

/// Bottom navigation: Today, Journal, Companion, Migraine, More.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final pages = [
      TodayScreen(key: ValueKey('today-${app.signedIn}'), onOpenTab: (i) => setState(() => _tab = i)),
      JournalScreen(key: ValueKey('journal-${app.signedIn}')),
      CompanionScreen(key: ValueKey('companion-${app.signedIn}')),
      MigraineScreen(key: ValueKey('migraine-${app.signedIn}')),
      const MoreScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(mainAxisSize: MainAxisSize.min, children: [
          const LogoMark(size: 28),
          const SizedBox(width: 10),
          const Text('ARUVI', style: TextStyle(letterSpacing: 3, fontWeight: FontWeight.w600)),
        ]),
        actions: [
          IconButton(
            tooltip: app.t('nav.support'),
            icon: const Icon(Icons.support),
            onPressed: () => Navigator.of(context).pushNamed('/help'),
          ),
        ],
      ),
      body: SafeArea(top: false, child: IndexedStack(index: _tab, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: app.t('dash.nav.overview')),
          NavigationDestination(icon: const Icon(Icons.edit_note_outlined), selectedIcon: const Icon(Icons.edit_note), label: app.t('journal.writeTitle')),
          NavigationDestination(icon: const Icon(Icons.chat_bubble_outline), selectedIcon: const Icon(Icons.chat_bubble), label: app.t('dash.nav.companion')),
          NavigationDestination(icon: const Icon(Icons.psychology_outlined), selectedIcon: const Icon(Icons.psychology), label: app.t('mobile.migraineTab')),
          NavigationDestination(icon: const Icon(Icons.menu), label: app.t('mobile.more')),
        ],
      ),
    );
  }
}
