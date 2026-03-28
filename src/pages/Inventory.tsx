import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, X, Zap, Store, Lock } from 'lucide-react';
import { getQuickSellRange, getRandomQuickSellPrice, formatCoins } from '@/lib/quick-sell';
import { toast } from 'sonner';

interface UserCard {
  id: string;
  name: string;
  rarity: string;
  emoji: string;
  image_url: string | null;
  stat_rap: number;
  stat_tir: number;
  stat_pas: number;
  stat_dri: number;
  stat_def: number;
  stat_phy: number;
  position: string;
  overall: number;
  is_listed: boolean;
  is_tradeable: boolean;
}

export default function Inventory() {
  const { user, profile, refreshProfile } = useAuth();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [search, setSearch] = useState('');
  const [filterPosition, setFilterPosition] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);
  const [marketPrice, setMarketPrice] = useState('');

  useEffect(() => {
    if (!user) return;
    loadCards();
  }, [user]);

  const loadCards = () => {
    if (!user) return;
    supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_listed', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCards(data as UserCard[]); });
  };

  const handleQuickSell = async (card: UserCard) => {
    if (!user || !profile) return;
    const price = getRandomQuickSellPrice(card.name, card.overall);
    
    const { data, error } = await supabase.rpc('quick_sell_card', {
      card_id: card.id,
      sell_price: price,
    });
    
    if (error) { toast.error('Erreur lors de la vente'); return; }
    const result = data as any;
    if (!result.success) { toast.error(result.error); return; }
    
    await refreshProfile();
    toast.success(`Vente rapide : +${formatCoins(price)} crédits`);
    setSelectedCard(null);
    setCards(prev => prev.filter(c => c.id !== card.id));
  };

  const handleMarketSell = async (card: UserCard) => {
    if (!user) return;
    const price = parseInt(marketPrice);
    if (!price || price <= 0) { toast.error('Montant invalide'); return; }

    const { error } = await supabase.from('marketplace_listings').insert({
      card_id: card.id,
      seller_id: user.id,
      price,
    });
    if (error) { toast.error('Erreur mise en vente'); return; }

    await supabase.from('user_cards').update({ is_listed: true }).eq('id', card.id);
    
    toast.success(`Carte mise en vente pour ${formatCoins(price)} crédits`);
    setSelectedCard(null);
    setMarketPrice('');
    setCards(prev => prev.filter(c => c.id !== card.id));
  };

  const filtered = cards.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPosition && c.position !== filterPosition) return false;
    return true;
  });

  const positions = [...new Set(cards.map(c => c.position))].sort();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display tracking-widest text-primary">Inventaire</h1>
          <p className="text-muted-foreground text-xs mt-1">{cards.length} carte{cards.length !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card/60 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {positions.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {positions.map(pos => (
              <button
                key={pos}
                onClick={() => setFilterPosition(filterPosition === pos ? null : pos)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono-stats transition-all duration-300 ${
                  filterPosition === pos 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-muted-foreground hover:text-foreground border border-border/20'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {cards.length === 0 ? 'Aucune carte. Ouvre ton premier pack !' : 'Aucune carte ne correspond aux filtres.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((card, i) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.6), duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => { setSelectedCard(card); setMarketPrice(''); }}
              className="group relative rounded-xl overflow-hidden transition-transform duration-300 ease-out hover:scale-[1.04] hover:z-10"
            >
              {!card.is_tradeable && (
                <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-background/70 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
              )}
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full aspect-[3/4] object-cover object-top rounded-xl" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center rounded-xl border border-border/30 bg-card">
                  <span className="text-5xl">{card.emoji}</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      )}

      {selectedCard && (() => {
        const qsRange = getQuickSellRange(selectedCard.name, selectedCard.overall);
        const tradeable = selectedCard.is_tradeable;
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs rounded-2xl overflow-hidden bg-card border border-border/30"
            >
              <div className="relative">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                {selectedCard.image_url ? (
                  <img src={selectedCard.image_url} alt={selectedCard.name} className="w-full aspect-[3/4] object-cover" />
                ) : (
                  <div className="w-full aspect-[3/4] flex items-center justify-center bg-secondary/30">
                    <span className="text-8xl">{selectedCard.emoji}</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {tradeable ? (
                  <>
                    <button
                      onClick={() => handleQuickSell(selectedCard)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="font-display text-xs tracking-wider text-amber-300">Vente rapide</span>
                      </div>
                      <span className="font-mono-stats text-xs text-amber-200">
                        {formatCoins(qsRange.min)} - {formatCoins(qsRange.max)}
                      </span>
                    </button>

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
                          onClick={() => handleMarketSell(selectedCard)}
                          disabled={!marketPrice}
                          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:brightness-110 transition-all disabled:opacity-40"
                        >
                          Vendre
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/20 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span className="font-display text-xs tracking-wider">Carte non échangeable</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        );
      })()}
    </div>
  );
}
