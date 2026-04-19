import firebase_admin
from firebase_admin import credentials, firestore
from django.conf import settings
import os
import json

class FirebaseHelper:
    _db = None

    @classmethod
    def get_db(cls):
        if cls._db is None:
            # Check if already initialized
            try:
                firebase_admin.get_app()
            except ValueError:
                # Initialize using settings from .env (via Django settings)
                cred_dict = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n") if os.getenv("FIREBASE_PRIVATE_KEY") else "",
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
                    "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
                    "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
                    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
                }
                
                # Check if we have valid creds
                if not cred_dict["project_id"] or "YOUR_PRIVATE_KEY_HERE" in cred_dict["private_key"]:
                    print("Firebase credentials not fully configured in .env. Using mock mode.")
                    return None

                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
            
            cls._db = firestore.client()
        return cls._db

    @classmethod
    def fetch_screen_time(cls, firebase_id):
        """
        Fetches screen time data for a child from Firestore.
        Assuming structure: screen_time/{firebase_id} -> { 'apps': { 'YouTube': 120, ... } }
        """
        db = cls.get_db()
        if db is None:
            return None
        
        try:
            doc_ref = db.collection('screen_time').document(firebase_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict().get('apps', {})
            else:
                print(f"No Firebase document found for ID: {firebase_id}")
                return None
        except Exception as e:
            print(f"Error fetching from Firebase: {str(e)}")
            return None
