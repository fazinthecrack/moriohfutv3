import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { CARD_POOL, type CardTemplate, type Position, type Rarity } from '@/lib/cards';
import { formatCoins } from '@/lib/quick-sell';
import { toast } from 'sonner';
import { Shield, Search, Coins, Trash2, UserPlus, Upload, Plus } from 'lucide-react';

const ADMIN_CODE = 'morioh2025';
const POSITIONS: Position[] = ['GK','DC','DG','DD','MDC','MC','MOC','MG','MD','AG','AD','BU','SC'];
const RARITIES: Rarity[] = ['common','rare','epic','legendary'];

export default function Admin() {
  const [code, setCode] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<'credits' | 'give-card' | 'delete-card' | 'import'>('credits');

  const [searchUser, setSearchUser] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditAction, setCreditAction] = useState<'add' | 'set'>('add');

  const [giveUser, setGiveUser] = useState('');
  const [giveFoundUsers, setGiveFoundUsers] = useState<any[]>([]);

  const [deleteSearch, setDeleteSearch] = useState('');
  const [deleteFoundUsers, setDeleteFoundUsers] = useState<any[]>([]);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Import card form
  const [importName, setImportName] = useState('');
  const [importPosition, setImportPosition] = useState<Position>('BU');
  const [importOverall, setImportOverall] = useState('80');
  const [importRarity, setImportRarity] = useState<Rarity>('rare');
  const [importImageUrl, setImportImageUrl] = useState('');
  const [importEmoji, setImportEmoji] = useState('⚔️');
  const [importStats, setImportStats] = useState({ rap: '80', tir: '80', pas: '80', dri: '80', def: '80', phy: '80' });
  const [importQsMin, setImportQsMin] = useState('5000');
  const [importQsMax, setImportQsMax] = useState('10000');
  const [importFreeOdds, setImportFreeOdds] = useState('500');
  const [importPremiumOdds, setImportPremiumOdds] = useState('250');
  const [importTarget, setImportTarget] = useState<'pool' | 'player'>('pool');
  const [importUserSearch, setImportUserSearch] = useState('');
  const [importFoundUsers, setImportFoundUsers] = useState<any[]>([]);
  const [customCards, setCustomCards] = useState<any[]>([]);

  const handleAuth = () => {
    if (code === ADMIN_CODE) { setAuthenticated(true); loadCustomCards(); }
    else toast.error('Code incorrect');
  };

  const searchUsers = async (query: string, setter: (u: any[]) => void) => {
    if (!query.trim()) { setter([]); return; }
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${query}%`).limit(10);
    setter(data || []);
  };

  const loadCustomCards = async () => {
    const { data } = await supabase.from('custom_card_pool').select('*').order('created_at', { ascending: false });
    setCustomCards(data || []);
  };

  const handleCredits = async (userId: string) => {
    const amount = parseInt(creditAmount);
    if (!amount && amount !== 0) { toast.error('Montant invalide'); return; }
    if (creditAction === 'set') {
      await supabase.rpc('admin_set_credits', { target_user_id: userId, new_credits: amount });
      toast.success(`Crédits définis à ${formatCoins(amount)}`);
    } else {
      const { data: profile } = await supabase.from('profiles').select('credits').eq('user_id', userId).single();
      if (!profile) { toast.error('Profil non trouvé'); return; }
      await supabase.rpc('admin_set_credits', { target_user_id: userId, new_credits: profile.credits + amount });
      toast.success(`+${formatCoins(amount)} crédits ajoutés`);
    }
    searchUsers(searchUser, setFoundUsers);
  };

  const handleGiveCard = async (userId: string, card: CardTemplate) => {
    await supabase.from('user_cards').insert({
      user_id: userId, name: card.name, rarity: card.rarity, emoji: card.emoji, position: card.position,
      overall: card.overall, image_url: card.image_url || null,
      stat_rap: card.stats.rap, stat_tir: card.stats.tir, stat_pas: card.stats.pas,
      stat_dri: card.stats.dri, stat_def: card.stats.def, stat_phy: card.stats.phy, is_tradeable: true,
    });
    toast.success(`${card.name} (${card.overall}) donné !`);
  };

  const loadUserCards = async (userId: string) => {
    setSelectedUserId(userId);
    const { data } = await supabase.from('user_cards').select('*').eq('user_id', userId).order('overall', { ascending: false });
    setUserCards(data || []);
  };

  const handleDeleteCard = async (cardId: string) => {
    await supabase.from('user_cards').delete().eq('id', cardId);
    toast.success('Carte supprimée');
    if (selectedUserId) loadUserCards(selectedUserId);
  };

  const handleImportToPool = async () => {
    if (!importName.trim()) { toast.error('Nom requis'); return; }
    const { error } = await supabase.from('custom_card_pool').insert({
      name: importName.trim(), rarity: importRarity, emoji: importEmoji, position: importPosition,
      overall: parseInt(importOverall) || 0, image_url: importImageUrl || null,
      stats_rap: parseInt(importStats.rap) || 0, stats_tir: parseInt(importStats.tir) || 0,
      stats_pas: parseInt(importStats.pas) || 0, stats_dri: parseInt(importStats.dri) || 0,
      stats_def: parseInt(importStats.def) || 0, stats_phy: parseInt(importStats.phy) || 0,
      quick_sell_min: parseInt(importQsMin) || 500, quick_sell_max: parseInt(importQsMax) || 1000,
      free_odds: parseInt(importFreeOdds) || 500, premium_odds: parseInt(importPremiumOdds) || 250,
    } as any);
    if (error) { toast.error('Erreur'); return; }
    toast.success('Carte ajoutée au pool !');
    loadCustomCards();
  };

  const handleImportGiveToPlayer = async (userId: string) => {
    if (!importName.trim()) { toast.error('Nom requis'); return; }
    await supabase.from('user_cards').insert({
      user_id: userId, name: importName.trim(), rarity: importRarity, emoji: importEmoji,
      position: importPosition, overall: parseInt(importOverall) || 0, image_url: importImageUrl || null,
      stat_rap: parseInt(importStats.rap) || 0, stat_tir: parseInt(importStats.tir) || 0,
      stat_pas: parseInt(importStats.pas) || 0, stat_dri: parseInt(importStats.dri) || 0,
      stat_def: parseInt(importStats.def) || 0, stat_phy: parseInt(importStats.phy) || 0, is_tradeable: true,
    });
    toast.success(`${importName} donné !`);
  };

  const handleDeleteCustomCard = async (id: string) => {
    await supabase.from('custom_card_pool').delete().eq('id', id);
    toast.success('Carte retirée du pool');
    loadCustomCards();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-2xl font-display tracking-widest text-primary">Admin</h1>
            <p className="text-muted-foreground text-sm">Entrez le code d'accès</p>
          </div>
          <input type="password" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Code admin..." className="w-full px-4 py-3 rounded-xl bg-card border border-border/30 text-foreground text-center font-mono-stats tracking-widest focus:outline-none focus:border-primary/50" />
          <button onClick={handleAuth} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-wider hover:brightness-110 transition-all">Accéder</button>
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

        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'credits' as const, label: 'Crédits', icon: Coins },
            { key: 'give-card' as const, label: 'Donner carte', icon: UserPlus },
            { key: 'delete-card' as const, label: 'Supprimer carte', icon: Trash2 },
            { key: 'import' as const, label: 'Importer carte', icon: Upload },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-display tracking-wider transition-all ${
                tab === t.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Credits Tab */}
        {tab === 'credits' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              <button onClick={() => searchUsers(searchUser, setFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm"><Search className="w-4 h-4" /></button>
            </div>
            {foundUsers.map(u => (
              <div key={u.id} className="p-4 rounded-xl bg-card border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display tracking-wider">{u.username}</span>
                  <span className="font-mono-stats text-primary">{formatCoins(u.credits)} crédits</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select value={creditAction} onChange={e => setCreditAction(e.target.value as any)} className="px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground">
                    <option value="add">Ajouter</option><option value="set">Définir à</option>
                  </select>
                  <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Montant..."
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                  <button onClick={() => handleCredits(u.user_id)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">OK</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Give Card Tab */}
        {tab === 'give-card' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={giveUser} onChange={e => setGiveUser(e.target.value)} placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              <button onClick={() => searchUsers(giveUser, setGiveFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm"><Search className="w-4 h-4" /></button>
            </div>
            {giveFoundUsers.map(u => (
              <div key={u.id} className="p-3 rounded-xl bg-card border border-border/30">
                <p className="font-display tracking-wider mb-2">{u.username}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CARD_POOL.map(card => (
                    <button key={`${card.name}_${card.overall}`} onClick={() => handleGiveCard(u.user_id, card)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-border/20 hover:border-primary/30 transition-all text-left">
                      {card.image_url ? <img src={card.image_url} alt={card.name} className="w-8 h-10 object-cover rounded" /> : <span>{card.emoji}</span>}
                      <div><p className="text-xs font-medium">{card.name}</p><p className="text-[10px] font-mono-stats text-primary">{card.overall}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Card Tab */}
        {tab === 'delete-card' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input type="text" value={deleteSearch} onChange={e => setDeleteSearch(e.target.value)} placeholder="Rechercher joueur..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              <button onClick={() => searchUsers(deleteSearch, setDeleteFoundUsers)} className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm"><Search className="w-4 h-4" /></button>
            </div>
            {deleteFoundUsers.map(u => (
              <div key={u.id} className="p-3 rounded-xl bg-card border border-border/30">
                <button onClick={() => loadUserCards(u.user_id)} className="font-display tracking-wider hover:text-primary transition-colors">{u.username} — voir cartes</button>
                {selectedUserId === u.user_id && userCards.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {userCards.map(card => (
                      <div key={card.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/20">
                        <div className="flex items-center gap-2">
                          {card.image_url ? <img src={card.image_url} alt={card.name} className="w-8 h-10 object-cover rounded" /> : <span>{card.emoji}</span>}
                          <div><p className="text-xs font-medium">{card.name}</p><p className="text-[10px] font-mono-stats text-primary">{card.overall} · {card.position}</p></div>
                        </div>
                        <button onClick={() => handleDeleteCard(card.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Import Card Tab */}
        {tab === 'import' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-card border border-border/30 space-y-4">
              <h3 className="font-display tracking-wider text-sm text-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Nouvelle carte</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] text-muted-foreground">Nom</label>
                  <input type="text" value={importName} onChange={e => setImportName(e.target.value)} placeholder="Nom..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Position</label>
                  <select value={importPosition} onChange={e => setImportPosition(e.target.value as Position)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground">
                    {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Overall</label>
                  <input type="number" value={importOverall} onChange={e => setImportOverall(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground focus:outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Rareté</label>
                  <select value={importRarity} onChange={e => setImportRarity(e.target.value as Rarity)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground">
                    {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Emoji</label>
                  <input type="text" value={importEmoji} onChange={e => setImportEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground focus:outline-none" />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <label className="text-[10px] text-muted-foreground">URL image (optionnel)</label>
                  <input type="text" value={importImageUrl} onChange={e => setImportImageUrl(e.target.value)} placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground">Stats</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(['rap','tir','pas','dri','def','phy'] as const).map(stat => (
                    <div key={stat}>
                      <label className="text-[8px] text-muted-foreground uppercase">{stat}</label>
                      <input type="number" value={importStats[stat]} onChange={e => setImportStats(prev => ({ ...prev, [stat]: e.target.value }))}
                        className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/30 text-xs font-mono-stats text-foreground focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><label className="text-[10px] text-muted-foreground">QS Min</label>
                  <input type="number" value={importQsMin} onChange={e => setImportQsMin(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/30 text-xs font-mono-stats focus:outline-none" /></div>
                <div><label className="text-[10px] text-muted-foreground">QS Max</label>
                  <input type="number" value={importQsMax} onChange={e => setImportQsMax(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/30 text-xs font-mono-stats focus:outline-none" /></div>
                <div><label className="text-[10px] text-muted-foreground">Odds Gratuit (1/X)</label>
                  <input type="number" value={importFreeOdds} onChange={e => setImportFreeOdds(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/30 text-xs font-mono-stats focus:outline-none" /></div>
                <div><label className="text-[10px] text-muted-foreground">Odds Premium (1/X)</label>
                  <input type="number" value={importPremiumOdds} onChange={e => setImportPremiumOdds(e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-background border border-border/30 text-xs font-mono-stats focus:outline-none" /></div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setImportTarget('pool'); handleImportToPool(); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-xs tracking-wider hover:brightness-110 transition-all">
                  <Upload className="w-4 h-4" /> Ajouter au pool de packs
                </button>
                <button onClick={() => setImportTarget('player')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-display text-xs tracking-wider transition-all ${
                    importTarget === 'player' ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground hover:text-foreground'
                  }`}>
                  <UserPlus className="w-4 h-4" /> Donner à un joueur
                </button>
              </div>

              {importTarget === 'player' && (
                <div className="space-y-3 pt-2 border-t border-border/20">
                  <div className="flex gap-2">
                    <input type="text" value={importUserSearch} onChange={e => setImportUserSearch(e.target.value)} placeholder="Rechercher joueur..."
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
                    <button onClick={() => searchUsers(importUserSearch, setImportFoundUsers)} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm"><Search className="w-4 h-4" /></button>
                  </div>
                  {importFoundUsers.map(u => (
                    <button key={u.id} onClick={() => handleImportGiveToPlayer(u.user_id)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-background border border-border/20 hover:border-primary/30 transition-all text-sm font-display tracking-wider">
                      {u.username} — donner cette carte
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Existing custom pool cards */}
            {customCards.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-display tracking-wider text-sm text-muted-foreground">Cartes importées ({customCards.length})</h3>
                <div className="space-y-2">
                  {customCards.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border/20">
                      <div className="flex items-center gap-3">
                        <span>{c.emoji}</span>
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-[10px] font-mono-stats text-primary">{c.overall} · {c.position} · {c.rarity}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteCustomCard(c.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
