import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from bot.services.miniapp_store import Store, Conflict


class TrainingBalanceTests(unittest.TestCase):
    def test_free_refill_is_atomic_and_preserves_history(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp)/'test.sqlite3')
            store.init()
            store.login(1, 'Owner', True)
            with self.assertRaises(Conflict):
                store.refill_training(1)
            with store.db() as c:
                c.execute('UPDATE accounts SET balance=0 WHERE id=1')
            def refill(_):
                try:
                    store.refill_training(1)
                    return True
                except Conflict:
                    return False
            with ThreadPoolExecutor(max_workers=4) as pool:
                self.assertEqual(sum(pool.map(refill, range(4))), 1)
            snapshot = store.snapshot(1)
            self.assertEqual(snapshot['balance'], 10000)
            self.assertEqual(len(snapshot['transactions']), 2)
            with self.assertRaises(PermissionError):
                store.refill_training(99)

    def test_pending_coupon_blocks_refill(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = Store(Path(tmp)/'test.sqlite3')
            store.init()
            store.login(1, 'Owner', True)
            with store.db() as c:
                c.execute('UPDATE accounts SET balance=0 WHERE id=1')
                c.execute("INSERT INTO bets VALUES('b',1,'k','h',100,'pending',NULL,'{}',0)")
            with self.assertRaises(Conflict):
                store.refill_training(1)


if __name__ == '__main__':
    unittest.main()
