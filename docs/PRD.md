# PRD — hithuc.com (Portfolio solo-builder)

| | |
|---|---|
| **Sản phẩm** | hithuc.com — website portfolio + blog cá nhân cho một solo builder |
| **Chủ sở hữu** | Hi Thực (4440design@gmail.com) |
| **Trạng thái** | Code 4 phase đã merge vào `main`; chờ dựng hạ tầng để go-live |
| **Cập nhật** | 2026-06-19 |
| **Repo** | `mellow-void-studio` (Vite + React 18 + TypeScript + Tailwind v4) |

---

## 1. Tổng quan & Mục tiêu

### 1.1 Vấn đề
Solo builder cần một nơi tập trung, chuyên nghiệp, tối giản để **trưng bày các dự án** (web / app / design), **chia sẻ bài viết**, và tạo điểm nhấn khác biệt bằng **trợ lý AI** có thể trò chuyện và điều hướng website cho khách.

### 1.2 Mục tiêu sản phẩm
1. Portfolio tổng hợp dự án theo 3 nhóm **Web / App / Design**, mỗi dự án có **trang chi tiết** khi click.
2. **Blog** để đăng bài chia sẻ.
3. **CMS + admin đăng nhập** để tự quản lý nội dung (không sửa code/JSON tay).
4. **Chatbot AI** live (voice + text) cho từng khách: có bộ nhớ, RAG theo kiến thức cung cấp, và **điều khiển được website**.
5. **Toàn bộ chạy trên hạ tầng Cloudflare** (ưu tiên cao, có ngoại lệ ở chatbot — xem §6.3).
6. Giữ **thẩm mỹ tối giản (editorial)** hiện có; **song ngữ Việt + Anh**.

### 1.3 Phi mục tiêu (Out of scope)
- Thương mại điện tử / thanh toán.
- Tài khoản người dùng cuối (khách không cần đăng nhập; chỉ admin đăng nhập để quản trị).
- Ứng dụng mobile native (chỉ web responsive).
- Đa ngôn ngữ ngoài vi/en.

---

## 2. Người dùng & Use cases

| Vai trò | Mô tả | Nhu cầu chính |
|---|---|---|
| **Khách / nhà tuyển dụng / client** | Người xem portfolio | Xem nhanh dự án, đọc chi tiết, đọc blog, hỏi trợ lý AI |
| **Chủ sở hữu (admin)** | Hi Thực | Đăng/sửa dự án & bài viết, tải ảnh, cập nhật hồ sơ — qua giao diện admin |

**Use cases tiêu biểu**
- Khách vào `/`, lướt 3 nhóm Web/App/Design → click 1 dự án → đọc trang chi tiết (mô tả, ảnh, stack, link).
- Khách đọc blog `/blog/:slug`.
- Khách mở chatbot, hỏi "có dự án app nào không?" → bot trả lời (RAG) và **điều hướng** tới trang phù hợp.
- Khách chuyển VI ⇄ EN.
- Admin đăng nhập CMS, tạo dự án mới song ngữ, upload ảnh → hiển thị ngay trên site.

---

## 3. Phạm vi tính năng

### 3.1 Portfolio
- Trang chủ `/`: hero tagline + 3 section Web/App/Design (mỗi nhóm tối đa 3 dự án nổi bật + link "Xem tất cả").
- `/work` và `/work/:type` (web|app|design): lưới dự án, lọc theo loại.
- `/project/:slug` — **trang chi tiết**: cover, mô tả markdown, gallery (filmstrip + lightbox), meta (role/year/stack/links), điều hướng prev/next.
- Dữ liệu dự án song ngữ: `title/summary/description {vi,en}`, `tags`, `coverImage`, `gallery[]`, `featured`, `order`.

### 3.2 Blog
- `/blog`: danh sách bài (sắp theo ngày, chỉ `published`).
- `/blog/:slug`: nội dung markdown (render qua `prose`/typography).
- Bài viết song ngữ: `title/excerpt/body {vi,en}`, `cover`, `tags`, `publishedAt`, `status`.

