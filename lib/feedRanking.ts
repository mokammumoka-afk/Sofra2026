import { Post, User, ChefProfile } from './types';

export interface FeedRankingParams {
  posts: Post[];
  userCity: string;
  currentUser: User;
  followedChefs: Record<string, boolean>;
  chefProfiles?: Record<string, ChefProfile>;
  userLikes?: Record<string, boolean>;
  userBookmarks?: Record<string, boolean>;
  isPostActiveSponsored: (postId: string, city?: string) => boolean;
  feedMode?: 'home' | 'explore' | 'city' | 'following';
  sortBy?: 'ranking' | 'newest' | 'popular' | 'price_low' | 'prep_time' | 'affiliate_commission';
}

/**
 * Calculates a comprehensive ranking score for a post based on:
 * 1. Geographic Proximity (Location match)
 * 2. Recency with mathematical Time Decay
 * 3. Engagement Rate: (Likes + Comments*2 + Gifts*3) / (1 + AgeInHours)
 * 4. Chef Reputation & Verification
 * 5. Personalization (User Likes & Follows)
 */
export function calculatePostScore(
  post: Post,
  params: FeedRankingParams
): number {
  const { userCity, followedChefs, chefProfiles, userLikes = {}, userBookmarks = {}, isPostActiveSponsored, feedMode } = params;

  // Active Sponsored Ads get baseline top tier priority score
  const isSponsored = isPostActiveSponsored(post.id, userCity);
  if (isSponsored) {
    return 10000; // Top tier baseline
  }

  // Use fixed deterministic reference time so server and client rankings match identically during hydration
  const DETERMINISTIC_BASE_TIME = 1754280000000;
  const nowMs = DETERMINISTIC_BASE_TIME;
  const createdMs = new Date(post.created_at).getTime();
  const ageInHours = Math.max(0.1, (nowMs - createdMs) / (1000 * 60 * 60));

  // 1. Recency with Time Decay Curve
  // Score decays gracefully over time rather than a harsh cutoff
  const timeDecayFactor = 100 / Math.pow(1 + ageInHours / 8, 1.3);

  // 2. Engagement Momentum Rate
  const totalGifts = post.gifts_total || 0;
  const engagementPoints = (post.likes_count || 0) + (post.comments_count || 0) * 2 + totalGifts * 3;
  const engagementVelocity = (engagementPoints * 10) / Math.pow(1 + ageInHours, 0.8);

  // 3. Geographic Proximity Score
  let geoScore = 0;
  if (post.city === userCity) {
    geoScore = feedMode === 'home' || feedMode === 'city' ? 40 : 20;
  }

  // 4. Chef Rating & Verification Score
  let chefScore = 0;
  if (post.chef_verified) {
    chefScore += 15;
  }
  const chefProf = chefProfiles?.[post.chef_id];
  if (chefProf?.rating_avg) {
    chefScore += chefProf.rating_avg * 4; // up to 20 points
  }

  // 5. Personal Affinity (Followed chef, user history)
  let affinityScore = 0;
  if (followedChefs[post.chef_id]) {
    affinityScore += feedMode === 'home' ? 50 : 25;
  }
  if (userLikes[post.id] || userBookmarks[post.id]) {
    affinityScore += 10;
  }

  // 6. Commerce & Availability Factor
  let availabilityScore = post.is_purchasable ? 10 : 5;

  // Explore Mode favors discovery of high-quality items outside following list
  let modeMultiplier = 1.0;
  if (feedMode === 'explore') {
    // In explore, boost trending items & un-followed chefs slightly for discovery
    if (!followedChefs[post.chef_id]) {
      modeMultiplier = 1.15;
    }
  }

  const rawScore =
    (timeDecayFactor * 0.3 +
      engagementVelocity * 0.35 +
      geoScore * 0.15 +
      chefScore * 0.10 +
      affinityScore * 0.10 +
      availabilityScore) *
    modeMultiplier;

  return Math.max(0, rawScore);
}

/**
 * Applies Diversity Interleaving Logic to avoid 3+ consecutive posts
 * from the exact same chef or same category.
 */
export function applyDiversityInterleaving(posts: Post[]): Post[] {
  if (posts.length <= 2) return posts;

  const result: Post[] = [];
  const pool = [...posts];

  while (pool.length > 0) {
    let candidateIndex = 0;

    if (result.length >= 2) {
      const prev1 = result[result.length - 1];
      const prev2 = result[result.length - 2];

      // Try to find a candidate that breaks consecutive chef/category streaks
      for (let i = 0; i < Math.min(pool.length, 6); i++) {
        const item = pool[i];
        const isSameChefStreak = item.chef_id === prev1.chef_id && item.chef_id === prev2.chef_id;
        const isSameCatStreak = item.category === prev1.category && item.category === prev2.category;

        if (!isSameChefStreak && !isSameCatStreak) {
          candidateIndex = i;
          break;
        }
      }
    }

    const [selected] = pool.splice(candidateIndex, 1);
    result.push(selected);
  }

  return result;
}

/**
 * Ranks and orders posts using the comprehensive score, custom sorting mode, and diversity rules.
 */
export function rankFeedPosts(params: FeedRankingParams): Post[] {
  const { posts, sortBy = 'ranking' } = params;

  if (posts.length === 0) return [];

  // Sort based on explicit requested sorting or default smart ranking
  const scoredPosts = posts.map((post) => ({
    post,
    score: calculatePostScore(post, params),
  }));

  if (sortBy === 'newest') {
    scoredPosts.sort((a, b) => {
      const aIsSponsored = params.isPostActiveSponsored(a.post.id, params.userCity);
      const bIsSponsored = params.isPostActiveSponsored(b.post.id, params.userCity);
      if (aIsSponsored && !bIsSponsored) return -1;
      if (!aIsSponsored && bIsSponsored) return 1;
      return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
    });
  } else if (sortBy === 'popular') {
    scoredPosts.sort((a, b) => {
      const aIsSponsored = params.isPostActiveSponsored(a.post.id, params.userCity);
      const bIsSponsored = params.isPostActiveSponsored(b.post.id, params.userCity);
      if (aIsSponsored && !bIsSponsored) return -1;
      if (!aIsSponsored && bIsSponsored) return 1;
      return (b.post.likes_count || 0) - (a.post.likes_count || 0);
    });
  } else if (sortBy === 'price_low') {
    scoredPosts.sort((a, b) => (a.post.price || 0) - (b.post.price || 0));
  } else if (sortBy === 'prep_time') {
    scoredPosts.sort((a, b) => (a.post.preparation_time_mins || 99) - (b.post.preparation_time_mins || 99));
  } else if (sortBy === 'affiliate_commission') {
    scoredPosts.sort((a, b) => (b.post.affiliate_commission_percent || 0) - (a.post.affiliate_commission_percent || 0));
  } else {
    // Default smart algorithmic ranking score
    scoredPosts.sort((a, b) => b.score - a.score);
  }

  const sortedList = scoredPosts.map((sp) => sp.post);

  // Apply diversity interleaving to organic posts
  return applyDiversityInterleaving(sortedList);
}
