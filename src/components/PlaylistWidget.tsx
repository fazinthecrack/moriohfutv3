import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Plus, X, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Song {
  id: string;
  user_id: string;
  url: string;
  title: string;
  platform: 'spotify' | 'youtube';
  created_at: string;
}

function parseMediaUrl(url: string): { platform: 'spotify' | 'youtube'; embedUrl: string; title: string } | null {
  // Spotify track
  const spotifyMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    return { platform: 'spotify', embedUrl: `https://open.spotify.com/embed/track/${spotifyMatch[1]}?theme=0`, title: 'Spotify Track' };
  }
  // Spotify playlist
  const spotifyPlaylistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (spotifyPlaylistMatch) {
    return { platform: 'spotify', embedUrl: `https://open.spotify.com/embed/playlist/${spotifyPlaylistMatch[1]}?theme=0`, title: 'Spotify Playlist' };
  }
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, title: 'YouTube Video' };
  }
  return null;
}

export function PlaylistWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSongs();
    const channel = supabase
      .channel('playlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlist_songs' }, () => fetchSongs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchSongs = async () => {
    const { data } = await supabase
      .from('playlist_songs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setSongs(data as Song[]);
  };

  const addSong = async () => {
    if (!newUrl.trim() || !user) return;
    const parsed = parseMediaUrl(newUrl);
    if (!parsed) { toast.error('Lien Spotify ou YouTube invalide'); return; }
    setAdding(true);
    const { error } = await supabase.from('playlist_songs').insert({
      user_id: user.id,
      url: parsed.embedUrl,
      title: parsed.title,
      platform: parsed.platform,
    });
    if (error) toast.error('Erreur');
    else { setNewUrl(''); toast.success('Musique ajoutée !'); }
    setAdding(false);
  };

  const deleteSong = async (id: string) => {
    await supabase.from('playlist_songs').delete().eq('id', id);
  };

  const currentSong = songs[currentIndex];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="glass-panel rounded-xl w-80 mb-2 overflow-hidden"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-sm tracking-wider text-primary">Playlist</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current player */}
            {currentSong && (
              <div className="p-2">
                <iframe
                  src={currentSong.url}
                  className="w-full rounded-lg"
                  height={currentSong.platform === 'spotify' ? 80 : 160}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            )}

            {/* Song list */}
            <div className="max-h-40 overflow-y-auto">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-secondary transition-colors ${i === currentIndex ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  <span className="flex-1 truncate">{song.platform === 'spotify' ? '🎵' : '▶️'} {song.title}</span>
                  {user && song.user_id === user.id && (
                    <button onClick={(e) => { e.stopPropagation(); deleteSong(song.id); }} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
              {songs.length === 0 && <p className="text-center text-muted-foreground text-xs py-4">Aucune musique</p>}
            </div>

            {/* Add song */}
            {user && (
              <div className="p-2 border-t border-border flex gap-2">
                <Input
                  placeholder="Lien Spotify ou YouTube..."
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="text-xs h-8 bg-secondary"
                  onKeyDown={e => e.key === 'Enter' && addSong()}
                />
                <Button size="sm" onClick={addSong} disabled={adding} className="h-8 px-2">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg fc-glow"
      >
        {open ? <ChevronUp className="w-5 h-5" /> : <Music className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}
