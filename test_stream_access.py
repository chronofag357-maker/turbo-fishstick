import unittest
from types import SimpleNamespace
import jwt
from bot.services.stream_access import connection_details, StreamUnavailable


class StreamAccessTests(unittest.TestCase):
    def setUp(self):
        self.config = SimpleNamespace(
            livekit_enabled=True, livekit_participant_ids="1,2,3",
            livekit_url="wss://media.example.com", livekit_room="partners",
            livekit_api_key="fixture-key", livekit_api_secret="fixture-secret-" * 4)

    def test_grants_are_private_and_short_lived(self):
        result = connection_details({"id": 2, "name": "Partner"}, self.config)
        claims = jwt.decode(result["token"], self.config.livekit_api_secret,
                            algorithms=["HS256"], issuer=self.config.livekit_api_key)
        self.assertEqual(claims["sub"], "2")
        self.assertEqual(claims["video"]["room"], "partners")
        self.assertFalse(claims["video"]["roomAdmin"])
        self.assertEqual(claims["video"]["canPublishSources"], ["camera", "microphone"])
        self.assertLessEqual(claims["exp"] - claims["nbf"], 300)
        self.assertNotIn("api_secret", result)

    def test_denies_outsider(self):
        with self.assertRaises(PermissionError):
            connection_details({"id": 4}, self.config)

    def test_disabled(self):
        self.config.livekit_enabled = False
        with self.assertRaises(StreamUnavailable):
            connection_details({"id": 1}, self.config)

    def test_requires_tls_and_strong_secret(self):
        for field, value in [("livekit_url", "ws://media.example.com"),
                             ("livekit_api_secret", "short"),
                             ("livekit_participant_ids", "1,2,3,4")]:
            with self.subTest(field=field):
                original = getattr(self.config, field)
                setattr(self.config, field, value)
                with self.assertRaises(StreamUnavailable):
                    connection_details({"id": 1}, self.config)
                setattr(self.config, field, original)


if __name__ == "__main__":
    unittest.main()
