import json

import pytest
from pydantic_ai import ModelMessage, ModelResponse, TextPart
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.models.test import TestModel

from griffier.adapters.llm.model_factory import (
    build_llm_model,
    build_llm_model_from_settings,
)
from griffier.adapters.llm.pydanticai import PydanticAIAnalyzer
from griffier.config import Settings
from griffier.domain.errors import UpstreamProviderError
from griffier.domain.models import (
    Claim,
    ClaimOrigin,
    ClaimVerdict,
    ExternalSource,
    IndexedSource,
    MarkedPassage,
    TranscriptSegment,
)
from griffier.domain.protocols import IntelligenceAnalyzer


def _build_segments() -> list[TranscriptSegment]:
    return [
        TranscriptSegment(
            id="seg-1",
            speaker="Interviewer",
            start_ms=0,
            end_ms=3000,
            text="Hoe evolueerde de inflatie vorig jaar?",
        ),
        TranscriptSegment(
            id="seg-2",
            speaker="Interviewee",
            start_ms=3100,
            end_ms=7200,
            text="De inflatie daalde vorig jaar met 2 procent.",
        ),
    ]


def _json_response(payload: dict[str, object]) -> ModelResponse:
    return ModelResponse(parts=[TextPart(content=json.dumps(payload))])


def test_model_factory_builds_supported_providers() -> None:
    # Arrange
    settings = Settings(
        llm_provider="anthropic",
        llm_model="deepseek-flash",
        llm_base_url="https://api.deepseek.com/anthropic",
        llm_api_key="test-key",
    )

    # Act
    anthropic_model = build_llm_model_from_settings(settings)
    openai_model = build_llm_model(
        provider="openai",
        model_name="gpt-4o-mini",
        api_key="test-openai-key",
        base_url="https://openrouter.ai/api/v1",
    )
    google_model = build_llm_model(
        provider="google",
        model_name="gemini-2.5-flash",
        api_key="test-google-key",
    )

    # Assert
    assert isinstance(anthropic_model, AnthropicModel)
    assert anthropic_model.model_name == "deepseek-flash"
    assert isinstance(openai_model, OpenAIChatModel)
    assert openai_model.model_name == "gpt-4o-mini"
    assert isinstance(google_model, GoogleModel)
    assert google_model.model_name == "gemini-2.5-flash"


def test_model_factory_rejects_invalid_configuration() -> None:
    # Act & Assert
    with pytest.raises(UpstreamProviderError, match="Unsupported LLM_PROVIDER"):
        build_llm_model(provider="unknown", model_name="m", api_key="k")

    with pytest.raises(UpstreamProviderError, match="LLM_API_KEY"):
        build_llm_model(provider="anthropic", model_name="m", api_key="   ")

    with pytest.raises(UpstreamProviderError, match="LLM_MODEL"):
        build_llm_model(provider="openai", model_name=" ", api_key="k")


async def test_extract_interview_analysis_returns_structured_output_with_test_model() -> None:
    # Arrange
    model = TestModel(
        custom_output_text=json.dumps(
            {
                "summary": "Interview over inflatiecijfers.",
                "topics": [
                    {"topic": "Inflatie", "search_query": "inflatie Belgie CBS vorig jaar"},
                ],
                "claims": [
                    {
                        "segment_id": "seg-2",
                        "quote": "De inflatie daalde vorig jaar met 2 procent.",
                        "speaker": "Interviewee",
                        "reason": "Specifiek macro-economisch cijfer dat verifieerbaar is.",
                        "search_query": "inflatie daling 2 procent vorig jaar officiele cijfers",
                    }
                ],
            }
        )
    )
    analyzer: IntelligenceAnalyzer = PydanticAIAnalyzer(model=model)

    # Act
    analysis = await analyzer.extract_interview_analysis(_build_segments())

    # Assert
    assert analysis.summary == "Interview over inflatiecijfers."
    assert len(analysis.topics) == 1
    assert analysis.topics[0].topic == "Inflatie"
    assert len(analysis.claims) == 1
    assert analysis.claims[0].segment_id == "seg-2"
    assert analysis.claims[0].speaker == "Interviewee"


