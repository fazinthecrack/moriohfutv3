import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CardDisplay } from '@/components/CardDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Tag, Pencil } from 'lucide-react';
import { formatCoins } from '@/lib/quick-sell';
import type { Rarity, Position, Card } from '@/lib/cards';

interface ListingCard {
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

interface ListingWithCard {
  id: string;
  price: number;
  seller_id: string;
  status: string;
  card_id: string;
  created_at: string;
  card: ListingCard;
  sellerUsername?: string;
}

function toCard(c: ListingCard): Card {
  return {
    id: c.id,
    name: c.name,
    rarity: c.rarity as Rarity,
    emoji: c.emoji,
    image_url: c.image_url,
    position: (c.position || 'BU') as Position,
    overall: c.overall || 0,
    stats: { rap: c.stat_rap || 0, tir: c.stat_tir || 0, pas: c.stat_pas || 0, dri: c.stat_dri || 0, def: c.stat_def || 0, phy: c.stat_phy || 0 },
  };
}

export default function Market() {
  const { user, profile, refreshProfile } = useAuth();
  const [listings, setListings] = useState<ListingWithCard[]>([]);
  const [myCards, setMyCards] = useState<any[]>([]);
  const [showSell, setShowSell] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    fetchListings();
    if (user) fetchMyCards();
  }, [user]);

  const fetchListings = async () => {
    const { data: listingsData } = await supabase
      .from('marketplace_listings')
      .select('*, card:user_cards(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!listingsData) { setLoading(false); return; }

    const sellerIds = [...new Set(listingsData.map((l: any) => l.seller_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username')
      .in('user_id', sellerIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.username]));

    const enriched = listingsData.map((l: any) => ({
      ...l,
      sellerUsername: profileMap.get(l.seller_id) || 'Inconnu',
    }));

    setListings(enriched as ListingWithCard[]);
    setLoading(false);
  };

  const fetchMyCards = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_listed', false)
      .eq('is_tradeable', true);
    if (data) setMyCards(data);
  };

  const createListing = async () => {
    if (!selectedCard || !price || !user) return;
    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) { toast.error('Prix invalide'); return; }

    const { error: updateError } = await supabase.from('user_cards').update({ is_listed: true }).eq('id', selectedCard);
    if (updateError) { toast.error('Erreur lors de la mise à jour de la carte'); return; }

    const { error } = await supabase.from('marketplace_listings').insert({
      seller_id: user.id,
      card_id: selectedCard,
      price: priceNum,
    });
    if (error) { toast.error('Erreur lors de la mise en vente'); return; }
    toast.success('Carte mise en vente !');
    setShowSell(false);
    setSelectedCard(null);
    setPrice('');
    fetchListings();
    fetchMyCards();
  };

  const updateListingPrice = async (listingId: string) => {
    const newPrice = parseInt(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) { toast.error('Prix invalide'); return; }
    const { data, error } = await supabase.rpc('update_listing_price', { listing_id: listingId, new_price: newPrice });
    if (error) { toast.error('Erreur'); return; }
    const result = data as any;
    if (!result.success) { toast.error(result.error); return; }
    toast.success('Prix mis à jour !');
    setEditingListing(null);
    setEditPrice('');
    fetchListings();
  };

  const buyCard = async (listingId: string, listingPrice: number) => {
    if (!profile || profile.credits < listingPrice) {
      toast.error(`Crédits insuffisants (${formatCoins(profile?.credits ?? 0)} / ${formatCoins(listingPrice)})`);
      return;
    }
    const { data, error } = await supabase.rpc('buy_card', { listing_id: listingId });
    if (error) { toast.error('Erreur'); return; }
    const result = data as any;
    if (!result.success) { toast.error(result.error); return; }
    toast.success('Carte achetée !');
    await refreshProfile();
    fetchListings();
    fetchMyCards();
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display tracking-widest text-primary">Marché</h1>
        <Button
          onClick={() => { setShowSell(!showSell); if (!showSell) fetchMyCards(); }}
          variant={showSell ? 'secondary' : 'default'}
          size="sm"
          className="font-display tracking-wider"
        >
          {showSell ? 'Fermer' : <><Plus className="w-4 h-4 mr-1" />Vendre</>}
        </Button>
      </div>

      {showSell && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-card/40 backdrop-blur-xl rounded-xl border border-border/30 p-4 space-y-4"
        >
          <h3 className="font-display text-xs tracking-wider text-primary">Choisir une carte à vendre</h3>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {myCards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={`border rounded-lg p-2 text-left text-xs transition-all ${
                  selectedCard === card.id ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-muted-foreground'
                }`}
              >
                {card.image_url ? (
                  <img src={card.image_url} alt={card.name} className="w-10 h-12 object-cover rounded mb-1" />
                ) : (
                  <span className="text-lg">{card.emoji}</span>
                )}
                <p className="font-semibold">{card.name}</p>
                <p className="font-mono-stats text-muted-foreground">{card.overall} OVR</p>
              </button>
            ))}
            {myCards.length === 0 && <p className="text-muted-foreground text-xs">Aucune carte disponible</p>}
          </div>
          {selectedCard && (
            <div className="flex gap-2 items-center">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Prix en crédits"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-40 bg-background/50 border-border/30"
              />
              <Button onClick={createListing} size="sm" className="font-display tracking-wider">Mettre en vente</Button>
            </div>
          )}
        </motion.div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-center py-10 text-sm">Chargement...</p>
      ) : listings.length === 0 ? (
        <p className="text-muted-foreground text-center py-10 text-sm">Aucune carte en vente pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-xl border border-border/20 p-4 space-y-3 bg-card/30 backdrop-blur"
            >
              <div className="flex justify-center">
                <CardDisplay card={toCard(listing.card)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{listing.sellerUsername}</p>
                  {editingListing === listing.id ? (
                    <div className="flex gap-1.5 items-center mt-1">
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-24 h-8 text-xs bg-background/50 border-border/30"
                        placeholder="Nouveau prix"
                        min={1}
                      />
                      <Button size="sm" className="h-8 text-xs" onClick={() => updateListingPrice(listing.id)}>OK</Button>
                      <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingListing(null)}>✕</Button>
                    </div>
                  ) : (
                    <p className="text-lg font-bold font-mono-stats text-primary">{formatCoins(listing.price)} <span className="text-xs text-muted-foreground">cr</span></p>
                  )}
                </div>
                {user && listing.seller_id === user.id && editingListing !== listing.id ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingListing(listing.id); setEditPrice(listing.price.toString()); }}
                    className="text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                ) : user && listing.seller_id !== user.id ? (
                  <Button size="sm" onClick={() => buyCard(listing.id, listing.price)} className="font-display tracking-wider text-xs">
                    Acheter
                  </Button>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
