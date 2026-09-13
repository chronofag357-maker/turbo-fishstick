import tempfile
import time
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from bot.services.miniapp_store import Store, Conflict
from bot.services import prediction_league as league


class LeagueTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.store=Store(Path(self.tmp.name)/'test.sqlite3'); self.store.init(); league.init(self.store)
        for uid in (1,2): self.store.login(uid,'Participant '+str(uid),True)
        self.tid=league.create(self.store,1,{'title':'Fixture','fixture':True,'source':'https://example.com','events':[{'id':str(i),'title':'Pair '+str(i),'start':time.time()+3600,'outcomes':[{'name':'A','odds':2},{'name':'B','odds':2}]} for i in range(5)]})['id']
        for uid in (1,2): league.join(self.store,uid,self.tid)

    def place(self,uid=1,key='request-key-0000001',stake=1000000,picks=None):
        return league.place(self.store,uid,{'tid':self.tid,'key':key,'stake':stake,'picks':picks or [{'event':'0','outcome':'A'}]})

    def finish(self):
        for i in range(5): league.result(self.store,1,{'tid':self.tid,'event':str(i),'outcome':'A','source':'https://example.com/result'})

    def test_isolated_once_and_champions(self):
        self.place(); self.place(2)
        self.assertEqual(self.place()['stake'],10000)
        league.join(self.store,1,self.tid)
        self.assertEqual(league.snapshot(self.store,1)['tournaments'][0]['members'][0]['balance'],0)
        self.finish(); self.finish()
        t=league.snapshot(self.store,1)['tournaments'][0]
        self.assertTrue(t['closed'])
        self.assertTrue(all(m['champion'] and m['balance']==20000 and m['rank']==1 for m in t['members']))
        self.assertEqual(self.store.snapshot(1)['balance'],456000)
        with self.assertRaises(Conflict): self.place(key='request-key-0000002')

    def test_double_spend(self):
        def submit(i):
            try: self.place(key='request-key-'+str(i).zfill(10)); return 1
            except Conflict: return 0
        with ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(sum(pool.map(submit,range(4))),1)

    def test_invalid_picks_and_amount(self):
        for picks in ([{'event':'0','outcome':'A'}]*2,[{'event':'foreign','outcome':'A'}],[{'event':str(i),'outcome':'A'} for i in range(6)]):
            with self.assertRaises((ValueError,Conflict)): self.place(picks=picks)
        for stake in (0,-1,True,1.5):
            with self.assertRaises(ValueError): self.place(stake=stake)
        self.place()
        with self.assertRaises(Conflict): self.place(stake=100)

    def test_void_and_immutable_result(self):
        self.place(picks=[{'event':'0','outcome':'A'},{'event':'1','outcome':'A'}])
        league.result(self.store,1,{'tid':self.tid,'event':'0','outcome':'void','source':'https://example.com/result'})
        league.result(self.store,1,{'tid':self.tid,'event':'1','outcome':'A','source':'https://example.com/result'})
        with self.assertRaises(Conflict): self.finish()
        me=next(m for m in league.snapshot(self.store,1)['tournaments'][0]['members'] if m['mine'])
        self.assertEqual(me['balance'],20000)

    def test_deadline(self):
        with self.store.db() as c:
            import json
            t=league.tournament(c,self.tid);t['events'][0]['start']=time.time()-1
            c.execute('UPDATE league_tournaments SET payload=? WHERE id=?',(json.dumps(t),self.tid))
        with self.assertRaises(Conflict): self.place()
        with self.assertRaises(Conflict): league.join(self.store,2,self.tid)


if __name__=='__main__': unittest.main()
