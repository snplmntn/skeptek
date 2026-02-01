import { supabase } from './supabase';

/**
 * normalize query for cache key consistency
 */
export function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * check if cached data exists and is not expired
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
  
  // console.log(`[cache] hit for "${query}"`);
  return data.data; // return the jsonb data field
}

/**
 * save analysis result to cache
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
  
  // dynamic ttl based on type
  switch (type) {
      case 'visual':
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days (hash is stable)
          break;
      case 'canonical':
      case 'alias':
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days (mapping is relatively stable)
          break;
      case 'compare':
          expiresAt.setDate(expiresAt.getDate() + 3); // 3 days
          break;
      default:
          expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours (standard text search)
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
    console.error('[cache] failed to save:', error);
  } else {
    // console.log(`[cache] saved "${query}" [${type}] (expires: ${expiresAt.toISOString()})`);
  }
}

/**
 * fetch community field reports for a product
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
    console.error('[internal scout] failed to fetch field reports:', error);
    return [];
  }

  return data || [];
}

/**
 * award xp to user and update rank
 */
export async function awardXP(userId: string, amount: number) {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('[gamification] failed to fetch profile:', fetchError);
    return;
  }

  const newXP = (profile?.xp || 0) + amount;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXP })
    .eq('id', userId);

  if (updateError) {
    console.error('[gamification] failed to award xp:', updateError);
  } else {
    // console.log(`[gamification] awarded ${amount} xp to user ${userId} (total: ${newXP})`);
  }
}
