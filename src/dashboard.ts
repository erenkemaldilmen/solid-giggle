// src/dashboard.ts

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

console.log("--- [0] dashboard.ts Yüklendi ---");

// YENİ SATIR BU
import { supabase } from './supabaseClient';

// === DOM Elementlerini Seçme ===
const userEmailDisplay = document.getElementById('user-email-display');
const planNameDisplay = document.getElementById('plan-name-display');
const wordCreditsDisplay = document.getElementById('word-credits-display');
// Diğer elementleri de buraya ekleyebilirsiniz...

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
            // =================================================================
            // === YENİ VE DOĞRU MANTIK BAŞLANGIÇ ===
            // =================================================================
            
            // 1. Doğrudan veritabanından gelen "kalan" krediyi al.
            const remainingCredits = profile.credits;

            // 2. Kalan krediyi ekrana yazdır.
            const creditsContainer = document.getElementById('word-credits-display');
            if (creditsContainer) {
                const spanElement = creditsContainer.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = remainingCredits.toString();
                }
            }
            
            // 3. Progress bar'ı toplam limite göre ayarla.
            //    Plan adını kontrol ederek toplam limiti bulalım.
            let totalLimit = 500; // Varsayılan ücretsiz limit
            if (profile.plan_name) {
                if (profile.plan_name.toLowerCase().includes('pro')) totalLimit = 100000;
                if (profile.plan_name.toLowerCase().includes('business')) totalLimit = 500000;
            }
            
            // Progress bar'ın doluluk oranını hesapla
            if (wordsProgressBar) {
                const percentage = totalLimit > 0 ? (remainingCredits / totalLimit) * 100 : 0;
                // Yüzde 100'ü geçmesin diye kontrol
                (wordsProgressBar as HTMLElement).style.width = `${Math.min(percentage, 100)}%`;
            }

            // =================================================================
            // === YENİ VE DOĞRU MANTIK BİTİŞ ===
            // =================================================================

            // Plan bilgilerini güncelle
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