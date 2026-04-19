/**
 * Minimal Express API for AI Scout Adventure.
 * POST /api/ask-ai — chat for kids (Groq, OpenAI-compatible API)
 * POST /api/camping-plan — camping prep checklist for a location & dates (Groq)
 * POST /api/verify-mission — vision check (Groq)
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { MISSION_VERIFY } from "./missionVerify.js";
import { CAMPING_PLAN_SYSTEM_PROMPT } from "./campingPlanPrompt.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

const SYSTEM_PROMPT = `إنت "صديق الكشّاف"، مرافق لطيف للصغار (حوالي 10 سنين) في الطبيعة.
القوانين:
- جاوب ديما بالدارجة التونسية الساهلة.
- استعمل جمل قصيرة وكلمات بسيطة.
- كون مشجّع وإيجابي.
- ما تقترحش حاجات خطيرة (تسلّق عالي، لمس حيوانات برية، قرب الماء وحدك، أكل نباتات مجهولة).
- إذا السؤال موش على الطبيعة ولا اللعب البرّا، رجّع الحديث للطبيعة بلطف.
- أقصى حاجة 4 جمل قصار إلا إذا الطفل طلب قائمة.`;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "12mb" }));

const apiKey = process.env.GROQ_API_KEY?.trim();
/** Groq uses the OpenAI-compatible REST surface */
const groq = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const chatModel = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
const visionModel =
  process.env.GROQ_VISION_MODEL?.trim() || "meta-llama/llama-4-scout-17b-16e-instruct";

function parseJsonLoose(raw) {
  const t = String(raw || "").trim();
  const stripped = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(stripped);
}

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Kids camping plan: { bullets: [{ icon, text }] } */
function normalizeCampingBullets(parsed) {
  const raw = parsed?.bullets;
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const text = typeof item.text === "string" ? item.text.trim().slice(0, 140) : "";
    if (!text) continue;
    let icon = typeof item.icon === "string" ? item.icon.trim() : "";
    if (!icon) icon = "⭐";
    else icon = icon.slice(0, 12);
    out.push({ icon, text });
    if (out.length >= 14) break;
  }
  if (out.length < 5) return null;
  return out;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(apiKey), provider: "groq" });
});

app.post("/api/ask-ai", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!text) {
    return res.status(400).json({ error: "إبعث نص في خانة text." });
  }

  if (!groq) {
    return res.status(503).json({
      error:
        "مساعد الذكاء موش مفعّل. لازم كبير يضيف GROQ_API_KEY في server/.env (https://console.groq.com/keys).",
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: chatModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text.slice(0, 8000) },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "سامحني، ما توضّحتليش. عاود إسألني!";

    res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err?.message || err);
    res.status(502).json({
      error: "صار مشكل صغير في مخّ الطبيعة. عاود بعد شوية.",
    });
  }
});

