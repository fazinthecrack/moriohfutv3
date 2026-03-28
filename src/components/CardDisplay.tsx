import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Card, Rarity } from '@/lib/cards';
import { CARD_POOL } from '@/lib/cards';
import { getQuickSellRange, getRandomQuickSellPrice, formatCoins } from '@/lib/quick-sell';
import { X, Zap, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const rarityClass: Record<Rarity, string> = {
  common: 'card-rarity-common',
  rare: 'card-rarity-rare',
  epic: 'card-rarity-epic',
  legendary: 'card-rarity-legendary',
};

const rarityBg: Record<string, string> = {
  common: 'from-[hsl(220,10%,20%)] to-[hsl(220,10%,12%)]',
  rare: 'from-[hsl(210,60%,20%)] to-[hsl(210,50%,10%)]',
  epic: 'from-[hsl(280,40%,20%)] to-[hsl(280,30%,10%)]',
  legendary: 'from-[hsl(45,60%,18%)] to-[hsl(45,40%,8%)]',
};

const rarityBorder: Record<string, string> = {
  common: 'border-[hsl(220,10%,40%)]',
  rare: 'border-[hsl(210,80%,50%)]',
  epic: 'border-[hsl(280,70%,55%)]',
  legendary: 'border-[hsl(45,95%,55%)]',
};

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'shadow-[0_0_15px_hsl(210,80%,50%,0.3)]',
  epic: 'shadow-[0_0_20px_hsl(280,70%,55%,0.4)]',
  legendary: 'shadow-[0_0_25px_hsl(45,95%,55%,0.5)]',
};

interface CardDisplayProps {
  card: Card;
  index?: number;
  animate?: boolean;
  compact?: boolean;
  onQuickSell?: (card: Card, price: number) => void;
  onMarketSell?: (card: Card, price: number) => void;
}

export function CardDisplay({ card, index = 0, animate = false, compact = false, onQuickSell, onMarketSell }: CardDisplayProps) {
  const [showDetail, setShowDetail] = useState(false);

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowDetail(true)}
          className={`w-full border-2 rounded-lg p-3 bg-card ${rarityClass[card.rarity]} flex items-center gap-3 text-left hover:brightness-110 transition-all`}
        >
          {card.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-10 h-12 object-cover rounded" />
          ) : (
            <span className="text-2xl">{card.emoji}</span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{card.name}</p>
            <span className="text-[10px] text-muted-foreground font-mono-stats">{card.position}</span>
          </div>
          <div className="font-mono-stats text-lg font-bold text-primary">{card.overall}</div>
        </button>
        {showDetail && <CardSellModal card={card} onClose={() => setShowDetail(false)} onQuickSell={onQuickSell} onMarketSell={onMarketSell} />}
      </>
    );
  }

  return (
    <>
      <motion.button
        initial={animate ? { scale: 0.8, rotateY: 90, opacity: 0 } : {}}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        transition={{ delay: index * 0.18, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={() => setShowDetail(true)}
        className="rounded-xl overflow-hidden w-44 border-0 bg-transparent cursor-pointer transition-transform duration-300 ease-out hover:scale-105"
      >
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className="w-full h-auto object-contain" />
        ) : (
          <div className={`w-full h-56 flex items-center justify-center rounded-xl border-2 bg-gradient-to-b ${rarityBg[card.rarity]} ${rarityBorder[card.rarity]}`}>
            <span className="text-6xl">{card.emoji}</span>
          </div>
        )}
      </motion.button>
      {showDetail && <CardSellModal card={card} onClose={() => setShowDetail(false)} onQuickSell={onQuickSell} onMarketSell={onMarketSell} />}
    </>
  );
}

function CardSellModal({ card, onClose, onQuickSell, onMarketSell }: { card: Card; onQuickSell?: (card: Card, price: number) => void; onMarketSell?: (card: Card, price: number) => void; onClose: () => void }) {
  const [marketPrice, setMarketPrice] = useState('');
  const quickSellRange = getQuickSellRange(card.name, card.overall);

  const handleQuickSell = () => {
    const price = getRandomQuickSellPrice(card.name, card.overall);
    onQuickSell?.(card, price);
    onClose();
  };

  const handleMarketSell = () => {
    const price = parseInt(marketPrice);
    if (!price || price <= 0) {
      toast.error('Insère un montant valide');
      return;
    }
    onMarketSell?.(card, price);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-xs rounded-2xl border-2 overflow-hidden bg-gradient-to-b ${rarityBg[card.rarity]} ${rarityBorder[card.rarity]} ${rarityGlow[card.rarity]}`}
      >
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          {card.image_url ? (
            <img src={card.image_url} alt={card.name} className="w-full aspect-[3/4] object-cover" />
          ) : (
            <div className="w-full aspect-[3/4] flex items-center justify-center">
              <span className="text-8xl">{card.emoji}</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col items-center">
            <span className="font-display text-3xl font-bold text-foreground drop-shadow-lg leading-none">{card.overall}</span>
            <span className="font-mono-stats text-xs text-foreground/80 drop-shadow">{card.position}</span>
          </div>
        </div>

        <div className="p-4 space-y-3 border-t border-border/10">
          <div className="text-center">
            <h3 className="font-display text-lg tracking-widest">{card.name}</h3>
          </div>

          {/* Quick sell */}
          <button
            onClick={handleQuickSell}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-display text-xs tracking-wider text-amber-300">Vente rapide</span>
            </div>
            <span className="font-mono-stats text-xs text-amber-200">
              {formatCoins(quickSellRange.min)} - {formatCoins(quickSellRange.max)}
            </span>
          </button>

          {/* Market sell */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Store className="w-3.5 h-3.5 text-primary" />
              <span className="font-display text-xs tracking-wider text-primary">Vente sur le marché</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={marketPrice}
                onChange={e => setMarketPrice(e.target.value)}
                placeholder="Montant..."
                min={1}
                className="flex-1 px-3 py-2.5 rounded-xl bg-background/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-mono-stats"
              />
              <button
                onClick={handleMarketSell}
                disabled={!marketPrice}
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:brightness-110 transition-all disabled:opacity-40"
              >
                Vendre
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
