import 'package:aruvi/core/app_state.dart';
import 'package:aruvi/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

Future<AppState> _boot(WidgetTester tester, {String? locale}) async {
  // A typical phone: 360 × 800 logical pixels.
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 3;
  addTearDown(tester.view.reset);
  SharedPreferences.setMockInitialValues({if (locale != null) 'locale': locale});
  late AppState state;
  await tester.runAsync(() async => state = await AppState.init());
  await tester.pumpWidget(ChangeNotifierProvider.value(value: state, child: const AruviApp()));
  await tester.pumpAndSettle();
  return state;
}

void main() {
  testWidgets('guest home renders in English with check-in and help', (tester) async {
    await _boot(tester);
    expect(find.text('A gentler place for difficult days.'), findsOneWidget);
    expect(find.text('How are you feeling right now?'), findsOneWidget);
    expect(find.text('Calm'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders in Sinhala', (tester) async {
    await _boot(tester, locale: 'si');
    expect(find.text('අපහසු දිනවලට මෘදු තැනක්.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('renders in Tamil and the journal tab asks a guest to sign in', (tester) async {
    await _boot(tester, locale: 'ta');
    expect(find.text('கடினமான நாட்களுக்கு ஒரு மென்மையான இடம்.'), findsOneWidget);
    await tester.tap(find.text('எழுதுங்கள்'));
    await tester.pumpAndSettle();
    expect(find.text('இதைப் பயன்படுத்த உள்நுழையவும்'), findsOneWidget);
  });

  testWidgets('breathing exercise starts, pauses and stops', (tester) async {
    await _boot(tester);
    await tester.scrollUntilVisible(find.text('Calm Space'), 200, scrollable: find.byType(Scrollable).first);
    await tester.tap(find.text('Calm Space'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start'));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Breathe in'), findsOneWidget);
    await tester.tap(find.text('Pause'));
    await tester.pump();
    expect(find.text('Paused'), findsOneWidget);
    await tester.tap(find.text('Stop'));
    await tester.pumpAndSettle();
    expect(find.text("Press start when you're ready."), findsOneWidget);
  });

  testWidgets('Arabic switches layout to right-to-left', (tester) async {
    await _boot(tester, locale: 'ar');
    final dir = Directionality.of(tester.element(find.byType(NavigationBar)));
    expect(dir, TextDirection.rtl);
  });
}
