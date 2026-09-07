import concurrent.futures
import hashlib
import hmac
import json
import tempfile
import time
import unittest
from pathlib import Path
from urllib.parse import urlencode

from bot.services.miniapp_store import Store, Conflict, settle
from bot.web.miniapp import validate_init_data, verified_pick


def signed(uid, token='123:test', age=0):
    data = {'auth_date': str(int(time.time())-age), 'user': json.dumps({'id': uid, 'first_name': 'Test'})}
    secret = hmac.new(b'WebAppData', token.encode(), hashlib.sha256).digest()
    data['hash'] = hmac.new(secret, '\n'.join(k+'='+v for k, v in sorted(data.items())).encode(), hashlib.sha256).hexdigest()
    return urlencode(data)


def pick(event='a', price=2):
    return {'id': event, 'value': price, 'sourceKey': 'book', 'marketKey': 'h2h',
            'selection': 'A', 'line': None, 'fighters': ['A', 'B'], 'kind': 'outcomes', 'sport': 'mma'}


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name)/'data.sqlite3')
        self.store.init()
        self.token = self.store.login(1, 'Owner', True)

    def tearDown(self):
        self.tmp.cleanup()

    def test_auth(self):
        self.assertEqual(validate_init_data(signed(1), '123:test')['id'], 1)
        for data in [signed(1, age=600), signed(1)+'&auth_date=1', signed(1).replace('Test', 'Evil')]:
            with self.assertRaises(PermissionError):
                validate_init_data(data, '123:test')
        with self.assertRaises(PermissionError):
            self.store.login(2, 'Other')
        self.store.allow(1, 2)
        token = self.store.login(2, 'Other')
        self.assertEqual(self.store.identity(token)['id'], 2)
        self.store.logout(token)
        with self.assertRaises(PermissionError):
            self.store.identity(token)

    def test_express_results_and_repeat(self):
        bet = self.store.place(1, 'request', 'hash', 100000, [pick('a', 1.22), pick('b', 2), pick('c', 1.2)])
        self.assertEqual(bet['payout'], 2928)
        self.assertEqual(self.store.snapshot(1)['balance'], 455000)
        for p in bet['picks']:
            self.store.confirm_result(1, self.store.result_key(p), 'A', 'https://example.com/result')
        self.assertEqual(self.store.snapshot(1)['balance'], 457928)
        self.assertEqual(self.store.snapshot(1)['stats']['profit'], 1928)
        self.store.confirm_result(1, self.store.result_key(bet['picks'][0]), 'A', 'https://example.com/result')
        self.assertEqual(self.store.snapshot(1)['balance'], 457928)
        with self.assertRaises(Conflict):
            self.store.confirm_result(1, self.store.result_key(bet['picks'][0]), 'B', 'https://example.com/result')

    def test_loss_and_later_pick_keeps_payout_zero(self):
        bet = self.store.place(1, 'r', 'h', 100000, [pick('a'), pick('b')])
        self.store.confirm_result(1, self.store.result_key(bet['picks'][0]), 'B', 'https://example.com')
        self.store.confirm_result(1, self.store.result_key(bet['picks'][1]), 'A', 'https://example.com')
        snap = self.store.snapshot(1)
        self.assertEqual(snap['balance'], 455000)
        self.assertEqual(snap['stats']['profit'], -1000)
        self.assertEqual([p['status'] for p in snap['bets'][0]['picks']], ['lost', 'won'])

    def test_void_and_rounding(self):
        self.assertEqual(settle([{'status': 'void', 'value': 4}, {'status': 'won', 'value': 1.555}], 100001), ('won', 155502))
        self.assertEqual(settle([{'status': 'void', 'value': 4}], 100000), ('void', 100000))
        self.assertEqual(settle([{'status': 'pending', 'value': 4}], 100000), ('pending', None))

    def test_concurrent_idempotent_and_balance(self):
        def place(_):
            return self.store.place(1, 'same', 'hash', 100000, [pick()])['id']
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            self.assertEqual(len(set(pool.map(place, range(12)))), 1)
        self.assertEqual(self.store.snapshot(1)['balance'], 455000)
        with self.assertRaises(Conflict):
            self.store.existing(1, 'same', 'different')
        self.store.login(1, 'Owner', True)
        self.assertEqual(self.store.snapshot(1)['balance'], 455000)
        reloaded = Store(self.store.path)
        self.assertEqual(len(reloaded.snapshot(1)['bets']), 1)
        self.store.allow(1, 2)
        self.assertEqual(self.store.snapshot(2)['bets'], [])

    def test_settings_and_invalid_stakes(self):
        for seconds in [39, 86401, '40', True]:
            with self.assertRaises(ValueError):
                self.store.save_policy(1, {'enabled': True, 'seconds': seconds})
        self.assertFalse(self.store.policy()['enabled'])
        for stake in [-1, 99999, 1000001, 100000.0, True]:
            with self.assertRaises(ValueError):
                self.store.place(1, 'a', 'b', stake, [pick()])

    def test_backup_restore(self):
        from deploy.backup_state import backup_database
        self.store.place(1, 'backup', 'hash', 100000, [pick()])
        target = Path(self.tmp.name)/'restored.sqlite3'
        backup_database(self.store.path, target)
        self.assertEqual(Store(target).snapshot(1), self.store.snapshot(1))

    def test_quote_closed_stale_and_changed(self):
        now = time.time()
        from datetime import datetime, timezone
        event = {'id': 'a', 'home_team': 'A', 'away_team': 'B', 'commence_time': '2099-01-01T00:00:00Z',
                 'bookmakers': [{'key': 'book', 'last_update': datetime.now(timezone.utc).isoformat(),
                   'markets': [{'key': 'h2h', 'outcomes': [{'name': 'A', 'price': 2}]}]}]}
        feed = {'fetched_at': now, 'events': [event]}
        data = {**pick(), 'index': 0}
        self.assertEqual(verified_pick(data, feed, now)['value'], 2)
        for altered in [{**feed, 'stale': True}, {**feed, 'events': []}, {**feed, 'fetched_at': now-121}]:
            with self.assertRaises(Conflict):
                verified_pick(data, altered, now)
        with self.assertRaises(Conflict):
            verified_pick({**data, 'value': 3}, feed, now)


if __name__ == '__main__':
    unittest.main()
