/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";
// The visual composition uses heterogeneous Lucide icon tuples; rendering is fully type-safe at runtime.

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  BellRing,
  Box,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  Globe2,
  ImageUp,
  Layers,
  LockKeyhole,
  Menu,
  Mic,
  Moon,
  Package,
  Play,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { FidelOSMark } from "@/components/brand/fidelos-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const nav = [
  ["Producto", "#producto"],
  ["Inventario", "#inventario"],
  ["CRM", "#crm"],
  ["Automatización", "#automatizacion"],
  ["Seguridad", "#seguridad"],
  ["Reportes", "#reportes"],
  ["Preguntas frecuentes", "#preguntas"],
] as const;

const faqs = [
  ["¿Qué es FidelOS?", "Es una plataforma que reúne control de inventario y CRM para centralizar la operación y el seguimiento comercial."],
  ["¿Puedo manejar inventario y CRM juntos?", "Sí. FidelOS reúne productos, proveedores, clientes, oportunidades y actividades dentro del mismo sistema."],
  ["¿Puedo controlar permisos por usuario?", "Sí. La administración de usuarios, roles y permisos permite definir el acceso de cada persona."],
  ["¿Qué ocurre si pierdo la conexión?", "El Modo Contingencia permite continuar con operaciones soportadas localmente y sincronizarlas al recuperar conexión."],
  ["¿Puedo consultar el historial de cambios?", "Sí. Los movimientos de inventario y el módulo de auditoría aportan trazabilidad sobre las acciones realizadas."],
  ["¿FidelOS utiliza IA?", "La Captura IA puede procesar foto, voz o ambas para proponer registros de inventario. La revisión y confirmación siguen en tus manos."],
] as const;

const features = [
  [Package, "Catálogo ordenado", "Productos, categorías, marcas, unidades de medida y proveedores en un mismo sistema."],
  [Activity, "Movimientos trazables", "Las entradas, salidas y ajustes respaldan cada cambio de existencias."],
  [UsersRound, "Relaciones comerciales", "Conecta contactos, clientes, oportunidades y actividades de seguimiento."],
  [ShieldCheck, "Acceso con control", "Roles, permisos, auditoría y aislamiento por empresa para operar con confianza."],
] as const;

const heroStats = [
  [Layers, "10", "módulos en una plataforma"],
  [UsersRound, "7", "roles configurables"],
  [ShieldCheck, "1", "empresa, datos aislados"],
] as const;

const beforeList = [
  "Catálogo en Excel, desactualizado apenas alguien lo edita en paralelo.",
  "Nadie sabe con certeza cuánto stock hay realmente disponible.",
  "Clientes y seguimientos repartidos entre WhatsApp y notas sueltas.",
  "Oportunidades que se olvidan sin un responsable claro.",
  "Todo el equipo comparte el mismo usuario y los mismos permisos.",
  "Reportes armados a mano antes de cada reunión.",
] as const;

const afterList = [
  "Un catálogo único: productos, categorías, marcas y unidades.",
  "Stock respaldado por movimientos — entradas, salidas y ajustes.",
  "Contactos, clientes y oportunidades en el mismo lugar.",
  "Actividades y automatizaciones que mantienen el seguimiento vivo.",
  "Usuarios con roles y permisos individuales, con auditoría.",
  "Reportes de inventario, movimientos y CRM disponibles al instante.",
] as const;

const howItWorks = [
  ["Configura tu empresa", "Crea usuarios, define roles y ajusta las etapas del embudo comercial."],
  ["Carga productos y contactos", "Suma tu catálogo, proveedores, clientes y contactos iniciales."],
  ["Opera inventario y CRM", "Registra movimientos, avanza oportunidades y completa actividades."],
  ["Analiza y mejora", "Consulta reportes y auditoría para decidir con información real."],
] as const;

const audiences = ["Comercios", "Distribuidores", "Pequeñas y medianas empresas", "Bodegas", "Negocios con inventario", "Equipos comerciales"] as const;

const pulseEvents = [
  [RefreshCw, "Movimiento de stock registrado"],
  [BriefcaseBusiness, "Oportunidad avanzó de etapa"],
  [ClipboardCheck, "Actividad completada"],
  [BellRing, "Alerta de stock mínimo"],
  [Sparkles, "Automatización ejecutada"],
] as const;

