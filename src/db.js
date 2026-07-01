// ============================================================
// Money Jars — data-access layer
// Talks to the Supabase schema (families/parents/kids/jars/
// allowances/goals/causes/chores/transactions).
//
// Setup: create ./supabaseClient.js that exports a configured
// client, e.g.
//
//   import { createClient } from "@supabase/supabase-js";
//   export const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_ANON_KEY
//   );
//
// All reads/writes are RLS-scoped to the logged-in parent's
// family, so no query needs to pass a family_id for safety —
// the database enforces it.
// ============================================================
import { supabase } from "./supabaseClient";

/* ---------------- AUTH ---------------- */

export async function signUp({ email, password, familyName, parentName }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Create the family + parent row for this new user.
  // (If email confirmation is ON, the session may be null until
  //  they confirm; in that case call bootstrap after first login.)
  if (data.session) {
    await bootstrapFamily({ familyName, parentName, email });
  }
  return data.user;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // Ensure the family exists (covers the confirm-email-first case).
  await bootstrapFamily({ email });
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Idempotent: creates family+parent if missing, returns family_id.
export async function bootstrapFamily({ familyName = "My Family", parentName = null, email = null } = {}) {
  const { data, error } = await supabase.rpc("bootstrap_family", {
    p_family_name: familyName,
    p_parent_name: parentName,
    p_email: email,
  });
  if (error) throw error;
  return data; // family_id
}

/* ---------------- LOAD WHOLE FAMILY ---------------- */
// Returns { family, kids: [ { ...kid, jars, allowance, cause,
// goal, goalProposal, chores, history } ] } in the shape the UI uses.

export async function loadFamily() {
  const { data: parent, error: pErr } = await supabase
    .from("parents").select("family_id, name, email").single();
  if (pErr) throw pErr;

  const { data: family } = await supabase
    .from("families").select("*").eq("id", parent.family_id).single();

  const { data: kids, error: kErr } = await supabase
    .from("kids")
    .select(`
      *,
      jars(*),
      allowances(*),
      causes(*),
      goals(*),
      chores(*),
      transactions(*)
    `)
    .order("created_at", { ascending: true });
  if (kErr) throw kErr;

  const shaped = (kids || []).map((k) => {
    const goalsAll = k.goals || [];
    const goal = goalsAll.find((g) => g.status === "approved") || null;
    const goalProposal = goalsAll.find((g) => g.status === "pending") || null;
    const a = k.allowances || {};
    return {
      id: k.id,
      name: k.name,
      avatar: k.avatar,
      color: k.color,
      saveLocked: k.save_locked,
      jars: {
        spend: Number(k.jars?.spend ?? 0),
        save: Number(k.jars?.save ?? 0),
        give: Number(k.jars?.give ?? 0),
      },
      allowance: {
        amount: Number(a.amount ?? 0),
        freq: a.freq ?? "weekly",
        mode: a.mode ?? "auto",
        manualJar: a.manual_jar ?? "save",
        split: { spend: a.split_spend ?? 40, save: a.split_save ?? 40, give: a.split_give ?? 20 },
      },
      cause: {
        name: k.causes?.name ?? null,
        emoji: k.causes?.emoji ?? "💛",
        match: k.causes?.match ?? false,
      },
      goal: goal
        ? { id: goal.id, name: goal.name, emoji: goal.emoji, target: Number(goal.target), due: goal.due, status: "approved" }
        : null,
      goalProposal: goalProposal
        ? { id: goalProposal.id, name: goalProposal.name, emoji: goalProposal.emoji, target: Number(goalProposal.target), due: goalProposal.due }
        : null,
      chores: (k.chores || [])
        .slice()
        .sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
        .map((c) => ({ id: c.id, label: c.label, amount: Number(c.amount), done: c.done, approved: c.approved })),
      history: (k.transactions || [])
        .slice()
        .sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
        .slice(0, 20)
        .map((t) => ({ id: t.id, label: t.label, amount: Number(t.amount), jar: t.jar })),
    };
  });

  return { family, parent, kids: shaped };
}

/* ---------------- KIDS ---------------- */

export async function addKid({ name, avatar = "🦊", color = "#E8623D", pin = null }) {
  const { data: parent } = await supabase.from("parents").select("family_id").single();
  const { data: kid, error } = await supabase
    .from("kids")
    .insert({
      family_id: parent.family_id,
      name, avatar, color,
      pin_hash: pin ? await hashPin(pin) : null,
    })
    .select("id").single();
  if (error) throw error;

  // Create the per-kid satellite rows so the UI always has them.
  await supabase.from("jars").insert({ kid_id: kid.id, spend: 0, save: 0, give: 0 });
  await supabase.from("allowances").insert({ kid_id: kid.id });
  await supabase.from("causes").insert({ kid_id: kid.id });
  return kid.id;
}

// PIN hashing via pgcrypto on the server would be ideal, but for
// a shared-device convenience gate we hash client-side here.
// (This is NOT a security boundary — see schema notes.)
async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(pin)));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(kidId, pin) {
  const { data } = await supabase.from("kids").select("pin_hash").eq("id", kidId).single();
  if (!data?.pin_hash) return true; // no PIN set = open
  return data.pin_hash === (await hashPin(pin));
}

