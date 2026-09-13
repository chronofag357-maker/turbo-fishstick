"""Free prediction contests. Integer hundredths of points, never money.

Published tournament lines are immutable fixed contest prices, not live odds.
All writes share the Store transaction lock; no changes to the ordinary wallet.
"""
import hashlib
import json
import math
import time
import uuid
from decimal import Decimal, ROUND_HALF_UP
from urllib.parse import urlsplit
from bot.services.miniapp_store import Conflict


def init(store):
    with store.db() as c:
        c.execute('CREATE TABLE IF NOT EXISTS league_tournaments(id TEXT PRIMARY KEY, title TEXT, payload TEXT, closed INTEGER DEFAULT 0)')
        c.execute('CREATE TABLE IF NOT EXISTS league_members(tid TEXT, uid INTEGER REFERENCES accounts(id), balance INTEGER NOT NULL CHECK(balance>=0), PRIMARY KEY(tid,uid))')
        c.execute('CREATE TABLE IF NOT EXISTS league_coupons(id TEXT PRIMARY KEY, tid TEXT, uid INTEGER, request_key TEXT, digest TEXT, stake INTEGER, payload TEXT, UNIQUE(uid,request_key))')
        c.execute('CREATE TABLE IF NOT EXISTS league_results(tid TEXT, event TEXT, outcome TEXT, source TEXT, PRIMARY KEY(tid,event))')


def create(store, admin, data):
    title = data.get('title')
    events = data.get('events')
    source = data.get('source', '')
    if not isinstance(title, str) or not 1 <= len(title.strip()) <= 100 or not isinstance(events, list) or not 1 <= len(events) <= 40:
        raise ValueError()
    if urlsplit(source).scheme != 'https' or not urlsplit(source).netloc:
        raise ValueError()
    ids = set()
    for event in events:
        if not isinstance(event.get('id'), str) or not 1 <= len(event['id']) <= 80 or event['id'] in ids:
            raise ValueError()
        ids.add(event['id'])
        if not isinstance(event.get('title'), str) or not 1 <= len(event['title']) <= 150:
            raise ValueError()
        start = event.get('start')
        if type(start) not in (int, float) or not math.isfinite(start) or not time.time() < start < time.time()+366*86400:
            raise ValueError()
        outcomes = event.get('outcomes')
        if not isinstance(outcomes, list) or not 2 <= len(outcomes) <= 3:
            raise ValueError()
        if len({o['name'] for o in outcomes}) != len(outcomes):
            raise ValueError()
        for o in outcomes:
            if not isinstance(o['name'], str) or not 1 <= len(o['name']) <= 100 or o['name'] == 'void':
                raise ValueError()
            if type(o['odds']) not in (int, float) or not math.isfinite(o['odds']) or not 1 < o['odds'] <= 100:
                raise ValueError()
    tid = str(uuid.uuid4())
    payload = {'id':tid, 'title':title.strip(), 'events':events, 'source':source, 'fixture':data.get('fixture') is True}
    with store.db() as c:
        c.execute('INSERT INTO league_tournaments(id,title,payload) VALUES(?,?,?)', (tid,title,json.dumps(payload)))
        store.log(c, admin, 'league_create', {'id':tid})
    return {'id':tid}


def tournament(c, tid):
    row = c.execute('SELECT * FROM league_tournaments WHERE id=?', (tid,)).fetchone()
    if not row:
        raise ValueError('Турнир не найден.')
    return {**json.loads(row['payload']), 'closed':bool(row['closed'])}


def join(store, uid, tid):
    with store.db() as c:
        t=tournament(c,tid)
        if t['closed'] or time.time() >= min(e['start'] for e in t['events']):
            raise Conflict('Регистрация закрыта.')
        c.execute('INSERT OR IGNORE INTO league_members VALUES(?,?,1000000)', (tid,uid))
    return {'ok':True}


