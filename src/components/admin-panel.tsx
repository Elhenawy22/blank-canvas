"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { deepMerge, fetchSettings, type ProjectEdit, type ResultEdit, type ServiceEdit, type SiteSettings } from "@/lib/site-settings";
import { getDictionary } from "@/i18n/dictionaries";
import { projects as baseProjects } from "@/data/portfolio";
import { salesResults as baseResults } from "@/data/sales-results";
import { brand, socials } from "@/data/brand";
import { serviceArtwork } from "@/components/sections/services";

type Order = { id: string; name: string; phone: string; company: string | null; service: string; message: string; status: string; created_at: string };
type Proj = { id: string; title: string; category: string; image: string; link: string | null; sort: number };
type Lang = "ar" | "en";
type Page = "orders" | "settings" | "services" | "results" | "work" | "spages" | "texts";

const STATUS: Record<string, string> = { new: "جديد", contacted: "تم التواصل", done: "مكتمل" };
const CATS: Record<string, string> = { branding: "هوية بصرية", social: "سوشيال ميديا", dev: "برمجة وتصميم", photo: "تصوير", video: "فيديو" };
const NAV: [Page, string, string][] = [
  ["orders", "الطلبات", "📥"],
  ["settings", "بيانات الموقع", "⚙️"],
  ["services", "خدماتنا", "🧩"],
  ["results", "نتائج العملاء", "📈"],
  ["work", "أعمال مختارة", "🖼️"],
  ["spages", "صفحات الخدمات", "🗂️"],
  ["texts", "كل نصوص الموقع", "✏️"],
];

/** Shrinks a picture from the computer to a compact JPEG so it can be stored directly. */
function toDataUrl(file: File, max = 1200): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      // Some phone formats can't be drawn; fall back to the raw file.
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

const css = `
.btn.ghost{opacity:.55}
.ad{position:fixed;inset:0;z-index:9999;display:flex;background:#f4f5f8;color:#1b1d2a;font-size:15px;overflow:hidden}
.ad *{box-sizing:border-box}
.ad aside{width:230px;background:#16162a;color:#fff;display:flex;flex-direction:column;padding:18px 12px;gap:4px;flex-shrink:0}
.ad aside .logo{font-weight:800;font-size:18px;padding:6px 10px 18px}
.ad aside button{display:flex;gap:10px;align-items:center;width:100%;text-align:start;background:transparent;border:0;color:#c9cbe0;padding:11px 12px;border-radius:10px;font:inherit;cursor:pointer}
.ad aside button.on,.ad aside button:hover{background:#2a2a48;color:#fff}
.ad aside .out{margin-top:auto}
.ad .main{flex:1;overflow-y:auto;padding:24px}
.ad .head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.ad h1{font-size:24px;margin:0}
.ad h3{margin:0 0 10px;font-size:16px}
.ad .panel{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.ad label{display:block;font-size:13px;color:#555;margin-bottom:12px}
.ad input,.ad select,.ad textarea{display:block;width:100%;padding:10px 12px;margin-top:5px;border-radius:9px;border:1px solid #d5d7e0;font:inherit;font-size:15px;background:#fff;color:#111}
.ad textarea{min-height:80px;resize:vertical}
.ad .btn{padding:10px 18px;border-radius:9px;border:0;background:#4f46e5;color:#fff;cursor:pointer;font:inherit;min-height:42px}
.ad .btn.light{background:#eceef4;color:#1b1d2a}.ad .btn.red{background:#fde8e8;color:#b42318}
.ad .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
.ad .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.ad .item{background:#fff;border-radius:14px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.ad .thumb{position:relative;width:100%;aspect-ratio:16/10;border-radius:10px;overflow:hidden;background:#e9ebf1;margin-bottom:10px}
.ad .thumb img{width:100%;height:100%;object-fit:cover;display:block}
.ad .thumb label{position:absolute;bottom:8px;inset-inline-start:8px;margin:0;background:rgba(0,0,0,.7);color:#fff;padding:6px 10px;border-radius:8px;cursor:pointer;font-size:13px}
.ad .thumb input{display:none}
.ad .seg{display:inline-flex;background:#eceef4;border-radius:9px;padding:3px}
.ad .seg button{border:0;background:transparent;padding:7px 14px;border-radius:7px;font:inherit;cursor:pointer;color:#1b1d2a}
.ad .seg button.on{background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.1)}
.ad .save{position:sticky;bottom:0;background:#f4f5f8;padding:12px 0;display:flex;gap:10px;align-items:center}
.ad .msg{font-size:14px}
.ad .muted{opacity:.45}
@media(max-width:760px){
 .ad{flex-direction:column}
 .ad aside{width:100%;flex-direction:row;overflow-x:auto;padding:8px;gap:4px}
 .ad aside .logo{display:none}
 .ad aside button{width:auto;white-space:nowrap;padding:9px 12px}
 .ad aside .out{margin-top:0}
 .ad .main{padding:14px}
 .ad .grid2{grid-template-columns:1fr}
}`;