/** Fades a block up into place the first time it enters the viewport. */
function useInView() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, visible] as const;
}

function Reveal({ className = "", delay = 0, children }: { className?: string; delay?: number; children: React.ReactNode }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={`mkt-reveal ${visible ? "mkt-reveal-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function CTA({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return (
    <Button
      nativeButton={false}
      variant={secondary ? "outline" : "default"}
      className={
        secondary
          ? "group relative h-11 overflow-hidden rounded-xl border-slate-300 bg-white/70 px-5 text-[#1e293b] hover:bg-white"
          : "group relative h-11 overflow-hidden rounded-xl bg-[#3949AB] px-5 text-white shadow-lg shadow-indigo-200 hover:bg-[#303f9f]"
      }
      render={<a href={href} />}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {!secondary && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      )}
    </Button>
  );
}

export function MarketingLanding() {
  const [menu, setMenu] = useState(false);
  const [tab, setTab] = useState("inventario");
  const [faq, setFaq] = useState<number | null>(null);
  const [notice, setNotice] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <main className="marketing min-h-screen overflow-x-hidden bg-[#fbfcff] text-[#0f172a]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700;800&display=swap');
        .mkt-display { font-family: "Unbounded", ui-sans-serif, system-ui, sans-serif; }
        .mkt-reveal { opacity: 0; transform: translateY(18px); transition: opacity .7s ease, transform .7s ease; }
        .mkt-reveal-in { opacity: 1; transform: translateY(0); }
        .mkt-drift { animation: mkt-drift 14s ease-in-out infinite; }
        @keyframes mkt-drift { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(14px, -12px) scale(1.06); } }
        .mkt-ticker { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); }
        .mkt-ticker-track { display: flex; width: max-content; animation: mkt-scroll 34s linear infinite; }
        @keyframes mkt-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) {
          .mkt-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .mkt-ticker-track, .mkt-drift { animation: none !important; }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[#fbfcff]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a href="#inicio" className="flex items-center gap-2.5" aria-label="FidelOS, inicio">
            <FidelOSMark className="size-9 text-[#3949AB]" />
            <span className="mkt-display text-lg font-bold tracking-tight">FidelOS</span>
          </a>
          <nav className="hidden items-center gap-5 xl:flex" aria-label="Navegación principal">
            {nav.slice(0, 6).map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-slate-600 hover:text-[#3949AB]">
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Cambiar tema">
              {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="ghost" nativeButton={false} render={<Link href="/login" />} className="rounded-xl">
              Iniciar sesión
            </Button>
            <CTA href="#demo">
              Solicitar una demo <ArrowRight className="size-4" />
            </CTA>
          </div>
          <Button variant="ghost" size="icon" className="rounded-xl md:hidden" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Abrir menú">
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
        {menu ? (
          <nav className="border-t border-slate-200 bg-white px-5 py-4 md:hidden" aria-label="Navegación móvil">
            {nav.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#334155] hover:bg-indigo-50">
                {label}
              </a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" nativeButton={false} render={<Link href="/login" />}>
                Iniciar sesión
              </Button>
              <CTA href="#demo">Demo</CTA>
            </div>
          </nav>
        ) : null}
      </header>

      <section id="inicio" className="hero-stage relative isolate overflow-hidden px-5 pb-20 pt-16 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="hero-grid absolute inset-0 -z-20 opacity-50" />
        <div className="hero-glow hero-glow-indigo mkt-drift absolute -right-28 -top-20 -z-10 size-[38rem] rounded-full blur-3xl" />
        <div className="hero-glow hero-glow-teal mkt-drift absolute left-[12%] top-56 -z-10 size-72 rounded-full blur-3xl" style={{ animationDelay: "-7s" }} />
        <div className="mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-3xl text-center">
            <span className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/75 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[.1em] text-[#3949AB] shadow-sm">
              <Sparkles className="size-3.5" /> Inventario + CRM en una sola plataforma
            </span>
            <h1 className="mkt-display mt-6 text-4xl leading-[1.06] font-bold tracking-[-.02em] text-[#020617] sm:text-6xl lg:text-[4.4rem]">
              Más control para tu operación. <span className="hero-gradient-text">Mejor seguimiento</span> para tus ventas.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              FidelOS centraliza productos, stock, movimientos, clientes, oportunidades, actividades, automatizaciones y reportes para que tu equipo trabaje con la misma información.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <CTA href="#demo">
                Solicitar una demo <ArrowRight className="size-4" />
              </CTA>
              <CTA href="#producto" secondary>
                <Play className="size-4 fill-current" /> Ver cómo funciona
              </CTA>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
              {heroStats.map(([Icon, value, label]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
                  <Icon className="size-3.5 text-[#3949AB]" />
                  <span className="font-mono font-bold text-[#0f172a]">{value}</span> {label}
                </span>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-500">
              <BadgeCheck className="mr-1 inline size-4 text-[#43A047]" /> Actualmente en versión Beta
            </p>
          </Reveal>
          <Reveal delay={150}>
            <HeroVisual />
          </Reveal>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="eyebrow">EL CAMBIO REAL</p>
            <h2 className="mkt-display section-title mx-auto max-w-3xl">Deja de administrar tu negocio entre Excel, WhatsApp y notas sueltas.</h2>
            <p className="section-copy mx-auto max-w-2xl">Lo que hoy vive repartido en varias herramientas, en FidelOS vive en un solo lugar.</p>
          </Reveal>
          <Reveal delay={100} className="mt-12 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-rose-700">Antes</p>
              <ul className="mt-4 space-y-3">
                {beforeList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <X className="mt-0.5 size-4 shrink-0 text-rose-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#3949AB]">Con FidelOS</p>
              <ul className="mt-4 space-y-3">
                {afterList.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-[#1e293b]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#43A047]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="producto" className="border-y border-slate-200 bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">UNA VISTA PARA OPERAR MEJOR</p>
          <div className="mt-3 grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <Reveal>
              <h2 className="mkt-display section-title">Todo tu negocio, conectado.</h2>
              <p className="section-copy">Cuando inventario y relación comercial viven por separado, el equipo pierde contexto. FidelOS los reúne para que el trabajo diario sea más claro y trazable.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {features.map(([Icon, title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                    <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-[#3949AB]">
                      <Icon className="size-4" />
                    </span>
                    <h3 className="mt-3 font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={120}>
              <DarkOverview />
            </Reveal>
          </div>
        </div>
      </section>

      <section id="inventario" className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow">CONTROL DE INVENTARIO</p>
          <div className="mt-3 grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <h2 className="mkt-display section-title">Conoce lo que tienes y cómo cambió.</h2>
              <p className="section-copy">Organiza el catálogo y consulta stock, movimientos y proveedores desde un entorno diseñado para la operación diaria.</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {["Productos y catálogo", "Categorías, marcas y unidades", "Stock y alertas de mínimo", "Entradas, salidas y ajustes", "Proveedores y productos asociados", "Reportes de inventario"].map((item) => (
                  <li key={item} className="flex gap-2 text-sm font-medium text-[#334155]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#43A047]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={120}>
              <InventoryMockup />
            </Reveal>
          </div>
          <Reveal className="mt-16 rounded-[2rem] border border-indigo-100 bg-[linear-gradient(135deg,#eef0ff,white_60%)] p-7 lg:p-10">
            <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr] md:items-center">
              <div>
                <span className="grid size-11 place-items-center rounded-2xl bg-[#3949AB] text-white">
                  <RefreshCw className="size-5" />
                </span>
                <h3 className="mkt-display mt-4 text-2xl font-bold tracking-tight">El stock no se cambia sin contexto.</h3>
                <p className="mt-3 text-slate-600">Cada variación se registra mediante un movimiento para conservar la trazabilidad de tu inventario.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Entrada", ArrowDown, "#43A047"],
                  ["Salida", ArrowUp, "#E53935"],
                  ["Ajuste", SlidersHorizontal, "#FFA000"],
                ].map(([title, Icon, color]) => (
                  <div key={title} className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                    <Icon className="size-5" style={{ color }} />
                    <p className="mt-5 font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">Movimiento → Stock</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="automatizacion" className="bg-[#101936] px-5 py-20 text-white lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-xs font-bold tracking-[.18em] text-teal-300">CAPTURA IA + CONTINUIDAD</p>
            <h2 className="mkt-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Menos digitación. El control sigue siendo tuyo.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-indigo-100">La Captura IA recibe foto, voz o ambas para proponer registros de inventario. Tú revisas y confirmas antes de aplicarlos.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                [ImageUp, "Foto"],
                [Mic, "Voz"],
                [ScanLine, "Foto + voz"],
                [FileCheck2, "Revisar y confirmar"],
              ].map(([Icon, label]) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm">
                  <Icon className="size-4 text-teal-300" />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="mkt-drift absolute -right-12 -top-12 -z-0 size-52 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="relative rounded-2xl bg-white p-5 text-[#0f172a]">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-[#3949AB]">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">Captura IA</p>
                  <p className="text-xs text-slate-500">Propuesta pendiente de revisión</p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Detalles detectados</span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Revisar</span>
                </div>
                <div className="mt-4 h-16 rounded-lg bg-gradient-to-r from-indigo-50 via-slate-100 to-teal-50" />
                <div className="mt-4 flex justify-end gap-2">
                  <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">Descartar</span>
                  <span className="rounded-lg bg-[#3949AB] px-3 py-1.5 text-sm text-white">Confirmar</span>
                </div>
              </div>
            </div>
            <div className="relative mt-4 flex gap-3 rounded-2xl border border-teal-400/20 bg-teal-400/10 p-4">
              <Globe2 className="mt-0.5 size-5 shrink-0 text-teal-300" />
              <div>
                <p className="font-semibold">La operación puede continuar sin conexión</p>
                <p className="mt-1 text-sm leading-6 text-indigo-100">El Modo Contingencia guarda operaciones soportadas localmente y las sincroniza al volver la conexión, con control de conflictos.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section id="crm" className="px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="eyebrow text-[#00897B]">CRM INTEGRADO</p>
            <h2 className="mkt-display section-title mx-auto max-w-3xl">Cada conversación puede tener un siguiente paso.</h2>
            <p className="section-copy mx-auto max-w-2xl">Conserva el contexto comercial desde el primer contacto hasta el seguimiento de una oportunidad.</p>
          </Reveal>
          <Reveal delay={80} className="mt-12 grid gap-4 md:grid-cols-4">
            {[
              [UsersRound, "Contacto", "Datos y relación comercial"],
              [BriefcaseBusiness, "Oportunidad", "Valor, etapa y responsable"],
              [ClipboardCheck, "Actividad", "Seguimientos programados"],
              [BadgeCheck, "Cierre", "Historial para decidir"],
            ].map(([Icon, title, text], i) => (
              <div key={title} className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-[#00897B]">
                  <Icon className="size-5" />
                </span>
                <p className="mt-5 font-mono text-xs font-bold text-teal-700">0{i + 1}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            ))}
          </Reveal>
          <Reveal delay={160} className="mt-16 grid gap-8 rounded-[2rem] bg-teal-50 p-7 lg:grid-cols-[1fr_.9fr] lg:items-center lg:p-10">
            <div>
              <h3 className="mkt-display text-3xl font-bold tracking-tight">Seguimientos que no se quedan en la memoria.</h3>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">Las oportunidades centralizan estado, valor y responsable. Las actividades ayudan a que el equipo mantenga las llamadas, tareas y seguimientos a la vista.</p>
              <div className="mt-7 flex items-center gap-3 text-sm font-medium text-[#00897B]">
                <BellRing className="size-4" /> Automatizaciones configurables pueden crear seguimientos y avisar al equipo en eventos definidos.
              </div>
            </div>
            <div className="relative">
              <div className="mkt-drift absolute -inset-6 -z-10 rounded-full bg-teal-200/40 blur-3xl" />
              <Image
                src="/images/marketing/fidelos-crm-relationships.png"
                alt="Red de contactos y relaciones comerciales conectadas en el CRM de FidelOS"
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 480px, 100vw"
                className="h-auto w-full rounded-[1.75rem] shadow-xl shadow-teal-900/10"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="reportes" className="border-y border-slate-200 bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="eyebrow">REPORTES Y AUDITORÍA</p>
              <h2 className="mkt-display section-title">Decide con información, no con suposiciones.</h2>
              <p className="section-copy">Consulta reportes sobre existencias, movimientos, terceros y CRM; complementa el análisis con un registro de auditoría de las acciones realizadas.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [BarChart3, "Inventario", "Stock actual, stock bajo, categorías, marcas y proveedores."],
                [FileText, "Movimientos", "Movimientos y kardex por producto."],
                [UsersRound, "Relaciones", "Reportes de clientes, contactos y oportunidades CRM."],
                [LockKeyhole, "Auditoría", "Usuario, módulo, acción y fecha para consultar trazabilidad."],
              ].map(([Icon, title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
                  <Icon className="size-5 text-[#3949AB]" />
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="seguridad" className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-gradient-to-br from-[#303f9f] to-[#101936] p-8 text-white lg:grid-cols-[.9fr_1.1fr] lg:p-12">
          <div>
            <p className="font-mono text-xs font-bold tracking-[.18em] text-indigo-200">SEGURIDAD EMPRESARIAL</p>
            <h2 className="mkt-display mt-3 text-4xl font-bold tracking-tight">Cada persona ve y hace solo lo que necesita.</h2>
            <p className="mt-5 max-w-xl text-indigo-100">FidelOS combina usuarios, roles y permisos con aislamiento por empresa. La auditoría permite consultar quién hizo qué y cuándo.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [UsersRound, "Usuarios", "Administra las personas de tu empresa."],
              [LockKeyhole, "Roles y permisos", "Define el acceso por responsabilidad."],
              [Database, "Aislamiento", "La información opera por empresa."],
              [FileCheck2, "Auditoría", "Consulta acciones, módulos y fechas."],
            ].map(([Icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10">
                <Icon className="size-5 text-teal-300" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-indigo-100">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="text-center">
            <p className="eyebrow">CÓMO FUNCIONA</p>
            <h2 className="mkt-display section-title mx-auto max-w-2xl">De cero a operando, en cuatro pasos.</h2>
          </Reveal>
          <Reveal delay={100} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map(([title, text], i) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <p className="font-mono text-xs font-bold text-[#3949AB]">0{i + 1}</p>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <p className="eyebrow">PARA QUIÉN ES</p>
            <h2 className="mkt-display section-title mx-auto max-w-2xl">Construido para equipos que necesitan controlar operación y ventas.</h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {audiences.map((label) => (
                <span key={label} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-sm">
                  {label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">EXPLORA FIDELOS</p>
              <h2 className="mkt-display section-title">Una plataforma, diferentes momentos de trabajo.</h2>
            </div>
            <p className="max-w-md text-slate-600">Cada vista refleja módulos existentes, sin promesas de datos ni capacidades que no están en el producto.</p>
          </Reveal>
          <Reveal delay={100} className="mt-8">
            <div role="tablist" aria-label="Demostración de módulos" className="flex w-full gap-2 overflow-x-auto pb-2">
              {[
                ["inventario", "Inventario"],
                ["crm", "CRM"],
                ["reportes", "Reportes"],
                ["seguridad", "Seguridad"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-[#3949AB] text-white shadow-md" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-indigo-200"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <DemoPanel active={tab} />
          </Reveal>
        </div>
      </section>

      <section id="preguntas" className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <p className="eyebrow">PREGUNTAS FRECUENTES</p>
            <h2 className="mkt-display section-title">Lo esencial, claro.</h2>
          </Reveal>
          <Reveal delay={100} className="mt-9 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-5">
            {faqs.map(([question, answer], index) => {
              const open = faq === index;
              return (
                <div key={question}>
                  <button className="flex w-full items-center justify-between gap-4 py-5 text-left font-semibold" onClick={() => setFaq(open ? null : index)} aria-expanded={open}>
                    <span>{question}</span>
                    <ChevronDown className={`size-5 shrink-0 text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                    <div className="overflow-hidden">
                      <p className="pb-5 pr-8 leading-7 text-slate-600">{answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      <section id="demo" className="px-5 py-20 lg:px-8">
        <Reveal className="mx-auto grid max-w-7xl gap-10 rounded-[2rem] bg-[linear-gradient(135deg,#eef0ff,white_55%,#e6faf8)] p-7 ring-1 ring-indigo-100 lg:grid-cols-[1fr_.9fr] lg:p-12">
          <div>
            <p className="eyebrow">HABLEMOS</p>
            <h2 className="mkt-display section-title">Da el siguiente paso hacia una operación más organizada.</h2>
            <p className="section-copy">Cuéntanos sobre tu empresa para preparar una conversación enfocada en tu operación y proceso comercial.</p>
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <strong>FidelOS está en Beta.</strong> El formulario está listo para conectarse a tu canal comercial; actualmente no envía información a ningún servicio.
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setNotice(true);
            }}
            className="rounded-2xl bg-white p-5 shadow-xl shadow-indigo-100 sm:p-7"
          >
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                Nombre
                <Input required name="nombre" placeholder="Tu nombre" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Empresa
                <Input required name="empresa" placeholder="Nombre de tu empresa" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Email
                <Input required name="email" type="email" placeholder="nombre@empresa.com" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Teléfono <span className="font-normal text-slate-500">(opcional)</span>
                <Input name="telefono" type="tel" placeholder="Tu número" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Mensaje
                <Textarea name="mensaje" placeholder="Cuéntanos qué quieres organizar" />
              </label>
            </div>
            <Button type="submit" className="mt-5 h-11 w-full rounded-xl bg-[#3949AB] hover:bg-[#303f9f]">
              Preparar solicitud <ArrowRight className="size-4" />
            </Button>
            {notice ? (
              <p role="status" className="mt-3 text-center text-sm text-[#00897B]">
                Formulario validado localmente. Falta configurar el canal comercial para enviarlo.
              </p>
            ) : null}
          </form>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <FidelOSMark className="size-8 text-[#3949AB]" />
              <span className="mkt-display font-bold">FidelOS</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-600">Control de inventario + CRM para organizar operación y ventas.</p>
            <p className="mt-3 text-xs font-medium text-amber-700">Versión Beta</p>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm">
            <a href="#producto">Producto</a>
            <a href="#seguridad">Seguridad</a>
            <a href="#inventario">Inventario</a>
            <a href="#reportes">Reportes</a>
            <a href="#crm">CRM</a>
            <Link href="/login">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="hero-visual relative mx-auto mt-14 max-w-6xl">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-r from-indigo-200/45 via-transparent to-teal-200/55 blur-2xl" />

      <div className="hero-float hero-float-left absolute -left-5 top-[14%] z-10 hidden w-48 rounded-2xl border border-white/75 bg-white/90 p-4 shadow-2xl shadow-indigo-200/50 backdrop-blur lg:block">
        <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-[#3949AB]">
          <RefreshCw className="size-4" />
        </span>
        <p className="mt-3 text-sm font-bold text-[#0f172a]">Stock trazable</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">Entradas, salidas y ajustes con respaldo.</p>
        <div className="mt-3 flex gap-1">
          <i className="h-1.5 flex-1 rounded-full bg-[#43A047]" />
          <i className="h-1.5 flex-1 rounded-full bg-[#3949AB]" />
          <i className="h-1.5 flex-1 rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="hero-float hero-float-right absolute -right-6 bottom-[10%] z-10 hidden w-52 rounded-2xl border border-white/75 bg-[#101936]/95 p-4 text-white shadow-2xl shadow-indigo-300/60 backdrop-blur lg:block">
        <span className="grid size-9 place-items-center rounded-xl bg-teal-400/15 text-teal-300">
          <BriefcaseBusiness className="size-4" />
        </span>
        <p className="mt-3 text-sm font-bold">Seguimiento en contexto</p>
        <p className="mt-1 text-xs leading-5 text-indigo-100">Contactos, oportunidades y actividades conectados.</p>
        <div className="mt-3 flex items-center gap-1.5">
          <i className="size-1.5 rounded-full bg-teal-300" />
          <i className="h-1.5 flex-1 rounded-full bg-white/15" />
        </div>
      </div>

      <ProductMockup />

      <div className="hero-caption mx-auto mt-7 max-w-2xl">
        <p className="mb-3 text-center font-mono text-[11px] uppercase tracking-[.14em] text-slate-400">Lo que tu equipo ve en el panel</p>
        <div className="mkt-ticker rounded-full border border-slate-200 bg-white/70 py-2.5 shadow-sm backdrop-blur">
          <div className="mkt-ticker-track">
            {[...pulseEvents, ...pulseEvents].map(([Icon, label], i) => (
              <span key={i} className="flex shrink-0 items-center gap-2 px-5 text-xs font-medium whitespace-nowrap text-slate-600">
                <Icon className="size-3.5 text-[#00897B]" />
                {label}
                <span className="mx-3 h-1 w-1 rounded-full bg-slate-300" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="hero-product mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/60 p-2 shadow-[0_30px_70px_-20px_rgba(49,46,129,.25)]">
      <div className="overflow-hidden rounded-[1.5rem]">
        <Image
          src="/images/marketing/fidelos-hero-product.png"
          alt="Panel de FidelOS mostrando catálogo de inventario, pipeline comercial y actividad reciente"
          width={1586}
          height={992}
          priority
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}

function DarkOverview() {
  return (
    <div className="rounded-[2rem] bg-slate-950 p-4 shadow-2xl shadow-slate-300">
      <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#111934] p-5 text-white">
        <div className="mkt-drift absolute -right-10 -top-10 -z-0 size-40 rounded-full bg-teal-400/20 blur-3xl" style={{ animationDelay: "-4s" }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Pulso comercial y operativo</p>
            <p className="mt-1 text-xs text-indigo-200">La información relevante, sin cambiar de herramienta.</p>
          </div>
          <Box className="size-5 text-teal-300" />
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3">
          {[
            [Package, "Inventario", "Productos y stock"],
            [BriefcaseBusiness, "CRM", "Pipeline y actividades"],
          ].map(([Icon, label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <Icon className="size-4 text-teal-300" />
              <p className="mt-4 text-xs text-indigo-200">{label}</p>
              <p className="mt-1 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-100">Actividad reciente</p>
            <svg width="72" height="24" viewBox="0 0 72 24" fill="none" className="text-teal-300" aria-hidden="true">
              <path d="M1 18 L13 12 L25 15 L37 6 L49 10 L61 3 L71 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Entrada · Producto A", "hace 2 min"],
              ["Oportunidad avanzó a Propuesta", "hace 12 min"],
              ["Ajuste de stock revisado", "hace 40 min"],
            ].map(([label, time]) => (
              <div key={label} className="flex items-center gap-3">
                <i className="size-2 rounded-full bg-teal-400" />
                <span className="flex-1 truncate text-xs text-indigo-100">{label}</span>
                <span className="font-mono text-[10px] text-indigo-300">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryMockup() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/50">
      <Image
        src="/images/marketing/fidelos-inventory-traceability.png"
        alt="Ilustración del flujo de entradas, ajustes y salidas de inventario en FidelOS"
        width={1536}
        height={1024}
        sizes="(min-width: 1024px) 560px, 100vw"
        className="h-auto w-full rounded-2xl"
      />
      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Inventario</p>
          <p className="text-xs text-slate-500">Productos y existencias, siempre trazables</p>
        </div>
        <span className="rounded-lg bg-indigo-50 p-2 text-[#3949AB]">
          <Box className="size-5" />
        </span>
      </div>
    </div>
  );
}

function DemoPanel({ active }: { active: string }) {
  const items: Record<string, [typeof Package, string, string, string[], boolean]> = {
    inventario: [Package, "Inventario en contexto", "Consulta catálogo, existencias, movimientos y alertas desde una misma operación.", ["Productos", "Stock", "Movimientos", "Proveedores"], false],
    crm: [BriefcaseBusiness, "CRM que acompaña el seguimiento", "Conecta contactos, oportunidades y actividades para mantener el trabajo comercial visible.", ["Contactos", "Oportunidades", "Actividades", "Automatizaciones"], true],
    reportes: [BarChart3, "Información para revisar", "Abre reportes de inventario, movimientos, terceros y CRM según las necesidades del equipo.", ["Stock actual", "Kardex", "Clientes", "Auditoría"], false],
    seguridad: [ShieldCheck, "Acceso administrado", "Define usuarios, roles y permisos mientras mantienes el rastro de las acciones relevantes.", ["Usuarios", "Roles", "Permisos", "Auditoría"], true],
  };
  const [Icon, title, text, labels, teal] = items[active];
  return (
    <div role="tabpanel" className="mt-3 grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[.8fr_1.2fr] lg:p-8">
      <div>
        <span className={`grid size-11 place-items-center rounded-2xl ${teal ? "bg-teal-50 text-[#00897B]" : "bg-indigo-50 text-[#3949AB]"}`}>
          <Icon className="size-5" />
        </span>
        <h3 className="mkt-display mt-5 text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 leading-7 text-slate-600">{text}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {labels.map((label, index) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className={`h-2 w-1/2 rounded ${teal ? "bg-teal-200" : "bg-indigo-200"}`} />
            <p className="mt-8 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-slate-500">Vista disponible en FidelOS</p>
            <div className={`mt-4 h-1.5 rounded-full ${index % 2 ? "bg-slate-200" : teal ? "bg-teal-100" : "bg-indigo-100"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