def place(store, uid, data):
    tid, key, stake, picks = data['tid'], data['key'], data['stake'], data['picks']
    if not isinstance(key,str) or not 16 <= len(key) <= 80 or type(stake) is not int or not 100 <= stake <= 9000000000000:
        raise ValueError()
    if not isinstance(picks,list) or not 1 <= len(picks) <= 5 or len({p['event'] for p in picks}) != len(picks):
        raise ValueError()
    digest=hashlib.sha256(json.dumps({'tid':tid,'stake':stake,'picks':picks},sort_keys=True).encode()).hexdigest()
    with store.db() as c:
        old=c.execute('SELECT digest,payload FROM league_coupons WHERE uid=? AND request_key=?',(uid,key)).fetchone()
        if old:
            if old['digest'] != digest: raise Conflict('Повторный запрос изменён.')
            return json.loads(old['payload'])
        t=tournament(c,tid)
        if t['closed']: raise Conflict('Турнир завершён.')
        verified=[]
        factor=Decimal(1)
        for p in picks:
            event=next((e for e in t['events'] if e['id']==p['event']),None)
            if not event or time.time() >= event['start'] or c.execute('SELECT 1 FROM league_results WHERE tid=? AND event=?',(tid,p['event'])).fetchone():
                raise Conflict('Событие закрыто.')
            outcome=next((o for o in event['outcomes'] if o['name']==p['outcome']),None)
            if not outcome: raise ValueError()
            factor*=Decimal(str(outcome['odds']))
            verified.append({'event':event['id'],'title':event['title'],'outcome':outcome['name'],'odds':outcome['odds'],'status':'pending'})
        if stake*factor > 9000000000000: raise ValueError()
        if c.execute('UPDATE league_members SET balance=balance-? WHERE tid=? AND uid=? AND balance>=?',(stake,tid,uid,stake)).rowcount != 1:
            raise Conflict('Недостаточно очков или вы ещё не участвуете.')
        coupon={'id':str(uuid.uuid4()),'stake':stake/100,'picks':verified,'status':'pending','payout':None,'created':time.time()}
        c.execute('INSERT INTO league_coupons VALUES(?,?,?,?,?,?,?)',(coupon['id'],tid,uid,key,digest,stake,json.dumps(coupon)))
        store.log(c,uid,'league_coupon',{'id':coupon['id'],'tid':tid})
        return coupon


def result(store, admin, data):
    tid,event_id,outcome,source=data['tid'],data['event'],data['outcome'],data['source']
    if urlsplit(source).scheme!='https' or not urlsplit(source).netloc: raise ValueError()
    with store.db() as c:
        t=tournament(c,tid)
        event=next((e for e in t['events'] if e['id']==event_id),None)
        if not event or outcome not in ['void', *[o['name'] for o in event['outcomes']]]: raise ValueError()
        if not t['fixture'] and time.time()<event['start']: raise Conflict('Событие ещё не началось.')
        old=c.execute('SELECT outcome FROM league_results WHERE tid=? AND event=?',(tid,event_id)).fetchone()
        if old and old['outcome']!=outcome: raise Conflict('Подтверждённый результат нельзя изменить.')
        c.execute('INSERT OR IGNORE INTO league_results VALUES(?,?,?,?)',(tid,event_id,outcome,source))
        results={r['event']:r['outcome'] for r in c.execute('SELECT * FROM league_results WHERE tid=?',(tid,))}
        for row in c.execute('SELECT * FROM league_coupons WHERE tid=?',(tid,)).fetchall():
            b=json.loads(row['payload'])
            for p in b['picks']:
                r=results.get(p['event'])
                p['status']='pending' if r is None else 'void' if r=='void' else 'won' if r==p['outcome'] else 'lost'
            if b['status']=='pending' and all(p['status']!='pending' for p in b['picks']):
                factor=Decimal(1)
                for p in b['picks']:
                    factor*=Decimal(0 if p['status']=='lost' else 1 if p['status']=='void' else str(p['odds']))
                payout=int((row['stake']*factor).quantize(Decimal(1),rounding=ROUND_HALF_UP))
                b.update(status='lost' if factor==0 else 'void' if all(p['status']=='void' for p in b['picks']) else 'won',payout=payout/100)
                c.execute('UPDATE league_members SET balance=balance+? WHERE tid=? AND uid=?',(payout,tid,row['uid']))
            c.execute('UPDATE league_coupons SET payload=? WHERE id=?',(json.dumps(b),row['id']))
        if len(results)==len(t['events']): c.execute('UPDATE league_tournaments SET closed=1 WHERE id=?',(tid,))
        store.log(c,admin,'league_result',{'tid':tid,'event':event_id,'outcome':outcome,'source':source})
    return {'ok':True}


def snapshot(store, uid):
    with store.db() as c:
        tournaments=[]
        for row in c.execute('SELECT id FROM league_tournaments ORDER BY rowid DESC LIMIT 50').fetchall():
            t=tournament(c,row['id']); members=[]
            results={r['event']:r['outcome'] for r in c.execute('SELECT * FROM league_results WHERE tid=?',(t['id'],))}
            t['results']=results
            for member in c.execute('SELECT m.*,a.name FROM league_members m JOIN accounts a ON a.id=m.uid WHERE tid=?',(t['id'],)).fetchall():
                coupons=[json.loads(b['payload']) for b in c.execute('SELECT payload FROM league_coupons WHERE tid=? AND uid=? ORDER BY rowid DESC',(t['id'],member['uid']))]
                members.append({'name':member['name'],'mine':member['uid']==uid,'balance':member['balance']/100,'count':len(coupons),'pending':sum(b['stake'] for b in coupons if b['status']=='pending'),'coupons':coupons if member['uid']==uid else []})
            members.sort(key=lambda m:(-m['balance'],m['name']))
            for m in members:
                m['rank']=1+sum(other['balance']>m['balance'] for other in members)
                played=[other for other in members if other['count']]
                m['champion']=t['closed'] and m['count']>0 and m['balance']==max((other['balance'] for other in played),default=-1)
            t['members']=members; tournaments.append(t)
    return {'tournaments':tournaments}
