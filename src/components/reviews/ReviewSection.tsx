import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';

interface Review {
  id: string;
  userName: string;
  avatar?: string;
  userAvatar?: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  tripType?: string;
  isVerified?: boolean;
}

interface ReviewSectionProps {
  packageId: string;
  packageName: string;
  averageRating: number;
  totalReviews: number;
}

// No mock reviews, real-time reviews only

export default function ReviewSection({ packageId, packageName, averageRating, totalReviews }: ReviewSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/packages/${packageId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data || []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [packageId]);

  const ratingDistribution = [
    { stars: 5, percentage: 80 },
    { stars: 4, percentage: 12 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ];

  const handleSubmitReview = async () => {
    if (!newRating || !newReview.trim()) {
      toast.error('Please add a rating and review');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE_URL}/packages/${packageId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userName: user?.name || 'You',
          userAvatar: '',
          rating: newRating,
          text: newReview,
          tripType: 'Verified Explorer'
        })
      });

      if (res.ok) {
        const addedReview = await res.json();
        setReviews([addedReview, ...reviews]);
        setNewRating(0);
        setNewReview('');
        toast.success('Review submitted successfully!');
        setDialogOpen(false);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = (reviewId: string) => {
    if (likedReviews.includes(reviewId)) {
      setLikedReviews(likedReviews.filter(id => id !== reviewId));
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpful: r.helpful - 1 } : r));
    } else {
      setLikedReviews([...likedReviews, reviewId]);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r));
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl text-white">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h3 className="font-display text-2xl font-bold mb-1 text-white">Reviews & Ratings</h3>
          <p className="text-white/40 text-sm font-medium">{reviews.length} reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" className="rounded-xl px-6 h-12 font-bold uppercase tracking-wider text-[10px] hover:scale-105 active:scale-95 transition-all">Write a Review</Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0f12] text-white border-white/10">
            <DialogHeader>
              <DialogTitle className="font-display text-white text-xl">Review {packageName}</DialogTitle>
            </DialogHeader>
            
            {!isAuthenticated ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">Please login to write a review</p>
                <Button variant="gold" onClick={() => window.location.href = '/auth?redirect=' + window.location.pathname}>
                  Login to Continue
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-3 block text-white/80">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            (hoverRating || newRating) >= star
                              ? "fill-kashmir-gold text-kashmir-gold"
                              : "text-white/20"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block text-white/80">Your Review</label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>

                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleSubmitReview}
                  disabled={isSubmitting || !newRating || !newReview.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Rating Overview */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-white/5">
        <div className="text-center md:border-r border-white/5 md:pr-8 flex flex-col justify-center">
          <div className="text-5xl font-bold text-white mb-2">{averageRating || 4.8}</div>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= Math.round(averageRating || 4.8)
                    ? "fill-kashmir-gold text-kashmir-gold"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-white/40 font-medium">{reviews.length} reviews</p>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ stars, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm w-8 text-white/60">{stars} ★</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-kashmir-gold rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-white/40 w-12 font-semibold">{percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-6">
            <Star className="h-10 w-10 text-white/10 mb-4" />
            <h4 className="font-display font-bold text-white text-lg mb-2">No Reviews Yet</h4>
            <p className="text-white/40 text-sm max-w-sm mb-6">Be the first to share your luxury travel experience with other explorers.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="pb-6 border-b border-white/5 last:border-0 last:pb-0">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {review.avatar || review.userAvatar ? (
                    <img src={review.avatar || review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-white">{review.userName}</h4>
                        {review.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-kashmir-gold bg-kashmir-gold/10 px-2 py-0.5 rounded-full border border-kashmir-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.15)]">
                            <Crown className="w-2.5 h-2.5" /> Verified Luxury Traveler
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-3.5 w-3.5",
                                star <= review.rating
                                  ? "fill-kashmir-gold text-kashmir-gold"
                                  : "text-white/20"
                              )}
                            />
                          ))}
                        </div>
                        {review.tripType && (
                          <span className="text-[10px] px-2 py-0.5 bg-white/5 text-white/40 rounded-full font-medium">
                            {review.tripType}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-white/30">
                      {new Date(review.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mt-3 leading-relaxed">{review.text}</p>
                  <button
                    onClick={() => handleLike(review.id)}
                    className={cn(
                      "flex items-center gap-2 mt-3 text-xs transition-colors",
                      likedReviews.includes(review.id)
                        ? "text-kashmir-gold"
                        : "text-white/30 hover:text-white/60"
                    )}
                  >
                    <ThumbsUp className={cn("h-3.5 w-3.5", likedReviews.includes(review.id) && "fill-current")} />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
