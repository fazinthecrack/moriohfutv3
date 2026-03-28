import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePack, canOpenPack, markPackOpened, getInventory, saveInventory, getNextOpenTime } from '@/lib/cards';
import type { Card } from '@/lib/cards';
import { CardDisplay } from './CardDisplay';

export function PackOpener() {
  const [canOpen, setCanOpen] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [inventory, setInventory] = useState<Card[]>([]);
  const [showInventory, setShowInventory] = useState(false);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    setCanOpen(canOpenPack());
    setInventory(getInventory());
  }, []);

  useEffect(() => {
    if (canOpen || cards) return;
    const interval = setInterval(() => {
      const target = getNextOpenTime();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCanOpen(true);
        setCountdown('');
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [canOpen, cards]);

  const openPack = () => {
    const newCards = generatePack();
    setCards(newCards);
    markPackOpened();
    setCanOpen(false);
    const updatedInv = [...newCards, ...getInventory()];
    saveInventory(updatedInv);
    setInventory(updatedInv);
  };

  const closePack = () => {
    setCards(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="fixed top-4 right-4 z-10">
        <button
          onClick={() => setShowInventory(!showInventory)}
          className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          {showInventory ? 'Fermer' : `Inventaire (${inventory.length})`}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showInventory ? (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <h2 className="text-xl font-bold mb-4 text-center">
              Inventaire
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {inventory.length} carte{inventory.length !== 1 ? 's' : ''}
              </span>
            </h2>
            {inventory.length === 0 ? (
              <p className="text-center text-muted-foreground">Aucune carte. Ouvre ton premier pack !</p>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
                {inventory.map((card) => (
                  <CardDisplay key={card.id} card={card} compact />
                ))}
              </div>
            )}
          </motion.div>
        ) : cards ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {cards.map((card, i) => (
                <CardDisplay key={card.id} card={card} index={i} animate />
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={closePack}
              className="px-6 py-2 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80 transition-colors"
            >
              OK
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {canOpen ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openPack}
                className="group relative px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg glow-gold transition-all hover:brightness-110"
              >
                Ouvrir le Pack
              </motion.button>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-sm">Prochain pack disponible à 23h</p>
                <p className="font-mono-stats text-3xl text-primary tracking-widest">{countdown}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
