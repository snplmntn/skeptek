'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { awardXP } from '@/app/actions/gamification';

const ReportSchema = z.object({
  productName: z.string().min(1),
  agreementRating: z.number().int().min(-1).max(1),
  comment: z.string().optional(),
});

export async function submitFieldReport(formData: FormData) {
  try {
    console.log("[Field Report] Submission started...");
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("[Field Report] Auth Failed:", authError);
        return { error: "Unauthenticated. Agents must sign in to submit reports." };
    }
    console.log(`[Field Report] User Authenticated: ${user.id}`);

    // 2. Validation
    const rawData = {
        productName: formData.get('productName'),
        agreementRating: parseInt(formData.get('agreementRating') as string),
        comment: formData.get('comment'),
    };
    console.log("[Field Report] Data:", rawData);

    const parsed = ReportSchema.safeParse(rawData);
    if (!parsed.success) {
        return { error: "Invalid data format." };
    }

    // 3. Database Insert
    const { error } = await supabase
        .from('field_reports')
        .insert({
        product_name: parsed.data.productName,
        agreement_rating: parsed.data.agreementRating,
        comment: parsed.data.comment,
        user_id: user.id,
        status: 'pending' // Default status
        });

    if (error) {
        console.error("[Field Report] DB Insert Error:", error);
        return { error: "Failed to submit report. Database error." };
    }
    console.log("[Field Report] Saved to DB");

    // 4. Gamification Reward
    // Award 100 XP for a detailed field report (Significant Contribution)
    // Non-blocking catch to prevent UI freeze if gamification fails
    awardXP(100).catch(err => console.error("XP Award Failed", err));

    revalidatePath('/');
    return { success: true, message: "Report submitted. XP Awarded: +100" };

  } catch (err: any) {
      console.error("[Field Report] Critical Crash:", err);
      return { error: "System Error: " + err.message };
  }
}
