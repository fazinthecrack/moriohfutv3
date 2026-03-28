import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DIVISIONS, getDivisionFromPoints, getPointsForNextDivision, calculateMatchOutcome, calculateCreditsEarned, calculatePointsChange } from '@/lib/divisions';
import { formatCoins } from '@/lib/quick-sell';
import { Swords, Trophy, TrendingUp, TrendingDown, History, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface DivisionData {
  division: number;
  points: number;
  wins: number;
  losses: number;
}

interface MatchResult {
  id: string;
  opponent_id: string;
  player_overall: number;
  opponent_overall: number;
  player_won: boolean;
  credits_earned: number;
  points_change: number;
  created_at: string;
}

export default function Versus() {
  const { user, profile, refreshProfile } = useAuth();
  const [divData, setDivData] = useState<DivisionData | null>(null);
  const [matchHistory, setMatchHistory] = useState<MatchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    won: boolean;
    playerOverall: number;
    opponentOverall: number;
    opponentName: string;
    credits: number;
    pointsChange: number;
    newDivision: ReturnType<typeof getDivisionFromPoints>;
    promoted: boolean;
    demoted: boolean;
  } | null>(null);
  const [playerOverall, setPlayerOverall] = useState(0);
  const [cardCount, setCardCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadDivision();
    loadHistory();
    loadPlayerOverall();
  }, [user]);

  const loadDivision = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_divisions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setDivData(data as DivisionData);
    } else {
      await supabase.from('user_divisions').insert({ user_id: user.id });
      setDivData({ division: 10, points: 0, wins: 0, losses: 0 });
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('player_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setMatchHistory(data as MatchResult[]);
  };

  const loadPlayerOverall = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_cards')
      .select('overall')
      .eq('user_id', user.id)
      .eq('is_listed', false)
      .order('overall', { ascending: false })
      .limit(11);
    
    if (data) {
      setCardCount(data.length);
      if (data.length >= 11) {
        const avg = Math.round(data.slice(0, 11).reduce((s, c) => s + c.overall, 0) / 11);
        setPlayerOverall(avg);
      } else {
        setPlayerOverall(0);
      }
    }
  };

  const hasFullTeam = cardCount >= 11;

  const findMatch = useCallback(async () => {
    if (!user || !divData || searching || !hasFullTeam) return;

    setSearching(true);
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

    // Find real opponents
    const { data: opponents } = await supabase
      .from('user_cards')
      .select('user_id, overall')
      .neq('user_id', user.id)
      .eq('is_listed', false);

    let opponentOverall: number;
    let opponentId: string;
    let opponentName = 'Joueur';

    if (opponents && opponents.length > 0) {
      const byUser: Record<string, number[]> = {};
      opponents.forEach(c => {
        if (!byUser[c.user_id]) byUser[c.user_id] = [];
        byUser[c.user_id].push(c.overall);
      });

      // Only consider users with 11+ cards
      const validUsers = Object.entries(byUser).filter(([, cards]) => cards.length >= 11);

      if (validUsers.length > 0) {
        const [randomUserId, userCards] = validUsers[Math.floor(Math.random() * validUsers.length)];
        const top11 = userCards.sort((a, b) => b - a).slice(0, 11);
        opponentOverall = Math.round(top11.reduce((s, v) => s + v, 0) / 11);
        opponentId = randomUserId;

        const { data: oppProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', randomUserId)
          .single();
        if (oppProfile) opponentName = oppProfile.username;
      } else {
        // Fallback: generate opponent based on player level
        opponentOverall = Math.max(60, playerOverall + Math.floor(Math.random() * 10 - 5));
        opponentId = '00000000-0000-0000-0000-000000000000';
        opponentName = 'Adversaire';
      }
    } else {
      opponentOverall = Math.max(60, playerOverall + Math.floor(Math.random() * 10 - 5));
      opponentId = '00000000-0000-0000-0000-000000000000';
      opponentName = 'Adversaire';
    }

    const outcome = calculateMatchOutcome(playerOverall, opponentOverall);
    const credits = calculateCreditsEarned(divData.division, outcome.playerWon, outcome.dominance);
    const pointsChange = calculatePointsChange(outcome.playerWon, outcome.dominance);
    const newPoints = Math.max(0, divData.points + pointsChange);
    const oldDiv = getDivisionFromPoints(divData.points);
    const newDiv = getDivisionFromPoints(newPoints);
    const promoted = newDiv.div < oldDiv.div;
    const demoted = newDiv.div > oldDiv.div;

    const newWins = divData.wins + (outcome.playerWon ? 1 : 0);
    const newLosses = divData.losses + (outcome.playerWon ? 0 : 1);

    await supabase.from('user_divisions').update({
      division: newDiv.div,
      points: newPoints,
      wins: newWins,
      losses: newLosses,
    }).eq('user_id', user.id);

    await supabase.from('matches').insert({
      player_id: user.id,
      opponent_id: opponentId,
      player_overall: playerOverall,
      opponent_overall: opponentOverall,
      player_won: outcome.playerWon,
      credits_earned: credits,
      points_change: pointsChange,
    });

    if (profile) {
      await supabase.from('profiles').update({
        credits: profile.credits + credits,
      }).eq('user_id', user.id);
      await refreshProfile();
    }

    setDivData({ division: newDiv.div, points: newPoints, wins: newWins, losses: newLosses });
    setMatchResult({
      won: outcome.playerWon,
      playerOverall,
      opponentOverall,
      opponentName,
      credits,
      pointsChange,
      newDivision: newDiv,
      promoted,
      demoted,
    });

    setSearching(false);
    loadHistory();
  }, [user, divData, playerOverall, searching, profile, hasFullTeam]);

  if (!divData) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentDiv = getDivisionFromPoints(divData.points);
  const nextDivPoints = getPointsForNextDivision(divData.points);
  const progress = nextDivPoints ? ((divData.points - currentDiv.minPoints) / (nextDivPoints - currentDiv.minPoints)) * 100 : 100;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-display tracking-widest text-primary">1v1</h1>
        <p className="text-muted-foreground text-sm mt-1">Affronte d'autres joueurs et monte en division</p>
      </div>

      {/* Division card */}
      <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display font-bold"
              style={{ backgroundColor: `${currentDiv.color}20`, color: currentDiv.color }}
            >
              {currentDiv.div}
            </div>
            <div>
              <h2 className="font-display tracking-wider text-lg" style={{ color: currentDiv.color }}>
                {currentDiv.name}
              </h2>
              <p className="text-xs text-muted-foreground font-mono-stats">
                {divData.points} pts • {divData.wins}V / {divData.losses}D
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Général équipe</p>
            <p className="font-mono-stats text-2xl text-primary">{hasFullTeam ? playerOverall : '—'}</p>
          </div>
        </div>

        {nextDivPoints && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono-stats">
              <span>{divData.points} pts</span>
              <span>{nextDivPoints} pts</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: currentDiv.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Play button or warning */}
      <div className="flex flex-col items-center gap-3">
        {!hasFullTeam ? (
          <div className="text-center space-y-3 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-amber-300 font-display tracking-wider text-sm">
              Équipe incomplète ({cardCount}/11 cartes)
            </p>
            <p className="text-muted-foreground text-xs">
              Tu dois avoir au moins 11 cartes pour jouer en 1v1
            </p>
            <Link
              to="/packs"
              className="inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:brightness-110 transition-all"
            >
              Ouvrir des packs
            </Link>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={findMatch}
            disabled={searching}
            className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-primary-foreground font-display text-xl tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
          >
            {searching ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Swords className="w-6 h-6" />
                Jouer
              </>
            )}
          </motion.button>
        )}
      </div>

      {/* Match result modal */}
      <AnimatePresence>
        {matchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4"
            onClick={() => setMatchResult(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-border/30 bg-card p-6 space-y-6"
            >
              <div className="text-center space-y-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  {matchResult.won ? (
                    <Trophy className="w-16 h-16 mx-auto text-amber-400" />
                  ) : (
                    <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
                  )}
                </motion.div>
                <h2 className={`text-3xl font-display tracking-widest ${matchResult.won ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {matchResult.won ? 'VICTOIRE' : 'DÉFAITE'}
                </h2>
                {(matchResult.promoted || matchResult.demoted) && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={`text-sm font-display tracking-wider ${matchResult.promoted ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {matchResult.promoted ? '⬆️ Promotion !' : '⬇️ Relégation'}
                    {' '}
                    <span style={{ color: matchResult.newDivision.color }}>{matchResult.newDivision.name}</span>
                  </motion.p>
                )}
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Toi</p>
                  <p className="font-mono-stats text-3xl text-primary">{matchResult.playerOverall}</p>
                </div>
                <span className="text-2xl text-muted-foreground font-display">VS</span>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">{matchResult.opponentName}</p>
                  <p className="font-mono-stats text-3xl text-foreground">{matchResult.opponentOverall}</p>
                </div>
              </div>

              <div className="space-y-2 bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Crédits gagnés</span>
                  <span className="font-mono-stats text-amber-400">+{formatCoins(matchResult.credits)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Points</span>
                  <span className={`font-mono-stats flex items-center gap-1 ${matchResult.pointsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {matchResult.pointsChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {matchResult.pointsChange >= 0 ? '+' : ''}{matchResult.pointsChange}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMatchResult(null)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display tracking-widest hover:brightness-110 transition-all"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match history */}
      {matchHistory.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display tracking-wider text-sm text-muted-foreground">Historique</h3>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {matchHistory.map((m) => (
              <div
                key={m.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  m.player_won
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-display tracking-wider ${m.player_won ? 'text-green-400' : 'text-red-400'}`}>
                    {m.player_won ? 'V' : 'D'}
                  </span>
                  <div>
                    <p className="text-sm font-mono-stats">
                      {m.player_overall} vs {m.opponent_overall}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono-stats text-xs text-amber-400">+{formatCoins(m.credits_earned)}</p>
                  <p className={`font-mono-stats text-[10px] ${m.points_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {m.points_change >= 0 ? '+' : ''}{m.points_change} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
