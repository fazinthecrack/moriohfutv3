import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { CARD_POOL, type CardTemplate, type Position, type Rarity } from '@/lib/cards';
import { formatCoins } from '@/lib/quick-sell';
import { toast } from 'sonner';
import { Shield, Search, Coins, Trash2, UserPlus } from 'lucide-react';

const ADMIN_CODE = 'morioh2025';

export default function Admin() {
  const [code, setCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<'credits' | 'give-card' | 'delete-card'>('credits');

  // Credits management
  const [searchUser, setSearchUser] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditAction, setCreditAction] = useState<'add' | 'set'>('add');

  // Give card
  const [giveUser, setGiveUser] = useState('');
  const [giveFoundUsers, setGiveFoundUsers] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);

  // Delete card
  const [deleteSearch, setDeleteSearch] = useState('');
  const [deleteFoundUsers, setDeleteFoundUsers] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleAuth = () => {
    if (code === ADMIN_CODE) {
      setAuthenticated(true);
    } else {
      toast.error('Code incorrect');
    }
  };

  const searchUsers = async (query: string, setter: (u: any[]) => void) => {
    if (!query.trim()) { setter([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(10);
    setter(data || []);
  };

  const handleCredits = async (userId: string) => {
    const amount = parseInt(creditAmount);
    if (!amount && amount !== 0) { toast.error('Montant invalide'); return; }

    if (creditAction === 'set') {
      const { data, error } = await supabase.rpc('admin_set_credits', { target_user_id: userId, new_credits: amount });
      if (error) { toast.error('Erreur'); return; }
      toast.success(`Crédits définis à ${formatCoins(amount)}`);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();
      if (!profile) { toast.error('Profil non trouvé'); return; }
      const newCredits = profile.credits + amount;
      const { data, error } = await supabase.rpc('admin_set_credits', { target_user_id: userId, new_credits: newCredits });
      if (error) { toast.error('Erreur'); return; }
      toast.success(`+${formatCoins(amount)} crédits ajoutés`);
    }
    searchUsers(searchUser, setFoundUsers);
  };

  const handleGiveCard = async (userId: string, card: CardTemplate) => {
    const { error } = await supabase.from('user_cards').insert({
      user_id: userId,
      name: card.name,
      rarity: card.rarity,
      emoji: card.emoji,
      position: card.position,
      overall: card.overall,
      image_url: card.image_url || null,
      stat_rap: card.stats.rap,
      stat_tir: card.stats.tir,
      stat_pas: card.stats.pas,
      stat_dri: card.stats.dri,
      stat_def: card.stats.def,
      stat_phy: card.stats.phy,
      is_tradeable: true,
    });
    if (error) { toast.error('Erreur'); return; }
    toast.success(`${card.name} (${card.overall}) donné !`);
  };

  const loadUserCards = async (userId: string) => {
    setSelectedUserId(userId);
    const { data } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', userId)
      .order('overall', { ascending: false });
    setUserCards(data || []);
  };

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase.from('user_cards').delete().eq('id', cardId);
    if (error) { toast.error('Erreur suppression'); return; }
    toast.success('Carte supprimée');
    if (selectedUserId) loadUserCards(selectedUserId);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-4"
        >
          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-display tracking-widest text-primary">Admin</h1>
            <p className="text-muted-foreground text-sm">Entrez le code d'accès</p>
          </div>
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Code admin..."
            className="w-full px-4 py-3 rounded-xl bg-card border border-border/30 text-foreground text-center font-mono-stats tracking-widest focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleAuth}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:brightness-110 transition-all"
          >
            Accéder
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display tracking-widest text-primary">Panel Admin</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { key: 'credits' as const, label: 'Crédits', icon: Coins },
            { key: 'give-card' as const, label: 'Donner carte', icon: UserPlus },
            { key: 'delete-card' as const, label: 'Supprimer carte', icon: Trash2 },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display tracking-wider transition-all ${
                tab === t.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Credits Tab */}
        {tab === 'credits' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
                placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button onClick={() => searchUsers(searchUser, setFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {foundUsers.map(u => (
              <div key={u.id} className="p-4 rounded-xl bg-card border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display tracking-wider">{u.username}</span>
                  <span className="font-mono-stats text-primary">{formatCoins(u.credits)} crédits</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    value={creditAction}
                    onChange={e => setCreditAction(e.target.value as 'add' | 'set')}
                    className="px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground"
                  >
                    <option value="add">Ajouter</option>
                    <option value="set">Définir à</option>
                  </select>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    placeholder="Montant..."
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    onClick={() => handleCredits(u.user_id)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
                  >
                    OK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Give Card Tab */}
        {tab === 'give-card' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={giveUser}
                onChange={e => setGiveUser(e.target.value)}
                placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button onClick={() => searchUsers(giveUser, setGiveFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {giveFoundUsers.length > 0 && (
              <div className="space-y-2">
                {giveFoundUsers.map(u => (
                  <div key={u.id} className="p-3 rounded-xl bg-card border border-border/30">
                    <p className="font-display tracking-wider mb-2">{u.username}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CARD_POOL.map(card => (
                        <button
                          key={`${card.name}_${card.overall}`}
                          onClick={() => handleGiveCard(u.user_id, card)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/20 hover:border-primary/30 transition-all text-left"
                        >
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.name} className="w-8 h-10 object-cover rounded" />
                          ) : (
                            <span>{card.emoji}</span>
                          )}
                          <div>
                            <p className="text-xs font-medium">{card.name}</p>
                            <p className="text-[10px] font-mono-stats text-primary">{card.overall}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Card Tab */}
        {tab === 'delete-card' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={deleteSearch}
                onChange={e => setDeleteSearch(e.target.value)}
                placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button onClick={() => searchUsers(deleteSearch, setDeleteFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {deleteFoundUsers.map(u => (
              <div key={u.id} className="p-3 rounded-xl bg-card border border-border/30">
                <button onClick={() => loadUserCards(u.user_id)} className="font-display tracking-wider hover:text-primary transition-colors">
                  {u.username} — voir cartes
                </button>
                {selectedUserId === u.user_id && userCards.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {userCards.map(card => (
                      <div key={card.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/20">
                        <div className="flex items-center gap-2">
                          {card.image_url ? (
                            <img src={card.image_url} alt={card.name} className="w-8 h-10 object-cover rounded" />
                          ) : (
                            <span>{card.emoji}</span>
                          )}
                          <div>
                            <p className="text-xs font-medium">{card.name}</p>
                            <p className="text-[10px] font-mono-stats text-primary">{card.overall} · {card.position}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
