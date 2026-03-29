import { motion } from 'framer-motion';
import { CARD_POOL } from '@/lib/cards';
import { getQuickSellRange, formatCoins } from '@/lib/quick-sell';
import { Coins } from 'lucide-react';

export default function Showcase() {
  const sorted = [...CARD_POOL].sort((a, b) => b.overall - a.overall);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display tracking-widest text-primary">Salon des Cartes</h1>
        <p className="text-muted-foreground text-xs mt-1">Toutes les cartes disponibles dans le jeu</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sorted.map((card, i) => {
          const qsRange = getQuickSellRange(card.name, card.overall);
          return (
            <motion.div
              key={`${card.name}_${card.overall}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.8), duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="rounded-xl overflow-hidden w-full">
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-full aspect-[3/4] object-cover object-top rounded-xl" />
                ) : (
                  <div className="w-full aspect-[3/4] flex items-center justify-center rounded-xl border border-border/30 bg-card">
                    <span className="text-5xl">{card.emoji}</span>
                  </div>
                )}
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-display text-sm tracking-wider text-foreground">{card.name}</p>
                <p className="font-mono-stats text-xs text-primary">{card.overall} OVR · {card.position}</p>
                <div className="flex items-center justify-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="font-mono-stats text-[10px] text-amber-300">
                    {formatCoins(qsRange.min)} - {formatCoins(qsRange.max)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
