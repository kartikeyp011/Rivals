import pytest
from unittest.mock import patch, AsyncMock
import httpx
from app.core.config import settings
from app.services.user_service import UserService

def test_unauthorized_deletion(client):
    response = client.delete("/api/v1/users/me")
    assert response.status_code == 401

def test_normal_deletion(client, test_user_1, test_user_1_headers):
    with patch("app.services.user_service.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.delete.return_value.status_code = 200
        mock_client.return_value.__aenter__.return_value = mock_instance

        # Call the endpoint
        response = client.delete("/api/v1/users/me", headers=test_user_1_headers)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"

        # Verify Supabase Admin API was called
        mock_instance.delete.assert_called_once()
        args, kwargs = mock_instance.delete.call_args
        assert f"/auth/v1/admin/users/{test_user_1}" in args[0]
        assert kwargs["headers"]["apikey"] == settings.SUPABASE_SERVICE_ROLE_KEY

def test_apple_revocation_success(client, test_user_2, test_user_2_headers):
    # Mock the Apple configuration
    settings.APPLE_TEAM_ID = "TEAMID"
    settings.APPLE_CLIENT_ID = "com.test.app"
    settings.APPLE_KEY_ID = "KEYID"
    settings.APPLE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----"

    # Mock DB token retrieval and httpx Client
    with patch.object(UserService, "_generate_apple_client_secret", return_value="mock_jwt"), \
         patch("app.repositories.user_repository.UserRepository.get_apple_refresh_token", return_value="mock_refresh_token"), \
         patch("app.services.user_service.httpx.AsyncClient") as mock_client:
        
        mock_instance = AsyncMock()
        mock_instance.post.return_value.status_code = 200
        mock_instance.delete.return_value.status_code = 200
        mock_client.return_value.__aenter__.return_value = mock_instance

        response = client.delete("/api/v1/users/me", headers=test_user_2_headers)
        assert response.status_code == 200

        # Verify Apple API was called
        mock_instance.post.assert_called_once()
        args, kwargs = mock_instance.post.call_args
        assert args[0] == "https://appleid.apple.com/auth/oauth2/v2/revoke"
        assert kwargs["data"]["token"] == "mock_refresh_token"

def test_apple_revocation_failure_proceeds(client, test_user_1, test_user_1_headers):
    settings.APPLE_TEAM_ID = "TEAMID"
    with patch.object(UserService, "_generate_apple_client_secret", return_value="mock_jwt"), \
         patch("app.repositories.user_repository.UserRepository.get_apple_refresh_token", return_value="mock_refresh_token"), \
         patch("app.services.user_service.httpx.AsyncClient") as mock_client:
        
        mock_instance = AsyncMock()
        mock_instance.post.return_value.status_code = 500  # Apple fails
        mock_instance.delete.return_value.status_code = 200  # Supabase succeeds
        mock_client.return_value.__aenter__.return_value = mock_instance

        response = client.delete("/api/v1/users/me", headers=test_user_1_headers)
        # It should still succeed
        assert response.status_code == 200

def test_supabase_auth_failure_returns_500(client, test_user_2, test_user_2_headers):
    with patch("app.services.user_service.httpx.AsyncClient") as mock_client:
        mock_instance = AsyncMock()
        mock_instance.delete.return_value.status_code = 502 # Admin API fails
        mock_client.return_value.__aenter__.return_value = mock_instance

        response = client.delete("/api/v1/users/me", headers=test_user_2_headers)
        assert response.status_code == 500
        assert "failed to remove Auth account" in response.json()["error"]["message"]
