import 'package:aruvi/core/i18n.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatMessage', () {
    test('replaces simple placeholders', () {
      expect(formatMessage('Hello, {name}', {'name': 'Ama'}), 'Hello, Ama');
    });

    test('keeps unknown placeholders visible', () {
      expect(formatMessage('Hi {who}', {}), 'Hi {who}');
    });

    test('handles plural with exact, one and other', () {
      const msg = '{count, plural, =0 {No rounds yet} one {# round completed} other {# rounds completed}}';
      expect(formatMessage(msg, {'count': 0}), 'No rounds yet');
      expect(formatMessage(msg, {'count': 1}), '1 round completed');
      expect(formatMessage(msg, {'count': 4}), '4 rounds completed');
    });

    test('works with Sinhala and Tamil text', () {
      expect(formatMessage('{count, plural, =0 {තවම වට නැත} other {වට # ක් සම්පූර්ණයි}}', {'count': 3}), 'වට 3 ක් සම්පූර්ණයි');
      expect(formatMessage('வணக்கம், {name}', {'name': 'நிலா'}), 'வணக்கம், நிலா');
    });

    test('prints whole doubles without decimals', () {
      expect(formatMessage('{n, plural, other {# h}}', {'n': 3.0}), '3 h');
    });
  });

  test('RTL detection', () {
    expect(isRtl('ar'), isTrue);
    expect(isRtl('si'), isFalse);
  });
}
