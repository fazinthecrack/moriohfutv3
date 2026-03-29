import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FORMATIONS, isPositionCompatible, POSITION_LABELS } from '@/lib/cards';
import type { Position } from '@/lib/cards';
import { isPositionCompatibleWithAlt, calculateTeamChemistry, getCoachChemBoost, COACHES, type Coach } from '@/lib/chemistry';
import { CLUB_LOGOS } from '@/lib/club-logos';
import { ChevronDown, X, AlertTriangle, Shield, Pencil, Users, Armchair, GraduationCap, Sparkles } from 'lucide-react';
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
}

interface UserTeam {
  team_name: string;
  logo_url: string;
}

const rarityBorder: Record<string, string> = {
  common: 'border-[hsl(220,10%,55%)]',
  rare: 'border-[hsl(210,80%,55%)]',
  epic: 'border-[hsl(280,70%,60%)]',
  legendary: 'border-[hsl(45,95%,55%)]',
};

const rarityGlow: Record<string, string> = {
  common: '',
  rare: 'shadow-[0_0_12px_hsl(210,80%,55%,0.4)]',
  epic: 'shadow-[0_0_16px_hsl(280,70%,60%,0.5)]',
  legendary: 'shadow-[0_0_20px_hsl(45,95%,55%,0.6)]',
};

