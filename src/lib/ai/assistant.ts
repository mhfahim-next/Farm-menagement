import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { FarmContext } from "@/lib/auth";
import { animalLabel } from "@/lib/cattle";
import { today } from "@/lib/format";
import type { I18n } from "@/lib/i18n/core";
import type { ChatTurn, Proposal, ProposalKind } from "./types";

/**
 * The cheapest current Claude model; plenty for turning a sentence into a
 * record. Override with AI_MODEL if you want to try another one.
 */
export const AI_MODEL = process.env.AI_MODEL || "claude-haiku-5-5";

const MAX_TOOL_ROUNDS = 4;
const MAX_INPUT_CHARS = 1000;

type Ctx = Pick<FarmContext, "supabase" | "farm"> & { i18n: I18n };

// ---------------------------------------------------------------------------
// Tools: every write tool only *prepares* a proposal. Nothing is saved until
// the farmer presses Confirm, and then the normal server action runs.
// ---------------------------------------------------------------------------

const str = (description: string) => ({ type: "string" as const, description });
const num = (description: string) => ({ type: "number" as const, description });

function tools(i18n: I18n): Anthropic.Tool[] {
  const vals = (list: Parameters<I18n["options"]>[0]) => i18n.options(list).map((o) => o.value);
  return [
    {
      name: "find_animals",
      description: "Search the farm's active cattle by tag number or name. Use it when the user's tag/name is unclear.",
      input_schema: { type: "object", properties: { query: str("Tag number or part of a name") }, required: ["query"] },
    },
    {
      name: "record_milk",
      description: "Prepare a milk record for one milking session (one or more cows). The user must confirm before it is saved.",
      input_schema: {
        type: "object",
        properties: {
          session: { type: "string", enum: vals("milk_session"), description: "Milking session" },
          date: str("YYYY-MM-DD, default today"),
          entries: {
            type: "array",
            items: {
              type: "object",
              properties: { tag: str("Cow tag number"), liters: num("Litres of milk"), fat_percent: num("Fat %, optional") },
              required: ["tag", "liters"],
            },
          },
        },
        required: ["session", "entries"],
      },
    },
    {
      name: "record_health",
      description: "Prepare a vaccine / deworming / pest control / treatment / check-up record for one or more animals.",
      input_schema: {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" }, description: "Tag numbers of the animals" },
          record_type: { type: "string", enum: vals("health_type") },
          product: str("Vaccine, medicine or pesticide name, e.g. FMD"),
          date: str("YYYY-MM-DD, default today"),
          interval_days: num("Repeat after this many days, if it repeats"),
          dose: str("Dose, optional"),
          cost: num("Cost per animal, optional"),
          notes: str("Notes, optional"),
        },
        required: ["tags", "record_type", "product"],
      },
    },
    {
      name: "record_breeding",
      description: "Prepare a breeding event (heat seen, insemination/AI, pregnancy check, calving, dry-off) for one cow.",
      input_schema: {
        type: "object",
        properties: {
          tag: str("Cow tag number"),
          event_type: { type: "string", enum: vals("breeding_event") },
          date: str("YYYY-MM-DD, default today"),
          time: str("HH:MM 24-hour, optional"),
          bull_or_semen: str("Bull or semen straw, for insemination"),
          technician: str("Technician or vet name"),
          result: { type: "string", enum: vals("pregnancy_result"), description: "Only for pregnancy_check" },
          heat_signs: { type: "array", items: { type: "string", enum: vals("heat_sign") }, description: "Only for heat" },
          calf_tag: str("Tag for the newborn calf, only for calving"),
          calf_name: str("Calf name, optional"),
          notes: str("Notes, optional"),
        },
        required: ["tag", "event_type"],
      },
    },
    {
      name: "add_animal",
      description: "Prepare adding a new animal to the herd.",
      input_schema: {
        type: "object",
        properties: {
          tag: str("Tag number"),
          name: str("Name, optional"),
          category: { type: "string", enum: vals("cattle_category"), description: "Animal type" },
          breed: { type: "string", enum: vals("cattle_breed"), description: "Breed, optional" },
          date_of_birth: str("YYYY-MM-DD, optional"),
          mother_tag: str("Tag of the mother in this farm, optional"),
          father: str("Father (bull name or straw number), optional"),
          notes: str("Notes, optional"),
        },
        required: ["tag", "category"],
      },
    },
    {
      name: "record_flock_log",
      description: "Prepare a daily layer-flock log (eggs, deaths, feed).",
      input_schema: {
        type: "object",
        properties: {
          flock: str("Flock name; may be omitted when the farm has a single active flock"),
          date: str("YYYY-MM-DD, default today"),
          eggs_collected: num("Eggs collected"),
          eggs_broken: num("Broken eggs"),
          mortality: num("Birds that died"),
          culled: num("Birds culled"),
          feed_kg: num("Feed in kg"),
          water_liters: num("Water in litres"),
          notes: str("Notes, optional"),
        },
      },
    },
    {
      name: "record_transaction",
      description: "Prepare an income or expense entry.",
      input_schema: {
        type: "object",
        properties: {
          txn_type: { type: "string", enum: vals("txn_type") },
          category: { type: "string", enum: vals("finance_category"), description: "Must match the type (income vs expense)" },
          amount: num("Amount in the farm currency"),
          module: { type: "string", enum: vals("txn_module"), description: "dairy, layer or general" },
          date: str("YYYY-MM-DD, default today"),
          description: str("Short note, optional"),
        },
        required: ["txn_type", "category", "amount"],
      },
    },
  ];
}

