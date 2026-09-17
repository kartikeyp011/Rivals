import pytest
from datetime import datetime, timedelta, timezone
import os
import json
import uuid

import jwt
from unittest.mock import patch, MagicMock

from app.core.security import verify_jwt, UnauthorizedError
from app.core.config import settings
import ecdsa

def generate_es256_keypair():
    sk = ecdsa.SigningKey.generate(curve=ecdsa.NIST256p)
    vk = sk.get_verifying_key()
    return sk, vk

@pytest.fixture
def es256_keys():
    return generate_es256_keypair()

@pytest.fixture
def valid_es256_token(es256_keys):
    sk, vk = es256_keys
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "authenticated",
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})
    return token, payload, vk

@pytest.fixture
def mock_jwks_client(es256_keys):
    sk, vk = es256_keys
    with patch("app.core.security.get_jwks_client") as mock_get_client:
        mock_client = MagicMock()
        mock_signing_key = MagicMock()
        mock_signing_key.key = vk.to_pem()
        mock_client.get_signing_key_from_jwt.return_value = mock_signing_key
        mock_get_client.return_value = mock_client
        yield mock_client

def test_verify_jwt_valid_es256(valid_es256_token, mock_jwks_client):
    token, expected_payload, _ = valid_es256_token
    payload = verify_jwt(token)
    assert payload["sub"] == expected_payload["sub"]
    assert payload["role"] == "authenticated"

def test_verify_jwt_valid_hs256():
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "authenticated",
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    decoded = verify_jwt(token)
    assert decoded["sub"] == payload["sub"]

def test_verify_jwt_invalid_es256_signature(es256_keys, mock_jwks_client):
    sk_original, _ = es256_keys
    sk_wrong, _ = generate_es256_keypair()

    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk_wrong.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})

    with pytest.raises(UnauthorizedError) as exc_info:
        verify_jwt(token)
    assert "Invalid or expired token" in str(exc_info.value)

def test_verify_jwt_expired_es256(es256_keys, mock_jwks_client):
    sk, vk = es256_keys
    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp() - 10000),
        "exp": int(datetime.now(timezone.utc).timestamp() - 5000)
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})

    with pytest.raises(UnauthorizedError) as exc_info:
        verify_jwt(token)

def test_verify_jwt_wrong_issuer(es256_keys, mock_jwks_client):
    sk, vk = es256_keys
    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": "https://wrong-issuer.com",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})

    with pytest.raises(UnauthorizedError):
        verify_jwt(token)

def test_verify_jwt_wrong_audience(es256_keys, mock_jwks_client):
    sk, vk = es256_keys
    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "wrong-audience",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})

    with pytest.raises(UnauthorizedError):
        verify_jwt(token)

def test_verify_jwt_missing_sub(es256_keys, mock_jwks_client):
    sk, vk = es256_keys
    payload = {
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "test-kid"})

    with pytest.raises(UnauthorizedError) as exc_info:
        verify_jwt(token)
    assert "missing subject" in str(exc_info.value)

def test_verify_jwt_unsupported_algorithm():
    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS512")

    with pytest.raises(UnauthorizedError) as exc_info:
        verify_jwt(token)
    assert "Unsupported JWT algorithm" in str(exc_info.value)

def test_verify_jwt_unknown_kid(es256_keys):
    sk, vk = es256_keys
    payload = {
        "sub": str(uuid.uuid4()),
        "aud": "authenticated",
        "iss": f"{settings.SUPABASE_URL}/auth/v1",
        "iat": int(datetime.now(timezone.utc).timestamp()),
        "exp": int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    }
    token = jwt.encode(payload, sk.to_pem(), algorithm="ES256", headers={"kid": "unknown-kid"})

    with patch("app.core.security.get_jwks_client") as mock_get_client:
        mock_client = MagicMock()
        from jwt import PyJWKClientError
        mock_client.get_signing_key_from_jwt.side_effect = PyJWKClientError("Unable to find a signing key")
        mock_get_client.return_value = mock_client

        with pytest.raises(UnauthorizedError):
            verify_jwt(token)
