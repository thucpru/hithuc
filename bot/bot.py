"""hithuc chatbot — Pipecat Cloud agent.

Pipeline (voice): Daily transport → Soniox STT → Gemini 3.1 Flash Lite (with
function tools) → Soniox TTS → Daily out. Text mode reuses the same LLM/tools;
TTS output is simply not spoken when the client sends text.

Deploy with the Pipecat Cloud CLI (see README.md). The model and STT/TTS keys
are provided as Pipecat Cloud secrets.

NOTE (version-sensitive): Pipecat's module paths and the Pipecat Cloud session
entrypoint signature evolve between releases. This follows the current Daily
starter shape; if `pipecat cloud deploy` reports import/signature errors, align
with the pinned `pipecat-ai` / `pipecatcloud` versions in requirements.txt.
"""

import os

from loguru import logger

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIObserver, RTVIProcessor
from pipecat.services.google.llm import GoogleLLMService
from pipecat.services.soniox.stt import SonioxSTTService
from pipecat.services.soniox.tts import SonioxTTSService
from pipecat.transports.services.daily import DailyParams, DailyTransport

from tools import build_tools_schema, register_handlers

SYSTEM_PROMPT = """You are the assistant on hithuc.com, the portfolio of a solo \
builder (web, app and design projects, plus a blog). You are bilingual: reply in \
Vietnamese if the user writes/speaks Vietnamese, otherwise in English.

- Be concise, friendly and concrete.
- To answer anything about the owner's projects or posts, FIRST call \
search_knowledge_base, then answer only from what it returns. If nothing \
relevant is found, say so.
- When the user asks to see something, drive the UI with the action tools \
(navigate, open_project, filter_work, set_language, set_theme). Call at most one \
action tool per turn.
- Keep spoken answers short; this may be read aloud.
"""

DEFAULT_LANG = "en"


async def run_bot(room_url: str, token: str, body: dict | None):
    body = body or {}
    site_origin = body.get("siteOrigin", os.getenv("SITE_ORIGIN", "https://hithuc.com"))
    lang = body.get("lang", DEFAULT_LANG)

    transport = DailyTransport(
        room_url,
        token,
        "hithuc-bot",
        DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
        ),
    )

    stt = SonioxSTTService(api_key=os.environ["SONIOX_API_KEY"])
    tts = SonioxTTSService(api_key=os.environ["SONIOX_API_KEY"])

    llm = GoogleLLMService(
        api_key=os.environ["GOOGLE_API_KEY"],
        model="gemini-3.1-flash-lite",
        # Disable "thinking" — Gemini 3.x thinking + function calling currently
        # trips a thought_signature error in pipecat (issues #3557 / #3290).
        params=GoogleLLMService.InputParams(thinking=False),
    )

    rtvi = RTVIProcessor(config=RTVIConfig(config=[]))
    register_handlers(llm, rtvi, site_origin)

    context = OpenAILLMContext(
        messages=[{"role": "system", "content": SYSTEM_PROMPT + f"\nCurrent language: {lang}."}],
        tools=build_tools_schema(),
    )
    context_aggregator = llm.create_context_aggregator(context)

    pipeline = Pipeline(
        [
            transport.input(),
            rtvi,
            stt,
            context_aggregator.user(),
            llm,
            tts,
            transport.output(),
            context_aggregator.assistant(),
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(allow_interruptions=True, enable_metrics=True),
        observers=[RTVIObserver(rtvi)],
        # In-session caps.
        idle_timeout_secs=120,
    )

    @transport.event_handler("on_first_participant_joined")
    async def _on_join(_transport, participant):
        await rtvi.set_bot_ready()
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @transport.event_handler("on_participant_left")
    async def _on_leave(_transport, participant, reason):
        await task.cancel()

    runner = PipelineRunner()
    await runner.run(task)


# ---- Pipecat Cloud entrypoint -----------------------------------------------


async def bot(args):
    """Called by Pipecat Cloud for each session (Daily transport args)."""
    logger.info("Starting hithuc bot session")
    await run_bot(args.room_url, args.token, getattr(args, "body", {}) or {})
