"""Function tools for the hithuc chatbot.

Two kinds of tools:
- `search_knowledge_base`: RAG lookup against the site Worker (`/api/kb/search`).
- UI actions (`navigate`, `open_project`, ...): the handler pushes an RTVI
  *server message* to the connected client, which the React app interprets to
  drive the UI. These work in both text and voice mode.

NOTE (version-sensitive): the exact import paths for FunctionSchema/ToolsSchema
and the RTVI server-message frame can change between pipecat releases. Pin
`pipecat-ai` (see requirements.txt) and adjust if the deploy reports import
errors.
"""

import os

import httpx
from loguru import logger

from pipecat.adapters.schemas.function_schema import FunctionSchema
from pipecat.adapters.schemas.tools_schema import ToolsSchema
from pipecat.processors.frameworks.rtvi import RTVIProcessor, RTVIServerMessageFrame

SITE_ORIGIN_DEFAULT = os.getenv("SITE_ORIGIN", "https://hithuc.com")

# ---- Tool schemas (advertised to Gemini) ------------------------------------

SEARCH_KB = FunctionSchema(
    name="search_knowledge_base",
    description="Search the site's projects and blog posts to answer questions about the owner's work.",
    properties={"query": {"type": "string", "description": "What to look up."}},
    required=["query"],
)

NAVIGATE = FunctionSchema(
    name="navigate",
    description="Navigate the website to a path, e.g. '/work', '/blog', '/about'.",
    properties={"path": {"type": "string"}},
    required=["path"],
)

OPEN_PROJECT = FunctionSchema(
    name="open_project",
    description="Open a project's detail page by its slug.",
    properties={"slug": {"type": "string"}},
    required=["slug"],
)

FILTER_WORK = FunctionSchema(
    name="filter_work",
    description="Show the work list filtered by type.",
    properties={"type": {"type": "string", "enum": ["web", "app", "design"]}},
    required=["type"],
)

SET_LANGUAGE = FunctionSchema(
    name="set_language",
    description="Switch the site language.",
    properties={"lang": {"type": "string", "enum": ["vi", "en"]}},
    required=["lang"],
)

SET_THEME = FunctionSchema(
    name="set_theme",
    description="Switch the site theme.",
    properties={"theme": {"type": "string", "enum": ["light", "dark"]}},
    required=["theme"],
)

UI_TOOLS = {
    "navigate": NAVIGATE,
    "open_project": OPEN_PROJECT,
    "filter_work": FILTER_WORK,
    "set_language": SET_LANGUAGE,
    "set_theme": SET_THEME,
}


def build_tools_schema() -> ToolsSchema:
    return ToolsSchema(standard_tools=[SEARCH_KB, *UI_TOOLS.values()])


# ---- Handlers ----------------------------------------------------------------


def register_handlers(llm, rtvi: RTVIProcessor, site_origin: str | None = None):
    """Register all tool handlers on the LLM service."""
    origin = site_origin or SITE_ORIGIN_DEFAULT

    async def on_search_kb(params):
        query = params.arguments.get("query", "")
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(f"{origin}/api/kb/search", json={"query": query})
                resp.raise_for_status()
                matches = resp.json().get("matches", [])
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"kb search failed: {exc}")
            matches = []
        # Return concise context for the LLM.
        await params.result_callback({"results": matches[:5]})

    llm.register_function("search_knowledge_base", on_search_kb)

    def make_ui_handler(action: str):
        async def handler(params):
            # Push a server message to the client to drive the UI.
            await rtvi.push_frame(
                RTVIServerMessageFrame(data={"type": "ui", "action": action, "args": params.arguments})
            )
            await params.result_callback({"ok": True})

        return handler

    for name in UI_TOOLS:
        llm.register_function(name, make_ui_handler(name))
