from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    bot_token: str
    admin_ids: str = ""
    database_url: str = "sqlite+aiosqlite:///./bot.db"
    mini_app_url: str = ""
    deepseek_api_key: str = ""
    contact_username: str = ""
    boxing_data_api_key: str = ""
    mini_app_api_port: int = 8080
    # HTTP(S) proxy for outbound requests (Telegram, Boxing Data API) — needed
    # when a system-wide VPN/proxy client (e.g. V2Ray, Clash) handles your
    # regular internet access but Python's aiohttp doesn't see it on its own.
    # Example: http://127.0.0.1:10809
    proxy_url: str = ""

    @property
    def admin_id_set(self) -> set[int]:
        return {
            int(raw.strip())
            for raw in self.admin_ids.split(",")
            if raw.strip().isdigit()
        }


settings = Settings()
