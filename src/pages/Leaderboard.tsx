import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  wins: number;
  losses: number;
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data: games } = await supabase.from('game_sessions').select('host_id, guest_id, winner_id').eq('status', 'finished');
    if (!games || games.length === 0) { setLoading(false); return; }

    const stats: Record<string, { wins: number; losses: number }> = {};
    games.forEach((g: any) => {
      [g.host_id, g.guest_id].filter(Boolean).forEach((id: string) => {
        if (!stats[id]) stats[id] = { wins: 0, losses: 0 };
      });
      if (g.winner_id) {
        stats[g.winner_id].wins++;
        const loserId = g.winner_id === g.host_id ? g.guest_id : g.host_id;
        if (loserId && stats[loserId]) stats[loserId].losses++;
      }
    });

    const userIds = Object.keys(stats);
    if (userIds.length === 0) { setLoading(false); return; }

    const { data: profiles } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds);
    const nameMap: Record<string, string> = {};
    profiles?.forEach(p => { nameMap[p.user_id] = p.username; });

    const leaderboard = userIds.map(id => ({
      user_id: id,
      username: nameMap[id] || 'Inconnu',
      wins: stats[id].wins,
      losses: stats[id].losses,
    })).sort((a, b) => b.wins - a.wins || a.losses - b.losses).slice(0, 50);

    setEntries(leaderboard);
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
        <h1 className="text-3xl font-display tracking-widest text-primary">Classement</h1>
        <p className="text-muted-foreground text-sm">Top joueurs 1v1</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground animate-pulse">Chargement...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Aucun match joué pour le moment</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <div key={e.user_id} className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${
              i === 0 ? 'border-amber-500/30 bg-amber-500/5' :
              i === 1 ? 'border-gray-400/30 bg-gray-400/5' :
              i === 2 ? 'border-orange-600/30 bg-orange-600/5' :
              'border-border/20 bg-card/30'
            }`}>
              <div className="w-8 text-center">
                {i < 3 ? (
                  <Medal className={`w-5 h-5 mx-auto ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : 'text-orange-600'}`} />
                ) : (
                  <span className="font-mono-stats text-sm text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-display tracking-wider text-sm">{e.username}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-mono-stats text-sm text-green-400">{e.wins}V</p>
                <p className="font-mono-stats text-sm text-red-400">{e.losses}D</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
