"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { db } from "@/lib/db";

type Order = {
  id: string;
  name: string;
  phone: string;
  company: string | null;
  service: string;
  message: string;
  status: string;
  created_at: string;
};

const STATUS: Record<string, string> = { new: "جديد", contacted: "تم التواصل", done: "مكتمل" };

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");

  useEffect(() => {
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = db.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data: ok } = await db.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setIsAdmin(!!ok);
      if (ok) load();
    })();
  }, [session]);

  async function load() {
    const { data } = await db.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
  }

  async function auth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setMsg("");
    if (mode === "in") {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) setMsg("بيانات الدخول غير صحيحة أو الحساب غير مُفعّل.");
    } else {
      const { error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.href },
      });
      setMsg(error ? error.message : "تم إنشاء الحساب — افتح بريدك واضغط رابط التأكيد ثم سجّل الدخول.");
    }
  }

  async function setStatus(id: string, status: string) {
    await db.from("orders").update({ status }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("حذف الطلب؟")) return;
    await db.from("orders").delete().eq("id", id);
    load();
  }

  const box: React.CSSProperties = { maxWidth: 1000, margin: "0 auto", padding: "120px 20px 60px" };
  const input: React.CSSProperties = { display: "block", width: "100%", padding: 12, margin: "6px 0 14px", borderRadius: 10, border: "1px solid #ccc", font: "inherit" };
  const btn: React.CSSProperties = { padding: "10px 18px", borderRadius: 999, border: 0, background: "#16162a", color: "#fff", cursor: "pointer", font: "inherit" };

  if (!ready) return <main dir="rtl" style={box}>جارٍ التحميل…</main>;

  if (!session)
    return (
      <main dir="rtl" style={{ ...box, maxWidth: 420 }}>
        <h1>لوحة التحكم</h1>
        <form onSubmit={auth}>
          <label>البريد الإلكتروني<input name="email" type="email" required style={input} dir="ltr" /></label>
          <label>كلمة المرور<input name="password" type="password" required minLength={6} style={input} dir="ltr" /></label>
          <button style={btn} type="submit">{mode === "in" ? "تسجيل الدخول" : "إنشاء حساب المدير"}</button>
        </form>
        <p style={{ marginTop: 16 }}>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} style={{ ...btn, background: "transparent", color: "inherit", textDecoration: "underline", padding: 0 }}>
            {mode === "in" ? "أول مرة؟ أنشئ حساب المدير" : "لديك حساب؟ سجّل الدخول"}
          </button>
        </p>
        <p aria-live="polite">{msg}</p>
      </main>
    );

  return (
    <main dir="rtl" style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <h1>الطلبات ({orders.length})</h1>
        <div style={{ display: "flex", gap: 8 }}>
          {isAdmin && <button style={btn} onClick={load}>تحديث</button>}
          <button style={{ ...btn, background: "#888" }} onClick={() => db.auth.signOut()}>خروج</button>
        </div>
      </div>
      {!isAdmin ? (
        <p>هذا الحساب ليس له صلاحية المدير.</p>
      ) : orders.length === 0 ? (
        <p>لا توجد طلبات بعد.</p>
      ) : (
        orders.map((o) => (
          <article key={o.id} style={{ border: "1px solid #ddd", borderRadius: 14, padding: 16, margin: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <strong>{o.name}{o.company ? ` — ${o.company}` : ""}</strong>
              <small>{new Date(o.created_at).toLocaleString("ar-EG")}</small>
            </div>
            <p>📞 <a dir="ltr" href={`https://wa.me/${o.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{o.phone}</a> · {o.service}</p>
            <p style={{ whiteSpace: "pre-wrap" }}>{o.message}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} style={{ padding: 8, borderRadius: 8 }}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button style={{ ...btn, background: "#b42318" }} onClick={() => remove(o.id)}>حذف</button>
            </div>
          </article>
        ))
      )}
    </main>
  );
}
