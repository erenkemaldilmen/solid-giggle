// src/dashboard.ts

// Hata Düzeltmesi: 'createClient' ve 'User' tipi ayrı ayrı import edildi.
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// === KENDİ BİLGİLERİNİZİ BURAYA GİRİN ===
const supabaseUrl = 'https://abteqgahhnnxiudbgrqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGVxZ2FoaG5ueGl1ZGJncnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzQyMTgsImV4cCI6MjA2NjUxMDIxOH0.fy1f6SbmTMeZU_A5PG2PPA2lGGfRz-j8K6G2hhYr8hAiz';
// ==========================================

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- DOM Elementlerini Seçme ---
// Not: Her elementin var olup olmadığını kontrol etmek, kodun daha sağlam olmasını sağlar.
const userEmailDisplay = document.getElementById('user-email-display');
const planNameDisplay = document.getElementById('plan-name-display');
const planPriceDisplay = document.getElementById('plan-price-display');
const wordsUsedDisplay = document.getElementById('words-used');
const wordsTotalDisplay = document.getElementById('words-total');
const wordsProgressBar = document.getElementById('words-progress-bar');
const manageSubscriptionBtn = document.getElementById('manage-subscription-btn');
const passwordUpdateForm = document.getElementById('password-update-form');
const newPasswordInput = document.getElementById('new-password') as HTMLInputElement | null; // Null olabileceğini belirtiyoruz
const passwordMessage = document.getElementById('password-message');

/**
 * Sayfa yüklendiğinde veya kullanıcı değiştiğinde dashboard'ı günceller.
 * @param {User} user - Supabase kullanıcı nesnesi.
 */
async function updateDashboard(user: User) {
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // 1. Hoşgeldin mesajını ve e-postayı güncelle
    if (userEmailDisplay) {
        // Hata Düzeltmesi: user.email undefined olabileceğinden, || '' ile boş string atandı.
        userEmailDisplay.textContent = user.email || 'No email found';
    }

    // 2. Kullanıcının profil bilgilerini çek
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('credits, plan_name, plan_price')
            .eq('id', user.id)
            .single();

        if (error) throw error; // Hata varsa catch bloğuna gönder

        if (profile) {
            // 3. Kelime kredisi bilgilerini güncelle
            // Örnek mantık: Plan adı varsa ücretlidir, yoksa ücretsizdir.
            const totalWords = profile.plan_name ? 100000 : 500; // Planlara göre total kelime sayısı
            const usedWords = Math.max(0, totalWords - profile.credits); // Kullanılan kelime negatif olamaz

            if (wordsUsedDisplay) wordsUsedDisplay.textContent = usedWords.toString();
            if (wordsTotalDisplay) wordsTotalDisplay.textContent = totalWords.toString();
            
            // Progress bar'ı güncelle
            if (wordsProgressBar) {
                const percentage = totalWords > 0 ? (usedWords / totalWords) * 100 : 0;
                (wordsProgressBar as HTMLElement).style.width = `${percentage}%`;
            }

            // 4. Plan bilgilerini güncelle
            if (planNameDisplay) planNameDisplay.textContent = profile.plan_name || 'Free Plan';
            if (planPriceDisplay) planPriceDisplay.textContent = profile.plan_price || '$0/month';
        }
    } catch (error) {
        console.error("Profil bilgileri alınırken hata oluştu:", error);
        if (planNameDisplay) planNameDisplay.textContent = 'Error';
    }
}

// --- Event Listeners (Olay Dinleyicileri) ---

// Şifre güncelleme formu
if (passwordUpdateForm && newPasswordInput) { // newPasswordInput'ın da varlığını kontrol et
    passwordUpdateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value;

        if (!newPassword) return;

        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;

            // Hata Düzeltmesi: Mesaj göstermeden önce passwordMessage'ın varlığını kontrol et
            if (passwordMessage) {
                passwordMessage.textContent = 'Şifreniz başarıyla güncellendi!';
                passwordMessage.style.color = 'green';
            }
            newPasswordInput.value = ''; // Input'u temizle

        } catch (error: any) {
            if (passwordMessage) {
                passwordMessage.textContent = `Hata: ${error.message}`;
                passwordMessage.style.color = 'red';
            }
        }
    });
}

// Abonelik yönetimi butonu (Customer Portal)
if (manageSubscriptionBtn) {
    manageSubscriptionBtn.addEventListener('click', async () => {
        alert('Customer Portal entegrasyonu henüz tamamlanmadı.');
        // Örnek:
        // try {
        //   const { data, error } = await supabase.functions.invoke('create-customer-portal-session');
        //   if (error) throw error;
        //   window.location.href = data.url;
        // } catch (error) {
        //   alert('Could not open customer portal.');
        // }
    });
}

/**
 * Ana uygulama başlatma fonksiyonu
 */
async function initializeDashboard() {
    if (document.body.id !== 'page-dashboard') return;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session) {
            window.location.href = '/login.html';
            return;
        }
        
        await updateDashboard(session.user);

        supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
                updateDashboard(newSession.user);
            } else {
                window.location.href = '/login.html';
            }
        });
    } catch (error) {
        console.error("Dashboard başlatılırken hata:", error);
        window.location.href = '/login.html'; // Kritik bir hata varsa giriş sayfasına yönlendir
    }
}

// Sayfa içeriği yüklendiğinde dashboard'ı başlat
document.addEventListener('DOMContentLoaded', initializeDashboard);