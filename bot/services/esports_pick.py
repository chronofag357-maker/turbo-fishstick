"""Server-verified play-money esports selections; never trust client price/labels."""
import math
from datetime import datetime, timezone
from decimal import Decimal
from bot.services.miniapp_store import Conflict


def verified_esports_pick(p, feed, now):
    event = next((e for e in feed.get('events', []) if e['id'] == p['id']), None)
    if not event or not event.get('active') or event.get('status') not in ('notstarted', 'inprogress'):
        raise Conflict('Матч или линия киберспорта закрыты.')
    received = event.get('line_received_at', feed.get('fetched_at', 0))
    # Connected stream preserves unchanged prices; disconnected/cached boards need a fresh receipt.
    if not event.get('live_confirmed'):
        if feed.get('error') or not 0 <= now-received <= 120:
            raise Conflict('Запустите обновление киберспорта перед оформлением.')
    if p.get('sourceKey') != 'pari' or p.get('kind') not in ('result', 'total', 'handicap'):
        raise ValueError()
    line = p.get('line')
    if line is not None and (type(line) not in (int, float) or not math.isfinite(line)):
        raise ValueError()
    market = next((m for m in event['markets'] if m['key'] == p['kind']), None)
    stake = next((s for s in (market or {}).get('stakes', []) if s['key'] == p.get('stakeKey') and s.get('argument') == line), None)
    if not stake:
        raise Conflict('Исход отсутствует или закрыт.')
    price = Decimal(str(p['value']))
    if not price.is_finite() or price != Decimal(str(stake['price'])):
        raise Conflict('Коэффициент изменился. Примите обновлённую линию.')
    start = datetime.fromtimestamp(event['start']/1000, timezone.utc).isoformat()
    return {'id': event['id'], 'sport': 'esports', 'kind': p['kind'], 'index': p.get('index', 0),
            'stakeKey': stake['key'], 'value': stake['price'], 'line': line, 'sourceKey': 'pari',
            'marketKey': p['kind'], 'selection': stake['key'], 'fighters': event['teams'],
            'resultOptions': list(dict.fromkeys(s['key'] for s in market['stakes'])),
            'label': stake['label']+((' '+str(line)) if line is not None else ''),
            'date': start, 'startTime': start, 'source': 'API-Sport · Pari'}
