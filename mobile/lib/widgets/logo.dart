import 'package:flutter/material.dart';

import '../core/theme.dart';

/// ARUVI mark: a water drop holding a gentle stream (same as the web logo).
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 30});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'ARUVI',
      image: true,
      child: CustomPaint(size: Size.square(size), painter: _LogoPainter(Tokens.of(context))),
    );
  }
}

class _LogoPainter extends CustomPainter {
  _LogoPainter(this.t);

  final Tokens t;

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 64;
    canvas.scale(s);
    canvas.drawRRect(RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, 64, 64), const Radius.circular(18)), Paint()..color = t.leaf);
    final drop = Path()
      ..moveTo(32, 10)
      ..cubicTo(41, 21, 48, 30, 48, 39)
      ..arcToPoint(const Offset(16, 39), radius: const Radius.circular(16))
      ..cubicTo(16, 30, 23, 21, 32, 10)
      ..close();
    canvas.drawPath(drop, Paint()..color = t.leafSoft);
    final wave = Paint()
      ..color = t.stream
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(
      Path()
        ..moveTo(21, 40)
        ..quadraticBezierTo(26.5, 36, 32, 40)
        ..quadraticBezierTo(37.5, 44, 43, 40),
      wave,
    );
    canvas.drawPath(
      Path()
        ..moveTo(23, 47)
        ..quadraticBezierTo(27.5, 44, 32, 47)
        ..quadraticBezierTo(36.5, 50, 41, 47),
      wave,
    );
  }

  @override
  bool shouldRepaint(_LogoPainter old) => old.t != t;
}
