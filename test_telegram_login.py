import unittest
import time
from unittest.mock import patch
from unittest.mock import AsyncMock
import hashlib
import json
from types import SimpleNamespace
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from bot.web import telegram_login as auth

class Validation(unittest.TestCase):
    def test_signed_claims(self):
        private=rsa.generate_private_key(public_exponent=65537,key_size=2048)
        claims=dict(iss='https://oauth.telegram.org',aud=auth.settings.bot_token.split(':')[0],sub='subject',id=123,iat=int(time.time()),exp=int(time.time())+120,nonce='test')
        def encoded(c): return jwt.encode(c,private,algorithm='RS256')
        with patch.object(auth.keys,'get_signing_key_from_jwt',return_value=SimpleNamespace(key=private.public_key())):
            self.assertEqual(auth.verify(encoded(claims),'test')['id'],123)
            self.assertEqual(auth.verify(encoded(dict(claims,id='123')),'test')['id'],123)
            for invalid_id in [True,123.0,None,0,-1,2**52,'0','-1','+123',' 123','123.0','١٢٣',str(2**52),'9'*100]:
                with self.subTest(id=invalid_id), self.assertRaises((ValueError,jwt.PyJWTError)):
                    auth.verify(encoded(dict(claims,id=invalid_id)),'test')
            for altered in [dict(claims,aud='wrong'),dict(claims,iss='wrong'),dict(claims,exp=1),dict(claims,nonce='wrong')]:
                with self.assertRaises((jwt.PyJWTError,ValueError)): auth.verify(encoded(altered),'test')
            with self.assertRaises(jwt.PyJWTError): auth.verify(encoded({k:v for k,v in claims.items() if k!='nonce'}),'test')
    def test_origin(self):
        with self.assertRaises(PermissionError):auth.check_origin(SimpleNamespace(headers={'Origin':'https://evil.example'}))

class LoginResponse(unittest.IsolatedAsyncioTestCase):
    async def test_verified_login_returns_session_and_expires_cookie(self):
        from bot.web import miniapp
        nonce='response-test'
        auth.pending[nonce]=(time.time()+300,hashlib.sha256(b'browser').hexdigest())
        request=SimpleNamespace(cookies={'__Host-tg-login':'browser'},json=AsyncMock(return_value={
            'consent':True,'nonce':nonce,'id_token':'signed-fixture'}))
        with patch.object(auth,'check_origin'), patch.object(auth,'verify',return_value={'id':123,'name':'Test'}), \
             patch('bot.db.repo.is_user_blocked',new=AsyncMock(return_value=False)), \
             patch.object(miniapp,'call',new=AsyncMock(return_value='session-fixture')):
            response=await auth.login(request)
        self.assertEqual(response.status,200)
        self.assertEqual(json.loads(response.text),{'token':'session-fixture'})
        cookie=response.cookies['__Host-tg-login']
        self.assertEqual(str(cookie['max-age']),'0')
        self.assertTrue(cookie['secure'])
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['path'],'/')
        self.assertNotIn(nonce,auth.pending)

if __name__=='__main__':unittest.main()