type Input = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

class ToolError extends Error {}

async function animalsByTag(ctx: Ctx, tags: string[]) {
  const clean = [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 60);
  if (clean.length === 0) throw new ToolError("No tag numbers were given. Ask the user which animals.");
  const { data } = await ctx.supabase
    .from("cattle")
    .select("id, tag_number, name, sex, category")
    .eq("farm_id", ctx.farm.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .in("tag_number", clean);
  const found = data ?? [];
  const missing = clean.filter((t) => !found.some((a) => a.tag_number.toLowerCase() === t.toLowerCase()));
  if (missing.length) {
    throw new ToolError(
      `No active animal with tag ${missing.join(", ")} on this farm. Ask the user to check the tag (use find_animals to look for similar ones). Do not guess.`,
    );
  }
  return clean.map((t) => found.find((a) => a.tag_number.toLowerCase() === t.toLowerCase())!);
}

function dateOf(v: unknown) {
  const d = s(v);
  if (!d) return today();
  if (!DATE.test(d)) throw new ToolError(`Invalid date "${d}"; use YYYY-MM-DD.`);
  return d;
}

function oneOf(ctx: Ctx, list: Parameters<I18n["options"]>[0], v: unknown, what: string) {
  const value = s(v);
  if (!value || !ctx.i18n.options(list).some((o) => o.value === value)) {
    throw new ToolError(`Invalid ${what}. Allowed: ${ctx.i18n.options(list).map((o) => o.value).join(", ")}.`);
  }
  return value;
}

let counter = 0;
const pid = () => `p${Date.now().toString(36)}${(counter++).toString(36)}`;

/** Builds a proposal for a write tool, or throws ToolError with a message for the model. */
async function propose(ctx: Ctx, name: string, input: Input): Promise<Proposal> {
  const { t, f, o } = ctx.i18n;
  const cur = ctx.farm.currency;

  if (name === "record_milk") {
    const session = oneOf(ctx, "milk_session", input.session, "session");
    const date = dateOf(input.date);
    const entries = Array.isArray(input.entries) ? (input.entries as Input[]) : [];
    if (entries.length === 0) throw new ToolError("No cows or litres were given.");
    const animals = await animalsByTag(ctx, entries.map((e) => String(e.tag ?? "")));
    const fields: [string, string][] = [["record_date", date], ["session", session]];
    const lines: string[] = [];
    let total = 0;
    entries.forEach((e, i) => {
      const liters = n(e.liters);
      if (liters === null || liters < 0) throw new ToolError(`Invalid litres for tag ${String(e.tag)}.`);
      const a = animals[i];
      fields.push([`qty_${a.id}`, String(liters)]);
      const fat = n(e.fat_percent);
      if (fat !== null) fields.push([`fat_${a.id}`, String(fat)]);
      total += liters;
      lines.push(`${animalLabel(a)}: ${t("common.litersShort", { n: f.number(liters, 1) })}${fat !== null ? ` · ${f.number(fat, 1)}%` : ""}`);
    });
    return { id: pid(), kind: "milk", title: t("ai.p.milk", { session: o("milk_session", session), date: f.date(date), n: entries.length, l: f.number(total, 1) }), lines, fields };
  }

  if (name === "record_health") {
    const tags = Array.isArray(input.tags) ? (input.tags as unknown[]).map(String) : [];
    const animals = await animalsByTag(ctx, tags);
    const type = oneOf(ctx, "health_type", input.record_type, "record_type");
    const product = s(input.product);
    if (!product) throw new ToolError("The vaccine/medicine name is missing. Ask the user.");
    const date = dateOf(input.date);
    const fields: [string, string][] = [["record_type", type], ["product", product], ["record_date", date]];
    for (const a of animals) fields.push(["cattle_id", a.id]);
    const interval = n(input.interval_days);
    if (interval !== null) fields.push(["interval_days", String(Math.round(interval))]);
    const dose = s(input.dose); if (dose) fields.push(["dose", dose]);
    const cost = n(input.cost); if (cost !== null) fields.push(["cost", String(cost)]);
    const notes = s(input.notes); if (notes) fields.push(["description", notes]);
    return {
      id: pid(), kind: "health",
      title: t("ai.p.health", { type: o("health_type", type), product, date: f.date(date), n: animals.length }),
      lines: [animals.map(animalLabel).join(", "), ...(interval !== null ? [t("ai.p.repeat", { n: Math.round(interval) })] : []), ...(cost !== null ? [f.money(cost, cur)] : [])],
      fields,
    };
  }

  if (name === "record_breeding") {
    const [cow] = await animalsByTag(ctx, [String(input.tag ?? "")]);
    if (cow.sex !== "female") throw new ToolError(`${animalLabel(cow)} is not female; breeding events are for cows and heifers.`);
    const type = oneOf(ctx, "breeding_event", input.event_type, "event_type");
    const date = dateOf(input.date);
    const fields: [string, string][] = [["cattle_id", cow.id], ["event_type", type], ["event_date", date]];
    const time = s(input.time);
    if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) fields.push(["event_time", time]);
    const lines: string[] = [animalLabel(cow)];
    if (type === "insemination") {
      const bull = s(input.bull_or_semen); if (bull) { fields.push(["bull_or_semen", bull]); lines.push(bull); }
    }
    if (type === "pregnancy_check") {
      const result = oneOf(ctx, "pregnancy_result", input.result, "pregnancy result");
      fields.push(["result", result]); lines.push(o("pregnancy_result", result));
    }
    if (type === "heat" && Array.isArray(input.heat_signs)) {
      for (const sg of input.heat_signs as unknown[]) if (typeof sg === "string") fields.push(["heat_sign", sg]);
    }
    const tech = s(input.technician); if (tech) { fields.push(["technician", tech]); lines.push(t("breeding.by", { name: tech })); }
    if (type === "calving") {
      const calf = s(input.calf_tag);
      if (calf) {
        fields.push(["calf_tag", calf]); lines.push(t("ai.p.calf", { tag: calf }));
        const cn = s(input.calf_name); if (cn) fields.push(["calf_name", cn]);
      }
    }
    const notes = s(input.notes); if (notes) fields.push(["notes", notes]);
    return { id: pid(), kind: "breeding", title: t("ai.p.breeding", { event: o("breeding_event", type), date: f.date(date) }), lines, fields };
  }

  if (name === "add_animal") {
    const tag = s(input.tag);
    if (!tag) throw new ToolError("The tag number is missing. Ask the user.");
    const category = oneOf(ctx, "cattle_category", input.category, "category");
    const fields: [string, string][] = [["tag_number", tag], ["category", category]];
    const lines: string[] = [o("cattle_category", category)];
    const nm = s(input.name); if (nm) { fields.push(["name", nm]); lines.unshift(nm); }
    const breed = s(input.breed); if (breed) { fields.push(["breed", breed]); lines.push(o("cattle_breed", breed)); }
    const dob = s(input.date_of_birth); if (dob && DATE.test(dob)) { fields.push(["date_of_birth", dob]); lines.push(f.date(dob)); }
    const mt = s(input.mother_tag);
    if (mt) {
      const [mother] = await animalsByTag(ctx, [mt]);
      fields.push(["mother_id", mother.id]); lines.push(`${t("cattle.mother")}: ${animalLabel(mother)}`);
    }
    const fa = s(input.father); if (fa) { fields.push(["father", fa]); lines.push(`${t("cattle.father")}: ${fa}`); }
    const notes = s(input.notes); if (notes) fields.push(["notes", notes]);
    return { id: pid(), kind: "animal", title: t("ai.p.animal", { tag }), lines, fields };
  }

  if (name === "record_flock_log") {
    const { data: flocks } = await ctx.supabase.from("flocks").select("id, name").eq("farm_id", ctx.farm.id).eq("status", "active").is("deleted_at", null);
    const list = flocks ?? [];
    if (list.length === 0) throw new ToolError("This farm has no active layer flock.");
    const want = s(input.flock)?.toLowerCase();
    const flock = want ? list.find((x) => x.name.toLowerCase() === want) ?? list.find((x) => x.name.toLowerCase().includes(want)) : list.length === 1 ? list[0] : undefined;
    if (!flock) throw new ToolError(`Which flock? Active flocks: ${list.map((x) => x.name).join(", ")}.`);
    const date = dateOf(input.date);
    const fields: [string, string][] = [["flock_id", flock.id], ["log_date", date]];
    const lines: string[] = [flock.name];
    const add = (key: string, label: Parameters<I18n["t"]>[0], v: unknown) => {
      const x = n(v);
      if (x !== null && x >= 0) { fields.push([key, String(x)]); lines.push(`${t(label)}: ${f.number(x, 1)}`); }
    };
    add("eggs_collected", "ai.f.eggs", input.eggs_collected);
    add("eggs_broken", "ai.f.broken", input.eggs_broken);
    add("mortality", "ai.f.deaths", input.mortality);
    add("culled", "ai.f.culled", input.culled);
    add("feed_kg", "ai.f.feed", input.feed_kg);
    add("water_liters", "ai.f.water", input.water_liters);
    if (fields.length <= 2) throw new ToolError("No numbers were given for the log. Ask the user.");
    const notes = s(input.notes); if (notes) fields.push(["notes", notes]);
    return { id: pid(), kind: "flock_log", title: t("ai.p.flock", { flock: flock.name, date: f.date(date) }), lines, fields };
  }

  if (name === "record_transaction") {
    const type = oneOf(ctx, "txn_type", input.txn_type, "txn_type");
    const category = oneOf(ctx, "finance_category", input.category, "category");
    const meta = ctx.i18n.rows("finance_category").find((r) => r.value === category)?.meta;
    if (meta?.txn_type && meta.txn_type !== type) throw new ToolError(`Category ${category} belongs to ${meta.txn_type}, not ${type}. Pick a matching category.`);
    const amount = n(input.amount);
    if (amount === null || amount <= 0) throw new ToolError("The amount must be greater than zero.");
    const txnModule = input.module ? oneOf(ctx, "txn_module", input.module, "module") : "general";
    const date = dateOf(input.date);
    const fields: [string, string][] = [["txn_type", type], ["category", category], ["amount", String(amount)], ["module", txnModule], ["txn_date", date]];
    const desc = s(input.description); if (desc) fields.push(["description", desc]);
    return {
      id: pid(), kind: "transaction",
      title: t("ai.p.txn", { type: o("txn_type", type), amount: f.money(amount, cur), category: o("finance_category", category) }),
      lines: [f.date(date), ...(desc ? [desc] : [])],
      fields,
    };
  }

  throw new ToolError(`Unknown tool ${name}.`);
}