export async function toggleSaveLock(kidId, locked) {
  const { error } = await supabase.from("kids").update({ save_locked: locked }).eq("id", kidId);
  if (error) throw error;
}

export async function updateKid(kidId, { name, avatar, color }) {
  const patch = {};
  if (name !== undefined) patch.name = name;
  if (avatar !== undefined) patch.avatar = avatar;
  if (color !== undefined) patch.color = color;
  const { error } = await supabase.from("kids").update(patch).eq("id", kidId);
  if (error) throw error;
}

export async function deleteKid(kidId) {
  // Cascades remove jars/allowances/goals/causes/chores/transactions.
  const { error } = await supabase.from("kids").delete().eq("id", kidId);
  if (error) throw error;
}

/* ---------------- ALLOWANCE ---------------- */

export async function saveAllowanceAmount(kidId, { amount, freq }) {
  const { error } = await supabase.from("allowances").update({ amount, freq }).eq("kid_id", kidId);
  if (error) throw error;
}

export async function saveAllowance(kidId, { amount, freq, mode, manualJar, split }) {
  const { error } = await supabase.from("allowances").upsert({
    kid_id: kidId,
    amount, freq, mode, manual_jar: manualJar,
    split_spend: split.spend, split_save: split.save, split_give: split.give,
  }, { onConflict: "kid_id" });
  if (error) throw error;
}

export async function setAllowanceMode(kidId, mode) {
  const { error } = await supabase.from("allowances").update({ mode }).eq("kid_id", kidId);
  if (error) throw error;
}

export async function setManualJar(kidId, manualJar) {
  const { error } = await supabase.from("allowances").update({ manual_jar: manualJar }).eq("kid_id", kidId);
  if (error) throw error;
}

export async function saveSplit(kidId, { spend, save, give }) {
  const { error } = await supabase.from("allowances").update({
    split_spend: spend, split_save: save, split_give: give,
  }).eq("kid_id", kidId);
  if (error) throw error;
}

