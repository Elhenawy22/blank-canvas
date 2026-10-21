"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { fetchSettings, type SiteSettings } from "@/lib/site-settings";

type Order = { id: string; name: string; phone: string; company: string | null; service: string; message: string; status: string; created_at: string };
type Proj = { id: string; title: string; category: string; image: string; link: string | null; sort: number };

const STATUS: Record<string, string> = { new: "جديد", contacted: "تم التواصل", done: "مكتمل" };
const CATS: Record<string, string> = { branding: "هوية بصرية", social: "سوشيال ميديا", dev: "برمجة وتصميم", photo: "تصوير", video: "فيديو" };
const FIELDS: [keyof SiteSettings, string, string?][] = [
  ["siteName", "اسم الموقع"],
  ["email", "البريد الإلكتروني", "ltr"],
  ["phone", "رقم الهاتف", "ltr"],
  ["whatsapp", "رقم الواتساب (بالكود الدولي مثل 2012...)", "ltr"],
  ["address", "العنوان"],
  ["instagram", "رابط إنستجرام", "ltr"],
  ["facebook", "رابط فيسبوك", "ltr"],
  ["linkedin", "رابط لينكدإن", "ltr"],
  ["x", "رابط X (تويتر)", "ltr"],
  ["youtube", "رابط يوتيوب", "ltr"],
];

