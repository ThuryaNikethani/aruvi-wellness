import 'package:flutter/material.dart';

/// ARUVI design tokens — the same values as the website (src/app/globals.css).
class Tokens {
  const Tokens({
    required this.bg,
    required this.surface,
    required this.surface2,
    required this.ink,
    required this.inkSoft,
    required this.line,
    required this.leaf,
    required this.leafSoft,
    required this.stream,
    required this.streamSoft,
    required this.clay,
    required this.claySoft,
    required this.onLeaf,
    required this.scenes,
  });

  final Color bg, surface, surface2, ink, inkSoft, line, leaf, leafSoft, stream, streamSoft, clay, claySoft, onLeaf;
  final Map<String, List<Color>> scenes;

  static const light = Tokens(
    bg: Color(0xFFF6F4EE),
    surface: Color(0xFFFFFDF8),
    surface2: Color(0xFFEEF0E8),
    ink: Color(0xFF22312C),
    inkSoft: Color(0xFF55665F),
    line: Color(0xFFDED9CC),
    leaf: Color(0xFF2F6F5B),
    leafSoft: Color(0xFFDCEBE3),
    stream: Color(0xFF3B7A8F),
    streamSoft: Color(0xFFDCECF1),
    clay: Color(0xFFA8634A),
    claySoft: Color(0xFFF4E4DA),
    onLeaf: Color(0xFFFFFFFF),
    scenes: {
      'forest': [Color(0xFFDCEBE3), Color(0xFFA9C9B7)],
      'ocean': [Color(0xFFE3F0F4), Color(0xFFA6CBD8)],
      'dusk': [Color(0xFFF4E7DC), Color(0xFFCFC0D3)],
    },
  );

  static const dark = Tokens(
    bg: Color(0xFF111916),
    surface: Color(0xFF18221F),
    surface2: Color(0xFF1F2B27),
    ink: Color(0xFFE4EBE7),
    inkSoft: Color(0xFFA7B6AF),
    line: Color(0xFF2B3934),
    leaf: Color(0xFF82C4AB),
    leafSoft: Color(0xFF1F3A31),
    stream: Color(0xFF8BC0D1),
    streamSoft: Color(0xFF1C3640),
    clay: Color(0xFFE0A58B),
    claySoft: Color(0xFF3A2A23),
    onLeaf: Color(0xFF0F1A16),
    scenes: {
      'forest': [Color(0xFF1B2C26), Color(0xFF143026)],
      'ocean': [Color(0xFF182A31), Color(0xFF12303B)],
      'dusk': [Color(0xFF2A2327), Color(0xFF241F30)],
    },
  );

  static Tokens of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;
}

ThemeData buildTheme(Brightness brightness) {
  final t = brightness == Brightness.dark ? Tokens.dark : Tokens.light;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: t.leaf,
    onPrimary: t.onLeaf,
    primaryContainer: t.leafSoft,
    onPrimaryContainer: t.ink,
    secondary: t.stream,
    onSecondary: t.onLeaf,
    secondaryContainer: t.streamSoft,
    onSecondaryContainer: t.ink,
    tertiary: t.clay,
    onTertiary: t.surface,
    tertiaryContainer: t.claySoft,
    onTertiaryContainer: t.ink,
    error: t.clay,
    onError: t.surface,
    surface: t.bg,
    onSurface: t.ink,
    onSurfaceVariant: t.inkSoft,
    surfaceContainerLowest: t.surface,
    surfaceContainerLow: t.surface,
    surfaceContainer: t.surface,
    surfaceContainerHigh: t.surface2,
    surfaceContainerHighest: t.surface2,
    outline: t.line,
    outlineVariant: t.line,
  );

  final rounded = RoundedRectangleBorder(borderRadius: BorderRadius.circular(999));
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: t.bg,
    // No page-transition flourishes: calm, predictable navigation.
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
    appBarTheme: AppBarTheme(backgroundColor: t.bg, foregroundColor: t.ink, elevation: 0, scrolledUnderElevation: 0),
    cardTheme: CardThemeData(
      color: t.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: t.line)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(shape: rounded, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: rounded,
        side: BorderSide(color: t.line),
        foregroundColor: t.ink,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: t.bg,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: t.stream, width: 2)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: t.surface,
      selectedColor: t.leafSoft,
      side: BorderSide(color: t.line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      labelStyle: TextStyle(color: t.ink),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: t.surface,
      indicatorColor: t.leafSoft,
      labelTextStyle: WidgetStatePropertyAll(TextStyle(fontSize: 12, color: t.ink)),
    ),
    sliderTheme: SliderThemeData(activeTrackColor: t.leaf, thumbColor: t.leaf, inactiveTrackColor: t.line),
    textTheme: Typography.material2021().black.apply(bodyColor: t.ink, displayColor: t.ink).copyWith(
          headlineMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w500, color: t.ink, height: 1.3),
          titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: t.ink),
          bodyLarge: TextStyle(fontSize: 16, height: 1.6, color: t.ink),
          bodyMedium: TextStyle(fontSize: 15, height: 1.6, color: t.ink),
        ),
  );
}
