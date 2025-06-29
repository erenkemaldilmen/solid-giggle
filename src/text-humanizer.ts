// src/text-humanizer.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://abteqgahhnnxiudbgrqf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGVxZ2FoaG5ueGl1ZGJncnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzQyMTgsImV4cCI6MjA2NjUxMDIxOH0.fy1f6SbmTMeZU_A5PG2PPA2lGGfRz-j8K6G2hhYr8hA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const initializeTextHumanizer = () => {
    if (document.body.id !== 'page-text-humanizer') {
        return;
    }

    const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
    const textOutput = document.getElementById('text-output') as HTMLDivElement | null;
    const charCount = document.getElementById('char-count') as HTMLSpanElement | null; // Bu değişken artık kullanılacak
    const humanizeButton = document.getElementById('humanize-button') as HTMLButtonElement | null;
    const loadingSpinner = textOutput?.querySelector('.loading-spinner') as HTMLElement | null;
    
    const sectionHeader = document.querySelector('#humanizer-tool-section .section-header');
    let toolMessageDiv: HTMLDivElement | null = null;
    if (sectionHeader && !document.getElementById('tool-message-display')) {
        toolMessageDiv = document.createElement('div');
        toolMessageDiv.id = 'tool-message-display';
        toolMessageDiv.className = 'tool-message';
        toolMessageDiv.style.display = 'none';
        sectionHeader.appendChild(toolMessageDiv);
    } else {
        toolMessageDiv = document.getElementById('tool-message-display') as HTMLDivElement | null;
    }
    
    let currentUserCredits = 0;

    const getWordCount = (text: string): number => {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };
    
    const updateToolState = (isLoggedIn: boolean) => {
        if (!textInput || !humanizeButton) return;

        const wordsInTextarea = getWordCount(textInput.value);
        
        // HATA DÜZELTMESİ: charCount değişkeni burada kullanılıyor.
        const charsInTextarea = textInput.value.length;
        if (charCount) {
            charCount.textContent = `${charsInTextarea} / 5000`; // Karakter sayacını güncelle
        }

        let remainingCredits = 0;
        let message = "";
        let disableButton = false;
        
        if (isLoggedIn) {
            remainingCredits = currentUserCredits;
            if (remainingCredits < wordsInTextarea && wordsInTextarea > 0) {
                disableButton = true;
                message = `Your text (${wordsInTextarea} words) exceeds your remaining credits (${remainingCredits} words). <a href="/pricing.html" class="link-primary">Get more credits.</a>`;
            }
        } else {
            remainingCredits = parseInt(localStorage.getItem('guestWordCredits') || '0', 10);
            if (remainingCredits <= 0) {
                disableButton = true;
                if(textInput) textInput.disabled = true;
                message = `Your free trial is over. Please <a href="/signup.html" class="link-primary">sign up</a> or <a href="/login.html" class="link-primary">login</a> for more.`;
            } else if (wordsInTextarea > remainingCredits) {
                disableButton = true;
                message = `Your text (${wordsInTextarea} words) exceeds your remaining trial credits (${remainingCredits} words).`;
            }
        }
        
        if (wordsInTextarea === 0) {
            disableButton = true;
        }

        humanizeButton.disabled = disableButton;
        if (toolMessageDiv) {
            if (message) {
                toolMessageDiv.innerHTML = message;
                toolMessageDiv.style.display = 'block';
            } else {
                toolMessageDiv.style.display = 'none';
            }
        }
    };

    const setupToolForUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!(session && session.user);

        if (isLoggedIn) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', session.user.id)
                .single();
            
            if (profile) {
                currentUserCredits = profile.credits;
            }
        } else {
            if (localStorage.getItem('guestWordCredits') === null) {
                localStorage.setItem('guestWordCredits', '500');
            }
        }
        updateToolState(isLoggedIn);
    };
    
if (humanizeButton && textInput && textOutput && loadingSpinner) {
    humanizeButton.addEventListener('click', async () => {
        // ================================================================
        // === HATA AYIKLAMA KODLARI BAŞLANGIÇ ===
        console.log("1. 'Humanize' butonuna tıklandı.");
        // ================================================================

        const wordsUsed = getWordCount(textInput.value);
        humanizeButton.disabled = true;
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (textOutput) textOutput.innerHTML = '';

        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!(session && session.user);
        
        // ================================================================
        console.log("2. Kullanıcı durumu kontrol ediliyor...", { isLoggedIn });
        // ================================================================

        if (isLoggedIn) {
            // --- GİRİŞ YAPMIŞ KULLANICI İÇİN KREDİ DÜŞÜRME ---
            console.log(`3. 'spend_credits' RPC çağrılıyor. Harcanacak kredi: ${wordsUsed}`);

            const { data: rpcData, error: rpcError } = await supabase.rpc('spend_credits', {
                amount_to_spend: wordsUsed
            });

            // ================================================================
            console.log("4. RPC yanıtı alındı:", { rpcData, rpcError });
            // ================================================================

            if (rpcError || (rpcData && !rpcData.success)) {
                // ================================================================
                console.error("5. HATA: RPC başarısız oldu!", rpcData?.message || rpcError?.message);
                // ================================================================
                alert(rpcData?.message || 'An error occurred while spending credits.');
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                updateToolState(isLoggedIn);
                return;
            }
            
            currentUserCredits = rpcData.new_balance;
            // ================================================================
            console.log("6. Kredi başarıyla düşürüldü. Yeni bakiye (lokal):", currentUserCredits);
            // ================================================================

        } else {
            // --- MİSAFİR KULLANICI (Bu kısım aynı kalabilir) ---
            const remainingGuestCredits = parseInt(localStorage.getItem('guestWordCredits') || '0', 10);
            localStorage.setItem('guestWordCredits', String(remainingGuestCredits - wordsUsed));
        }

        // Kredi düşürüldükten sonra n8n webhook'unu çağır
        try {
            console.log("7. n8n webhook'u çağrılıyor...");
            const n8nWebhookUrl = 'https://n8n.swiftscriptify.com/webhook/78fec90e-aa0f-4814-a0b5-95d2e0a220a7';
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textInput.value }),
            });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const data = await response.json();
            if (data && data.humanizedText) {
                textOutput.innerText = data.humanizedText;
            }
            console.log("8. n8n yanıtı başarıyla işlendi.");
        } catch (error) {
            console.error('9. HATA: n8n çağrısı başarısız oldu!', error);
            textOutput.innerText = 'An error occurred.';
        } finally {
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            updateToolState(isLoggedIn);
            console.log("10. İşlem tamamlandı, arayüz güncellendi.");
        }
    });
}
    if (textInput) {
        textInput.addEventListener('input', async () => {
            const { data: { session } } = await supabase.auth.getSession();
            updateToolState(!!(session && session.user));
        });
    }

    supabase.auth.onAuthStateChange((_event, session) => {
        const isLoggedIn = !!(session && session.user);
        if (isLoggedIn) {
            setupToolForUser();
        } else {
            currentUserCredits = 0;
            updateToolState(false);
        }
    });

    setupToolForUser();
};

document.addEventListener('DOMContentLoaded', initializeTextHumanizer);