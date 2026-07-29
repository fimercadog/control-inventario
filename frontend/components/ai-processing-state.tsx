"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Estado de carga conversacional (requisito de UX): nunca se menciona
 * "IA"/"modelo"/JSON — se siente como un empleado experto trabajando,
 * con mensajes que avanzan por las etapas reales del pipeline (subir,
 * analizar/transcribir, extraer, guardar). Se detiene en el último
 * mensaje en vez de repetir el ciclo si la respuesta tarda más de lo
 * esperado — nunca vuelve a "Subiendo..." una vez que avanzó.
 */
export function AiProcessingState({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => Math.min(i + 1, messages.length - 1));
    }, 1600);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-14 text-center">
      <div className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <span className="absolute inset-2 animate-pulse rounded-full bg-primary/15" />
        <div className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <Sparkles className="size-6" />
        </div>
      </div>

      <div className="h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-sm font-medium text-foreground"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden>
        {messages.map((message, i) => (
          <span
            key={message}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i <= index ? "w-6 bg-primary" : "w-3 bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
