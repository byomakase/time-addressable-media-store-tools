from datetime import datetime, timedelta
import boto3
import requests


class Credentials:
    def __init__(
        self,
        token_url: str,
        client_id: str,
        scopes: list[str],
        user_pool_id: str = None,
        client_secret: str = None,
    ) -> None:
        self._token_url = token_url
        self._user_pool_id = user_pool_id
        self._client_id = client_id
        self._scope = " ".join(scopes)
        self._client_secret = client_secret
        self._access_token = None
        self._expires_at = None

    def token(self) -> str:
        if (
            self._access_token is None
            or self._expires_at is None
            or (self._expires_at and self._expires_at < datetime.now())
        ):
            if not self._client_secret:
                self._get_client_secret()
            self._request_token()
        return self._access_token

    def _get_client_secret(self):
        """Get client secret from Cognito"""
        if self._user_pool_id is None:
            raise ValueError("Either client_secret or user_pool_id must be provided")

        client = boto3.client("cognito-idp")
        user_pool_client = client.describe_user_pool_client(
            UserPoolId=self._user_pool_id, ClientId=self._client_id
        )
        self._client_secret = user_pool_client["UserPoolClient"]["ClientSecret"]

    def _request_token(self):
        """Request access token"""
        form_data = {
            "client_id": self._client_id,
            "client_secret": self._client_secret,
            "grant_type": "client_credentials",
            "scope": self._scope,
        }
        resp = requests.post(self._token_url, data=form_data, timeout=30)
        resp.raise_for_status()
        token_response = resp.json()
        self._access_token = token_response["access_token"]
        self._expires_at = datetime.now() + timedelta(
            seconds=(
                token_response["expires_in"] - 30
            )  # 30 seconds of overlap with expiry
        )
