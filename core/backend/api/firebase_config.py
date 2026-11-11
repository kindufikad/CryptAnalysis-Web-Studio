import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore


SERVICE_ACCOUNT_FILE = Path(
    os.environ.get(
        "FIREBASE_SERVICE_ACCOUNT_PATH",
        Path(__file__).with_name("serviceAccountKey.json"),
    )
).expanduser()

if not SERVICE_ACCOUNT_FILE.is_file():
    raise FileNotFoundError(
        "Firebase service account JSON not found. Set FIREBASE_SERVICE_ACCOUNT_PATH "
        "or place serviceAccountKey.json beside firebase_config.py."
    )

try:
    app = firebase_admin.get_app()
except ValueError:
    app = firebase_admin.initialize_app(
        credentials.Certificate(str(SERVICE_ACCOUNT_FILE))
    )

firestore_client = firestore.client(app=app)
