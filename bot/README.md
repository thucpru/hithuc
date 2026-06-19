# hithuc-bot — Pipecat Cloud agent

Voice + text chatbot for hithuc.com. Pipeline: Daily ⇄ Soniox STT → Gemini 3.1
Flash Lite (tools) → Soniox TTS. RAG + UI control via the site Worker.

## Files
- `bot.py` — pipeline + Pipecat Cloud `bot()` entrypoint.
- `tools.py` — `search_knowledge_base` (RAG) + UI action tools.
- `requirements.txt`, `Dockerfile`, `pcc-deploy.toml`.

## Secrets (set in Pipecat Cloud)
```
GOOGLE_API_KEY     # Gemini
SONIOX_API_KEY     # STT + TTS
MEM0_API_KEY       # conversation memory (when enabled)
SITE_ORIGIN        # https://hithuc.com  (where /api/kb/search lives)
```

## Deploy
```bash
pip install pipecatcloud
pipecat cloud auth login

# build & push image (matches pcc-deploy.toml image)
docker build --platform linux/arm64 -t YOUR_USER/hithuc-bot:0.1 .
docker push YOUR_USER/hithuc-bot:0.1

# create secret set from the keys above, then deploy
pipecat cloud secrets set hithuc-bot-secrets --file ./.env
pipecat cloud deploy
```
The Worker's `/api/agent/session` starts a session via
`POST https://api.pipecat.daily.co/v1/public/hithuc-bot/start`
(`PIPECAT_API_KEY` = your Pipecat Cloud **public** API key).

## ⚠️ Verify first — Gemini function calling
Before relying on UI control / RAG, run a minimal function-calling spike with the
pinned `pipecat-ai`. Gemini 3.x + function calling has known `thought_signature`
400 errors (pipecat #3557 / #3290); `thinking=False` + one tool/turn is the
current mitigation. Bump the pin if a newer release fixes it.

## Local run
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Pipecat Cloud provides Daily args in production; for local dev use the
# pipecat dev runner against a local Daily room.
```
