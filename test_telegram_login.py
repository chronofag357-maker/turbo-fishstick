import unittest
import time
from unittest.mock import patch
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

if __name__=='__main__':unittest.main()
