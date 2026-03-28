import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useClickSound } from '@/hooks/useClickSound';
import logoWide from '@/assets/logo-wide.png';

export default function Auth() {
  useClickSound();
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Chargement...</div></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignUp) {
        const { error } = await signUpWithEmail(email, password, username);
        if (error) throw error;
        toast.success('Compte créé ! Vérifie ton email.');
      } else {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* YouTube video background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <iframe
          src="https://www.youtube.com/embed/asbjp60vbJk?autoplay=1&mute=1&loop=1&playlist=asbjp60vbJk&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0&disablekb=1"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '177.78vh',
            height: '100vh',
            minWidth: '100vw',
            minHeight: '56.25vw',
            border: 'none',
          }}
          allow="autoplay; encrypted-media"
          title="Background"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <img src={logoWide} alt="Morioh Ultimate Team" className="h-16 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Ouvre des packs. Collectionne. Échange.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/30 p-6 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              {isSignUp && (
                <Input
                  placeholder="Nom d'utilisateur"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="bg-background/50 border-border/30 h-11"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-background/50 border-border/30 h-11"
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-background/50 border-border/30 h-11"
              />
              <Button type="submit" disabled={submitting} className="w-full font-display text-base tracking-wider h-11">
                {submitting ? '...' : isSignUp ? "S'inscrire" : 'Se connecter'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card/60 px-3 text-muted-foreground rounded">ou</span></div>
            </div>

            <Button variant="outline" onClick={signInWithGoogle} className="w-full gap-2 bg-background/30 border-border/30">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuer avec Google
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? 'Déjà un compte ?' : 'Pas de compte ?'}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
                {isSignUp ? 'Se connecter' : "S'inscrire"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
