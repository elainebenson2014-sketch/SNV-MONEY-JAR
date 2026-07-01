import React, { useState, useEffect } from "react";
import { Plus, Check, Sparkles, PiggyBank, Heart, ShoppingBag, Lock, Unlock, CalendarClock, Repeat, Gift } from "lucide-react";
import * as db from "./db";

// ---- Design tokens ----
// Paper cream #FBF6EC · Ink #2B2620 · Coral #E8623D · Mint #3F9C7C · Sun #E8A93D · Sky #4C7EA8

const AVATARS = ["👸", "🤴", "🦸", "🦸‍♀️", "🧚", "🦄", "🐉", "🐬", "🦊", "🐱", "🐶", "🐼", "🦁", "🐨", "🦉", "🐧", "🌈", "⭐️", "🚀", "🦖"];
const KID_COLORS = ["#FF5A5F", "#FF9F1C", "#FFD23F", "#3FC46A", "#2EC4B6", "#4CA6FF", "#7C5CFF", "#E84FA6"];
const GOAL_EMOJI = ["🚲", "🎮", "🛹", "🎨", "📚", "🧸", "⚽️", "🎧", "🚁", "🐾", "👑", "🦄", "🎸", "🪀"];

const fmtDate = (s) => { try { return new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" }); } catch { return s; } };
const weeksUntil = (s) => { const ms = new Date(s + "T00:00:00") - new Date(); return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24 * 7))); };

const JAR_META = {
  spend: { label: "Spend", icon: ShoppingBag, color: "#FF9F1C" },
  save: { label: "Save", icon: PiggyBank, color: "#3FC46A" },
  give: { label: "Give", icon: Heart, color: "#E84FA6" },
};

const inp = { width: "100%", padding: "10px 12px", border: "2px solid #2B2620", borderRadius: 10, fontSize: 13, outline: "none" };
function Field({ label, children }) {
  return (<label className="block mb-3"><span className="block text-[12px] font-bold mb-1.5" style={{ color: "#2B2620" }}>{label}</span>{children}</label>);
}

/* ============================ AUTH ============================ */
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [parentName, setParentName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      if (mode === "signup") {
        if (!email || !password) { setErr("Email and password are required."); setBusy(false); return; }
        await db.signUp({ email, password, familyName: familyName || "My Family", parentName });
      } else {
        await db.signIn({ email, password });
      }
      const user = await db.getSessionUser();
      if (user) onAuthed();
      else setErr("Check your email to confirm your account, then sign in.");
    } catch (e) { setErr(e.message || "Something went wrong."); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg,#7C5CFF 0%,#4CA6FF 40%,#2EC4B6 100%)" }}>
      <div className="w-full max-w-sm rounded-3xl border-[3px] p-6" style={{ borderColor: "#2B2620", background: "#fff", boxShadow: "0 12px 0 rgba(43,38,32,0.15)" }}>
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <Sparkles size={24} color="#FFD23F" />
          <span className="font-extrabold text-[24px] tracking-tight" style={{ color: "#2B2620", fontFamily: "Georgia, serif" }}>SNV Money Jars</span>
        </div>
        <p className="text-center text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: "#7C5CFF" }}>Budgeting for Kids</p>
        <p className="text-center text-[13px] mb-5" style={{ color: "#6b6356" }}>
          {mode === "signup" ? "Create your family account" : "Welcome back"}
        </p>

        {mode === "signup" && (
          <>
            <Field label="Your name"><input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Parent name" style={inp} /></Field>
            <Field label="Family name"><input value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g. The Bensons" style={inp} /></Field>
          </>
        )}
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={inp} /></Field>
        <Field label="Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inp} /></Field>

        {err && <div className="text-[12.5px] mb-2" style={{ color: "#E8623D" }}>{err}</div>}

        <button onClick={submit} disabled={busy} className="w-full text-[14px] font-bold py-2.5 rounded-xl text-white mt-1" style={{ background: "#2B2620", opacity: busy ? 0.6 : 1 }}>
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        <p className="text-center text-[12.5px] mt-4" style={{ color: "#6b6356" }}>
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <span onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setErr(""); }} className="font-bold cursor-pointer" style={{ color: "#E8623D" }}>
            {mode === "signup" ? "Sign in" : "Create one"}
          </span>
        </p>
      </div>
    </div>
  );
}