### 3.3 CMS + Admin
- **EmDash** (CMS mã nguồn mở chính chủ Cloudflare, chạy trên Workers + D1 + R2) làm backend nội dung; có sẵn **admin panel + auth + media library + REST API**.
- React SPA đọc nội dung qua **Worker proxy** (`/api/projects`, `/api/posts`, `/api/profile`) — gộp 2 locale về shape `{vi,en}`, cache edge 60s.
- **Fallback**: khi chưa cấu hình EmDash, site đọc `/data/*.json` tĩnh để vẫn chạy.

### 3.4 Chatbot AI
- Widget nổi (lazy-load client nặng khi mở) — **text + voice**.
- **RAG**: truy hồi trên kiến thức (dự án, blog, hồ sơ) bằng embeddings `@cf/baai/bge-m3` → **Vectorize**; reindex theo cron + endpoint có secret.
- **Điều khiển website**: bot phát message điều khiển UI (`navigate`, `setLang`, `setTheme`…) tới client qua `UiControlBridge` — hoạt động ở cả chế độ text lẫn voice.
- **Bộ nhớ**: per-user (Mem0), nhớ xuyên phiên.
- **Bảo mật/giới hạn**: Turnstile → rate-limit theo IP → daily cap (KV) trước khi mở session.

### 3.5 i18n & SEO
- Chuyển ngữ VI ⇄ EN qua `?lang=`, lưu localStorage; mọi nhãn UI song ngữ.
- SEO: `canonical` + `hreflang` (vi/en/x-default), Open Graph + Twitter, JSON-LD (Person/WebSite/CreativeWork/BlogPosting), **sitemap.xml động** (lấy URL dự án/bài viết từ CMS), `robots.txt`.

---

## 4. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
|---|---|
| **Hiệu năng** | LCP < 2.5s, CLS < 0.1; code-split theo route; chat client tách lazy-chunk (~424K) khỏi bundle chính (~352K) |
| **Khả dụng** | Site không chết khi CMS/chatbot chưa cấu hình (fallback tĩnh + 503 graceful) |
| **Truy cập (a11y)** | Điều hướng bàn phím, focus-visible, `aria-*`, tôn trọng reduced-motion |
| **Bảo mật** | Turnstile + rate-limit cho endpoint tốn kém; secrets qua Wrangler/Pipecat; admin auth qua EmDash |
| **Chi phí** | Mục tiêu ~$0 trên nền Workers Paid $5/tháng; chatbot voice phát sinh phí theo dùng |
| **SEO** | Lighthouse SEO 90+, hreflang hợp lệ, sitemap submit được |

---

## 5. Kiến trúc & Công nghệ

```
hithuc.com (Cloudflare DNS/CDN/WAF/Turnstile)
└─ Worker (worker/index.ts) — static assets (SPA) + dispatcher
   ├─ /api/projects|posts|profile → EmDash proxy (worker/content.ts) → EmDash (Workers+D1+R2)
   ├─ /api/kb/search, /api/kb/reindex → bge-m3 + Vectorize (worker/kb.ts)
   ├─ /api/agent/session → Turnstile+rate-limit → Pipecat Cloud (worker/agent.ts)
   └─ /sitemap.xml → sitemap động (worker/sitemap.ts)
Chatbot bot (bot/, Python @ Pipecat Cloud): Daily ⇄ Soniox STT → Gemini 3.1 Flash Lite (tools) → Soniox TTS, Mem0
Frontend: React SPA (Vite) — Portfolio/Blog/About + chat widget (src/components/chat/*)
```

**Stack cốt lõi:** React 18, TypeScript, Tailwind v4, React Router 6, TanStack Query, react-markdown. **Cloudflare:** Workers (static assets), Vectorize, Workers AI (bge-m3), KV, Rate Limiting, Cron, Turnstile. **Bên ngoài (chatbot):** Pipecat Cloud (Daily), Google Gemini, Soniox, Mem0.

---

## 6. Quyết định thiết kế & đánh đổi

