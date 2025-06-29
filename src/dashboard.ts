// src/dashboard.ts

// HATA 1 DÜZELTİLDİ: Gereksiz 'createClient' import'u silindi.
import type { User } from '@supabase/supabase-js';

console.log("--- [0] dashboard.ts Yüklendi ---");

// Bu satır doğru, çünkü supabase nesnesini başka bir dosyadan alıyorsunuz.
import { supabase } from './supabaseClient';

// === DOM Elementlerini Seçme ===
const userEmailDisplay = document.getElementById('user-email-display');
const planNameDisplay = document.getElementById('plan-name-display');

// HATA 2 İÇİN HAZIRLIK: Bu değişken artık kullanılacak.
const wordCreditsDisplay = document.getElementById('word-credits-display');

// HATA 3, 4, 5, 6 DÜZELTİLDİ: Eksik elementler tanımlandı.
const wordsProgressBar = document.getElementById('words-progress-bar');
const planPriceDisplay = document.getElementById('plan-price-display');

/**
 * Arayüzü güncelleyen fonksiyon
 */
async function updateDashboardUI(user: User) {
    if (userEmailDisplay) {
        userEmailDisplay.textContent = user.email || 'No email found';
    }

    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('credits, plan_name, plan_price')
            .eq('id', user.id)
            .single();

        if (error) throw error;

        if (profile) {
            const remainingCredits = profile.credits || 0;

            // HATA 2 DÜZELTİLDİ: 'creditsContainer' yerine doğrudan 'wordCreditsDisplay' kullanılıyor.
            if (wordCreditsDisplay) {
                const spanElement = wordCreditsDisplay.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = remainingCredits.toString();
                }
            }
            
            let totalLimit = 500; // Varsayılan ücretsiz limit
            if (profile.plan_name) {
                if (profile.plan_name.toLowerCase().includes('pro')) totalLimit = 100000;
                if (profile.plan_name.toLowerCase().includes('business')) totalLimit = 500000;
            }
            
            // Artık 'wordsProgressBar' tanımlı olduğu için bu kod çalışacak.
            if (wordsProgressBar) {
                // Not: Progress bar'ı 'kullanılan' krediye göre ayarlamak daha mantıklı olabilir.
                // Örneğin: const usedCredits = totalLimit - remainingCredits;
                // const percentage = totalLimit > 0 ? (usedCredits / totalLimit) * 100 : 0;
                const percentage = totalLimit > 0 ? (remainingCredits / totalLimit) * 100 : 0;
                (wordsProgressBar as HTMLElement).style.width = `${Math.min(percentage, 100)}%`;
            }

            // Artık 'planPriceDisplay' tanımlı olduğu için bu kod çalışacak.
            if (planNameDisplay) planNameDisplay.textContent = profile.plan_name || 'Free Plan';
            if (planPriceDisplay) planPriceDisplay.textContent = profile.plan_price || '$0/month';
        }
    } catch (error) {
        console.error("Profil bilgileri alınırken hata oluştu:", error);
    }
}


/**
 * Ana başlatma fonksiyonu
 */
async function initializeDashboard() {
    console.log("--- [2] initializeDashboard fonksiyonu başladı ---");

    if (document.body.id !== 'page-dashboard') {
        console.log("--- [!] Yanlış sayfa. initializeDashboard sonlandırıldı. ---");
        return;
    }

    try {
        console.log("--- [3] Oturum bilgisi (session) isteniyor... ---");
        const { data: { session } } = await supabase.auth.getSession();

        console.log("--- [4] Oturum bilgisi alındı:", session);

        if (session && session.user) {
            console.log("--- [5] Geçerli oturum bulundu. Arayüz güncellenecek. ---");
            await updateDashboardUI(session.user);
        } else {
            console.log("--- [6] Oturum bulunamadı. Giriş sayfasına yönlendiriliyor. ---");
            window.location.href = '/login.html';
        }
    } catch (err) {
        console.error("--- [7] HATA: initializeDashboard içinde kritik bir hata oluştu! ---", err);
    }
}

// === Script'in Çalışmasını Başlatan Olay Dinleyici ===
document.addEventListener('DOMContentLoaded', initializeDashboard);