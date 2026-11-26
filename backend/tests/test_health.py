import pytest
from fastapi.testclient import TestClient

from griffier.config import Settings
from griffier.main import create_app


def test_health_endpoint_returns_ok() -> None:
    # Arrange
    client = TestClient(create_app(Settings()))

    # Act
    response = client.get("/api/health")

    # Assert
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_configured_frontend_origin() -> None:
    # Arrange
    origin = "http://localhost:5173"
    settings = Settings(cors_origins=[origin])
    client = TestClient(create_app(settings))

    # Act
    response = client.options(
        "/api/health",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )

    # Assert
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_settings_loads_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    # Arrange
    expected = {
        "ASSEMBLYAI_API_KEY": "test-aai",
        "LLM_PROVIDER": "openai",
        "LLM_MODEL": "gpt-4o-mini",
        "LLM_BASE_URL": "https://example.com/v1",
        "LLM_API_KEY": "test-llm",
        "TAVILY_API_KEY": "test-tavily",
    }
    for key, value in expected.items():
        monkeypatch.setenv(key, value)

    # Act
    settings = Settings()

    # Assert
    assert settings.assemblyai_api_key == expected["ASSEMBLYAI_API_KEY"]
    assert settings.llm_provider == expected["LLM_PROVIDER"]
    assert settings.llm_model == expected["LLM_MODEL"]
    assert settings.llm_base_url == expected["LLM_BASE_URL"]
    assert settings.llm_api_key == expected["LLM_API_KEY"]
    assert settings.tavily_api_key == expected["TAVILY_API_KEY"]
