from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    bot_token: str
    admin_ids: str = ""
    database_url: str = "sqlite+aiosqlite:///./bot.db"
    mini_app_url: str = ""

    @property
    def admin_id_set(self) -> set[int]:
        return {
            int(raw.strip())
            for raw in self.admin_ids.split(",")
            if raw.strip().isdigit()
        }


settings = Settings()