// Runs an allowance payment: reads config + current jars, computes
// the split (or single jar), writes new jar balances + a tx row.
export async function runAllowance(kidId) {
  const { data: a, error: aErr } = await supabase.from("allowances").select("*").eq("kid_id", kidId).single();
  if (aErr) throw aErr;
  const { data: j, error: jErr } = await supabase.from("jars").select("*").eq("kid_id", kidId).single();
  if (jErr) throw jErr;

  const amount = Number(a.amount) || 0;
  let next = { spend: Number(j.spend), save: Number(j.save), give: Number(j.give) };
  let jarLabel = "split";

  if (a.mode === "manual") {
    next[a.manual_jar] += amount;
    jarLabel = a.manual_jar;
  } else {
    const spend = Math.round((amount * a.split_spend) / 100);
    const save = Math.round((amount * a.split_save) / 100);
    const give = amount - spend - save; // remainder keeps the sum exact
    next.spend += spend; next.save += save; next.give += give;
  }

  await supabase.from("jars").update(next).eq("kid_id", kidId);
  await supabase.from("transactions").insert({ kid_id: kidId, label: "Allowance", amount, jar: jarLabel });
}

/* ---------------- DEPOSITS ---------------- */

export async function addDeposit(kidId, { label, amount, jar }) {
  const { data: j } = await supabase.from("jars").select("*").eq("kid_id", kidId).single();
  const next = { spend: Number(j.spend), save: Number(j.save), give: Number(j.give) };
  next[jar] += Number(amount);
  await supabase.from("jars").update(next).eq("kid_id", kidId);
  await supabase.from("transactions").insert({ kid_id: kidId, label: label || "Deposit", amount: Number(amount), jar });
}

/* ---------------- CHORES ---------------- */

export async function addChore(kidId, { label, amount }) {
  const { error } = await supabase.from("chores").insert({ kid_id: kidId, label, amount: Number(amount) });
  if (error) throw error;
}

export async function markChoreDone(choreId) {
  const { error } = await supabase.from("chores").update({ done: true }).eq("id", choreId);
  if (error) throw error;
}

// Approve a chore -> pay it into the kid's SAVE jar + log a tx.
export async function approveChore(choreId) {
  const { data: chore, error } = await supabase.from("chores").select("*").eq("id", choreId).single();
  if (error) throw error;
  await supabase.from("chores").update({ approved: true }).eq("id", choreId);

  const { data: j } = await supabase.from("jars").select("*").eq("kid_id", chore.kid_id).single();
  await supabase.from("jars").update({ save: Number(j.save) + Number(chore.amount) }).eq("kid_id", chore.kid_id);
  await supabase.from("transactions").insert({
    kid_id: chore.kid_id, label: chore.label, amount: Number(chore.amount), jar: "save",
  });
}

export async function deleteChore(choreId) {
  const { error } = await supabase.from("chores").delete().eq("id", choreId);
  if (error) throw error;
}

/* ---------------- GOALS (propose / approve / decline) ---------------- */

// Kid proposes: only one pending allowed — clear any old pending first.
export async function proposeGoal(kidId, { name, emoji, target, due }) {
  await supabase.from("goals").delete().eq("kid_id", kidId).eq("status", "pending");
  const { error } = await supabase.from("goals").insert({
    kid_id: kidId, name, emoji, target: Number(target), due: due || null, status: "pending",
  });
  if (error) throw error;
}

// Parent approves: retire any existing approved goal, promote the pending one.
export async function approveGoal(kidId) {
  await supabase.from("goals").delete().eq("kid_id", kidId).eq("status", "approved");
  const { error } = await supabase.from("goals")
    .update({ status: "approved" })
    .eq("kid_id", kidId).eq("status", "pending");
  if (error) throw error;
}

export async function declineGoal(kidId) {
  const { error } = await supabase.from("goals").delete().eq("kid_id", kidId).eq("status", "pending");
  if (error) throw error;
}

/* ---------------- GIVING CAUSE ---------------- */

export async function saveCause(kidId, { name, emoji, match }) {
  const { error } = await supabase.from("causes").upsert({
    kid_id: kidId, name, emoji, match,
  }, { onConflict: "kid_id" });
  if (error) throw error;
}

export async function toggleMatch(kidId, match) {
  const { error } = await supabase.from("causes").update({ match }).eq("kid_id", kidId);
  if (error) throw error;
}
