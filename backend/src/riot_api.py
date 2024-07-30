import valo_api
from config import get_settings

settings = get_settings()

if settings.henrik_api_key is None:
    raise ValueError("henrik_api_key is required")

valo_api.set_api_key(settings.henrik_api_key.get_secret_value())
