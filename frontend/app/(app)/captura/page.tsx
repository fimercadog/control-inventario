"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Camera, Mic, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  {
    href: "/captura/foto",
    icon: Camera,
    title: "Foto",
    description: "Toma una foto de tu estantería, pallet o bodega. Detectamos todos los productos.",
    emoji: "📷",
  },
  {
    href: "/captura/foto-voz",
    icon: Sparkles,
    title: "Foto + Voz",
    description: "La combinación más rápida: la foto identifica el producto, tu voz da la cantidad.",
    emoji: "✨",
    featured: true,
  },
  {
    href: "/captura/voz",
    icon: Mic,
    title: "Voz",
    description: "Dicta el movimiento en lenguaje natural: \"Entraron cinco bolsas de Dog Chow\".",
    emoji: "🎤",
  },
];

export default function CapturaHomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex max-w-xl flex-col items-center gap-3"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" />
          Registro inteligente de inventario
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          ¿Cómo quieres registrar tu inventario?
        </h1>
        <p className="text-balance text-muted-foreground sm:text-lg">
          Sin formularios largos. Toma una foto o habla — un empleado experto se encarga del resto.
        </p>
      </motion.div>

      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {OPTIONS.map((option, index) => (
          <motion.div
            key={option.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 + index * 0.08, ease: "easeOut" }}
            className={cn("flex", option.featured && "sm:-my-3")}
          >
            <Link
              href={option.href}
              className={cn(
                "group relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl border p-8 text-center transition-all hover:-translate-y-1 hover:shadow-2xl",
                option.featured
                  ? "border-primary/30 bg-primary text-primary-foreground shadow-xl shadow-primary/25 sm:py-11"
                  : "border-border/60 bg-card hover:border-primary/40 hover:shadow-primary/10"
              )}
            >
              {option.featured && (
                <span className="absolute right-4 top-4 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-medium">
                  Recomendado
                </span>
              )}

              <div
                className={cn(
                  "flex size-16 items-center justify-center rounded-2xl text-3xl transition-transform group-hover:scale-110",
                  option.featured ? "bg-primary-foreground/15" : "bg-primary/10"
                )}
              >
                {option.emoji}
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-xl font-semibold">{option.title}</h2>
                <p
                  className={cn(
                    "text-sm",
                    option.featured ? "text-primary-foreground/85" : "text-muted-foreground"
                  )}
                >
                  {option.description}
                </p>
              </div>

              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-sm font-medium transition-transform group-hover:translate-x-1",
                  option.featured ? "text-primary-foreground" : "text-primary"
                )}
              >
                Comenzar
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground"
      >
        Cada captura queda registrada y auditada automáticamente.
      </motion.p>
    </div>
  );
}
