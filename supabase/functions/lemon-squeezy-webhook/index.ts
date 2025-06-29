// supabase/functions/lemon-squeezy-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Ortam değişkenlerini alıyoruz
const lemonSqueezySigningSecret = Deno.env.get('Kemal26.36.46')!;
const supabaseUrl = Deno.env.get('https://abteqgahhnnxiudbgrqf.supabase.co')!;
const supabaseServiceKey = Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGVxZ2FoaG5ueGl1ZGJncnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzQyMTgsImV4cCI6MjA2NjUxMDIxOH0.fy1f6SbmTMeZU_A5PG2PPA2lGGfRz-j8K6G2hhYr8hA')!; // Kullandığınız isim

console.log("Lemon Squeezy Webhook function for plan & credit system initialized.");

serve(async (req) => {
  try {
    // 1. İsteğin Lemon Squeezy'den geldiğini doğrula
    const signature = req.headers.get('X-Signature');
    const body = await req.text();

    if (!signature) throw new Error("Missing 'X-Signature' header.");

    const secret = new TextEncoder().encode(lemonSqueezySigningSecret);
    const hmac = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const digest = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(body));
    const hash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash !== signature) throw new Error("Invalid signature.");
    
    console.log("Signature verified successfully.");

    // 2. Gelen veriyi işle
    const payload = JSON.parse(body);
    const eventName = payload.meta.event_name;
    const variantId = payload.data.attributes.variant_id.toString();
    const userId = payload.meta.custom_data?.user_id;

    if (!userId) {
      console.warn("Webhook received without a user_id. Cannot process.");
      return new Response("Webhook processed, but no user_id found.", { status: 200 });
    }
    
    console.log(`Processing event: ${eventName} for user: ${userId} and variant: ${variantId}`);

    // 3. Abonelik oluşturulduğunda veya ödeme başarılı olduğunda planı güncelle
    if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Yeni oluşturduğumuz 'subscription_plans' tablosundan plan detaylarını çek
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('credits_granted, plan_name, plan_price')
        .eq('lemon_squeezy_variant_id', variantId)
        .single();

      if (planError || !plan) {
        throw new Error(`Plan with variant_id '${variantId}' not found in 'subscription_plans'. DB Error: ${planError?.message}`);
      }
      
      console.log(`Found plan in DB: ${plan.plan_name}. Credits: ${plan.credits_granted}. Price: ${plan.plan_price}`);

      // Kullanıcının 'profiles' tablosundaki bilgilerini tek seferde güncelle
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: plan.credits_granted,
          plan_name: plan.plan_name,
          plan_price: plan.plan_price
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update user profile: ${updateError.message}`);
      }
      
      console.log(`Successfully updated profile for user ${userId} to plan '${plan.plan_name}'.`);

    } else {
        console.log(`Event '${eventName}' is not relevant for plan update. Skipping.`);
    }

    return new Response(JSON.stringify({ received: true, status: "success" }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("CRITICAL ERROR in webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});