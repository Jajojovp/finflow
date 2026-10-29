"""Exercise real PHP authentication endpoints without Google credentials/accounts."""
import base64
import hashlib
import http.client
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
import unittest
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://finflow.sysora.io'


class AuthServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory(prefix='finflow-auth-test-')
        cls.private = Path(cls.temp.name)
        (cls.private / 'sessions').mkdir()
        php = Path(os.environ.get('FINFLOW_PHP', str(Path.home() / '.cache/finflow-php/runtime/php.exe')))
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        env = dict(os.environ, FINFLOW_AUTH_PRIVATE_DIR=str(cls.private))
        cls.server = subprocess.Popen([str(php), '-d', 'extension_dir=' + str(php.parent / 'ext'), '-d', 'extension=mbstring', '-d', 'session.save_path=' + str(cls.private / 'sessions'), '-S', f'127.0.0.1:{cls.port}', '-t', str(ROOT / 'public')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        for _ in range(60):
            try:
                with socket.create_connection(('127.0.0.1', cls.port), timeout=.2):
                    break
            except OSError:
                time.sleep(.1)
        else:
            cls.server.terminate()
            raise RuntimeError('PHP test server did not start')

    @classmethod
    def tearDownClass(cls):
        cls.server.terminate()
        cls.server.wait(timeout=10)
        cls.temp.cleanup()

    def setUp(self):
        for path in self.private.glob('rate-*.json'):
            path.unlink()
        (self.private / 'config.json').write_text(json.dumps({'client_id': '123-test.apps.googleusercontent.com', 'client_secret': 'fixture-only-not-a-real-secret'}))

    def request(self, action, body=None, headers=None, suffix=''):
        client = http.client.HTTPConnection('127.0.0.1', self.port, timeout=10)
        h = {'Content-Type': 'application/json', **(headers or {})}
        client.request('GET' if body is None else 'POST', '/auth/index.php?action=' + action + suffix, None if body is None else json.dumps(body), h)
        response = client.getresponse()
        raw = response.read().decode()
        result = (response.status, dict(response.getheaders()), json.loads(raw) if 'application/json' in response.getheader('Content-Type', '') else raw)
        self.assertNotIn('fixture-only-not-a-real-secret', raw)
        client.close()
        return result

    def attempt(self):
        verifier = 'v' * 64
        challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
        status, _, attempt = self.request('begin-native', {'challenge': challenge})
        self.assertEqual(status, 200)
        return attempt, verifier

    def completed_attempt(self):
        attempt, verifier = self.attempt()
        code = 'c' * 43
        path = self.private / ('attempt-' + hashlib.sha256(attempt['id'].encode()).hexdigest() + '.json')
        record = json.loads(path.read_text())
        record.update(user={'id': '123456789', 'email': 'test@example.com', 'name': 'Test'}, codeHash=hashlib.sha256(code.encode()).hexdigest())
        path.write_text(json.dumps(record))
        return {'id': attempt['id'], 'verifier': verifier, 'code': code}, path

    def test_session_cookie_and_csrf_logout(self):
        status, headers, session = self.request('session')
        self.assertEqual(status, 200)
        self.assertIsNone(session['user'])
        cookie = headers['Set-Cookie']
        for flag in ['__Host-finflow=', 'secure', 'HttpOnly', 'SameSite=Lax']:
            self.assertIn(flag, cookie)
        h = {'Cookie': cookie.split(';')[0], 'Origin': ORIGIN}
        self.assertEqual(self.request('logout', {}, h)[0], 403)
        h['X-CSRF-Token'] = session['csrf']
        self.assertEqual(self.request('logout', {}, {**h, 'Origin': 'https://evil.example'})[0], 403)
        self.assertEqual(self.request('logout', {}, h)[0], 200)

    def test_unconfigured_login_stays_disabled(self):
        (self.private / 'config.json').unlink()
        self.assertFalse(self.request('session')[2]['configured'])
        self.assertEqual(self.request('login')[0], 503)

    def test_native_cannot_redeem_without_both_browser_code_and_verifier(self):
        body, _ = self.completed_attempt()
        self.assertEqual(self.request('complete-native', {k: v for k, v in body.items() if k != 'code'})[0], 400)
        self.assertEqual(self.request('complete-native', {**body, 'verifier': 'x' * 64})[0], 410)
        self.assertEqual(self.request('complete-native', {**body, 'code': 'x' * 43})[0], 400)
        status, _, session = self.request('complete-native', body)
        self.assertEqual(status, 200)
        self.assertEqual(session['user']['id'], '123456789')
        self.assertEqual(self.request('complete-native', body)[0], 410)
        headers = {'Authorization': 'Bearer ' + session['token']}
        self.assertEqual(self.request('native-session', {}, headers)[2]['user']['email'], 'test@example.com')
        self.assertEqual(self.request('native-logout', {}, headers)[0], 200)
        self.assertEqual(self.request('native-session', {}, headers)[0], 401)

    def test_expired_and_forged_requests_fail_closed(self):
        body, path = self.completed_attempt()
        record = json.loads(path.read_text())
        record['expires'] = time.time() - 1
        path.write_text(json.dumps(record))
        self.assertEqual(self.request('complete-native', body)[0], 410)
        self.assertEqual(self.request('callback', suffix='&state=forged&code=forged')[0], 400)
        self.assertEqual(self.request('begin-native', {'challenge': 'x' * 43}, {'Origin': 'https://evil.example'})[0], 403)

    def test_oauth_uses_fixed_return_scope_state_and_pkce(self):
        status, _, session = self.request('login')
        self.assertEqual(status, 302)
        # Inspect the redirect separately, never contact Google in an offline test.
        _, headers, _ = self.request('login')
        url = urlparse(headers['Location'])
        query = parse_qs(url.query)
        self.assertEqual(url.netloc, 'accounts.google.com')
        self.assertEqual(query['redirect_uri'], [ORIGIN + '/auth/index.php?action=callback'])
        self.assertEqual(set(query['scope'][0].split()), {'openid', 'email', 'profile'})
        self.assertEqual(query['code_challenge_method'], ['S256'])
        self.assertEqual(len(query['state'][0]), 43)
        self.assertEqual(len(query['code_challenge'][0]), 43)

    def test_attempt_creation_is_rate_limited(self):
        for _ in range(8):
            self.assertEqual(self.request('begin-native', {'challenge': 'a' * 43})[0], 200)
        self.assertEqual(self.request('begin-native', {'challenge': 'a' * 43})[0], 429)


if __name__ == '__main__':
    unittest.main(verbosity=2)