/** Shrinks a picture from the computer to a compact JPEG so it can be stored directly. */
function toDataUrl(file: File, max = 1400): Promise<string> {
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
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

const css = `
.adm{max-width:960px;margin:0 auto;padding:100px 16px 60px;font-size:16px}
.adm h1{font-size:clamp(22px,5vw,32px);margin:0}
.adm input,.adm select,.adm textarea{display:block;width:100%;box-sizing:border-box;padding:12px;margin:6px 0 14px;border-radius:10px;border:1px solid #ccc;font:inherit;background:#fff;color:#111}
.adm .btn{padding:10px 18px;border-radius:999px;border:0;background:#16162a;color:#fff;cursor:pointer;font:inherit;min-height:44px}
.adm .btn.gray{background:#888}.adm .btn.red{background:#b42318}
.adm .bar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.adm .tabs{display:flex;gap:6px;margin:18px 0;overflow-x:auto}
.adm .tabs button{flex:1;white-space:nowrap;padding:10px 14px;border-radius:999px;border:1px solid #16162a;background:transparent;color:inherit;font:inherit;cursor:pointer;min-height:44px}
.adm .tabs button.on{background:#16162a;color:#fff}
.adm .card{border:1px solid #ddd;border-radius:14px;padding:14px;margin:12px 0;overflow-wrap:anywhere}
.adm .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.adm .grid img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:block}
.adm .two{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
@media(max-width:640px){.adm .two{grid-template-columns:1fr}.adm{padding-top:90px}}
`;

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"orders" | "settings" | "projects">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [projects, setProjects] = useState<Proj[]>([]);
  const [msg, setMsg] = useState("");
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
      if (ok) { loadOrders(); loadProjects(); fetchSettings(true).then(setSettings); }
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

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setMsg("");
    const { error } = await db.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    if (error) setMsg("بيانات الدخول غير صحيحة.");
  }

  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    FIELDS.forEach(([k]) => { const v = String(f.get(k) ?? "").trim(); if (v) data[k] = v; });
    setBusy(true);
    const { error } = await db.from("site_settings").upsert({ id: 1, data, updated_at: new Date().toISOString() });
    setBusy(false);
    setMsg(error ? "حصل خطأ في الحفظ: " + error.message : "تم حفظ الإعدادات ✓");
    if (!error) setSettings(data);
  }

  async function addProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("file") as File;
    if (!file || !file.size) return setMsg("اختر صورة من جهازك.");
    setBusy(true);
    try {
      const image = await toDataUrl(file);
      const { error } = await db.from("cms_projects").insert({
        title: String(f.get("title")),
        category: String(f.get("category")),
        link: String(f.get("link") || "") || null,
        sort: Number(f.get("sort") || 0),
        image,
      });
      setMsg(error ? "حصل خطأ: " + error.message : "تم رفع المشروع ✓");
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

  if (!ready) return <main dir="rtl" className="adm"><style>{css}</style>جارٍ التحميل…</main>;

  if (!session)
    return (
      <main dir="rtl" className="adm" style={{ maxWidth: 420 }}>
        <style>{css}</style>
        <h1>لوحة التحكم</h1>
        <form onSubmit={signIn} style={{ marginTop: 20 }}>
          <label>البريد الإلكتروني<input name="email" type="email" required dir="ltr" /></label>
          <label>كلمة المرور<input name="password" type="password" required dir="ltr" /></label>
          <button className="btn" type="submit" style={{ width: "100%" }}>تسجيل الدخول</button>
        </form>
        <p aria-live="polite">{msg}</p>
      </main>
    );

  return (
    <main dir="rtl" className="adm">
      <style>{css}</style>
      <div className="bar">
        <h1>لوحة التحكم</h1>
        <button className="btn gray" onClick={() => db.auth.signOut()}>خروج</button>
      </div>
      {!isAdmin ? <p>هذا الحساب ليس له صلاحية المدير.</p> : (
        <>
          <div className="tabs">
            {([["orders", `الطلبات (${orders.length})`], ["settings", "بيانات الموقع"], ["projects", `المشاريع (${projects.length})`]] as const).map(([k, l]) => (
              <button key={k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setMsg(""); }}>{l}</button>
            ))}
          </div>
          {msg && <p aria-live="polite" className="card">{msg}</p>}

          {tab === "orders" && (
            <>
              <button className="btn" onClick={loadOrders}>تحديث</button>
              {orders.length === 0 ? <p>لا توجد طلبات بعد.</p> : orders.map((o) => (
                <article key={o.id} className="card">
                  <div className="bar">
                    <strong>{o.name}{o.company ? ` — ${o.company}` : ""}</strong>
                    <small>{new Date(o.created_at).toLocaleString("ar-EG")}</small>
                  </div>
                  <p>📞 <a dir="ltr" href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{o.phone}</a> · {o.service}</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{o.message}</p>
                  <div className="bar" style={{ justifyContent: "flex-start" }}>
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ width: "auto", margin: 0 }}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn red" onClick={() => removeOrder(o.id)}>حذف</button>
                  </div>
                </article>
              ))}
            </>
          )}

          {tab === "settings" && (
            <form onSubmit={saveSettings} key={JSON.stringify(settings)} className="card">
              <p style={{ marginTop: 0 }}>اترك الحقل فاضي لاستخدام القيمة الحالية في الموقع.</p>
              <div className="two">
                {FIELDS.map(([k, label, dir]) => (
                  <label key={k}>{label}<input name={k} defaultValue={settings[k] ?? ""} dir={dir} /></label>
                ))}
              </div>
              <button className="btn" disabled={busy} type="submit" style={{ width: "100%" }}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button>
            </form>
          )}

          {tab === "projects" && (
            <>
              <form onSubmit={addProject} className="card">
                <strong>رفع مشروع جديد</strong>
                <div className="two" style={{ marginTop: 10 }}>
                  <label>اسم المشروع<input name="title" required /></label>
                  <label>القسم<select name="category">{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
                  <label>الصورة من جهازك<input name="file" type="file" accept="image/*" required /></label>
                  <label>رابط (اختياري)<input name="link" type="url" dir="ltr" placeholder="https://" /></label>
                  <label>الترتيب (رقم أصغر = يظهر أولاً)<input name="sort" type="number" defaultValue={0} /></label>
                </div>
                <button className="btn" disabled={busy} type="submit" style={{ width: "100%" }}>{busy ? "جارٍ الرفع…" : "رفع"}</button>
              </form>
              <div className="grid">
                {projects.map((p) => (
                  <div key={p.id} className="card" style={{ margin: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.title} />
                    <p style={{ margin: "8px 0" }}><strong>{p.title}</strong><br /><small>{CATS[p.category] ?? p.category}</small></p>
                    <button className="btn red" style={{ width: "100%" }} onClick={() => removeProject(p.id)}>حذف</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