### 6.1 CMS: EmDash thay vì tự build
Plan gốc là tự build CMS trên D1+R2. Đã đổi sang **EmDash** vì là CMS chính chủ Cloudflare cũng trên D1+R2 nhưng có sẵn admin/auth/media → ít code tự bảo trì. **Đánh đổi:** EmDash đang beta; chạy như app riêng (`cms.hithuc.com`) → 2 deployment; mapping proxy là phỏng đoán, có thể phải chỉnh khi đấu nối thật.

### 6.2 Chatbot: Pipecat Cloud + Gemini (không phải Realtime Agents + Claude)
Quyết định ban đầu là all-Cloudflare (Realtime Agents) + Claude. PR cuối dùng **Pipecat Cloud + Gemini 3.1 Flash Lite + Soniox + Mem0** (chủ sở hữu duyệt nguyên trạng). **Đánh đổi:** bot chạy **ngoài** Cloudflare (không còn 100% all-CF); Gemini 3.x dính bug function-calling (`thought_signature`) phải workaround — nếu lỗi, **đổi sang Claude trong `bot/bot.py`** (Pipecat hỗ trợ sẵn `AnthropicLLMService`).

### 6.3 "All-Cloudflare" — mức độ đạt được
Phần user-facing (SPA, CMS storage D1/R2, RAG/Vectorize, bảo mật, sitemap) **trên Cloudflare**. Riêng tiến trình chatbot voice chạy ở Pipecat Cloud.

---

## 7. Lộ trình (đã hoàn thành code) & việc còn lại

| Phase | Nội dung | Trạng thái code |
|---|---|---|
| P1 | Portfolio web/app/design + trang chi tiết + i18n nền | ✅ Merged (#1) |
| P2 | CMS EmDash qua proxy + Blog | ✅ Merged (#2) |
| P3 | Chatbot (Pipecat+Gemini+Soniox+Mem0) + RAG + UI control + bảo mật | ✅ Merged (#3) |
| P4 | SEO (canonical/hreflang/JSON-LD) + sitemap động + i18n polish | ✅ Merged (#4) |

### Việc cần làm để go-live (ngoài repo)
1. **CMS:** deploy EmDash → `cms.hithuc.com`; tạo collections `projects`/`posts`/`profile` (i18n vi+en); seed nội dung từ `public/data/*.json`; set `EMDASH_BASE` (+ `EMDASH_TOKEN` nếu cần); chỉnh mapping `worker/content.ts` cho khớp API thật.
2. **Chatbot:** tạo Vectorize index + KV; pin `bot/requirements.txt`; chạy spike Gemini 3.x; deploy bot Pipecat Cloud; set secrets (`GOOGLE_API_KEY`, `SONIOX_API_KEY`, `MEM0_API_KEY`, `SITE_ORIGIN`, `PIPECAT_API_KEY`, `PIPECAT_AGENT`, `TURNSTILE_SECRET`, `KB_REINDEX_SECRET`); chạy reindex KB.
3. **Domain & deploy:** trỏ `hithuc.com` vào Cloudflare; `npm run cf:deploy`; cập nhật thông tin thật (avatar, dự án, link, social).

---

## 8. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| EmDash beta thay đổi API | Trung bình | Pin version; proxy có lớp map phòng thủ + fallback tĩnh |
| Gemini 3.x function-calling lỗi | Cao | `thinking=False`, 1 tool/lượt; spike trước; sẵn sàng đổi Claude |
| Chi phí voice (STT/TTS/LLM) | Trung bình | Turnstile + rate-limit + daily cap; ưu tiên text |
| Lạm dụng endpoint công khai | Trung bình | Turnstile, rate-limit theo IP, secret cho reindex |
| Lệ thuộc nhiều nhà cung cấp (bot) | Trung bình | Tách module Worker; có thể thay từng service |

---

## 9. Tiêu chí thành công
- Khách xem được dự án + chi tiết + blog, chuyển VI/EN mượt; Lighthouse SEO/Perf 90+.
- Admin tự đăng/sửa nội dung qua CMS, không cần dev.
- Chatbot trả lời đúng theo RAG và điều hướng được UI; có giới hạn chống lạm dụng.
- `hithuc.com` chạy ổn định trên Cloudflare với chi phí dự kiến.