function Thumb({ src, onPick }: { src: string; onPick: (v: string) => void }) {
  return (
    <div className="thumb">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : null}
      <label>
        📷 تغيير الصورة
        <input type="file" accept="image/*" onChange={async (e) => {
          const input = e.currentTarget; const f = input.files?.[0]; if (!f) return;
          try { onPick(await toDataUrl(f)); } catch { alert("تعذّر قراءة الصورة، جرّب صورة تانية (JPG أو PNG)."); }
          input.value = "";
        }} />
      </label>
    </div>
  );
}

function Field({ label, value, onChange, long, ltr }: { label: string; value: string | undefined; onChange: (v: string) => void; long?: boolean; ltr?: boolean }) {
  return (
    <label>
      {label}
      {long ? <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} /> : <input value={value ?? ""} dir={ltr ? "ltr" : undefined} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

const dict = (l: Lang) => getDictionary(l);
const TEXT_SECS: [string, string][] = [
  ["nav", "الهيدر والقائمة (الهمبرجر)"], ["hero", "الواجهة الرئيسية"], ["services", "ماذا نقدم"],
  ["showcase", "خدماتنا وأثرها"], ["milestones", "الأرقام والإنجازات"], ["principles", "الرؤية والرسالة"],
  ["marquee", "الشريط المتحرك"], ["results", "نتائج العملاء"], ["work", "أعمال مختارة"],
  ["about", "صفحة من نحن"], ["contact", "نموذج الطلب"], ["footer", "الفوتر"], ["language", "زر اللغة"],
  ["meta", "عنوان الموقع في المتصفح"], ["notFound", "صفحة غير موجودة"],
];
const SKIP = /aria|alt$|hint|href|status|missing|skip|label$|^id$|slug|image|src/i;
function leaves(o: unknown, path: (string | number)[] = [], out: [(string | number)[], string][] = []) {
  if (typeof o === "string") { if (!path.some((k) => typeof k === "string" && SKIP.test(k)) || path[path.length - 1] === "label") out.push([path, o]); }
  else if (Array.isArray(o)) o.forEach((v, i) => leaves(v, [...path, i], out));
  else if (o && typeof o === "object") Object.entries(o).forEach(([k, v]) => leaves(v, [...path, k], out));
  return out;
}
function setIn(o: unknown, path: (string | number)[], v: string): unknown {
  if (!path.length) return v;
  const [k, ...r] = path;
  const c: Record<string | number, unknown> = Array.isArray(o) ? [...o] as never : { ...(o as object) };
  c[k] = setIn(c[k], r, v);
  return c;
}
type Heading = { eyebrow: string; lines: string[]; description?: string };

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState<Page>("orders");
  const [lang, setLang] = useState<Lang>("ar");
  const [orders, setOrders] = useState<Order[]>([]);
  const [st, setSt] = useState<SiteSettings>({});
  const [projects, setProjects] = useState<Proj[]>([]);
  const [msg, setMsg] = useState("");
  const [textSec, setTextSec] = useState("nav");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    db.rpc("has_role", { _user_id: session.user.id, _role: "admin" }).then(({ data: ok }) => {
      setIsAdmin(!!ok);
      if (ok) { loadOrders(); loadProjects(); fetchSettings(true).then(setSt); }
    });
  }, [session]);

  async function loadOrders() {
    const { data } = await db.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  }
  async function loadProjects() {
    const { data } = await db.from("cms_projects").select("*").order("sort").order("created_at", { ascending: false });
    setProjects((data as Proj[]) ?? []);
  }

  async function save() {
    setBusy(true);
    const { data: rows, error } = await db.from("site_settings").update({ data: st as never, updated_at: new Date().toISOString() }).eq("id", 1).select("id");
    setBusy(false);
    setMsg(!error && rows?.length ? "✓ تم الحفظ — التعديل ظاهر في الموقع الآن" : "لم يتم الحفظ: " + (error?.message ?? "لا توجد صلاحية"));
  }
  const patch = (p: Partial<SiteSettings>) => { setSt((s) => ({ ...s, ...p })); setMsg(""); };

  // --- section headings (per language) ---
  const heading = (sec: "services" | "results" | "work"): Heading =>
    deepMerge(dict(lang)[sec] as unknown as Heading, st.content?.[lang]?.[sec]);
  const setHeading = (sec: "services" | "results" | "work", h: Partial<Heading>) =>
    patch({ content: { ...st.content, [lang]: { ...st.content?.[lang], [sec]: { ...(st.content?.[lang]?.[sec] as object), ...h } } } });

  // --- lists with current site values as the starting point ---
  const services: ServiceEdit[] = st.servicesList ?? dict("ar").services.items.map((it, i) => ({
    image: serviceArtwork[i % serviceArtwork.length],
    text: { ar: { ...it, tags: it.tags ? [...it.tags] : [] }, en: { ...dict("en").services.items[i], tags: dict("en").services.items[i]?.tags ? [...dict("en").services.items[i].tags!] : [] } },
  }));
  const results: ResultEdit[] = st.resultsList ?? baseResults.map((r) => ({
    id: r.id, image: r.image, metrics: { ...r.metrics },
    text: { ar: { ...dict("ar").results.cases[r.id] }, en: { ...dict("en").results.cases[r.id] } },
  }));
  const works: ProjectEdit[] = baseProjects.map((p) => {
    const e = st.projects?.find((x) => x.slug === p.slug);
    return {
      slug: p.slug, image: e?.image || p.image, categoryId: e?.categoryId || p.categoryId, hidden: e?.hidden ?? false,
      text: { ar: { title: e?.text?.ar?.title || dict("ar").work.projects[p.slug]?.title }, en: { title: e?.text?.en?.title || dict("en").work.projects[p.slug]?.title } },
    };
  });

  const setService = (i: number, v: ServiceEdit) => patch({ servicesList: services.map((x, n) => (n === i ? v : x)) });
  const setResult = (i: number, v: ResultEdit) => patch({ resultsList: results.map((x, n) => (n === i ? v : x)) });
  const setWork = (i: number, v: ProjectEdit) => patch({ projects: works.map((x, n) => (n === i ? v : x)) });

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMsg("");
    const { error } = await db.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) setMsg("بيانات الدخول غير صحيحة.");
  }

  const svcTitles = (st.servicesList?.map((x) => x.text.ar?.title ?? "") ?? dict("ar").services.items.map((x) => x.title));
  const svcName = (c: string) => (c.startsWith("service-") ? "خدمة: " + (svcTitles[Number(c.slice(8)) - 1] ?? c) : c);

  async function addProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("file") as File;
    if (!file || !file.size) return setMsg("اختر صورة من جهازك.");
    setBusy(true);
    try {
      const image = await toDataUrl(file);
      const { error } = await db.from("cms_projects").insert({ title: String(f.get("title")), category: String(f.get("category")), link: String(f.get("link") || "") || null, image });
      setMsg(error ? "حصل خطأ: " + error.message : "✓ تم إضافة المشروع");
      if (!error) { form.reset(); loadProjects(); }
    } catch { setMsg("تعذّر قراءة الصورة."); }
    setBusy(false);
  }
  async function removeProject(id: string) {
    if (!confirm("حذف المشروع؟")) return;
    await db.from("cms_projects").delete().eq("id", id);
    loadProjects();
  }
  async function setStatus(id: string, status: string) { await db.from("orders").update({ status }).eq("id", id); loadOrders(); }
  async function removeOrder(id: string) { if (!confirm("حذف الطلب؟")) return; await db.from("orders").delete().eq("id", id); loadOrders(); }

  if (!ready) return <main dir="rtl" className="ad"><style>{css}</style><div className="main">جارٍ التحميل…</div></main>;

  if (!session || !isAdmin)
    return (
      <main dir="rtl" className="ad" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <form onSubmit={signIn} className="panel" style={{ width: "min(400px, 92vw)" }}>
          <h1 style={{ marginBottom: 18 }}>لوحة التحكم</h1>
          {session ? (
            <>
              <p>هذا الحساب ليس له صلاحية المدير.</p>
              <button type="button" className="btn light" onClick={() => db.auth.signOut()}>خروج</button>
            </>
          ) : (
            <>
              <label>البريد الإلكتروني<input name="email" type="email" required dir="ltr" /></label>
              <label>كلمة المرور<input name="password" type="password" required dir="ltr" /></label>
              <button className="btn" type="submit" style={{ width: "100%" }}>تسجيل الدخول</button>
              <p className="msg">{msg}</p>
            </>
          )}
        </form>
      </main>
    );

  const LangSwitch = (
    <div className="seg">
      <button className={lang === "ar" ? "on" : ""} onClick={() => setLang("ar")}>العربية</button>
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
    </div>
  );
  const SaveBar = (
    <div className="save">
      <button className="btn" disabled={busy} onClick={save}>{busy ? "جارٍ الحفظ…" : "💾 حفظ التعديلات"}</button>
      <span className="msg">{msg}</span>
    </div>
  );
  const HeadingEditor = ({ sec }: { sec: "services" | "results" | "work" }): ReactNode => {
    const h = heading(sec);
    return (
      <div className="panel">
        <h3>عنوان القسم</h3>
        <div className="grid2">
          <Field label="العنوان الصغير" value={h.eyebrow} onChange={(v) => setHeading(sec, { eyebrow: v })} />
          <Field label="العنوان الرئيسي (سطر لكل جزء)" value={h.lines.join("\n")} long onChange={(v) => setHeading(sec, { lines: v.split("\n") })} />
        </div>
        {h.description !== undefined && <Field label="الوصف" long value={h.description} onChange={(v) => setHeading(sec, { description: v })} />}
      </div>
    );
  };

  const brandVals = {
    siteName: brand.name, email: brand.email, phone: brand.phone, whatsapp: brand.whatsappHref.replace(/\D/g, ""),
    address: dict("ar").contact.address,
    ...Object.fromEntries(socials.filter((s) => s.id !== "whatsapp").map((s) => [s.id, s.href])),
  } as Record<string, string>;
  const SET_FIELDS: [keyof SiteSettings, string, boolean?][] = [
    ["siteName", "اسم الموقع"], ["email", "البريد الإلكتروني", true], ["phone", "رقم الهاتف", true],
    ["whatsapp", "رقم الواتساب (مثال 201207312268)", true], ["address", "العنوان"],
    ["instagram", "إنستجرام", true], ["facebook", "فيسبوك", true], ["linkedin", "لينكدإن", true], ["x", "X (تويتر)", true], ["youtube", "يوتيوب", true],
  ];

  return (
    <main dir="rtl" className="ad">
      <style>{css}</style>
      <aside>
        <div className="logo">لوحة التحكم</div>
        {NAV.map(([k, l, i]) => (
          <button key={k} className={page === k ? "on" : ""} onClick={() => { setPage(k); setMsg(""); }}>
            <span>{i}</span>{l}{k === "orders" && orders.length ? ` (${orders.length})` : ""}
          </button>
        ))}
        <button className="out" onClick={() => window.open("/ar/index.html", "_blank")}>🌐 عرض الموقع</button>
        <button onClick={() => db.auth.signOut()}>🚪 خروج</button>
      </aside>

      <div className="main">
        {page === "orders" && (
          <>
            <div className="head"><h1>الطلبات</h1><button className="btn light" onClick={loadOrders}>تحديث</button></div>
            {orders.length === 0 ? <div className="panel">لا توجد طلبات بعد.</div> : orders.map((o) => (
              <div key={o.id} className="panel">
                <div className="head" style={{ marginBottom: 6 }}>
                  <strong>{o.name}{o.company ? ` — ${o.company}` : ""}</strong>
                  <small>{new Date(o.created_at).toLocaleString("ar-EG")}</small>
                </div>
                <p>📞 <a dir="ltr" href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{o.phone}</a> · {o.service}</p>
                <p style={{ whiteSpace: "pre-wrap" }}>{o.message}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ width: "auto", marginTop: 0 }}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <button className="btn red" onClick={() => removeOrder(o.id)}>حذف</button>
                </div>
              </div>
            ))}
          </>
        )}

        {page === "settings" && (
          <>
            <div className="head"><h1>بيانات الموقع</h1></div>
            <div className="panel">
              <div className="grid2">
                {SET_FIELDS.map(([k, label, ltr]) => (
                  <Field key={k} label={label} ltr={ltr} value={(st[k] as string | undefined) ?? brandVals[k] ?? ""} onChange={(v) => patch({ [k]: v })} />
                ))}
              </div>
            </div>
            {SaveBar}
          </>
        )}

        {page === "services" && (
          <>
            <div className="head"><h1>خدماتنا</h1>{LangSwitch}</div>
            {HeadingEditor({ sec: "services" })}
            <div className="cards">
              {services.map((s, i) => {
                const t = s.text[lang] ?? { title: "", description: "", tags: [] };
                const setT = (p: Partial<typeof t>) => setService(i, { ...s, text: { ...s.text, [lang]: { ...t, ...p } } });
                return (
                  <div key={i} className="item">
                    <Thumb src={s.image} onPick={(image) => setService(i, { ...s, image })} />
                    <Field label="اسم الخدمة" value={t.title} onChange={(title) => setT({ title })} />
                    <Field label="الوصف" long value={t.description} onChange={(description) => setT({ description })} />
                    <Field label="وسوم (افصل بفاصلة)" value={(t.tags ?? []).join("، ")} onChange={(v) => setT({ tags: v.split(/[،,]/).map((x) => x.trim()).filter(Boolean) })} />
                    <button className="btn red" onClick={() => patch({ servicesList: services.filter((_, n) => n !== i) })}>حذف الخدمة</button>
                  </div>
                );
              })}
            </div>
            <p><button className="btn light" onClick={() => patch({ servicesList: [...services, { image: serviceArtwork[0], text: { ar: { title: "خدمة جديدة", description: "" }, en: { title: "New service", description: "" } } }] })}>➕ إضافة خدمة</button></p>
            {SaveBar}
          </>
        )}

        {page === "results" && (
          <>
            <div className="head"><h1>نتائج العملاء</h1>{LangSwitch}</div>
            {HeadingEditor({ sec: "results" })}
            <div className="cards">
              {results.map((r, i) => {
                const t = r.text[lang] ?? { title: "", subtitle: "", market: "", alt: "", summary: "" };
                const setT = (p: Partial<typeof t>) => setResult(i, { ...r, text: { ...r.text, [lang]: { ...t, ...p } } });
                const setM = (k: keyof ResultEdit["metrics"], v: string) => setResult(i, { ...r, metrics: { ...r.metrics, [k]: v } });
                return (
                  <div key={r.id} className="item">
                    <Thumb src={r.image} onPick={(image) => setResult(i, { ...r, image })} />
                    <Field label="العنوان" value={t.title} onChange={(title) => setT({ title })} />
                    <Field label="العنوان الفرعي" value={t.subtitle} onChange={(subtitle) => setT({ subtitle })} />
                    <Field label="الدولة / السوق" value={t.market} onChange={(market) => setT({ market })} />
                    <Field label="الملخص" long value={t.summary} onChange={(summary) => setT({ summary })} />
                    <div className="grid2">
                      <Field label="المبيعات" ltr value={r.metrics.sales} onChange={(v) => setM("sales", v)} />
                      <Field label="نسبة زيادة المبيعات" ltr value={r.metrics.salesDelta} onChange={(v) => setM("salesDelta", v)} />
                      <Field label="الطلبات" ltr value={r.metrics.orders} onChange={(v) => setM("orders", v)} />
                      <Field label="نسبة زيادة الطلبات" ltr value={r.metrics.ordersDelta} onChange={(v) => setM("ordersDelta", v)} />
                      <Field label="معدل التحويل" ltr value={r.metrics.conversion} onChange={(v) => setM("conversion", v)} />
                      <Field label="الفترة (أيام)" ltr value={r.metrics.period} onChange={(v) => setM("period", v)} />
                    </div>
                    <button className="btn red" onClick={() => patch({ resultsList: results.filter((_, n) => n !== i) })}>حذف النتيجة</button>
                  </div>
                );
              })}
            </div>
            <p><button className="btn light" onClick={() => patch({ resultsList: [...results, { id: `custom-${Date.now()}`, image: "", metrics: { sales: "", orders: "", conversion: "", period: "30" }, text: { ar: { title: "نتيجة جديدة", subtitle: "", market: "", alt: "", summary: "" }, en: { title: "New result", subtitle: "", market: "", alt: "", summary: "" } } }] })}>➕ إضافة نتيجة</button></p>
            {SaveBar}
          </>
        )}

        {page === "work" && (
          <>
            <div className="head"><h1>أعمال مختارة</h1>{LangSwitch}</div>
            {HeadingEditor({ sec: "work" })}
            <h3>المشاريع الحالية</h3>
            <div className="cards">
              {works.map((w, i) => (
                <div key={w.slug} className={`item${w.hidden ? " muted" : ""}`}>
                  <Thumb src={w.image} onPick={(image) => setWork(i, { ...w, image })} />
                  <Field label="اسم المشروع" value={w.text?.[lang]?.title} onChange={(title) => setWork(i, { ...w, text: { ...w.text, [lang]: { title } } })} />
                  <label>القسم<select value={w.categoryId} onChange={(e) => setWork(i, { ...w, categoryId: e.target.value })}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                  <button className="btn light" onClick={() => setWork(i, { ...w, hidden: !w.hidden })}>{w.hidden ? "👁️ إظهار في الموقع" : "🙈 إخفاء من الموقع"}</button>
                </div>
              ))}
            </div>
            {SaveBar}

            <h3 style={{ marginTop: 24 }}>مشاريع جديدة</h3>
            <form onSubmit={addProject} className="panel">
              <div className="grid2">
                <label>اسم المشروع<input name="title" required /></label>
                <label>القسم<select name="category">{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                <label>الصورة من جهازك<input name="file" type="file" accept="image/*" required /></label>
                <label>رابط (اختياري)<input name="link" type="url" dir="ltr" placeholder="https://" /></label>
              </div>
              <button className="btn" disabled={busy} type="submit">➕ إضافة المشروع</button>
            </form>
            <div className="cards">
              {projects.filter((p) => !p.category.startsWith("service-")).map((p) => (
                <div key={p.id} className="item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="thumb"><img src={p.image} alt={p.title} /></div>
                  <p style={{ margin: "0 0 10px" }}><strong>{p.title}</strong> · <small>{CATS[p.category] ?? svcName(p.category)}</small></p>
                  <button className="btn red" onClick={() => removeProject(p.id)}>حذف</button>
                </div>
              ))}
            </div>
          </>
        )}
        {page === "texts" && (() => {
          const sec = textSec;
          const base = (dict(lang) as unknown as Record<string, unknown>)[sec];
          const cur = deepMerge(base, st.content?.[lang]?.[sec]);
          const orig = leaves(base);
          return (
            <>
              <div className="head"><h1>كل نصوص الموقع</h1>
                <div style={{ display: "flex", gap: 6 }}>{(["ar", "en"] as Lang[]).map((l) => <button key={l} className={"btn" + (lang === l ? "" : " ghost")} onClick={() => setLang(l)}>{l === "ar" ? "عربي" : "English"}</button>)}</div>
              </div>
              <div className="panel">
                <label>اختر القسم<select value={sec} onChange={(e) => setTextSec(e.target.value)}>{TEXT_SECS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <p><small>كل خانة مكتوب فوقها النص الأصلي. عدّل اللي عايزه واضغط حفظ.</small></p>
                {leaves(cur).map(([path, v], i) => {
                  const o = orig.find(([p]) => p.join(".") === path.join("."))?.[1] ?? "";
                  return <Field key={path.join(".") + i} long={v.length > 70} label={"الأصلي: " + (o.length > 60 ? o.slice(0, 60) + "…" : o)} value={v}
                    onChange={(nv) => patch({ content: { ...st.content, [lang]: { ...st.content?.[lang], [sec]: setIn(cur, path, nv) } } })} />;
                })}
              </div>
              {SaveBar}
            </>
          );
        })()}
        {page === "spages" && (
          <>
            <h3>صفحات الخدمات</h3>
            <p><small>كل خدمة ليها صفحة منفصلة. ارفع صور ومشاريع لأي خدمة وهتظهر في صفحتها.</small></p>
            <form onSubmit={addProject} className="panel">
              <div className="grid2">
                <label>الخدمة<select name="category">{svcTitles.map((t, i) => <option key={i} value={`service-${i + 1}`}>{i + 1}. {t}</option>)}</select></label>
                <label>اسم المشروع / الصورة<input name="title" required /></label>
                <label>الصورة من جهازك<input name="file" type="file" accept="image/*" required /></label>
                <label>رابط (اختياري)<input name="link" type="url" dir="ltr" placeholder="https://" /></label>
              </div>
              <button className="btn" disabled={busy} type="submit">➕ إضافة</button>
            </form>
            <div className="cards">
              {projects.filter((p) => p.category.startsWith("service-")).map((p) => (
                <div key={p.id} className="item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <div className="thumb"><img src={p.image} alt={p.title} /></div>
                  <p style={{ margin: "0 0 10px" }}><strong>{p.title}</strong> · <small>{svcName(p.category)}</small></p>
                  <button className="btn red" onClick={() => removeProject(p.id)}>حذف</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
