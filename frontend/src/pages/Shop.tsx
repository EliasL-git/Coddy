import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ShoppingBag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// CONFIG NOTE: The exchange rate label below is a display-only constant.
// The authoritative value lives in the server config (e.g. COINS_PER_USD env var).
const EXCHANGE_RATE_LABEL = '300 coins = $5 USD in prizes';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  fulfilled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Shop() {
  const { user, updateUser } = useAuth();
  const [prizes, setPrizes] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(null); // prize._id currently being redeemed
  const [feedback, setFeedback] = useState({}); // { [prizeId]: { type: 'success'|'error', msg } }
  const [showRedemptions, setShowRedemptions] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, r] = await Promise.all([
          api.prizes.list(),
          api.prizes.myRedemptions(),
        ]);
        setPrizes(p);
        setRedemptions(r);
      } catch {
        // silent — prizes will simply stay empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRedeem(prize) {
    setRedeeming(prize._id);
    setFeedback((prev) => ({ ...prev, [prize._id]: null }));
    try {
      const result = await api.prizes.redeem(prize._id);
      updateUser({ coins: result.coins });
      setFeedback((prev) => ({
        ...prev,
        [prize._id]: { type: 'success', msg: 'Redeemed! Check My Redemptions below.' },
      }));
      // Refresh redemptions list so the new entry appears immediately
      const r = await api.prizes.myRedemptions();
      setRedemptions(r);
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [prize._id]: { type: 'error', msg: err.message },
      }));
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className='max-w-4xl mx-auto px-4 py-6'>
      {/* ── Header / balance ── */}
      <div className='bg-surface border border-border rounded-2xl p-6 mb-6'>
        <div className='flex items-center justify-between flex-wrap gap-4'>
          <div className='flex items-center gap-3'>
            <ShoppingBag size={28} className='text-primary' />
            <div>
              <h1 className='text-2xl font-extrabold'>Prize Shop</h1>
              <p className='text-muted text-sm'>Spend your coins on real prizes!</p>
            </div>
          </div>
          <div className='flex flex-col items-end'>
            <div className='text-3xl font-extrabold text-yellow-500'>
              🪙 {user?.coins ?? 0}
            </div>
            <div className='text-xs text-muted mt-0.5'>{EXCHANGE_RATE_LABEL}</div>
          </div>
        </div>
      </div>

      {/* ── Prize grid ── */}
      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2 className='animate-spin text-muted' size={32} />
        </div>
      ) : prizes.length === 0 ? (
        <div className='text-center text-muted py-16'>
          No prizes available right now — check back soon!
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
          {prizes.map((prize) => {
            const canAfford = (user?.coins ?? 0) >= prize.coinCost;
            const inStock = prize.stock === -1 || prize.stock > 0;
            const isRedeeming = redeeming === prize._id;
            const fb = feedback[prize._id];

            return (
              <div
                key={prize._id}
                className='bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow'
              >
                {/* Emoji */}
                <div className='text-5xl text-center leading-tight'>{prize.emoji}</div>

                {/* Info */}
                <div>
                  <h3 className='font-bold text-lg text-center'>{prize.name}</h3>
                  <p className='text-muted text-sm text-center mt-1'>{prize.description}</p>
                </div>

                {/* Cost + stock */}
                <div className='flex items-center justify-center gap-2 flex-wrap'>
                  <span className='bg-yellow-100 text-yellow-700 font-bold px-3 py-1 rounded-full text-sm'>
                    🪙 {prize.coinCost}
                  </span>
                  {prize.stock !== -1 && (
                    <span className='bg-background border border-border text-muted text-xs px-2 py-1 rounded-full'>
                      {prize.stock} left
                    </span>
                  )}
                </div>

                {/* Inline feedback */}
                {fb && (
                  <p
                    className={`text-xs text-center font-medium ${
                      fb.type === 'success' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {fb.msg}
                  </p>
                )}

                {/* Redeem button */}
                <button
                  onClick={() => handleRedeem(prize)}
                  disabled={!canAfford || !inStock || isRedeeming}
                  className='w-full py-2 rounded-xl font-bold text-sm transition-opacity bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isRedeeming
                    ? 'Redeeming…'
                    : !inStock
                    ? 'Out of Stock'
                    : !canAfford
                    ? 'Not Enough Coins'
                    : 'Redeem'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── My Redemptions (collapsible) ── */}
      <div className='bg-surface border border-border rounded-2xl overflow-hidden'>
        <button
          onClick={() => setShowRedemptions((v) => !v)}
          className='w-full flex items-center justify-between px-5 py-4 font-bold hover:bg-background transition-colors'
        >
          <span>My Redemptions ({redemptions.length})</span>
          {showRedemptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showRedemptions && (
          <div className='px-5 pb-5'>
            {redemptions.length === 0 ? (
              <p className='text-muted text-sm text-center py-6'>No redemptions yet.</p>
            ) : (
              <ul className='divide-y divide-border'>
                {redemptions.map((r) => (
                  <li key={r._id} className='py-3 flex flex-wrap items-start justify-between gap-3'>
                    <div>
                      <div className='font-semibold text-sm'>{r.prizeName}</div>
                      <div className='text-xs text-muted'>
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {r.adminNote && (
                        <p className='text-xs text-muted italic mt-0.5'>{r.adminNote}</p>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold text-yellow-600'>🪙 {r.coinCost}</span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                          STATUS_STYLES[r.status] ?? 'bg-background text-muted'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