async function findAnimals(ctx: Ctx, query: string) {
  const term = query.replace(/[%,()"\\*]/g, "").trim();
  if (!term) return "No query.";
  const { data } = await ctx.supabase
    .from("cattle")
    .select("tag_number, name, category")
    .eq("farm_id", ctx.farm.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .or(`tag_number.ilike.%${term}%,name.ilike.%${term}%`)
    .order("tag_number")
    .limit(10);
  if (!data?.length) return "No matching active animals.";
  return data.map((a) => `${a.tag_number}${a.name ? " · " + a.name : ""} (${a.category})`).join("\n");
}

// ---------------------------------------------------------------------------

function systemPrompt(ctx: Ctx) {
  const { i18n, farm } = ctx;
  const lists = (label: string, list: Parameters<I18n["options"]>[0]) =>
    `- ${label}: ${i18n.options(list).map((o) => `${o.value} (${o.label})`).join(", ")}`;
  return `You are the FarmFlow assistant for "${farm.name}", a cattle/dairy and layer-poultry farm in Bangladesh. You help farm staff enter records by chat.

Today is ${today()}. Currency: ${farm.currency}. The user's app language is ${i18n.locale === "bn" ? "Bangla" : "English"}; reply in the language the user writes in (Bangla if they write Bangla, including Banglish).

How you work:
- When the user describes something to record, call the matching tool right away with what they said. Tools only PREPARE the record; the user must press Confirm in the app. Never say it is saved.
- After preparing, reply in one or two short sentences saying what you prepared and asking them to check and confirm.
- If something essential is missing or ambiguous (which cow, how many litres, which flock), ask one short question instead of guessing. Never invent tag numbers, names or amounts.
- If a tool returns an error, explain it simply and ask the user to correct it.
- Several records in one message are fine: call several tools.
- You cannot delete or edit existing records; tell the user to use the normal pages for that.
- Only help with this farm's records and farm-management questions; politely decline anything else.
- Keep replies short and plain; no markdown tables.

Allowed values:
${lists("milk session", "milk_session")}
${lists("health record type", "health_type")}
${lists("breeding event", "breeding_event")}
${lists("pregnancy result", "pregnancy_result")}
${lists("animal type", "cattle_category")}
${lists("finance category", "finance_category")}
${lists("finance module", "txn_module")}
Tag numbers are written as the farm wrote them (for example 001 or C-12). Bangla digits (০১২৩) mean the same as 0123.`;
}

export type AssistantOutput = {
  reply: string;
  proposals: Proposal[];
  inputTokens: number;
  outputTokens: number;
};

/**
 * Runs one user message through Claude with the farm tools. Returns the
 * assistant's text and any records it prepared (not saved).
 */
export async function runAssistant(ctx: Ctx, history: ChatTurn[], text: string): Promise<AssistantOutput> {
  const client = new Anthropic({ maxRetries: 1, timeout: 45_000 });

  const messages: Anthropic.MessageParam[] = [];
  for (const turn of history.slice(-12)) {
    const content = turn.text.slice(0, 2000).trim();
    if (!content) continue;
    const last = messages.at(-1);
    if (last && last.role === turn.role) last.content = `${last.content as string}\n${content}`;
    else messages.push({ role: turn.role, content });
  }
  // The conversation must start with the user.
  while (messages.length && messages[0].role !== "user") messages.shift();
  const clean = text.slice(0, MAX_INPUT_CHARS).trim();
  const lastMsg = messages.at(-1);
  if (lastMsg && lastMsg.role === "user") lastMsg.content = `${lastMsg.content as string}\n${clean}`;
  else messages.push({ role: "user", content: clean });

  const system = systemPrompt(ctx);
  const toolDefs = tools(ctx.i18n);
  const proposals: Proposal[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let reply = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system,
      tools: toolDefs,
      messages,
      output_config: { effort: "low" },
    });
    inputTokens += res.usage.input_tokens;
    outputTokens += res.usage.output_tokens;

    reply = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const uses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || uses.length === 0) break;

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const use of uses) {
      const input = (use.input ?? {}) as Input;
      try {
        if (use.name === "find_animals") {
          results.push({ type: "tool_result", tool_use_id: use.id, content: await findAnimals(ctx, String(input.query ?? "")) });
        } else {
          const p = await propose(ctx, use.name, input);
          proposals.push(p);
          results.push({ type: "tool_result", tool_use_id: use.id, content: "Prepared for the user to confirm. NOT saved yet. Tell the user briefly and ask them to confirm." });
        }
      } catch (e) {
        const message = e instanceof ToolError ? e.message : "Could not prepare this record.";
        if (!(e instanceof ToolError)) console.error("AI tool failed:", e);
        results.push({ type: "tool_result", tool_use_id: use.id, content: message, is_error: true });
      }
    }
    messages.push({ role: "assistant", content: res.content });
    messages.push({ role: "user", content: results });
  }

  return { reply, proposals, inputTokens, outputTokens };
}

export const PROPOSAL_ACTIONS: Record<ProposalKind, true> = {
  milk: true, health: true, breeding: true, animal: true, flock_log: true, transaction: true,
};
