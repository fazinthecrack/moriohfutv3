import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CardDisplay } from '@/components/CardDisplay';
import { Package, Trophy, TrendingUp } from 'lucide-react';
import type { Card, Rarity, Position } from '@/lib/cards';

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
}

function toCard(c: UserCard): Card {
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity as Rarity,
    emoji: c.emoji,
    image_url: c.image_url,
    position: c.position as Position,
    overall: c.overall,
    stats: { rap: c.stat_rap, tir: c.stat_tir, pas: c.stat_pas, dri: c.stat_dri, def: c.stat_def, phy: c.stat_phy },
  };
}

export default function Index() {
  const { user, profile } = useAuth();
  const [cards, setCards] = useState<UserCard[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setCards(data as UserCard[]); });
  }, [user]);

  const totalCards = cards.length;
  const legendaryCount = cards.filter(c => c.rarity === 'legendary').length;
  const avgOverall = cards.length > 0 ? Math.round(cards.reduce((s, c) => s + c.overall, 0) / cards.length) : 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 bg-card/40 backdrop-blur-xl border border-border/30"
      >
        <h1 className="text-3xl font-bold text-primary">
          Bienvenue, {profile?.username}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">Ouvre tes packs quotidiens et construis ta collection ultime.</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Package, label: 'Cartes', value: totalCards, color: 'text-primary' },
          { icon: Trophy, label: 'Légendaires', value: legendaryCount, color: 'text-rarity-legendary' },
          { icon: TrendingUp, label: 'OVR Moyen', value: avgOverall, color: 'text-rarity-rare' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-xl p-5 bg-card/30 backdrop-blur border border-border/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground font-display tracking-wider">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold font-mono-stats ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-display tracking-wider mb-4 text-foreground/80">Dernières cartes</h2>
        {cards.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune carte. Ouvre ton premier pack !</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {cards.slice(0, 5).map(card => (
              <CardDisplay key={card.id} card={toCard(card)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
