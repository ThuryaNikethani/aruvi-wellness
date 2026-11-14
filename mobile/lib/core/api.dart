import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class ApiException implements Exception {
  ApiException(this.status, this.code);
  final int status;
  final String code;
  @override
  String toString() => 'ApiException($status, $code)';
}

class ChatStream {
  ChatStream({required this.crisis, required this.conversationId, required this.chunks});
  final bool crisis;
  final String? conversationId;
  final Stream<String> chunks;
}

/// HTTP client for the ARUVI backend (the Next.js API). Uses a bearer token.
class Api {
  Api({required this.token, required this.onUnauthorized});

  String? token;
  final void Function() onUnauthorized;
  final _client = http.Client();

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${Config.apiBase}$path').replace(queryParameters: query);

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<Map<String, dynamic>> _send(String method, String path, {Object? body, Map<String, String>? query}) async {
    final req = http.Request(method, _uri(path, query))..headers.addAll(_headers);
    if (body != null) req.body = jsonEncode(body);
    http.Response res;
    try {
      res = await http.Response.fromStream(await _client.send(req).timeout(const Duration(seconds: 30)));
    } on TimeoutException {
      throw ApiException(0, 'network_error');
    } catch (_) {
      throw ApiException(0, 'network_error');
    }
    Map<String, dynamic> data = {};
    if (res.body.isNotEmpty) {
      try {
        data = jsonDecode(res.body) as Map<String, dynamic>;
      } catch (_) {}
    }
    if (res.statusCode == 401 && token != null) onUnauthorized();
    if (res.statusCode >= 400) throw ApiException(res.statusCode, (data['error'] as String?) ?? 'server_error');
    return data;
  }

  Future<Map<String, dynamic>> get(String path, [Map<String, String>? query]) => _send('GET', path, query: query);
  Future<Map<String, dynamic>> post(String path, Object body) => _send('POST', path, body: body);
  Future<Map<String, dynamic>> patch(String path, Object body) => _send('PATCH', path, body: body);
  Future<Map<String, dynamic>> delete(String path, [Object? body]) => _send('DELETE', path, body: body);

  /// Companion chat: the reply streams back as plain text.
  Future<ChatStream> chat(Map<String, Object?> body) async {
    final req = http.Request('POST', _uri('/api/ai/chat'))
      ..headers.addAll(_headers)
      ..body = jsonEncode(body);
    http.StreamedResponse res;
    try {
      res = await _client.send(req).timeout(const Duration(seconds: 60));
    } catch (_) {
      throw ApiException(0, 'network_error');
    }
    if (res.statusCode >= 400) {
      final text = await res.stream.bytesToString();
      String code = 'server_error';
      try {
        code = (jsonDecode(text) as Map<String, dynamic>)['error'] as String? ?? code;
      } catch (_) {}
      if (res.statusCode == 401) onUnauthorized();
      throw ApiException(res.statusCode, code);
    }
    return ChatStream(
      crisis: res.headers['x-aruvi-crisis'] == '1',
      conversationId: res.headers['x-conversation-id'],
      chunks: res.stream.transform(utf8.decoder),
    );
  }
}
