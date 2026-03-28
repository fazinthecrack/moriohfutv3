import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getNextOpenTime } from '@/lib/cards';
import { generatePackWithRates, PREMIUM_PACK_COST } from '@/lib/drop-rates';
import { formatCoins } from '@/lib/quick-sell';
import type { Card } from '@/lib/cards';
import { CardDisplay } from '@/components/CardDisplay';
import { toast } from 'sonner';
import packImage from '@/assets/pack-image.png';
import { Coins } from 'lucide-react';

export default function Packs() {
  const { user, profile, refreshProfile } = useAuth();
  const [canOpen, setCanOpen] = useState(false);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [countdown, setCountdown] = useState('');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkCanOpen();
  }, [user]);

  const checkCanOpen = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('pack_opens')
      .select('opened_at')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) { setCanOpen(true); return; }

    const lastOpen = new Date(data[0].opened_at);
    const now = new Date();
    const frOpts: Intl.DateTimeFormatOptions = { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false };
    const frFormatter = new Intl.DateTimeFormat('fr-FR', frOpts);
    const getVal = (parts: Intl.DateTimeFormatPart[], type: string) => parts.find(p => p.type === type)?.value || '';

    const lastParts = frFormatter.formatToParts(lastOpen);
    const nowParts = frFormatter.formatToParts(now);
    const lastDay = `${getVal(lastParts, 'year')}-${getVal(lastParts, 'month')}-${getVal(lastParts, 'day')}`;
    const nowDay = `${getVal(nowParts, 'year')}-${getVal(nowParts, 'month')}-${getVal(nowParts, 'day')}`;
    const nowHour = parseInt(getVal(nowParts, 'hour'));

    if (lastDay === nowDay) { setCanOpen(false); return; }
    if (nowHour >= 23) { setCanOpen(true); return; }

    const lastDate = new Date(lastDay);
    const nowDate = new Date(nowDay);
    const diffDays = (nowDate.getTime() - lastDate.getTime()) / 86400000;
    setCanOpen(diffDays >= 2 || (diffDays >= 1 && nowHour >= 23));
  };

  useEffect(() => {
    if (canOpen || cards) return;
    const interval = setInterval(() => {
      const target = getNextOpenTime();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCanOpen(true); setCountdown(''); clearInterval(interval); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [canOpen, cards]);

  const insertCards = async (newCards: Card[], isTradeable: boolean) => {
    if (!user) return;
    const cardsToInsert = newCards.map(c => ({
      user_id: user.id,
      name: c.name,
      rarity: c.rarity,
      emoji: c.emoji,
      position: c.position,
      overall: c.overall,
      image_url: c.image_url || null,
      stat_rap: c.stats.rap,
      stat_tir: c.stats.tir,
      stat_pas: c.stats.pas,
      stat_dri: c.stats.dri,
      stat_def: c.stats.def,
      stat_phy: c.stats.phy,
      stat_atk: 0,
      stat_vit: 0,
      stat_int: 0,
      is_tradeable: isTradeable,
    }));
    await supabase.from('user_cards').insert(cardsToInsert);
  };

  const openFreePack = async () => {
    if (!user || opening) return;
    setOpening(true);
    const newCards = generatePackWithRates('free');
    setCards(newCards);
    await insertCards(newCards, true);
    await supabase.from('pack_opens').insert({ user_id: user.id });
    setCanOpen(false);
    setOpening(false);
    toast.success('Pack ouvert !');
  };

  const openPremiumPack = async () => {
    if (!user || opening) return;
    if (!profile || profile.credits < PREMIUM_PACK_COST) {
      toast.error(`Il te faut ${formatCoins(PREMIUM_PACK_COST)} crédits`);
      return;
    }
    setOpening(true);
    
    // Deduct credits
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - PREMIUM_PACK_COST })
      .eq('user_id', user.id);
    
    if (creditError) { toast.error('Erreur crédits'); setOpening(false); return; }
    
    const newCards = generatePackWithRates('premium');
    setCards(newCards);
    await insertCards(newCards, false); // NOT tradeable
    await refreshProfile();
    setOpening(false);
    toast.success('Pack Premium ouvert !');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {cards ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-8"
          >
            <h2 className="text-xl font-display tracking-widest text-primary">Ton Pack</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {cards.map((card, i) => (
                <CardDisplay key={card.id} card={card} index={i} animate />
              ))}
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={() => setCards(null)}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-display text-lg tracking-widest hover:brightness-110 transition-all"
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
            className="flex flex-col items-center gap-8"
          >
            <div className="text-center">
              <h1 className="text-3xl font-display tracking-widest text-primary mb-2">Packs</h1>
              <p className="text-muted-foreground text-sm">Un nouveau pack disponible chaque jour à 23h</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* Free daily pack */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs font-display tracking-wider text-muted-foreground">Pack Quotidien</p>
                {canOpen ? (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openFreePack}
                    disabled={opening}
                    className="relative group cursor-pointer bg-transparent border-0 p-0"
                  >
                    <motion.img
                      src={packImage}
                      alt="Pack gratuit"
                      className="h-72 object-contain drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_0_40px_hsl(207,73%,28%,0.4)]"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    />
                    <p className="text-center text-primary font-display tracking-widest text-xs mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                      Gratuit
                    </p>
                  </motion.button>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="h-72 flex items-center justify-center opacity-40">
                      <img src={packImage} alt="Pack" className="h-72 object-contain grayscale" />
                    </div>
                    <p className="font-mono-stats text-2xl text-primary tracking-widest">{countdown}</p>
                  </div>
                )}
              </div>

              {/* Premium pack */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs font-display tracking-wider text-amber-400">Pack Premium</p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={openPremiumPack}
                  disabled={opening || !profile || profile.credits < PREMIUM_PACK_COST}
                  className="relative group cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50"
                >
                  <motion.img
                    src={packImage}
                    alt="Pack premium"
                    className="h-72 object-contain drop-shadow-2xl transition-all duration-300 group-hover:drop-shadow-[0_0_40px_hsl(45,80%,50%,0.4)] hue-rotate-[30deg] saturate-150"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  />
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono-stats text-sm text-amber-400">{formatCoins(PREMIUM_PACK_COST)}</span>
                  </div>
                  <p className="text-center text-amber-300/60 text-[10px] mt-1">
                    Cartes non échangeables
                  </p>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