function chemColor(score: number): string {
  if (score >= 7) return 'text-green-400';
  if (score >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function chemBgColor(score: number): string {
  if (score >= 7) return 'bg-green-500/20 border-green-500/30';
  if (score >= 4) return 'bg-amber-500/20 border-amber-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

function totalChemColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export default function Lineup() {
  const { user } = useAuth();
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [lineup, setLineup] = useState<(UserCard | null)[]>(Array(11).fill(null));
  const [bench, setBench] = useState<(UserCard | null)[]>(Array(7).fill(null));
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selecting, setSelecting] = useState<{ type: 'lineup' | 'bench'; index: number } | null>(null);
  const [showFormationPicker, setShowFormationPicker] = useState(false);
  const [showCoachPicker, setShowCoachPicker] = useState(false);

  // Team setup
  const [team, setTeam] = useState<UserTeam | null>(null);
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamLoading, setTeamLoading] = useState(true);

  const formation = FORMATIONS[selectedFormation];

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_listed', false)
      .then(({ data }) => { if (data) setCards(data as UserCard[]); });

    // Load saved lineup
    const saved = localStorage.getItem(`lineup_v3_${user.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLineup(parsed.lineup || Array(11).fill(null));
        setBench(parsed.bench || Array(7).fill(null));
        setSelectedFormation(parsed.formation || '4-4-2');
        if (parsed.coachId) {
          setSelectedCoach(COACHES.find(c => c.id === parsed.coachId) || null);
        }
      } catch {}
    }

    supabase
      .from('user_teams')
      .select('team_name, logo_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setTeam({ team_name: data.team_name, logo_url: data.logo_url });
        else setShowTeamSetup(true);
        setTeamLoading(false);
      });
  }, [user]);

  const saveAll = (newLineup: (UserCard | null)[], newBench: (UserCard | null)[], form: string, coach: Coach | null) => {
    if (user) {
      localStorage.setItem(`lineup_v3_${user.id}`, JSON.stringify({
        lineup: newLineup,
        bench: newBench,
        formation: form,
        coachId: coach?.id || null,
      }));
    }
  };

  const assignCard = (card: UserCard) => {
    if (!selecting) return;
    if (selecting.type === 'lineup') {
      const newLineup = [...lineup];
      newLineup[selecting.index] = card;
      setLineup(newLineup);
      saveAll(newLineup, bench, selectedFormation, selectedCoach);
    } else {
      const newBench = [...bench];
      newBench[selecting.index] = card;
      setBench(newBench);
      saveAll(lineup, newBench, selectedFormation, selectedCoach);
    }
    setSelecting(null);
  };

  const removeFromSlot = (type: 'lineup' | 'bench', idx: number) => {
    if (type === 'lineup') {
      const newLineup = [...lineup];
      newLineup[idx] = null;
      setLineup(newLineup);
      saveAll(newLineup, bench, selectedFormation, selectedCoach);
    } else {
      const newBench = [...bench];
      newBench[idx] = null;
      setBench(newBench);
      saveAll(lineup, newBench, selectedFormation, selectedCoach);
    }
  };

  const changeFormation = (formKey: string) => {
    setSelectedFormation(formKey);
    setShowFormationPicker(false);
    const newLineup = Array(11).fill(null);
    setLineup(newLineup);
    saveAll(newLineup, bench, formKey, selectedCoach);
  };

  const selectCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setShowCoachPicker(false);
    saveAll(lineup, bench, selectedFormation, coach);
    toast.success(`Coach ${coach.name} sélectionné !`);
  };

  const saveTeam = async () => {
    if (!user || !teamName.trim()) return;
    const teamData = { user_id: user.id, team_name: teamName.trim(), logo_url: teamLogo };
    if (team) {
      await supabase.from('user_teams').update({ team_name: teamData.team_name, logo_url: teamData.logo_url }).eq('user_id', user.id);
    } else {
      await supabase.from('user_teams').insert(teamData);
    }
    setTeam({ team_name: teamData.team_name, logo_url: teamData.logo_url });
    setShowTeamSetup(false);
    toast.success('Équipe sauvegardée !');
  };

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    lineup.filter(Boolean).forEach(c => ids.add(c!.id));
    bench.filter(Boolean).forEach(c => ids.add(c!.id));
    return ids;
  }, [lineup, bench]);

  const getCompatibleCards = (type: 'lineup' | 'bench', slotIdx: number) => {
    if (type === 'bench') {
      return cards.filter(c => !assignedIds.has(c.id));
    }
    const slot = formation.slots[slotIdx];
    return cards.filter(c =>
      !assignedIds.has(c.id) &&
      isPositionCompatibleWithAlt(c.position as Position, c.name, c.overall, slot.pos)
    );
  };

  // Chemistry calculation
  const chemistry = useMemo(() => {
    const lineupData = lineup.map(c => c ? { name: c.name, overall: c.overall, position: c.position } : null);
    const chem = calculateTeamChemistry(lineupData, formation.slots);
    // Apply coach boost
    if (selectedCoach) {
      const boost = getCoachChemBoost(selectedCoach, lineupData);
      chem.total = Math.min(100, chem.total + boost);
    }
    return chem;
  }, [lineup, formation, selectedCoach]);

  const totalRating = lineup.filter(Boolean).reduce((sum, c) => sum + (c?.overall || 0), 0);
  const filledCount = lineup.filter(Boolean).length;

  if (teamLoading) {
    return <div className="p-6 flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>;
  }

  // Team setup modal
  if (showTeamSetup) {
    return (
      <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6 min-h-[60vh] flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 p-6 space-y-6"
        >
          <div className="text-center space-y-2">
            <Shield className="w-10 h-10 text-primary mx-auto" />
            <h2 className="text-xl font-display tracking-widest text-primary">
              {team ? 'Modifier ton équipe' : 'Crée ton équipe'}
            </h2>
            <p className="text-muted-foreground text-xs">Choisis un nom et un blason pour ton club</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-display tracking-wider text-muted-foreground">Nom de l'équipe</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Ex: FC Morioh"
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl bg-background/60 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 font-display tracking-wider"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-display tracking-wider text-muted-foreground">Blason du club</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {CLUB_LOGOS.filter(c => c.logoUrl).map(club => (
                <button
                  key={club.name}
                  onClick={() => setTeamLogo(club.logoUrl || club.emoji)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all duration-300 ${
                    (teamLogo === club.logoUrl || teamLogo === club.emoji)
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border/20 hover:border-border/40 hover:bg-secondary/20'
                  }`}
                >
                  <img src={club.logoUrl} alt={club.name} className="w-8 h-8 object-contain" />
                  <span className="text-[8px] text-muted-foreground truncate w-full text-center">{club.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {team && (
              <button
                onClick={() => setShowTeamSetup(false)}
                className="flex-1 py-3 rounded-xl border border-border/30 text-muted-foreground font-display text-sm tracking-wider hover:bg-secondary/30 transition-colors"
              >
                Annuler
              </button>
            )}
            <button
              onClick={saveTeam}
              disabled={!teamName.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-display text-sm tracking-wider hover:brightness-110 transition-all disabled:opacity-40"
            >
              {team ? 'Sauvegarder' : 'Créer mon club'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {team && (
            <button 
              onClick={() => { setTeamName(team.team_name); setTeamLogo(team.logo_url); setShowTeamSetup(true); }}
              className="flex items-center gap-2 group"
            >
              {team.logo_url?.startsWith('http') ? (
                <img src={team.logo_url} alt={team.team_name} className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-2xl">{team.logo_url || '⚽'}</span>
              )}
              <div>
                <h1 className="text-xl font-display tracking-widest text-primary group-hover:text-primary/80 transition-colors">{team.team_name}</h1>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" /> Modifier
                </p>
              </div>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Formation selector */}
          <div className="relative">
            <button
              onClick={() => setShowFormationPicker(!showFormationPicker)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30 hover:border-primary/40 transition-all"
            >
              <span className="font-display text-xs tracking-wider text-primary">{selectedFormation}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            <AnimatePresence>
              {showFormationPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-card border border-border/40 rounded-xl shadow-2xl p-2 min-w-[160px] max-h-72 overflow-y-auto"
                >
                  {Object.keys(FORMATIONS).map(key => (
                    <button
                      key={key}
                      onClick={() => changeFormation(key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-display tracking-wider transition-all ${
                        key === selectedFormation ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/50 text-foreground/80'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-right space-y-0.5">
            <p className="font-mono-stats text-sm text-primary">{filledCount}/11</p>
            <p className="text-[10px] text-muted-foreground font-mono-stats">{totalRating} OVR</p>
          </div>
        </div>
      </div>

      {/* Chemistry + Coach bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Chemistry score */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 border border-border/30">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-display tracking-wider text-muted-foreground">Collectif</span>
          <span className={`font-mono-stats text-lg font-bold ${totalChemColor(chemistry.total)}`}>{chemistry.total}</span>
        </div>

        {/* Coach */}
        <button
          onClick={() => setShowCoachPicker(!showCoachPicker)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 border border-border/30 hover:border-primary/40 transition-all"
        >
          <GraduationCap className="w-4 h-4 text-primary" />
          {selectedCoach ? (
            <span className="text-xs font-display tracking-wider">{selectedCoach.name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Choisir un coach</span>
          )}
        </button>
      </div>

      {/* Coach picker */}
      <AnimatePresence>
        {showCoachPicker && COACHES.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-card/40 rounded-xl border border-border/20">
              {COACHES.map(coach => (
                <button
                  key={coach.id}
                  onClick={() => selectCoach(coach)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedCoach?.id === coach.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/20 hover:border-primary/30 hover:bg-secondary/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="font-display text-sm tracking-wider">{coach.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{coach.nationality}</p>
                  <p className="text-[10px] text-primary/70 mt-0.5">{coach.bonus}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout: pitch left, picker right on desktop */}
      <div className="flex flex-col lg:flex-row gap-4">
      {/* Left column: Pitch + Bench */}
      <div className="flex-1 space-y-4">
      {/* Pitch */}
      <div className="relative w-full aspect-[3/4] max-w-2xl mx-auto rounded-2xl overflow-hidden border border-border/20">
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(140,35%,18%)] to-[hsl(140,30%,10%)]" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-foreground/15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground/20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-l border-r border-foreground/15 rounded-t-sm" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-10 border-t border-l border-r border-foreground/10 rounded-t-sm" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-l border-r border-foreground/15 rounded-b-sm" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-10 border-b border-l border-r border-foreground/10 rounded-b-sm" />

        {formation.slots.map((slot, idx) => {
          const card = lineup[idx];
          const pChem = chemistry.playerChem[idx];
          return (
            <motion.button
              key={`${selectedFormation}-${idx}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.03 * idx }}
              onClick={() => {
                if (card) removeFromSlot('lineup', idx);
                else setSelecting({ type: 'lineup', index: idx });
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              {card ? (
                <div className="relative">
                  <div className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 ${rarityBorder[card.rarity] || ''} ${rarityGlow[card.rarity] || ''} bg-card/90 backdrop-blur overflow-hidden transition-transform group-hover:scale-110 flex items-center justify-center`}>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <X className="w-2.5 h-2.5 text-destructive-foreground" />
                    </div>
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-full h-full object-cover object-top" />
                    ) : (
                      <span className="text-2xl">{card.emoji}</span>
                    )}
                  </div>
                  {/* Chemistry indicator */}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[8px] font-mono-stats font-bold border ${chemBgColor(pChem)}`}>
                    <span className={chemColor(pChem)}>{pChem}</span>
                  </div>
                </div>
              ) : (
                <div className={`w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 border-dashed ${
                  selecting?.type === 'lineup' && selecting.index === idx ? 'border-primary bg-primary/20 scale-110' : 'border-foreground/20'
                } flex flex-col items-center justify-center gap-0.5 transition-all group-hover:border-primary/50 group-hover:bg-primary/5`}>
                  <span className="font-display text-[10px] text-foreground/60">{slot.label}</span>
                  <span className="text-foreground/30 text-xs">+</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bench */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Armchair className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-display text-xs tracking-wider text-muted-foreground">Banc (7)</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {bench.map((card, idx) => (
            <button
              key={`bench-${idx}`}
              onClick={() => {
                if (card) removeFromSlot('bench', idx);
                else setSelecting({ type: 'bench', index: idx });
              }}
              className={`flex-shrink-0 group ${
                selecting?.type === 'bench' && selecting.index === idx ? 'ring-2 ring-primary rounded-lg' : ''
              }`}
            >
              {card ? (
                <div className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 ${rarityBorder[card.rarity] || ''} bg-card/90 overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center`}>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <X className="w-2.5 h-2.5 text-destructive-foreground" />
                  </div>
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <span className="text-2xl">{card.emoji}</span>
                  )}
                </div>
              ) : (
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg border-2 border-dashed border-foreground/15 flex items-center justify-center transition-all group-hover:border-primary/40">
                  <span className="text-foreground/30 text-xs">+</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Card picker */}
      <AnimatePresence>
        {selecting !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-card/60 backdrop-blur-xl rounded-xl border border-border/30 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xs tracking-wider text-primary">
                  {selecting.type === 'lineup'
                    ? `Choisir pour ${formation.slots[selecting.index]?.label}`
                    : `Banc #${selecting.index + 1}`
                  }
                </h3>
                {selecting.type === 'lineup' && (
                  <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full">
                    Positions compatibles
                  </span>
                )}
              </div>
              <button onClick={() => setSelecting(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-80 overflow-y-auto">
              {getCompatibleCards(selecting.type, selecting.index).map(card => (
                <button
                  key={card.id}
                  onClick={() => assignCard(card)}
                  className="rounded-xl overflow-hidden hover:scale-105 transition-transform duration-200 hover:ring-2 hover:ring-primary"
                >
                  {card.image_url ? (
                    <img src={card.image_url} alt={card.name} className="w-full aspect-[3/4] object-cover object-top rounded-xl" />
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center bg-card rounded-xl border border-border/30">
                      <span className="text-3xl">{card.emoji}</span>
                    </div>
                  )}
                </button>
              ))}
              {getCompatibleCards(selecting.type, selecting.index).length === 0 && (
                <div className="col-span-full text-center py-6 space-y-2">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground text-xs">
                    {selecting.type === 'lineup'
                      ? `Aucune carte compatible avec le poste ${formation.slots[selecting.index]?.label}`
                      : 'Aucune carte disponible'
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
