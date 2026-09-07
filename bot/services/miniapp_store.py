"""Private play-money ledger. All balance changes and settlements are atomic.

The SQLite file is not served by the static web server. Amounts are integer
kopecks; no deposits, real-money bets or automatic guessed fight results.
"""
import hashlib
import json
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager, closing
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


class Conflict(ValueError):
    pass


def settle(picks, stake):
    states = [p.get('status', 'pending') for p in picks]
    if not states or any(s not in ('won', 'lost', 'void', 'pending') for s in states):
        raise ValueError('Invalid outcomes')
    if 'lost' in states:
        return 'lost', 0
    if 'pending' in states:
        return 'pending', None
    factor = Decimal(1)
    for p in picks:
        if p['status'] == 'won':
            factor *= Decimal(str(p['value']))
    return ('void' if all(s == 'void' for s in states) else 'won',
            int((Decimal(stake) * factor).quantize(Decimal(1), rounding=ROUND_HALF_UP)))


class Store:
    def __init__(self, path):
        self.path = Path(path)

    @contextmanager
    def db(self):
        connection = sqlite3.connect(self.path, timeout=15)
        connection.row_factory = sqlite3.Row
        try:
            connection.execute('PRAGMA foreign_keys=ON')
            connection.execute('BEGIN IMMEDIATE')
            yield connection
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def init(self):
        self.path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with closing(sqlite3.connect(self.path)) as c:
            c.execute('PRAGMA journal_mode=WAL')
            c.executescript('''
                CREATE TABLE IF NOT EXISTS accounts(
                    id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '',
                    allowed INTEGER NOT NULL DEFAULT 1,
                    balance INTEGER NOT NULL DEFAULT 45600000 CHECK(balance >= 0));
                CREATE TABLE IF NOT EXISTS sessions(
                    token TEXT PRIMARY KEY, uid INTEGER REFERENCES accounts(id), expires REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS bets(
                    id TEXT PRIMARY KEY, uid INTEGER REFERENCES accounts(id), request_key TEXT NOT NULL,
                    request_hash TEXT NOT NULL, stake INTEGER NOT NULL, status TEXT NOT NULL,
                    payout INTEGER, payload TEXT NOT NULL, created REAL NOT NULL,
                    UNIQUE(uid, request_key));
                CREATE TABLE IF NOT EXISTS ledger(
                    id TEXT PRIMARY KEY, uid INTEGER REFERENCES accounts(id), bet_id TEXT,
                    amount INTEGER NOT NULL, kind TEXT NOT NULL, created REAL NOT NULL,
                    UNIQUE(bet_id, kind));
                CREATE TABLE IF NOT EXISTS actions(
                    id INTEGER PRIMARY KEY, uid INTEGER, kind TEXT, payload TEXT, created REAL);
                CREATE INDEX IF NOT EXISTS actions_user_time ON actions(uid, created);
                CREATE INDEX IF NOT EXISTS bets_user ON bets(uid, created);
                CREATE TABLE IF NOT EXISTS results(
                    result_key TEXT PRIMARY KEY, result TEXT NOT NULL, source TEXT NOT NULL,
                    admin INTEGER NOT NULL, created REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS preferences(key TEXT PRIMARY KEY, payload TEXT NOT NULL);
            ''')
            c.execute('DELETE FROM sessions WHERE expires < ?', (time.time(),))
            c.execute('DELETE FROM actions WHERE created < ?', (time.time()-90*86400,))
            c.commit()
        self.path.chmod(0o600)

    @staticmethod
    def log(c, uid, kind, payload):
        c.execute('INSERT INTO actions(uid,kind,payload,created) VALUES(?,?,?,?)',
                  (uid, kind, json.dumps(payload, ensure_ascii=False), time.time()))

    def allow(self, admin, uid):
        with self.db() as c:
            c.execute('INSERT OR IGNORE INTO accounts(id) VALUES(?)', (uid,))
            c.execute('UPDATE accounts SET allowed=1 WHERE id=?', (uid,))
            self.log(c, admin, 'participant_allowed', {'id': uid})

    def login(self, uid, name, is_admin=False):
        token = secrets.token_urlsafe(32)
        with self.db() as c:
            if is_admin:
                c.execute('INSERT OR IGNORE INTO accounts(id) VALUES(?)', (uid,))
            row = c.execute('SELECT * FROM accounts WHERE id=? AND allowed=1', (uid,)).fetchone()
            if not row:
                raise PermissionError('Участник не добавлен администратором.')
            c.execute('UPDATE accounts SET name=? WHERE id=?', (name[:200], uid))
            # One initial ledger credit, even when login is repeated on another device.
            c.execute('INSERT OR IGNORE INTO ledger VALUES(?,?,?,?,?,?)',
                      ('initial:'+str(uid), uid, None, 45600000, 'initial', time.time()))
            c.execute('INSERT INTO sessions VALUES(?,?,?)',
                      (hashlib.sha256(token.encode()).hexdigest(), uid, time.time()+8*3600))
            self.log(c, uid, 'login', {})
        return token

    def identity(self, token):
        with self.db() as c:
            row = c.execute('''SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.uid
                WHERE s.token=? AND s.expires>? AND a.allowed=1''',
                (hashlib.sha256(token.encode()).hexdigest(), time.time())).fetchone()
            if not row:
                raise PermissionError('Войдите через Telegram заново.')
            return dict(row)

    def logout(self, token):
        with self.db() as c:
            c.execute('DELETE FROM sessions WHERE token=?', (hashlib.sha256(token.encode()).hexdigest(),))

    def snapshot(self, uid):
        with self.db() as c:
            account = c.execute('SELECT * FROM accounts WHERE id=?', (uid,)).fetchone()
            bets = [json.loads(r['payload']) for r in c.execute('SELECT payload FROM bets WHERE uid=? ORDER BY created DESC', (uid,))]
            transactions = [dict(r) for r in c.execute('SELECT kind,amount,bet_id,created FROM ledger WHERE uid=? ORDER BY created DESC LIMIT 100', (uid,))]
        completed = [b for b in bets if b['status'] != 'pending']
        return {'id': uid, 'name': account['name'], 'balance': account['balance']/100,
                'bets': bets, 'transactions': transactions,
                'stats': {'placed': sum(b['stake'] for b in bets),
                          'inPlay': sum(b['stake'] for b in bets if b['status'] == 'pending'),
                          'paid': sum(b.get('settledPayout', 0) for b in completed),
                          'profit': sum(b.get('settledPayout', 0)-b['stake'] for b in completed),
                          'won': sum(b['status'] == 'won' for b in bets),
                          'lost': sum(b['status'] == 'lost' for b in bets)}}

    def existing(self, uid, key, digest):
        with self.db() as c:
            row = c.execute('SELECT * FROM bets WHERE uid=? AND request_key=?', (uid, key)).fetchone()
            if row and row['request_hash'] != digest:
                raise Conflict('Повторный запрос отличается от принятого купона.')
            return json.loads(row['payload']) if row else None

    @staticmethod
    def result_key(p):
        return json.dumps([p['id'], p['sourceKey'], p['marketKey'], p.get('line')], separators=(',', ':'))

    def place(self, uid, key, digest, stake, picks):
        if type(stake) is not int or not 100000 <= stake <= 1000000 or not 1 <= len(picks) <= 20:
            raise ValueError('Сумма должна быть от 1 000 до 10 000.')
        factor = Decimal(1)
        for p in picks:
            price = Decimal(str(p['value']))
            if not price.is_finite() or not 1 < price <= 10000:
                raise ValueError('Некорректный коэффициент.')
            factor *= price
        payout = int((stake*factor).quantize(Decimal(1), rounding=ROUND_HALF_UP))
        if payout > 9000000000000:
            raise ValueError('Слишком большая возможная выплата.')
        bet = {'id': str(uuid.uuid4()), 'created': datetime.now(timezone.utc).isoformat(),
               'stake': stake/100, 'odds': float(factor), 'payout': payout/100,
               'status': 'pending', 'picks': [{**p, 'resultKey': self.result_key(p), 'status': 'pending'} for p in picks]}
        with self.db() as c:
            old = c.execute('SELECT * FROM bets WHERE uid=? AND request_key=?', (uid, key)).fetchone()
            if old:
                if old['request_hash'] != digest:
                    raise Conflict('Ключ запроса уже использован.')
                return json.loads(old['payload'])
            for p in picks:
                if c.execute('SELECT 1 FROM results WHERE result_key=?', (self.result_key(p),)).fetchone():
                    raise Conflict('Этот рынок уже рассчитан.')
            if c.execute('UPDATE accounts SET balance=balance-? WHERE id=? AND allowed=1 AND balance>=?', (stake, uid, stake)).rowcount != 1:
                raise Conflict('Недостаточно баланса.')
            c.execute('INSERT INTO bets VALUES(?,?,?,?,?,?,?,?,?)',
                      (bet['id'], uid, key, digest, stake, 'pending', None, json.dumps(bet, ensure_ascii=False), time.time()))
            c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?)', (str(uuid.uuid4()), uid, bet['id'], -stake, 'stake', time.time()))
            self.log(c, uid, 'bet_accepted', {'bet': bet['id'], 'stake': stake})
        return bet

    def confirm_result(self, admin, key, result, source):
        """Immutable, audited confirmation. Corrections require a separate audited workflow."""
        with self.db() as c:
            old = c.execute('SELECT result FROM results WHERE result_key=?', (key,)).fetchone()
            if old and old['result'] != result:
                raise Conflict('Результат уже подтверждён. Автоматическая перезапись запрещена.')
            c.execute('INSERT OR IGNORE INTO results VALUES(?,?,?,?,?)', (key, result, source, admin, time.time()))
            count = 0
            for row in c.execute('SELECT * FROM bets').fetchall():
                bet = json.loads(row['payload'])
                changed = False
                for p in bet['picks']:
                    if self.result_key(p) == key and p.get('status') == 'pending':
                        p['status'] = 'void' if result == 'void' else 'won' if p['selection'] == result else 'lost'
                        p['resultSource'] = source
                        changed = True
                if not changed:
                    continue
                state, payout = settle(bet['picks'], row['stake'])
                if row['status'] == 'pending' and state != 'pending':
                    bet.update(status=state, settledPayout=payout/100)
                    c.execute('INSERT INTO ledger VALUES(?,?,?,?,?,?)', (str(uuid.uuid4()), row['uid'], row['id'], payout, 'settlement', time.time()))
                    c.execute('UPDATE accounts SET balance=balance+? WHERE id=?', (payout, row['uid']))
                    self.log(c, row['uid'], 'bet_settled', {'bet': row['id'], 'status': state, 'payout': payout})
                    count += 1
                c.execute('UPDATE bets SET payload=?,status=?,payout=? WHERE id=?',
                          (json.dumps(bet, ensure_ascii=False), bet['status'], round(bet['settledPayout']*100) if 'settledPayout' in bet else None, row['id']))
            self.log(c, admin, 'result_confirmed', {'key': key, 'result': result, 'source': source})
            return count

    def action(self, uid, kind, payload):
        with self.db() as c:
            if c.execute('SELECT count(*) FROM actions WHERE uid=? AND created>?', (uid, time.time()-60)).fetchone()[0] >= 120:
                return
            self.log(c, uid, kind, payload)

    def report(self):
        with self.db() as c:
            ids = [r[0] for r in c.execute('SELECT id FROM accounts ORDER BY id')]
            actions = [dict(r) for r in c.execute('SELECT * FROM actions ORDER BY id DESC LIMIT 200')]
        return {'accounts': [self.snapshot(uid) for uid in ids], 'actions': actions}

    def policy(self):
        with self.db() as c:
            row = c.execute("SELECT payload FROM preferences WHERE key='odds'").fetchone()
            return json.loads(row[0]) if row else {'enabled': False, 'seconds': 86400}

    def save_policy(self, admin, policy):
        if type(policy.get('enabled')) is not bool or type(policy.get('seconds')) is not int or not 40 <= policy['seconds'] <= 86400:
            raise ValueError('Интервал: 40–86400 секунд.')
        value = {'enabled': policy['enabled'], 'seconds': policy['seconds']}
        with self.db() as c:
            c.execute("INSERT OR REPLACE INTO preferences VALUES('odds',?)", (json.dumps(value),))
            self.log(c, admin, 'odds_policy', value)
        return value
