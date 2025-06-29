// src/pricing-logic.ts

// Hata Düzeltmesi: 'createClient' ve 'User' tipi ayrı ayrı import edildi.
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// === KENDİ BİLGİLERİNİZİ BURAYA GİRİN ===
// Not: Bu bilgilerin dashboard.ts'deki ile aynı olması gerekir.
// Daha iyi bir yaklaşım, bu bilgileri tek bir dosyadan export etmektir.
const supabaseUrl = 'https://abteqgahhnnxiudbgrqf.supabase.co'; // SİZİN Supabase Proje URL'niz
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGVxZ2FoaG5ueGl1ZGJncnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzQyMTgsImV4cCI6MjA2NjUxMDIxOH0.fy1f6SbmTMeZU_A5PG2PPA2lGGfRz-j8K6G2hhYr8hAiz'; // SİZİN Supabase Anon Key'iniz
// ==========================================

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Giriş yapan kullanıcılar için satın alma linklerini günceller.
 * Kullanıcı giriş yapmamışsa, linkleri giriş sayfasına yönlendirir.
 * @param {User | null} user - Supabase kullanıcı nesnesi veya null
 */
const updatePurchaseLinks = (user: User | null) => {
    const purchaseButtons = document.querySelectorAll('.lemon-button');
    
    purchaseButtons.forEach(button => {
        const link = button as HTMLAnchorElement;
        
        // Orijinal linki, sadece ilk seferde bir data attribute'unda sakla
        if (!link.dataset.originalHref) {
            link.dataset.originalHref = link.href;
        }

        // URL işlemleri için her zaman orijinal linki kullan
        // Bu, kullanıcının art arda giriş/çıkış yapması durumunda linkin bozulmasını engeller.
        const originalHref = link.dataset.originalHref;
        if (!originalHref) return; // Orijinal link yoksa devam etme

        const url = new URL(originalHref);

        if (user) {
            // KULLANICI GİRİŞ YAPMIŞSA
            url.searchParams.set('checkout[custom][user_id]', user.id);
            // Hata Düzeltmesi: user.email undefined olabileceğinden, || '' ile boş string atandı.
            url.searchParams.set('checkout[email]', user.email || '');
            link.href = url.toString();
            
            // Lemon Squeezy script'inin butonu tanıması için class ekle
            if (!link.classList.contains('lemonsqueezy-button')) {
                 link.classList.add('lemonsqueezy-button');
            }
        } else {
            // KULLANICI GİRİŞ YAPMAMIŞSA
            link.href = "/login.html"; // Giriş yapma sayfasına yönlendir
            link.classList.remove('lemonsqueezy-button');
        }
    });

    // Hata Düzeltmesi: LemonSqueezy'nin varlığını ve Setup metodunun bir fonksiyon olduğunu kontrol et
    if (window.LemonSqueezy && typeof window.LemonSqueezy.Setup === 'function') {
        window.LemonSqueezy.Setup({
            // Hata Düzeltmesi: event parametresine 'any' tipi vererek TS hatasını gider
            event_handler: (event: any) => {
                // Bu bölümü şimdilik boş bırakabilir veya loglama için kullanabilirsiniz.
                // 'event' kullanılmadığı için hata vermemesi adına bir log ekleyelim.
                if (event) {
                    console.log('Lemon Squeezy event:', event.event);
                }
            }
        });
    }
};

/**
 * Fiyatlandırma sayfasının ana mantığını başlatan fonksiyon.
 */
const initializePricingPage = async () => {
    if (document.body.id !== 'page-pricing') {
        return;
    }
    
    try {
        // Kullanıcının oturum durumu değiştiğinde (giriş/çıkış) linkleri güncelle
        supabase.auth.onAuthStateChange((_event, session) => {
            updatePurchaseLinks(session?.user ?? null);
        });

        // Sayfa ilk yüklendiğinde mevcut oturumu bir kere kontrol et ve linkleri güncelle
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        updatePurchaseLinks(session?.user ?? null);

    } catch (error) {
        console.error("Fiyatlandırma sayfası başlatılırken hata:", error);
        // Kritik bir hata durumunda bile linklerin 'login'e yönlenmesini sağla
        updatePurchaseLinks(null);
    }
};
    if (window.LemonSqueezy && typeof window.LemonSqueezy.Setup === 'function') {
        window.LemonSqueezy.Setup({
            event_handler: (event: any) => {
                if (event) {
                    console.log('Lemon Squeezy event:', event.event);
                }
            }
        });
    }

// Sayfa içeriği yüklendiğinde fiyatlandırma mantığını başlat
document.addEventListener('DOMContentLoaded', initializePricingPage);