/* ============================ JAR ============================ */
function Jar({ type, amount, total, locked }) {
  const meta = JAR_META[type]; const Icon = meta.icon;
  const pct = total > 0 ? Math.min(100, Math.round((amount / total) * 100)) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-28 rounded-b-2xl rounded-t-md border-[3px] overflow-hidden" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
        <div className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out" style={{ height: `${pct}%`, background: meta.color }} />
        <div className="absolute inset-0 flex items-center justify-center"><Icon size={22} strokeWidth={2.25} color={pct > 55 ? "#FBF6EC" : "#2B2620"} /></div>
        <div className="absolute top-0 left-0 right-0 h-2 border-b-[3px]" style={{ borderColor: "#2B2620" }} />
        {type === "save" && locked && <div className="absolute top-1 right-1"><Lock size={13} color="#2B2620" /></div>}
      </div>
      <div className="text-center">
        <div className="text-[13px] font-semibold" style={{ color: "#2B2620" }}>{meta.label}</div>
        <div className="text-[15px] font-bold" style={{ color: meta.color }}>${amount}</div>
      </div>
    </div>
  );
}
function CoinStamp({ amount }) {
  return (<div className="flex items-center justify-center w-9 h-9 rounded-full border-2 shrink-0 text-[12px] font-bold" style={{ borderColor: "#2B2620", background: "#E8A93D", color: "#2B2620", fontFamily: "Georgia, serif" }}>+{amount}</div>);
}

