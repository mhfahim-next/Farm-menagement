import { strict as assert } from "node:assert";
import { test } from "node:test";
import { DISEASE_SPECIES, DISEASES, diseaseBySlug, matchDiseases, SYMPTOMS, symptomsFor, type SymptomId } from "../../src/lib/diseases.ts";

test("every disease is complete in both languages, with signs the checker asks about for its species", () => {
  const slugs = new Set<string>();
  for (const d of DISEASES) {
    assert.ok(/^[a-z0-9-]+$/.test(d.slug) && !slugs.has(d.slug), `slug ${d.slug}`);
    slugs.add(d.slug);
    for (const text of [d.name, d.summary, ...d.signs, ...d.todo, ...d.prevent]) assert.ok(text.en.trim() && text.bn.trim(), `${d.slug} text`);
    assert.ok(d.signs.length && d.todo.length && d.prevent.length, `${d.slug} sections`);
    for (const s of d.symptoms) {
      assert.ok(s in SYMPTOMS, `${d.slug}: ${s}`);
      for (const sp of d.species) assert.ok((SYMPTOMS[s].species as string[]).includes(sp), `${d.slug}: ${s} not asked for ${sp}`);
    }
  }
  for (const sp of DISEASE_SPECIES) assert.ok(symptomsFor(sp).length >= 10);
});

test("checker: the disease that fits best comes first", () => {
  const fmd = matchDiseases("cattle", ["drooling", "mouth_sores", "hoof_sores", "lame"]);
  assert.equal(fmd[0].disease.slug, "foot-and-mouth-disease");
  assert.equal(matchDiseases("cattle", ["udder_swollen", "milk_clots"])[0].disease.slug, "mastitis");
  assert.equal(matchDiseases("cattle", ["red_urine", "ticks"])[0].disease.slug, "tick-fever-babesiosis");
  assert.equal(matchDiseases("poultry", ["twisted_neck", "green_dung"])[0].disease.slug, "newcastle-disease");
  assert.equal(matchDiseases("goat", ["nasal_discharge", "mouth_sores", "diarrhoea"])[0].disease.slug, "ppr");
  // Only diseases of that species, at most 5, none without a match.
  const many = matchDiseases("poultry", ["sudden_death", "dull", "off_feed"] as SymptomId[]);
  assert.ok(many.length <= 5 && many.every((m) => m.disease.species.includes("poultry") && m.matched.length > 0));
  assert.deepEqual(matchDiseases("cattle", []), []);
  assert.equal(diseaseBySlug("anthrax")?.zoonotic, true);
  assert.equal(diseaseBySlug("nope"), null);
});