app.post("/api/camping-plan", async (req, res) => {
  const location =
    typeof req.body?.location === "string" ? req.body.location.trim().slice(0, 500) : "";
  const timePeriod =
    typeof req.body?.timePeriod === "string" ? req.body.timePeriod.trim().slice(0, 500) : "";

  if (!location || !timePeriod) {
    return res.status(400).json({
      error: "أرسل الحقلين: المكان (location) والفترة الزمنية (timePeriod) كنصّين (حد أقصى 500 حرف لكل منهما).",
    });
  }

  if (!groq) {
    return res.status(503).json({
      error:
        "مخطّط التخييم غير مفعّل. اطلب من المسؤول إضافة GROQ_API_KEY في ملف server/.env (https://console.groq.com/keys).",
    });
  }

  const userMessage = `المكان: ${location}\nالفترة الزمنية: ${timePeriod}`;

  try {
    const completion = await groq.chat.completions.create({
      model: chatModel,
      messages: [
        { role: "system", content: CAMPING_PLAN_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 900,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      return res.status(502).json({
        error: "الإجابة كانت غير واضحة. اضغط مرة أخرى!",
      });
    }

    const bullets = normalizeCampingBullets(parsed);
    if (!bullets) {
      return res.status(502).json({
        error: "لم نستطع عمل القائمة. جرّب تاني!",
      });
    }

    res.json({ bullets });
  } catch (err) {
    console.error("Groq camping-plan error:", err?.message || err);
    res.status(502).json({
      error: "تعذّر إنشاء الخطة الآن. حاول بعد قليل.",
    });
  }
});

app.post("/api/verify-mission", async (req, res) => {
  const missionId = typeof req.body?.missionId === "string" ? req.body.missionId.trim() : "";
  const missionTarget =
    typeof req.body?.missionTarget === "string" ? req.body.missionTarget.trim().slice(0, 160) : "";
  const imageBase64 =
    typeof req.body?.imageBase64 === "string" ? req.body.imageBase64.trim() : "";
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.startsWith("image/")
      ? req.body.mimeType
      : "image/jpeg";

  if (!missionId || !imageBase64) {
    return res.status(400).json({ error: "إبعث missionId و imageBase64 (JPEG base64 بلا data:)." });
  }

  const spec = MISSION_VERIFY[missionId];
  if (!spec) {
    return res.status(400).json({ error: "المهمّة هاذي موش معروفة. حدّث الصفحة وعاود." });
  }

  if (imageBase64.length > 10_000_000) {
    return res.status(400).json({ error: "التصويرة كبيرة برشا. صوّر من قريب شوية وعاود." });
  }

  if (!groq) {
    return res.status(503).json({
      error:
        "التحقق بالتصويرة موش مفعّل. لازم كبير يضيف GROQ_API_KEY في server/.env (https://console.groq.com/keys).",
    });
  }

  const claimedTarget = missionTarget || spec.title;

  const judgePrompt = `إنت تتحقّق من تصويرة وحدة لمهمّة طبيعة متاع طفل.

عنوان المهمّة: "${spec.title}"
الهدف إلي الطفل قال عليه: "${claimedTarget}"
قواعد النجاح أو الفشل:
${spec.checklist}

نجّح كان إذا التصويرة تطابق الهدف والقواعد بوضوح.
كون عادل مع الصغار: إذا قريبة وواضحة وبنية باهية، نجّحها.
إذا التصويرة فارغة، مغبشة وما فيها حتى شي، ميم عشوائي، ولا موش نفس المهمّة، خوّذها فشل.

جاوب بـ JSON فقط (بلا markdown) بالشكل هذا:
{"pass":true or false,"message":"جملة قصيرة ولطيفة لطفل عمره 10 سنين بالدارجة التونسية."}`;

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  try {
    const completion = await groq.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: judgePrompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 256,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      return res.status(502).json({
        pass: false,
        message: "التحقّق تخلّط شوية. جرّب تصويرة أوضح!",
      });
    }

    const pass = Boolean(parsed.pass);
    const message =
      typeof parsed.message === "string" && parsed.message.trim()
        ? parsed.message.trim().slice(0, 400)
        : pass
          ? "يعطيك الصحة! المهمّة نجحت."
          : "التصويرة ما تطابقش المهمّة برشا. جرّب وحدة أخرى.";

    res.json({ pass, message });
  } catch (err) {
    console.error("Groq vision error:", err?.message || err);
    res.status(502).json({
      pass: false,
      message: "فشل التحقّق من التصويرة. عاود بعد شوية!",
    });
  }
});

app.post("/api/identify-item", async (req, res) => {
  const imageBase64 =
    typeof req.body?.imageBase64 === "string" ? req.body.imageBase64.trim() : "";
  const mimeType =
    typeof req.body?.mimeType === "string" && req.body.mimeType.startsWith("image/")
      ? req.body.mimeType
      : "image/jpeg";

  if (!imageBase64) {
    return res.status(400).json({
      error: "إبعث imageBase64 (JPEG base64 بلا data:).",
    });
  }

  if (imageBase64.length > 10_000_000) {
    return res.status(400).json({
      error: "التصويرة كبيرة برشا. قرّب وصوّر أوضح.",
    });
  }

  if (!groq) {
    return res.status(503).json({
      error:
        "ميزة التعريف بالتصويرة موش مفعّلة. لازم كبير يضيف GROQ_API_KEY في server/.env (https://console.groq.com/keys).",
    });
  }

  const prompt = `إنت مساعد تعريف بصري مختص في النباتات، الفطر، والماكولات.

المستخدم باش يبعثلك تصويرة وحدة.

المطلوب منك:
1) تعرّف شنية الحاجة (نبتة، فطر، غلة، ماكولة...)
2) أعطي أكثر إسم شائع محتمل
3) وصف قصير
4) قيّم خطر السلامة:
- SAFE (ماكول معروف غالباً صالح)
- UNKNOWN (ما نجموش نأكدوا السلامة)
- DANGEROUS (غالباً سام/خطر)

قوانين لازمك تتبعها:
- ما تقولش 100% يقين للنباتات أو الفطر البري.
- إذا موش متأكد، إختار UNKNOWN.
- السلامة أهم من الدقة.
- ديما نبه المستخدم: ما ياكلش حاجات برية مجهولة.

رجّع JSON فقط (بلا markdown) بالشكل هذا:
{"name":"string","description":"string","safetyLevel":"SAFE|UNKNOWN|DANGEROUS","warning":"string","confidence":0}

خلي name و description و warning بالدارجة التونسية.
confidence لازم عدد صحيح من 0 إلى 100.`;

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  try {
    const completion = await groq.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 350,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = parseJsonLoose(raw);
    } catch {
      return res.status(502).json({
        error: "التعريف تخلّط شوية. جرّب تصويرة أوضح.",
      });
    }

    const safetyRaw = String(parsed?.safetyLevel || "").toUpperCase();
    const safetyLevel = ["SAFE", "UNKNOWN", "DANGEROUS"].includes(safetyRaw)
      ? safetyRaw
      : "UNKNOWN";

    const name =
      typeof parsed?.name === "string" && parsed.name.trim()
        ? parsed.name.trim().slice(0, 160)
        : "حاجة موش واضحة";

    const description =
      typeof parsed?.description === "string" && parsed.description.trim()
        ? parsed.description.trim().slice(0, 400)
        : "ما نجمنّاش نحددوها بوضوح من التصويرة.";

    const warning =
      typeof parsed?.warning === "string" && parsed.warning.trim()
        ? parsed.warning.trim().slice(0, 300)
        : "ما تاكلش نباتات ولا فطر بري مجهول.";

    const confidence = clampConfidence(parsed?.confidence);

    res.json({ name, description, safetyLevel, warning, confidence });
  } catch (err) {
    console.error("Groq identify-item error:", err?.message || err);
    res.status(502).json({
      error: "فشل تحليل التصويرة. عاود بعد شوية.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Scout server (Groq) listening on http://localhost:${PORT}`);
});