/* ============================ GOAL SECTION ============================ */
function GoalSection({ kid, onProposeGoal }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(""); const [emoji, setEmoji] = useState("🎮");
  const [target, setTarget] = useState(""); const [due, setDue] = useState("");

  if (kid.goal && kid.goal.status === "approved") {
    const saved = kid.jars.save;
    const pct = Math.min(100, Math.round((saved / kid.goal.target) * 100));
    const remaining = Math.max(0, kid.goal.target - saved);
    const wk = kid.goal.due ? weeksUntil(kid.goal.due) : 0;
    return (
      <div className="rounded-3xl border-[3px] p-4" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><span className="text-2xl">{kid.goal.emoji}</span><span className="font-bold text-[15px]" style={{ color: "#2B2620" }}>{kid.goal.name}</span></div>
          <span className="text-[13px] font-semibold" style={{ color: "#3F9C7C" }}>${saved} / ${kid.goal.target}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden border-2" style={{ borderColor: "#2B2620", background: "#fff" }}>
          <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: "#3F9C7C" }} />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] font-medium" style={{ color: "#6b6356" }}>{remaining === 0 ? "You did it! 🎉" : `$${remaining} more to go`}</span>
          {kid.goal.due && <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "#4C7EA8" }}><CalendarClock size={13} /> by {fmtDate(kid.goal.due)}{wk > 0 ? ` · ${wk} wk${wk === 1 ? "" : "s"}` : ""}</span>}
        </div>
      </div>
    );
  }
  if (kid.goalProposal) {
    return (
      <div className="rounded-3xl border-[3px] border-dashed p-4" style={{ borderColor: "#E8A93D", background: "#FFF8EA" }}>
        <div className="flex items-center gap-2 mb-1"><span className="text-2xl">{kid.goalProposal.emoji}</span><span className="font-bold text-[15px]" style={{ color: "#2B2620" }}>{kid.goalProposal.name}</span><span className="ml-auto text-[12px] font-semibold" style={{ color: "#E8A93D" }}>${kid.goalProposal.target}</span></div>
        <div className="text-[12.5px] font-medium" style={{ color: "#6b6356" }}>⏳ Waiting for a parent to approve your goal.</div>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border-[3px] border-dashed p-4" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-2 text-[14px] font-bold py-2" style={{ color: "#2B2620" }}><Sparkles size={16} color="#E8A93D" /> Dream up a savings goal</button>
      ) : (
        <div className="space-y-2.5">
          <div className="text-[13px] font-bold" style={{ color: "#2B2620" }}>What are you saving for?</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New skateboard" style={inp} />
          <div className="flex flex-wrap gap-1.5">
            {GOAL_EMOJI.map((e) => (<button key={e} onClick={() => setEmoji(e)} className="text-[18px] w-8 h-8 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: emoji === e ? "#E8A93D" : "#e5ded0", background: emoji === e ? "#FFF8EA" : "#fff" }}>{e}</button>))}
          </div>
          <div className="flex gap-2">
            <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" placeholder="$ target" style={{ ...inp, flex: 1 }} />
            <input value={due} onChange={(e) => setDue(e.target.value)} type="date" style={{ ...inp, flex: 1 }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="text-[13px] font-bold px-3 py-2 rounded-xl border-2" style={{ borderColor: "#2B2620", color: "#2B2620" }}>Cancel</button>
            <button onClick={async () => { if (!name.trim() || !target || isNaN(Number(target))) return; await onProposeGoal(kid.id, { name: name.trim(), emoji, target: Number(target), due: due || null }); setOpen(false); setName(""); setTarget(""); setDue(""); setEmoji("🎮"); }} className="flex-1 text-[13px] font-bold py-2 rounded-xl text-white" style={{ background: "#2B2620" }}>Send to parent</button>
          </div>
          <div className="text-[11.5px] font-medium" style={{ color: "#6b6356" }}>Your parent will approve it before it goes live.</div>
        </div>
      )}
    </div>
  );
}

/* ============================ KID VIEW ============================ */
function KidView({ kid, onMarkDone, onProposeGoal }) {
  const total = kid.jars.spend + kid.jars.save + kid.jars.give;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-5 border-[3px]" style={{ borderColor: "#2B2620", background: kid.color }}>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{kid.avatar}</div>
          <div>
            <div className="text-[22px] leading-tight font-extrabold text-white" style={{ fontFamily: "Georgia, serif" }}>Hi {kid.name}!</div>
            <div className="text-[13px] text-white/85 font-medium">You've got ${total} across your jars</div>
          </div>
        </div>
      </div>

      <div className="flex justify-around bg-white rounded-3xl border-[3px] py-5 px-3" style={{ borderColor: "#2B2620" }}>
        <Jar type="spend" amount={kid.jars.spend} total={total} />
        <Jar type="save" amount={kid.jars.save} total={total} locked={kid.saveLocked} />
        <Jar type="give" amount={kid.jars.give} total={total} />
      </div>

      <div className="flex items-center gap-2 rounded-2xl border-2 px-3 py-2.5" style={{ borderColor: "#2B2620", background: "#FFF8EA" }}>
        <Repeat size={16} color="#E8A93D" />
        <span className="text-[13px] font-medium" style={{ color: "#2B2620" }}>
          ${kid.allowance.amount} allowance every {kid.allowance.freq === "weekly" ? "week" : "month"}
          {kid.allowance.mode === "auto" ? " — splits into your jars automatically" : ` — goes into your ${JAR_META[kid.allowance.manualJar].label} jar`}
        </span>
      </div>

      <GoalSection kid={kid} onProposeGoal={onProposeGoal} />

      {kid.cause.name && (
        <div className="rounded-3xl border-[3px] p-4" style={{ borderColor: "#2B2620", background: "#FFF1EE" }}>
          <div className="flex items-center gap-2 mb-1"><Gift size={17} color="#E8623D" /><span className="font-bold text-[15px]" style={{ color: "#2B2620" }}>Giving to {kid.cause.emoji} {kid.cause.name}</span></div>
          <div className="text-[12.5px] font-medium" style={{ color: "#6b6356" }}>Your Give jar has <b style={{ color: "#E8623D" }}>${kid.jars.give}</b> saved up.{kid.cause.match && <span> Your parent matches every dollar you give! 💞</span>}</div>
        </div>
      )}

      <div>
        <div className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6b6356" }}>Chores</div>
        <div className="space-y-2">
          {kid.chores.length === 0 && <div className="text-[13px]" style={{ color: "#6b6356" }}>No chores right now.</div>}
          {kid.chores.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border-2 px-3 py-2.5" style={{ borderColor: "#2B2620", background: c.approved ? "#F1EEE3" : "#fff" }}>
              <div className="flex items-center gap-2"><CoinStamp amount={c.amount} /><span className="text-[14px] font-medium" style={{ color: "#2B2620" }}>{c.label}</span></div>
              {c.approved ? <span className="flex items-center gap-1 text-[12px] font-semibold" style={{ color: "#3F9C7C" }}><Check size={14} /> Paid</span>
                : c.done ? <span className="text-[12px] font-semibold" style={{ color: "#E8A93D" }}>Waiting for parent</span>
                : <button onClick={() => onMarkDone(c.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "#2B2620" }}>Mark done</button>}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6b6356" }}>Recent</div>
        <div className="space-y-1.5">
          {kid.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-[13px] px-1">
              <span style={{ color: "#2B2620" }}>{h.label}</span>
              <span className="font-semibold" style={{ color: h.jar === "split" ? "#4C7EA8" : JAR_META[h.jar].color }}>+${h.amount}{h.jar === "split" ? " → jars" : ` → ${JAR_META[h.jar].label}`}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ SPLIT EDITOR ============================ */
function SplitEditor({ kid, onSaveSplit }) {
  const [open, setOpen] = useState(false);
  const sp = kid.allowance.split;
  const [spend, setSpend] = useState(sp.spend);
  const [save, setSave] = useState(sp.save);
  const [give, setGive] = useState(sp.give);
  const total = Number(spend || 0) + Number(save || 0) + Number(give || 0);
  const ok = total === 100;

  if (!open) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-medium" style={{ color: "#6b6356" }}>Splits {sp.spend}% Spend · {sp.save}% Save · {sp.give}% Give</span>
        <button onClick={() => { setSpend(sp.spend); setSave(sp.save); setGive(sp.give); setOpen(true); }} className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#7C5CFF", color: "#fff" }}>Edit split</button>
      </div>
    );
  }
  const row = (label, val, setVal, color) => (
    <div className="flex items-center gap-2">
      <span className="text-[11.5px] font-bold w-12" style={{ color }}>{label}</span>
      <input type="number" min="0" max="100" value={val} onChange={(e) => setVal(e.target.value === "" ? "" : Number(e.target.value))}
        className="flex-1" style={{ ...inp, padding: "6px 8px" }} />
      <span className="text-[12px] font-bold" style={{ color: "#6b6356" }}>%</span>
    </div>
  );
  return (
    <div className="space-y-2">
      {row("Spend", spend, setSpend, "#FF9F1C")}
      {row("Save", save, setSave, "#3FC46A")}
      {row("Give", give, setGive, "#E84FA6")}
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] font-bold" style={{ color: ok ? "#3FC46A" : "#FF5A5F" }}>Total: {total}%{ok ? " ✓" : " — must equal 100"}</span>
        <div className="flex gap-1.5">
          <button onClick={() => setOpen(false)} className="text-[11px] font-bold px-2.5 py-1 rounded-full border-2" style={{ borderColor: "#2B2620", color: "#2B2620" }}>Cancel</button>
          <button disabled={!ok} onClick={async () => { await onSaveSplit(kid.id, { spend: Number(spend), save: Number(save), give: Number(give) }); setOpen(false); }} className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: ok ? "#3FC46A" : "#bbb" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ PARENT VIEW ============================ */
function ParentView({ kids, actions }) {
  const [openKid, setOpenKid] = useState(null);
  const [amount, setAmount] = useState(""); const [jar, setJar] = useState("save"); const [label, setLabel] = useState("");
  const [addingKid, setAddingKid] = useState(false);
  const [newKidName, setNewKidName] = useState(""); const [newAvatar, setNewAvatar] = useState("🦊"); const [newColor, setNewColor] = useState("#E8623D");
  const [choreKid, setChoreKid] = useState(null); const [choreLabel, setChoreLabel] = useState(""); const [choreAmt, setChoreAmt] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "#6b6356" }}>Family overview</div>
        <button onClick={() => setAddingKid(!addingKid)} className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: "#2B2620" }}><Plus size={14} /> Add kid</button>
      </div>

      {addingKid && (
        <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
          <input value={newKidName} onChange={(e) => setNewKidName(e.target.value)} placeholder="Kid's name" style={inp} />
          <div className="flex flex-wrap gap-1.5">{AVATARS.map((a) => <button key={a} onClick={() => setNewAvatar(a)} className="text-[18px] w-8 h-8 rounded-lg border-2 flex items-center justify-center" style={{ borderColor: newAvatar === a ? "#E8A93D" : "#e5ded0", background: newAvatar === a ? "#FFF8EA" : "#fff" }}>{a}</button>)}</div>
          <div className="flex flex-wrap gap-1.5">{KID_COLORS.map((c) => <button key={c} onClick={() => setNewColor(c)} className="w-7 h-7 rounded-full border-2" style={{ borderColor: newColor === c ? "#2B2620" : "#fff", background: c }} />)}</div>
          <button onClick={async () => { if (!newKidName.trim()) return; await actions.addKid({ name: newKidName.trim(), avatar: newAvatar, color: newColor }); setNewKidName(""); setAddingKid(false); }} className="w-full text-[13px] font-bold py-2 rounded-xl text-white" style={{ background: "#2B2620" }}>Add kid</button>
        </div>
      )}

      {kids.map((kid) => {
        const total = kid.jars.spend + kid.jars.save + kid.jars.give;
        const pending = kid.chores.filter((c) => c.done && !c.approved);
        const sp = kid.allowance.split;
        return (
          <div key={kid.id} className="rounded-3xl border-[3px] p-4" style={{ borderColor: "#2B2620", background: "#fff" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><span className="text-2xl">{kid.avatar}</span><div><div className="font-bold text-[15px]" style={{ color: "#2B2620" }}>{kid.name}</div><div className="text-[12px]" style={{ color: "#6b6356" }}>Total: ${total}</div></div></div>
              <button onClick={() => setOpenKid(openKid === kid.id ? null : kid.id)} className="flex items-center gap-1 text-[12px] font-bold px-3 py-1.5 rounded-full text-white" style={{ background: kid.color }}><Plus size={14} /> Add money</button>
            </div>

            {kid.goalProposal && (
              <div className="rounded-2xl border-2 border-dashed p-3 mb-3" style={{ borderColor: "#E8A93D", background: "#FFF8EA" }}>
                <div className="flex items-center gap-2 mb-1.5"><span className="text-xl">{kid.goalProposal.emoji}</span><span className="text-[13px] font-bold" style={{ color: "#2B2620" }}>{kid.name} wants to save for {kid.goalProposal.name}</span></div>
                <div className="text-[12px] font-medium mb-2" style={{ color: "#6b6356" }}>Target ${kid.goalProposal.target}{kid.goalProposal.due ? ` · by ${fmtDate(kid.goalProposal.due)}` : ""}</div>
                <div className="flex gap-2">
                  <button onClick={() => actions.declineGoal(kid.id)} className="text-[12px] font-bold px-3 py-1.5 rounded-full border-2" style={{ borderColor: "#2B2620", color: "#2B2620" }}>Decline</button>
                  <button onClick={() => actions.approveGoal(kid.id)} className="flex-1 flex items-center justify-center gap-1 text-[12px] font-bold py-1.5 rounded-full text-white" style={{ background: "#3F9C7C" }}><Check size={13} /> Approve goal</button>
                </div>
              </div>
            )}

            {/* Allowance */}
            <div className="rounded-2xl border-2 p-3 mb-3" style={{ borderColor: "#2B2620", background: "#FFF8EA" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#2B2620" }}><Repeat size={14} color="#E8A93D" /> Allowance: ${kid.allowance.amount}/{kid.allowance.freq === "weekly" ? "wk" : "mo"}</span>
                <button onClick={() => actions.runAllowance(kid.id)} className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "#E8A93D" }}>Pay now</button>
              </div>
              <div className="flex rounded-full border-2 p-0.5 mb-2" style={{ borderColor: "#2B2620", background: "#fff" }}>
                {["auto", "manual"].map((m) => (<button key={m} onClick={() => actions.setAllowanceMode(kid.id, m)} className="flex-1 text-[11.5px] font-bold py-1 rounded-full" style={{ background: kid.allowance.mode === m ? "#E8A93D" : "transparent", color: kid.allowance.mode === m ? "#2B2620" : "#6b6356" }}>{m === "auto" ? "Auto-split" : "One jar"}</button>))}
              </div>
              {kid.allowance.mode === "auto" ? (
                <SplitEditor kid={kid} onSaveSplit={actions.saveSplit} />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] font-medium" style={{ color: "#6b6356" }}>All to:</span>
                  <div className="flex gap-1">{["spend", "save", "give"].map((j) => (<button key={j} onClick={() => actions.setManualJar(kid.id, j)} className="text-[11px] font-bold px-2 py-1 rounded-full border" style={{ borderColor: "#2B2620", background: kid.allowance.manualJar === j ? JAR_META[j].color : "#fff", color: kid.allowance.manualJar === j ? "#fff" : "#2B2620" }}>{JAR_META[j].label}</button>))}</div>
                </div>
              )}
            </div>

            {/* Locks & match */}
            <div className="flex gap-2 mb-3">
              <button onClick={() => actions.toggleSaveLock(kid.id, !kid.saveLocked)} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 rounded-xl border-2" style={{ borderColor: "#2B2620", background: kid.saveLocked ? "#3F9C7C" : "#fff", color: kid.saveLocked ? "#fff" : "#2B2620" }}>{kid.saveLocked ? <Lock size={13} /> : <Unlock size={13} />} Save {kid.saveLocked ? "locked" : "open"}</button>
              <button onClick={() => actions.toggleMatch(kid.id, !kid.cause.match)} className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-bold py-2 rounded-xl border-2" style={{ borderColor: "#2B2620", background: kid.cause.match ? "#E8623D" : "#fff", color: kid.cause.match ? "#fff" : "#2B2620" }}><Heart size={13} /> Match {kid.cause.match ? "on" : "off"}</button>
            </div>

            {openKid === kid.id && (
              <div className="rounded-2xl border-2 p-3 mb-3 space-y-2" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What's it for?" style={inp} />
                <div className="flex gap-2">
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$ amount" type="number" style={{ ...inp, flex: 1 }} />
                  <select value={jar} onChange={(e) => setJar(e.target.value)} style={{ ...inp, width: "auto" }}><option value="spend">Spend</option><option value="save">Save</option><option value="give">Give</option></select>
                </div>
                <button onClick={async () => { if (!amount || isNaN(Number(amount))) return; await actions.addDeposit(kid.id, { label: label || "Deposit", amount: Number(amount), jar }); setAmount(""); setLabel(""); setOpenKid(null); }} className="w-full text-[13px] font-bold py-2 rounded-xl text-white" style={{ background: "#2B2620" }}>Confirm deposit</button>
              </div>
            )}

            {/* Chores pending approval */}
            {pending.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {pending.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border-2 px-3 py-2" style={{ borderColor: "#E8A93D", background: "#FFF8EA" }}>
                    <span className="text-[13px] font-medium" style={{ color: "#2B2620" }}>{c.label} — ${c.amount}</span>
                    <button onClick={() => actions.approveChore(c.id)} className="flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: "#3F9C7C" }}><Check size={13} /> Approve</button>
                  </div>
                ))}
              </div>
            )}

            {/* Add chore */}
            {choreKid === kid.id ? (
              <div className="rounded-2xl border-2 p-3 space-y-2" style={{ borderColor: "#2B2620", background: "#FBF6EC" }}>
                <input value={choreLabel} onChange={(e) => setChoreLabel(e.target.value)} placeholder="Chore (e.g. Make bed)" style={inp} />
                <div className="flex gap-2">
                  <input value={choreAmt} onChange={(e) => setChoreAmt(e.target.value)} type="number" placeholder="$" style={{ ...inp, flex: 1 }} />
                  <button onClick={async () => { if (!choreLabel.trim() || !choreAmt) return; await actions.addChore(kid.id, { label: choreLabel.trim(), amount: Number(choreAmt) }); setChoreLabel(""); setChoreAmt(""); setChoreKid(null); }} className="text-[13px] font-bold px-4 rounded-xl text-white" style={{ background: "#2B2620" }}>Add</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setChoreKid(kid.id)} className="w-full flex items-center justify-center gap-1 text-[12px] font-bold py-2 rounded-xl border-2 border-dashed" style={{ borderColor: "#2B2620", color: "#2B2620" }}><Plus size={13} /> Add a chore</button>
            )}
          </div>
        );
      })}
      {kids.length === 0 && !addingKid && <div className="text-center text-[13px] py-6" style={{ color: "#6b6356" }}>Add your first kid to get started.</div>}
    </div>
  );
}

