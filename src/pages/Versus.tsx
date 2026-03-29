import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCoins } from '@/lib/quick-sell';
import { Swords, Trophy, Shield, Loader2, Copy, Check, Users, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface GameSession {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: string;
  host_overall: number;
  guest_overall: number;
  round: number;
  host_tactics: string[];
  guest_tactics: string[];
  host_score: number;
  guest_score: number;
  winner_id: string | null;
  credits_reward: number;
  created_at: string;
}

const TACTICS = [
  { id: 'attaque', label: 'Attaque', icon: '⚔️', desc: 'Bat Défense' },
  { id: 'equilibre', label: 'Équilibré', icon: '⚖️', desc: 'Bat Attaque' },
  { id: 'defense', label: 'Défense', icon: '🛡️', desc: 'Bat Équilibré' },
];

export default function Versus() {
  const { user, profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = searchParams.get('game');

  const [session, setSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerOverall, setPlayerOverall] = useState(0);
  const [cardCount, setCardCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hostName, setHostName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [recentGames, setRecentGames] = useState<GameSession[]>([]);

  const isHost = session?.host_id === user?.id;
  const isGuest = session?.guest_id === user?.id;
  const hasFullTeam = cardCount >= 11;

  useEffect(() => {
    if (!user) return;
    supabase.from('user_cards').select('overall').eq('user_id', user.id).eq('is_listed', false)
      .order('overall', { ascending: false }).limit(11)
      .then(({ data }) => {
        if (data) {
          setCardCount(data.length);
          setPlayerOverall(data.length >= 11 ? Math.round(data.reduce((s, c) => s + c.overall, 0) / 11) : 0);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!user || gameId) return;
    supabase.from('game_sessions').select('*')
      .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
      .eq('status', 'finished')
      .order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setRecentGames(data as any); });
  }, [user, gameId]);

  useEffect(() => {
    if (!gameId || !user) return;

    const loadSession = async () => {
      setLoading(true);
      const { data } = await supabase.from('game_sessions').select('*').eq('id', gameId).single();
      if (data) {
        setSession(data as any);
        const { data: hp } = await supabase.from('profiles').select('username').eq('user_id', data.host_id).single();
        if (hp) setHostName(hp.username);
        if (data.guest_id) {
          const { data: gp } = await supabase.from('profiles').select('username').eq('user_id', data.guest_id).single();
          if (gp) setGuestName(gp.username);
        }
        if (data.status === 'waiting' && data.host_id !== user.id && !data.guest_id) {
          const { data: result } = await supabase.rpc('join_game', { session_id: gameId } as any);
          const r = result as any;
          if (r && !r.success) toast.error(r.error);
          else toast.success('Match rejoint !');
        }
      }
      setLoading(false);
    };

    loadSession();

    const channel = supabase.channel(`game-${gameId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_sessions', filter: `id=eq.${gameId}` }, async (payload) => {
        const ns = payload.new as any;
        setSession(prev => {
          if (prev && (ns.round !== prev.round || (prev.status === 'playing' && ns.status === 'finished'))) {
            setShowResult(true);
            setSubmitted(false);
            setSelectedTactic(null);
            setTimeout(() => setShowResult(false), 3000);
          }
          return ns;
        });
        if (ns.guest_id && !guestName) {
          const { data: gp } = await supabase.from('profiles').select('username').eq('user_id', ns.guest_id).single();
          if (gp) setGuestName(gp.username);
        }
        if (ns.status === 'finished') refreshProfile();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, user]);

  const createGame = async () => {
    if (!user || !hasFullTeam) return;
    setLoading(true);
    const { data } = await supabase.from('game_sessions').insert({ host_id: user.id, host_overall: playerOverall } as any).select().single();
    if (data) setSearchParams({ game: data.id });
    setLoading(false);
  };

  const submitTactic = async (tactic: string) => {
    if (!gameId || submitted) return;
    setSelectedTactic(tactic);
    setSubmitted(true);
    const { data } = await supabase.rpc('submit_tactic', { session_id: gameId, tactic } as any);
    const r = data as any;
    if (r && !r.success) {
      toast.error(r.error);
      setSubmitted(false);
      setSelectedTactic(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/versus?game=${session?.id}`);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const goHome = () => {
    setSearchParams({});
    setSession(null);
    setSubmitted(false);
    setSelectedTactic(null);
    setShowResult(false);
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  // Main menu
  if (!gameId || !session) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Swords className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-3xl font-display tracking-widest text-primary">1v1</h1>
          <p className="text-muted-foreground text-sm">Affronte un ami en temps réel via lien d'invitation</p>
        </div>

        {hasFullTeam ? (
          <div className="text-center space-y-4">
            <div className="p-4 rounded-2xl bg-card/60 border border-border/30">
              <p className="text-xs text-muted-foreground mb-1">Général équipe</p>
              <p className="font-mono-stats text-3xl text-primary">{playerOverall}</p>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={createGame}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-display text-xl tracking-widest hover:brightness-110 transition-all">
              <div className="flex items-center justify-center gap-3">
                <Swords className="w-6 h-6" /> Créer un match
              </div>
            </motion.button>
          </div>
        ) : (
          <div className="text-center p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-amber-300 font-display tracking-wider text-sm">Équipe incomplète ({cardCount}/11)</p>
            <p className="text-muted-foreground text-xs">11 cartes minimum pour jouer</p>
            <Link to="/packs" className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:brightness-110 transition-all">
              Ouvrir des packs
            </Link>
          </div>
        )}

        {recentGames.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-display tracking-wider text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Historique
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentGames.map(g => {
                const won = g.winner_id === user?.id;
                const isH = g.host_id === user?.id;
                return (
                  <div key={g.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                    won ? 'border-green-500/20 bg-green-500/5' : g.winner_id ? 'border-red-500/20 bg-red-500/5' : 'border-border/20 bg-card/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-display tracking-wider ${won ? 'text-green-400' : 'text-red-400'}`}>
                        {won ? 'V' : 'D'}
                      </span>
                      <p className="font-mono-stats text-sm">{isH ? g.host_score : g.guest_score} - {isH ? g.guest_score : g.host_score}</p>
                    </div>
                    <p className="font-mono-stats text-xs text-amber-400">+{formatCoins(won ? 2000 : 500)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Waiting
  if (session.status === 'waiting') {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
            <Users className="w-12 h-12 text-primary mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-display tracking-widest text-primary">En attente...</h2>
          <p className="text-muted-foreground text-sm">Partage ce lien avec ton adversaire</p>
          <div className="flex items-center gap-2 max-w-md mx-auto">
            <input readOnly value={`${window.location.origin}/versus?game=${session.id}`}
              className="flex-1 px-4 py-3 rounded-xl bg-card border border-border/30 text-sm text-foreground font-mono-stats truncate" />
            <button onClick={copyLink} className="px-4 py-3 rounded-xl bg-primary text-primary-foreground">
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <button onClick={goHome} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
        </div>
      </div>
    );
  }

  // Playing
  if (session.status === 'playing') {
    const myTacticsCount = isHost ? (session.host_tactics?.length || 0) : (session.guest_tactics?.length || 0);
    const hasSubmittedRound = myTacticsCount >= session.round;

    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-display tracking-widest text-primary">Round {session.round}/3</h2>
          <div className="flex items-center justify-center gap-4 font-mono-stats text-2xl">
            <span className={isHost ? 'text-primary' : 'text-foreground'}>{session.host_score}</span>
            <span className="text-muted-foreground">-</span>
            <span className={isGuest ? 'text-primary' : 'text-foreground'}>{session.guest_score}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{isHost ? 'Toi' : (hostName || 'Hôte')}</p>
            <p className="font-mono-stats text-3xl text-primary">{session.host_overall}</p>
          </div>
          <span className="text-2xl text-muted-foreground font-display">VS</span>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{isGuest ? 'Toi' : (guestName || 'Adversaire')}</p>
            <p className="font-mono-stats text-3xl text-foreground">{session.guest_overall}</p>
          </div>
        </div>

        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center p-6 rounded-2xl bg-card/80 border border-border/30">
              <p className="font-display text-lg tracking-widest text-primary">Round terminé !</p>
              <p className="font-mono-stats text-2xl mt-2">{session.host_score} - {session.guest_score}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {!showResult && (
          <div className="space-y-4">
            {hasSubmittedRound ? (
              <div className="text-center space-y-3 p-6 rounded-2xl bg-card/60 border border-border/30">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">En attente de l'adversaire...</p>
                <p className="text-xs text-primary font-display tracking-wider">
                  Tactique : {TACTICS.find(t => t.id === selectedTactic)?.label}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">Choisis ta tactique</p>
                <div className="grid grid-cols-3 gap-3">
                  {TACTICS.map(t => (
                    <motion.button key={t.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => submitTactic(t.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border/30 bg-card/60 hover:border-primary/50 hover:bg-primary/10 transition-all">
                      <span className="text-3xl">{t.icon}</span>
                      <span className="font-display text-xs tracking-wider">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Finished
  if (session.status === 'finished') {
    const won = session.winner_id === user?.id;
    const draw = !session.winner_id;
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            {won ? <Trophy className="w-16 h-16 mx-auto text-amber-400" /> : <Shield className="w-16 h-16 mx-auto text-muted-foreground" />}
          </motion.div>
          <h2 className={`text-3xl font-display tracking-widest ${won ? 'text-amber-400' : draw ? 'text-muted-foreground' : 'text-red-400'}`}>
            {won ? 'VICTOIRE' : draw ? 'ÉGALITÉ' : 'DÉFAITE'}
          </h2>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{isHost ? 'Toi' : (hostName || 'Hôte')}</p>
              <p className="font-mono-stats text-3xl text-primary">{session.host_score}</p>
            </div>
            <span className="text-2xl text-muted-foreground font-display">-</span>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{isGuest ? 'Toi' : (guestName || 'Adversaire')}</p>
              <p className="font-mono-stats text-3xl text-foreground">{session.guest_score}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30">
            <p className="text-sm text-muted-foreground">Crédits gagnés</p>
            <p className="font-mono-stats text-2xl text-amber-400">+{formatCoins(won ? 2000 : draw ? 1000 : 500)}</p>
          </div>
          <p className="text-xs text-muted-foreground">+10 XP pour tes 11 meilleures cartes</p>
          <button onClick={goHome} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-widest hover:brightness-110 transition-all">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return null;
}
