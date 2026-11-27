from collections.abc import Sequence
from typing import Annotated, cast

from fastapi import Depends, Request

from griffier.adapters.llm.model_factory import build_llm_model_from_settings
from griffier.adapters.llm.pydanticai import PydanticAIAnalyzer
from griffier.adapters.search.tavily import TavilySearcher
from griffier.adapters.storage.in_memory import InMemoryInterviewRepository
from griffier.adapters.storage.in_memory_audio import InMemoryAudioStore
from griffier.adapters.stt.assemblyai import AssemblyAITranscriber
from griffier.config import Settings
from griffier.domain.models import (
    Claim,
    ClaimVerification,
    IndexedSource,
    InterviewAnalysis,
    MarkedPassage,
    MarkedPassageQuery,
    TranscriptSegment,
)
from griffier.domain.protocols import (
    AudioStore,
    IntelligenceAnalyzer,
    InterviewRepository,
    SourceSearcher,
    Transcriber,
)
from griffier.services.interview_service import InterviewService


class _LazyPydanticAIAnalyzer:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._analyzer: PydanticAIAnalyzer | None = None

    def _resolve(self) -> PydanticAIAnalyzer:
        if self._analyzer is None:
            model = build_llm_model_from_settings(self._settings)
            self._analyzer = PydanticAIAnalyzer(model=model)
        return self._analyzer

    async def extract_interview_analysis(
        self,
        segments: Sequence[TranscriptSegment],
    ) -> InterviewAnalysis:
        return await self._resolve().extract_interview_analysis(segments)

    async def generate_marked_queries(
        self,
        passages: Sequence[MarkedPassage],
    ) -> list[MarkedPassageQuery]:
        return await self._resolve().generate_marked_queries(passages)

    async def verify_claims_against_sources(
        self,
        claims: Sequence[Claim],
        indexed_sources: Sequence[IndexedSource],
    ) -> list[ClaimVerification]:
        return await self._resolve().verify_claims_against_sources(claims, indexed_sources)


def get_app_settings(request: Request) -> Settings:
    return cast(Settings, request.app.state.settings)


def get_interview_repository(request: Request) -> InterviewRepository:
    return cast(InMemoryInterviewRepository, request.app.state.interview_repository)


def get_audio_store(request: Request) -> AudioStore:
    return cast(InMemoryAudioStore, request.app.state.audio_store)


SettingsDep = Annotated[Settings, Depends(get_app_settings)]
InterviewRepositoryDep = Annotated[InterviewRepository, Depends(get_interview_repository)]
AudioStoreDep = Annotated[AudioStore, Depends(get_audio_store)]


def get_transcriber(settings: SettingsDep) -> Transcriber:
    return AssemblyAITranscriber(api_key=settings.assemblyai_api_key)


def get_intelligence_analyzer(settings: SettingsDep) -> IntelligenceAnalyzer:
    return _LazyPydanticAIAnalyzer(settings)


def get_source_searcher(settings: SettingsDep) -> SourceSearcher:
    return TavilySearcher(api_key=settings.tavily_api_key)


TranscriberDep = Annotated[Transcriber, Depends(get_transcriber)]
IntelligenceAnalyzerDep = Annotated[IntelligenceAnalyzer, Depends(get_intelligence_analyzer)]
SourceSearcherDep = Annotated[SourceSearcher, Depends(get_source_searcher)]


def get_interview_service(
    transcriber: TranscriberDep,
    analyzer: IntelligenceAnalyzerDep,
    searcher: SourceSearcherDep,
    repository: InterviewRepositoryDep,
    audio_store: AudioStoreDep,
) -> InterviewService:
    return InterviewService(
        transcriber=transcriber,
        analyzer=analyzer,
        searcher=searcher,
        repository=repository,
        audio_store=audio_store,
    )


InterviewServiceDep = Annotated[InterviewService, Depends(get_interview_service)]
