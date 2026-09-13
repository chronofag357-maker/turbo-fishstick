"""Browser Telegram Login: one-use browser-bound nonce and verified OIDC JWT."""
import asyncio
import hashlib
import hmac
import logging
import secrets
import time
from urllib.parse import urlsplit

import jwt
from aiohttp import web
from bot.config import settings

pending = {}
keys = jwt.PyJWKClient('https://oauth.telegram.org/.well-known/jwks.json', timeout=10)

def origin():
    u = urlsplit(settings.mini_app_url)
    return f'{u.scheme}://{u.netloc}'

def check_origin(request):
    if request.headers.get('Origin') != origin() or not origin().startswith('https://'):
        raise PermissionError('Откройте вход на основном сайте приложения.')

async def challenge(request):
    check_origin(request)
    now = time.time()
    for key in list(pending):
        if pending[key][0] < now: pending.pop(key, None)
    if len(pending) >= 1000:
        raise PermissionError('Попробуйте войти немного позже.')
    nonce, browser = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    pending[nonce] = (now + 300, hashlib.sha256(browser.encode()).hexdigest())
    response = web.json_response({'client_id': int(settings.bot_token.split(':')[0]), 'nonce': nonce})
    response.set_cookie('__Host-tg-login', browser, secure=True, httponly=True, samesite='Strict', max_age=300, path='/')
    return response

def verify(raw, nonce):
    key = keys.get_signing_key_from_jwt(raw).key
    claims = jwt.decode(raw, key, algorithms=['RS256'], audience=settings.bot_token.split(':')[0],
        issuer='https://oauth.telegram.org', options={'require':['exp','iat','iss','aud','sub','nonce','id']})
    if not hmac.compare_digest(str(claims['nonce']), nonce): raise ValueError('nonce_mismatch')
    if not -30 <= time.time()-claims['iat'] <= 300: raise ValueError('token_age')
    if type(claims['id']) is not int or not 0 < claims['id'] < 2**52: raise ValueError('id_type_or_range')
    return claims

async def login(request):
    check_origin(request)
    data = await request.json()
    if not isinstance(data, dict) or data.get('consent') is not True: raise ValueError()
    nonce, raw = data.get('nonce'), data.get('id_token')
    if not isinstance(nonce,str) or not isinstance(raw,str) or len(raw)>16000: raise ValueError()
    entry = pending.get(nonce)
    browser = request.cookies.get('__Host-tg-login','')
    if not entry or entry[0]<time.time() or not hmac.compare_digest(entry[1],hashlib.sha256(browser.encode()).hexdigest()):
        raise PermissionError('Вход устарел. Повторите попытку.')
    pending.pop(nonce, None)
    try:
        user = await asyncio.to_thread(verify, raw, nonce)
    except (jwt.PyJWTError, ValueError, TypeError, KeyError) as exc:
        # Log only the error class, never JWTs, profile data or signing material.
        logging.getLogger(__name__).warning('Telegram JWT rejected: %s', type(exc).__name__)
        if type(exc) is ValueError and str(exc) in ('nonce_mismatch','token_age','id_type_or_range'):
            logging.getLogger(__name__).warning('Telegram validation check: %s', str(exc))
        raise PermissionError('Telegram не подтвердил вход. Повторите попытку.') from None
    from bot.db.repo import is_user_blocked
    from bot.web.miniapp import call, store
    if await is_user_blocked(user['id']): raise PermissionError('Аккаунт заблокирован.')
    token = await call(store.login,user['id'],str(user.get('name',''))[:200],user['id'] in settings.admin_id_set)
    response=web.json_response({'token':token})
    response.del_cookie('__Host-tg-login',path='/',secure=True,httponly=True,samesite='Strict')
    return response
