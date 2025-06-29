// supabase/functions/lemon-squeezy-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

// Gizli anahtarlarımızı ortam değişkenlerinden alıyoruz
const lemonSqueezySigningSecret = Deno.env.get('LEMON_SQUEEZY_SIGNING_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// DİKKAT: Yeni ismimizi kullanıyoruz
const supabaseServiceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')!;

console.log("Lemon Squeezy Webhook function for credit system initialized.");

serve(async (req) => {
  try {
    // 1. Gelen isteğin imzasını ve gövdesini al
    const signature = req.headers.get('X-Signature');
    const body = await req.text();

    if (!signature) {
      throw new Error("Missing 'X-Signature' header. Request is not from Lemon Squeezy.");
    }

    // 2. İmzanın geçerli olduğunu doğrula
    const secret = new TextEncoder().encode(lemonSqueezySigningSecret);
    const hmac = await crypto.subtle.importKey(
      "raw", secret, { name: "HMAC", hash: "SHA-256" },
      false, ["sign"]
    );
    const digest = await crypto.subtle.sign("HMAC", hmac, new TextEncoder().encode(body));
    const hash = Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    if (hash !== signature) {
      throw new Error("Invalid signature. Webhook request is not authentic.");
    }
    
    console.log("Signature verified successfully.");

    // 3. Güvenli isteği işle
    const payload = JSON.parse(body);
    const eventName = payload.meta.event_name;
    const variantId = payload.data.attributes.variant_id.toString();
    const userId = payload.meta.custom_data?.user_id;

    if (!userId) {
      console.warn("Webhook received without a user_id in custom_data. Cannot assign credits.");
      return new Response("Webhook processed, but no user_id found.", { status: 200 });
    }
    
    console.log(`Processing event: ${eventName} for user: ${userId} and variant: ${variantId}`);

    if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('credits_granted')
        .eq('lemon_squeezy_variant_id', variantId)
        .single();

      if (planError || !plan) {
        throw new Error(`Plan with lemon_squeezy_variant_id '${variantId}' not found in the 'subscription_plans' table.`);
      }
      
      const creditsToAdd = plan.credits_granted;
      console.log(`Found plan. ${creditsToAdd} credits to be added.`);

      const { error: rpcError } = await supabaseAdmin.rpc('add_credits_to_user', {
        target_user_id: userId,
        credit_amount_to_add: creditsToAdd
      });

      if (rpcError) {
        throw new Error(`Failed to add credits via RPC: ${rpcError.message}`);
      }
      
      console.log(`Successfully added ${creditsToAdd} credits to user ${userId}.`);
    } else {
        console.log(`Event '${eventName}' is not relevant for credit assignment. Skipping.`);
    }

    return new Response(JSON.stringify({ received: true, status: "success" }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Error processing webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
});