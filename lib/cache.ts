import { supabase } from './supabase';

/**
 * Normalize query for cache key consistency
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check if cached data exists and is not expired
 */
export async function getCachedProduct(query: string) {
  const queryKey = normalizeQuery(query);
  
  const { data, error } = await supabase
    .from('product_cache')
    .select('*')
    .eq('query_key', queryKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;
  
  console.log(`[Cache] HIT for "${query}"`);
  return data.data; // Return the JSONB data field
}

/**
 * Save analysis result to cache
 */
export async function setCachedProduct(
  query: string, 
  productName: string, 
  category: string | null, 
  analysisData: any,
  type: 'text' | 'visual' | 'compare' | 'url' | 'canonical' | 'alias' = 'text'
) {
  const queryKey = normalizeQuery(query);
  const expiresAt = new Date();
  
  // Dynamic TTL based on Type
  switch (type) {
      case 'visual':
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 Days (Hash is stable)
          break;
      case 'canonical':
      case 'alias':
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 Days (Mapping is relatively stable)
          break;
      case 'compare':
          expiresAt.setDate(expiresAt.getDate() + 3); // 3 Days
          break;
      default:
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 Hours (Standard text search)
  }

  const { error } = await supabase
    .from('product_cache')
    .upsert({
      query_key: queryKey,
      product_name: productName,
      category: category,
      data: analysisData,
      expires_at: expiresAt.toISOString(),
      type: type
    }, {
      onConflict: 'query_key'
    });

  if (error) {
    console.error('[Cache] Failed to save:', error);
  } else {
    console.log(`[Cache] SAVED "${query}" [${type}] (expires: ${expiresAt.toISOString()})`);
  }
}

/**
 * Fetch community field reports for a product
 */
export async function getFieldReports(productName: string) {
  const { data, error } = await supabase
    .from('field_reports')
    .select('*')
    .ilike('product_name', `%${productName}%`)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[Internal Scout] Failed to fetch field reports:', error);
    return [];
  }

  return data || [];
}

/**
 * Award XP to user and update rank
 */
export async function awardXP(userId: string, amount: number) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('[Gamification] Failed to fetch profile:', fetchError);
    return;
  }

  const newXP = (profile?.xp || 0) + amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXP })
    .eq('id', userId);

  if (updateError) {
    console.error('[Gamification] Failed to award XP:', updateError);
  } else {
    console.log(`[Gamification] Awarded ${amount} XP to user ${userId} (Total: ${newXP})`);
  }
}
