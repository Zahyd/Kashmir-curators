import { useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  userName: string;
  avatar?: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  tripType?: string;
}

interface ReviewSectionProps {
  packageId: string;
  packageName: string;
  averageRating: number;
  totalReviews: number;
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: '1',
    userName: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    date: '2024-11-15',
    text: 'Absolutely magical experience! The itinerary was perfectly planned and our guide was knowledgeable. The houseboat stay was the highlight of our trip. Highly recommend!',
    helpful: 24,
    tripType: 'Family Trip',
  },
  {
    id: '2',
    userName: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    rating: 5,
    date: '2024-10-28',
    text: 'Kashmir truly is paradise on Earth. The package included everything we needed. Great value for money and excellent customer service throughout.',
    helpful: 18,
    tripType: 'Honeymoon',
  },
  {
    id: '3',
    userName: 'Ananya Patel',
    rating: 4,
    date: '2024-10-10',
    text: 'Beautiful destinations and well-organized tour. The only small issue was the hotel in Pahalgam could have been better. Everything else was perfect!',
    helpful: 12,
    tripType: 'Solo Travel',
  },
  {
    id: '4',
    userName: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    rating: 5,
    date: '2024-09-22',
    text: 'Third time booking with Kashmir Alle and they never disappoint. The attention to detail and personalized service is what sets them apart.',
    helpful: 31,
    tripType: 'Group Trip',
  },
];

export default function ReviewSection({ packageId, packageName, averageRating, totalReviews }: ReviewSectionProps) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [likedReviews, setLikedReviews] = useState<string[]>([]);

  const ratingDistribution = [
    { stars: 5, percentage: 75 },
    { stars: 4, percentage: 15 },
    { stars: 3, percentage: 7 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ];

  const handleSubmitReview = async () => {
    if (!newRating || !newReview.trim()) {
      toast.error('Please add a rating and review');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const review: Review = {
      id: Date.now().toString(),
      userName: 'You',
      rating: newRating,
      date: new Date().toISOString().split('T')[0],
      text: newReview,
      helpful: 0,
    };

    setReviews([review, ...reviews]);
    setNewRating(0);
    setNewReview('');
    setIsSubmitting(false);
    setDialogOpen(false);
    toast.success('Review submitted successfully!');
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
    <div className="bg-card rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-semibold mb-1">Reviews & Ratings</h3>
          <p className="text-muted-foreground text-sm">{totalReviews} reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold">Write a Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Review {packageName}</DialogTitle>
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
                  <label className="text-sm font-medium mb-3 block">Your Rating</label>
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
                              : "text-muted-foreground"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Your Review</label>
                  <Textarea
                    placeholder="Share your experience..."
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    rows={4}
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
      <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary mb-2">{averageRating}</div>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= Math.round(averageRating)
                    ? "fill-kashmir-gold text-kashmir-gold"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{totalReviews} reviews</p>
        </div>

        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ stars, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm w-8">{stars} ★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-kashmir-gold rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12">{percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {review.avatar ? (
                  <img src={review.avatar} alt={review.userName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{review.userName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              star <= review.rating
                                ? "fill-kashmir-gold text-kashmir-gold"
                                : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      {review.tripType && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                          {review.tripType}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground mt-3">{review.text}</p>
                <button
                  onClick={() => handleLike(review.id)}
                  className={cn(
                    "flex items-center gap-2 mt-3 text-sm transition-colors",
                    likedReviews.includes(review.id)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ThumbsUp className={cn("h-4 w-4", likedReviews.includes(review.id) && "fill-current")} />
                  <span>Helpful ({review.helpful})</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