/* ============================ ROOT ============================ */
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kids, setKids] = useState([]);
  const [mode, setMode] = useState("parent");
  const [activeKid, setActiveKid] = useState(null);

  const refresh = async () => {
    const { kids } = await db.loadFamily();
    setKids(kids);
    setActiveKid((prev) => prev || (kids.length ? kids[0].id : null));
  };

  useEffect(() => {
    (async () => {
      const user = await db.getSessionUser();
      if (user) { setAuthed(true); await refresh(); }
      setLoading(false);
    })();
  }, []);

  const onAuthed = async () => { setAuthed(true); setLoading(true); await refresh(); setLoading(false); };
  const signOut = async () => { await db.signOut(); setAuthed(false); setKids([]); setActiveKid(null); };

  // wrap every action so the UI refreshes from the DB after each change
  const wrap = (fn) => async (...args) => { await fn(...args); await refresh(); };
  const actions = {
    addKid: wrap(db.addKid),
    runAllowance: wrap(db.runAllowance),
    setAllowanceMode: wrap(db.setAllowanceMode),
    setManualJar: wrap(db.setManualJar),
    saveSplit: wrap(db.saveSplit),
    addDeposit: wrap((kidId, d) => db.addDeposit(kidId, d)),
    toggleSaveLock: wrap(db.toggleSaveLock),
    toggleMatch: wrap(db.toggleMatch),
    approveChore: wrap(db.approveChore),
    addChore: wrap((kidId, c) => db.addChore(kidId, c)),
    approveGoal: wrap(db.approveGoal),
    declineGoal: wrap(db.declineGoal),
  };
  const markDone = wrap(db.markChoreDone);
  const proposeGoal = wrap((kidId, g) => db.proposeGoal(kidId, g));

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7C5CFF,#4CA6FF)", color: "#fff", fontFamily: "Georgia, serif", fontSize: 18 }}>Loading SNV Money Jars…</div>;
  if (!authed) return <AuthScreen onAuthed={onAuthed} />;

  const kid = kids.find((k) => k.id === activeKid) || kids[0];

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: "linear-gradient(180deg,#FFF4E0 0%,#FDE9F4 100%)" }}>
      <div className="w-full max-w-md px-4 py-6" style={{ fontFamily: "'Trebuchet MS', system-ui, sans-serif" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={20} color="#FFD23F" />
            <div className="leading-none">
              <div className="font-extrabold text-[18px]" style={{ color: "#2B2620", fontFamily: "Georgia, serif" }}>SNV Money Jars</div>
              <div className="text-[9.5px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#7C5CFF" }}>Budgeting for Kids</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border-2 p-0.5" style={{ borderColor: "#2B2620", background: "#fff" }}>
              <button onClick={() => setMode("kid")} className="text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: mode === "kid" ? "#7C5CFF" : "transparent", color: mode === "kid" ? "#fff" : "#2B2620" }}>Kid</button>
              <button onClick={() => setMode("parent")} className="text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: mode === "parent" ? "#7C5CFF" : "transparent", color: mode === "parent" ? "#fff" : "#2B2620" }}>Parent</button>
            </div>
            <button onClick={signOut} className="text-[11px] font-bold px-2.5 py-1.5 rounded-full border-2" style={{ borderColor: "#2B2620", color: "#2B2620", background: "#fff" }}>Sign out</button>
          </div>
        </div>

        {mode === "kid" && kids.length > 0 && kid && (
          <>
            <div className="flex gap-2 mb-5 flex-wrap">
              {kids.map((k) => (<button key={k.id} onClick={() => setActiveKid(k.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-[13px] font-bold" style={{ borderColor: "#2B2620", background: activeKid === k.id ? k.color : "#fff", color: activeKid === k.id ? "#fff" : "#2B2620" }}><span>{k.avatar}</span> {k.name}</button>))}
            </div>
            <KidView kid={kid} onMarkDone={markDone} onProposeGoal={proposeGoal} />
          </>
        )}
        {mode === "kid" && kids.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: "#6b6356" }}>No kids yet — switch to Parent view to add one.</div>}
        {mode === "parent" && <ParentView kids={kids} actions={actions} />}
      </div>
    </div>
  );
}