async def test_generate_marked_queries_passes_passage_context_and_preserves_claim_id() -> None:
    # Arrange
    captured_prompts: list[str] = []

    def respond(messages: list[ModelMessage], agent_info: AgentInfo) -> ModelResponse:
        assert not agent_info.output_tools
        captured_prompts.append(str(messages))
        return _json_response(
            {
                "items": [
                    {
                        "claim_id": "claim-j1",
                        "segment_id": "seg-2",
                        "quote": "De inflatie daalde vorig jaar met 2 procent.",
                        "reason": "Controleer het exacte inflatiepercentage.",
                        "search_query": "officiele inflatiecijfers vorig jaar",
                    }
                ]
            }
        )

    analyzer = PydanticAIAnalyzer(model=FunctionModel(respond))
    passage = MarkedPassage(
        claim_id="claim-j1",
        segment_id="seg-2",
        quote="De inflatie daalde vorig jaar met 2 procent.",
        speaker="Interviewee",
        context="Vraag ging over de nationale inflatie.",
    )

    # Act
    queries = await analyzer.generate_marked_queries([passage])

    # Assert
    assert len(captured_prompts) == 1
    assert "claim-j1" in captured_prompts[0]
    assert "Vraag ging over de nationale inflatie." in captured_prompts[0]
    assert len(queries) == 1
    assert queries[0].claim_id == "claim-j1"
    assert queries[0].search_query == "officiele inflatiecijfers vorig jaar"


async def test_verify_claims_against_sources_omits_raw_urls_and_filters_invalid_source_ids() -> (
    None
):
    # Arrange
    captured_prompts: list[str] = []

    def respond(messages: list[ModelMessage], agent_info: AgentInfo) -> ModelResponse:
        assert not agent_info.output_tools
        captured_prompts.append(str(messages))
        return _json_response(
            {
                "items": [
                    {
                        "claim_id": "claim-1",
                        "verdict": "supported",
                        "explanation": "Bevestigd door officiele statistieken [1].",
                        "source_ids": [1, 99],
                    }
                ]
            }
        )

    analyzer = PydanticAIAnalyzer(model=FunctionModel(respond))
    claim = Claim(
        id="claim-1",
        origin=ClaimOrigin.AI,
        segment_id="seg-2",
        speaker="Interviewee",
        quote="De inflatie daalde vorig jaar met 2 procent.",
    )
    indexed_sources = [
        IndexedSource(
            source_id=1,
            source=ExternalSource(
                title="CBS Jaaroverzicht",
                url="https://example.com/secret-url-not-for-llm",
                snippet="De inflatie daalde met 2,0 procent in het afgelopen jaar.",
                published_date="2026-01-15",
            ),
        )
    ]

    # Act
    verifications = await analyzer.verify_claims_against_sources([claim], indexed_sources)

    # Assert
    assert len(captured_prompts) == 1
    assert (
        '<source id="1" title="CBS Jaaroverzicht" published_date="2026-01-15">'
        in (captured_prompts[0])
    )
    assert "https://example.com/secret-url-not-for-llm" not in captured_prompts[0]
    assert len(verifications) == 1
    assert verifications[0].claim_id == "claim-1"
    assert verifications[0].verdict is ClaimVerdict.SUPPORTED
    assert verifications[0].source_ids == [1]


async def test_analyzer_short_circuits_empty_inputs_without_calling_model() -> None:
    # Arrange
    def fail_if_called(messages: list[ModelMessage], agent_info: AgentInfo) -> ModelResponse:
        raise AssertionError("Model should not be invoked for empty input.")

    analyzer = PydanticAIAnalyzer(model=FunctionModel(fail_if_called))

    # Act
    analysis = await analyzer.extract_interview_analysis([])
    queries = await analyzer.generate_marked_queries([])
    verifications = await analyzer.verify_claims_against_sources([], [])

    # Assert
    assert analysis.summary == ""
    assert analysis.topics == []
    assert analysis.claims == []
    assert queries == []
    assert verifications == []


async def test_analyzer_maps_model_failures_to_upstream_provider_error() -> None:
    # Arrange
    def explode(messages: list[ModelMessage], agent_info: AgentInfo) -> ModelResponse:
        raise RuntimeError("Provider rate limit exceeded")

    analyzer = PydanticAIAnalyzer(model=FunctionModel(explode))

    # Act & Assert
    with pytest.raises(UpstreamProviderError, match="Provider rate limit exceeded") as exc:
        await analyzer.extract_interview_analysis(_build_segments())
    assert exc.value.provider == "LLM"
