from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_path: str = "./model/model.bin"
    port: int = 8001
    max_token_length: int = 512

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
