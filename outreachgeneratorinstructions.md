Super Recruiter Outreach Generator — Final Instructions
(Unified System for LinkedIn + Email Outreach)
________________________________________
Overview
This system governs both the LinkedIn Message Generator and Email Outreach Generator.
It defines:
1.	Immutable base templates (anchors).
2.	AI variation logic (1–5) — tone, structure, and length.
3.	Validation + anti-hallucination rules for safe, scalable automation.
________________________________________
Allowed Placeholders
{{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}
No additional placeholders may be introduced.
________________________________________
Formatting Rule
🚫 Do not use Em Dashes (—) anywhere.
Only standard punctuation (hyphens, commas, periods, etc.).
________________________________________
Section 1: LinkedIn Anchor Templates (Immutable)
(≤300 characters each, no recursion)
LinkedIn 1 — Direct & Professional
Hi {{firstname}},
I came across your profile while reviewing candidates for a {{job_opening}} at {{company_name}}.
You look like a strong fit.
What salary range would make you consider a move?
________________________________________
LinkedIn 2 — Skills Focused
Hey {{firstname}},
Your {{skillone}} and {{skilltwo}} experience really caught my eye.
We’re hiring a {{job_opening}} at {{company_name}} that lines up well with your work.
What salary range would make you open to chat?
________________________________________
LinkedIn 3 — Casual & Engaging
Hey {{firstname}},
Love your background, seriously solid.
We’ve got a {{job_opening}} at {{company_name}} that seems right up your alley.
Curious, what salary would get you interested?
________________________________________
Section 2: Email Anchor Templates (Immutable, No Perks)
Email 1 — High-Paying Opening (Baseline)
Subject: (high-paying) {{job_opening}} opening
Hi {{firstname}},
Saw your LinkedIn, looks like you’ve done some great work at {{company_name}}.
We’re hiring a {{job_opening}} with a strong background in {{skillone}} and {{skilltwo}}, and you look like a strong fit.
The role offers a flexible salary around ${{salary}}K with excellent benefits.
Want to see a full job description?
Best,
[Your Name]
________________________________________
Email 2 — Nice LinkedIn (Profile-Driven)
Subject: Nice LinkedIn, {{firstname}}
Hey {{firstname}},
I saw your LinkedIn earlier today - really liked your background.
You look like a great fit for our {{job_opening}} opening at {{company_name}}.
Salary’s around ${{salary}}K with full benefits.
Open to taking a look at the JD?
All the best,
[Your Name]
________________________________________
Email 3 — Salary Focused (Value-Driven)
Subject: {{job_opening}} opportunity — ${{salary}}K+
Hi {{firstname}},
Your background in {{skillone}} and {{skilltwo}} really stood out to me.
We have a {{job_opening}} at {{company_name}} that matches your experience perfectly.
Base salary is ${{salary}}K + benefits.
Interested in checking out the full job description?
Best,
[Your Name]
________________________________________
Email 4 — Short & Sweet (Fast-Response)
Subject: Quick {{job_opening}} note
Hi {{firstname}},
Saw your LinkedIn, great background in {{skillone}} and {{skilltwo}}.
We’ve got a {{job_opening}} at {{company_name}} paying around ${{salary}}K + benefits.
Happy to send the JD if you want to take a look.
Best,
[Your Name]
________________________________________
Email 5 — High-Paying Opportunity (Perks Version of #1)
Subject: (high-paying) {{job_opening}} opportunity
Hi {{firstname}},
Saw your LinkedIn - looks like you’ve done some great work at {{company_name}}.
We’re hiring a {{job_opening}} with experience in {{skillone}} and {{skilltwo}}, and you look like a great fit.
Here’s what’s included:
•	{{perk1}}
•	{{perk2}}
•	{{perk3}}
The role offers a flexible salary around ${{salary}}K with excellent benefits.
Want to see a full job description?
Best,
[Your Name]
________________________________________
Email 6 — Profile-Driven + Perks (Mirror of #2)
Subject: Nice LinkedIn, {{firstname}}
Hey {{firstname}},
I saw your LinkedIn earlier today - really liked your background.
You look perfect for our {{job_opening}} opening at {{company_name}}.
Here’s what comes with it:
•	{{perk1}}
•	{{perk2}}
•	{{perk3}}
Salary is around ${{salary}}K with full benefits.
Open to taking a look at the JD?
All the best,
[Your Name]
________________________________________
Email 7 — Salary-Focused + Perks (Mirror of #3)
Subject: {{job_opening}} role - ${{salary}}K+
Hi {{firstname}},
Your experience with {{skillone}} and {{skilltwo}} really stood out to me.
We have a {{job_opening}} at {{company_name}} that lines up perfectly.
What you’ll get:
•	Competitive pay ${{salary}}K+
•	{{perk1}}
•	{{perk2}}
•	{{perk3}}
Interested in checking out the full job description?
Best,
[Your Name]
________________________________________
Email 8 — Short & Sweet + Perks (Mirror of #4)
Subject: Quick {{job_opening}} note
Hi {{firstname}},
Saw your LinkedIn - great background in {{skillone}} and {{skilltwo}}.
We’ve got a {{job_opening}} at {{company_name}} paying around ${{salary}}K plus benefits.
Quick highlights:
•	{{perk1}}
•	{{perk2}}
•	{{perk3}}
Happy to send the JD if you want to take a look.
Best,
[Your Name]

Section 3: AI Variation Types (Shared Across LinkedIn + Email)
Every output must begin from the chosen base.
Never reuse, edit, or “iterate” on previous outputs.
1️. Longer / More Detailed
Add one brief clause about the role’s scope or impact.
Never describe the company or the candidate personally.
•	LinkedIn: ≤300 chars
•	Email: ≤700 chars
2️. Shorter / More Concise
Tighten wording, remove redundancy.
Keep all meaning intact.
•	LinkedIn: ≤280 chars
•	Email: ≤500 chars
3️. More Casual / Friendly
Use light contractions (“we’re,” “you’re”).
Maintain rhythm variety.
No slang, emojis, or exclamation marks.
•	LinkedIn: 260–280 chars
•	Email: 450–650 chars
4️. More Formal / Polished
Slightly elevated diction (“credentials,” “aligned,” “background”).
Balanced pacing, professional tone.
•	LinkedIn: ≤300 chars
•	Email: ≤700 chars
5️. Different Approach
Reorder flow: candidate → role → closing question.
No new information may be added.
________________________________________
Section 4: Style & Behavior Rules
•	Sentences must have natural rhythm (short + medium, not uniform).
•	Maintain mild unpredictability (“burstiness”) in structure.
•	Avoid recruiter clichés (“impressive background,” “slam dunk,” “amazing opportunity”).
•	Use a single clear question at the end.
•	No colons mid-line unless for bullet formatting in Email.
•	No em dashes (—). Use commas or periods instead.
________________________________________
Section 5: Channel-Specific Hard Rules
LinkedIn
•	Output ≤300 characters including spaces.
•	Final line must contain “salary” or “range.”
•	No links, emojis, hashtags, or titles.
•	Do not infer company culture, product, or perks.
•	Do not assume candidate traits (“leader,” “expert,” “seasoned”).
Email
•	Output ≤700 characters (body only).
•	Final line must contain a reply-inviting question (“salary,” “JD,” “details”).
•	No company invention beyond {{company_name}} and optional single-line blurb.
•	Benefits may be referenced generically (“+ benefits”) only.
•	No speculative candidate traits or performance claims.
________________________________________
Section 6: Anti-Hallucination Policy
AI may not invent, infer, or assume details beyond placeholders.
Permitted: generic role framing (“impactful role,” “key opportunity”).
Forbidden:
•	Company details (mission, funding, culture, perks, locations, awards, etc.)
•	Candidate traits (“leader,” “expert,” “creative,” etc.)
•	Perk or equity specifics, policy details, relocation, PTO, stock terms.
________________________________________
Section 7: System Prompts
LinkedIn System Prompt
You are rewriting a LinkedIn outreach message.
Always start from the stored base template for the selected style.
Never use previous AI outputs as input.
Allowed placeholders: {{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}.
Hard rules:
• ≤300 characters.
• Preserve placeholders exactly.
• End with one salary-related question (must include “salary” or “range”).
• No invented company or candidate details.
• No links, emojis, hashtags, or em dashes.
• Natural rhythm, mixed sentence length, no clichés.
Output only the final message text.
________________________________________
Email System Prompt
You are rewriting an email outreach message.
Always start from the stored base template for the selected style.
Never use previous AI outputs as input.
Allowed placeholders: {{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}.
Hard rules:
• ≤700 characters (body).
• Preserve placeholders exactly.
• End with one reply-inviting question (“salary,” “JD,” or “details”).
• No invented company or candidate details.
• No em dashes.
• Maintain natural rhythm, sentence variety, and clarity.
Output only the final message text.
________________________________________
Section 8: Validation Checklist
All outputs must pass these checks:
✅ Length compliance (LinkedIn ≤300 / Email ≤700)
✅ All placeholders preserved, none renamed
✅ Exactly one question mark, located at the end
✅ Includes at least one of: salary | range | JD | job description | details | spec
✅ No forbidden content (company or candidate hallucinations)
✅ No em dashes
✅ No emojis, hashtags, or titles
✅ No recursion drift (base language intact)
Fail any check → regenerate once.
Fail again → revert to base template.
________________________________________
Section 9: Implementation Summary (for Dev)
1.	Store all base templates under structured keys (LI-1 … EM-4).
2.	Each variation call references the base + selected variation rule.
3.	Add system prompt per channel.
4.	Run post-generation validator:
o	Character count
o	Placeholder integrity
o	Forbidden terms
o	Question check
o	No em dashes
5.	On success → output plain text message.
6.	On failure → regenerate once, else revert to base.
IMPLEMENTATION PSEUDO CODE
// ==============================
// 1) Base Templates (immutable)
// ==============================
const BASE = {
  // LinkedIn (≤300)
  "LI-1": "Hi {{firstname}}, I came across your profile while reviewing candidates for a {{job_opening}} at {{company_name}}. You look like a strong fit. What salary range would make you consider a move?",
  "LI-2": "Hey {{firstname}}, Your {{skillone}} and {{skilltwo}} experience really caught my eye. We’re hiring a {{job_opening}} at {{company_name}} that lines up well with your work. What salary range would make you open to chat?",
  "LI-3": "Hey {{firstname}}, Love your background, seriously solid. We’ve got a {{job_opening}} at {{company_name}} that seems right up your alley. Curious, what salary would get you interested?",

  // Email (≤700, body only)
  "EM-1": "(high-paying) {{job_opening}} opening\n\nHi {{firstname}},\nSaw your LinkedIn, looks like you’ve done some great work at {{company_name}}.\n\nWe’re hiring a {{job_opening}} with a strong background in {{skillone}} and {{skilltwo}}, and you look like a great fit.\n\nThe role offers a flexible salary around ${{salary}}K with excellent benefits.\n\nWant to see a full job description?\n\nBest,\n[Your Name]",
  "EM-2": "Nice LinkedIn, {{firstname}}\n\nHey {{firstname}},\nReally liked your background, I saw your LinkedIn earlier today.\n\nYou look like a great fit for our {{job_opening}} opening at {{company_name}}.\nWe specialize in [1-line company blurb].\n\nSalary’s around ${{salary}}K with full benefits.\n\nOpen to taking a look at the JD?\n\nAll the best,\n[Your Name]",
  "EM-3": "{{job_opening}} opportunity - ${{salary}}K+\n\nHi {{firstname}},\nYour background in {{skillone}} and {{skilltwo}} really stood out.\n\nWe have a {{job_opening}} at {{company_name}} that matches your experience perfectly.\n\nBase salary is ${{salary}}K + benefits.\n\nInterested in checking out the full job description?\n\nBest,\n[Your Name]",
  "EM-4": "Quick {{job_opening}} note\n\nHi {{firstname}},\nSaw your LinkedIn, great background in {{skillone}} and {{skilltwo}}.\n\nWe’ve got a {{job_opening}} at {{company_name}} paying around ${{salary}}K + benefits.\n\nHappy to send the JD if you want to take a look.\n\nBest,\n[Your Name]"
};

// =====================================
// 2) Variation Rules (prompt modifiers)
// =====================================
const VAR_RULE = {
  1: "Longer / More Detailed: add one brief clause about role scope or impact. Do not add company or candidate specifics. Keep natural rhythm.",
  2: "Shorter / More Concise: compress wording and remove redundancy while keeping meaning.",
  3: "More Casual / Friendly: use light contractions and conversational cadence. No slang, no emojis.",
  4: "More Formal / Polished: slightly elevate diction and keep balanced sentences.",
  5: "Different Approach: reorder to candidate -> role -> closing question without adding new info."
};

// =====================================
// 3) System Prompts (per channel)
// =====================================
const SYS_LI = `
You are rewriting a LinkedIn outreach message.
Always start from the stored base template for the selected style. Never use previous AI outputs.
Allowed placeholders: {{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}.
Rules:
- Output <= 300 characters (spaces included).
- Preserve placeholders exactly.
- End with one salary-related question containing "salary" or "range".
- Do not invent company or candidate details.
- Do not use em dashes.
- No links, emojis, or hashtags.
- Natural human rhythm; vary sentence length; avoid clichés.
Output only the final message text.
`.trim();

const SYS_EMAIL = `
You are rewriting an email outreach message.
Always start from the stored base template for the selected style. Never use previous AI outputs.
Allowed placeholders: {{firstname}}, {{job_opening}}, {{company_name}}, {{skillone}}, {{skilltwo}}, {{salary}}.
Rules:
- Output <= 700 characters (body).
- Preserve placeholders exactly.
- End with one reply-inviting question (salary, JD, job description, details, spec).
- Do not invent company or candidate details.
- Do not use em dashes.
- Natural human rhythm; vary sentence length; avoid clichés.
Output only the final message text.
`.trim();

// =====================================
// 4) Forbidden Content & Regex Helpers
// =====================================
const FORBIDDEN_COMPANY = /(mission|funding|investor|series [a-e]|ipo|customers?|client(s)?|award(s)?|press|hq|headquarters|office(s)?|location(s)?|culture|values|perk(s)?|unlimited pto|equity|stock|rsu|bonus|visa|relocation|remote policy)/i;
const FORBIDDEN_CANDIDATE = /(leader|leadership|expert|seasoned|rockstar|ninja|guru|innovative|visionary|world[- ]class|award[- ]winning)/i;
const EXTRA_PLACEHOLDER = /{{(?!firstname|job_opening|company_name|skillone|skilltwo|salary)[^}]+}}/i;
const ANY_PLACEHOLDER = /{{(firstname|job_opening|company_name|skillone|skilltwo|salary)}}/g;
const EM_DASH = /\u2014/; // em dash
const EMOJI = /[\p{Extended_Pictographic}]/u;
const HASHTAG = /#/;

// =====================================
// 5) Core Generate -> Validate -> Retry
// =====================================
function generate({ baseKey, variationType, channel }) {
  const base = BASE[baseKey];
  const sys = channel === "LI" ? SYS_LI : SYS_EMAIL;
  const rule = VAR_RULE[variationType];

  const prompt = [
    sys,
    "",
    "Variation Rule:",
    rule,
    "",
    "Base Message:",
    base
  ].join("\n");

  let out = callLLM(prompt).trim();             // <- your LLM call
  out = normalizeWhitespace(out);

  if (!validate(out, channel)) {
    const retry = callLLM(prompt).trim();
    if (validate(retry, channel)) return finalize(retry, channel);
    return finalize(base, channel);             // fallback to anchor
  }

  return finalize(out, channel);
}

// =====================================
// 6) Validation Pipeline
// =====================================
function validate(text, channel) {
  // no em dashes
  if (EM_DASH.test(text)) return false;

  // no emojis or hashtags (LI rule; for email we keep same to be safe)
  if (EMOJI.test(text) || HASHTAG.test(text)) return false;

  // placeholders preserved; no new placeholders
  if (EXTRA_PLACEHOLDER.test(text)) return false;
  // must contain at least one allowed placeholder (defensive)
  if (!ANY_PLACEHOLDER.test(text)) return false;

  // length caps
  const maxLen = channel === "LI" ? 300 : 700;
  if (countChars(text) > maxLen) return false;

  // forbidden content
  if (FORBIDDEN_COMPANY.test(text) || FORBIDDEN_CANDIDATE.test(text)) return false;

  // ending question requirement
  const trimmed = text.trim();
  if (!trimmed.endsWith("?")) return false;

  // channel-specific required keywords
  if (channel === "LI") {
    if (!/(salary|range)/i.test(trimmed)) return false;
  } else {
    if (!/(salary|range|jd|job description|details|spec)/i.test(trimmed)) return false;
  }

  // lane lock (example heuristic): if base is LI-2 (skills), keep at least one skill placeholder
  // Optional strictness:
  // if (baseKey.startsWith("LI-2") && !/{{skill(one|two)}}/i.test(text)) return false;

  return true;
}

// =====================================
// 7) Finalization & Length Enforcement
// =====================================
function finalize(text, channel) {
  const limit = channel === "LI" ? 300 : 700;
  if (countChars(text) <= limit) return text;

  // Smart trim: cut to limit, then remove trailing partial sentence
  let cut = text.slice(0, limit);
  cut = cut.replace(/[^.?!]*$/, "").trim();
  // ensure it still ends with a question; if not, force a minimal closing ask
  if (!cut.endsWith("?")) {
    const ask = channel === "LI"
      ? " What salary range would make you consider a move?"
      : " Want to see the full job description?";
    const room = limit - countChars(cut);
    if (room > ask.length) cut += ask;
  }
  // Final guard: remove any em dashes that may have slipped (shouldn’t)
  cut = cut.replace(EM_DASH, "-").trim();
  return cut;
}

// =====================================
// 8) Utilities
// =====================================
function callLLM(prompt) {
  // Adapter to your model provider
  // return provider.generate({prompt, temperature: 0.4, max_tokens: ...});
  return "";
}

function normalizeWhitespace(s) {
  return s.replace(/\r/g, "")
          .replace(/[ \t]+\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
}

function countChars(s) {
  return [...s].length; // unicode-safe
}
