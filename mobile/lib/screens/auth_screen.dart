import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _signUp = false;
  bool _busy = false;
  bool _terms = false, _health = false;
  String? _error;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _form = GlobalKey<FormState>();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_signUp && !(_terms && _health)) {
      setState(() => _error = context.t('auth.errors.checkFields'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final app = context.app;
    try {
      if (_signUp) {
        await app.register(name: _name.text.trim(), email: _email.text.trim(), password: _password.text);
      } else {
        await app.signIn(_email.text.trim(), _password.text);
      }
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() {
        _error = switch (e.status) {
          0 => context.t('mobile.offline'),
          401 => _signUp ? context.t('auth.errors.exists') : context.t('auth.errors.invalid'),
          429 => context.t('auth.errors.rateLimited'),
          400 => context.t('auth.errors.checkFields'),
          _ => context.t('auth.errors.generic'),
        };
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tk = Tokens.of(context);
    return Scaffold(
      appBar: AppBar(),
      body: Form(
        key: _form,
        child: PageBody(
          title: _signUp ? context.t('auth.signUpTitle') : context.t('auth.signInTitle'),
          subtitle: _signUp ? context.t('auth.signUpSubtitle') : context.t('auth.signInSubtitle'),
          children: [
            if (_signUp)
              TextFormField(
                controller: _name,
                maxLength: 80,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(labelText: '${context.t('auth.name')} (${context.t('auth.optional')})'),
              ),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: context.t('auth.email')),
              validator: (v) => (v == null || !v.contains('@')) ? context.t('auth.errors.checkFields') : null,
            ),
            TextFormField(
              controller: _password,
              obscureText: true,
              autofillHints: [_signUp ? AutofillHints.newPassword : AutofillHints.password],
              decoration: InputDecoration(
                labelText: context.t('auth.password'),
                helperText: _signUp ? context.t('auth.passwordHint') : null,
                helperMaxLines: 2,
              ),
              validator: (v) => (v == null || v.length < (_signUp ? 10 : 1)) ? context.t('auth.passwordHint') : null,
              onFieldSubmitted: (_) => _submit(),
            ),
            if (_signUp)
              Container(
                decoration: BoxDecoration(color: tk.surface2, borderRadius: BorderRadius.circular(18)),
                child: Column(children: [
                  CheckboxListTile(
                    value: _terms,
                    onChanged: (v) => setState(() => _terms = v ?? false),
                    title: Text(context.t('auth.acceptTerms'), style: const TextStyle(fontSize: 14)),
                    controlAffinity: ListTileControlAffinity.leading,
                  ),
                  CheckboxListTile(
                    value: _health,
                    onChanged: (v) => setState(() => _health = v ?? false),
                    title: Text(context.t('auth.acceptHealth'), style: const TextStyle(fontSize: 14)),
                    controlAffinity: ListTileControlAffinity.leading,
                  ),
                ]),
              ),
            if (_error != null) Notice(_error!, warm: true, icon: Icons.error_outline),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: Text(_busy ? context.t('auth.wait') : (_signUp ? context.t('auth.signUp') : context.t('auth.signIn'))),
            ),
            TextButton(
              onPressed: () => setState(() {
                _signUp = !_signUp;
                _error = null;
              }),
              child: Text(_signUp
                  ? '${context.t('auth.haveAccount')} ${context.t('auth.signIn')}'
                  : '${context.t('auth.noAccount')} ${context.t('auth.signUp')}'),
            ),
          ],
        ),
      ),
    );
  }
}
