import './style.css';

// --- DOM Element Selections ---
const mobileNavToggle = document.querySelector('.mobile-nav-toggle') as HTMLButtonElement | null;
const mobileNavMenu = document.getElementById('nav-links-mobile') as HTMLElement | null;
const currentYearElement = document.getElementById('currentYear') as HTMLSpanElement | null;
const bodyElement = document.body;

// --- Global Functions (Run on all pages) ---

// Automatically update the year in the footer
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear().toString();
}

// Mobile Navigation Toggle
if (mobileNavToggle && mobileNavMenu) {
    mobileNavToggle.addEventListener('click', () => {
        const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
        mobileNavToggle.setAttribute('aria-expanded', String(!isExpanded));
        mobileNavMenu.classList.toggle('active');
        // Prevent body scroll when mobile menu is open
        bodyElement.classList.toggle('no-scroll', !isExpanded);
    });
}

// Set the active state for the current navigation link
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkElement = link as HTMLAnchorElement;
        // Check if the link's pathname matches the current page's pathname
        if (linkElement.pathname === currentPath) {
            linkElement.classList.add('active');
        } else {
            linkElement.classList.remove('active');
        }
    });
}

// Smooth scroll for in-page anchor links, accounting for header height
function smoothScrollSetup() {
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (this: HTMLAnchorElement, e) {
            const href = this.getAttribute('href');
            if (!href || !href.includes('#')) return;

            // Handle links that navigate to a hash on another page
            if (this.pathname !== window.location.pathname) {
                // Let the browser handle navigation
                return;
            }

            const targetId = href.substring(href.indexOf('#') + 1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                const headerOffset = (document.getElementById('main-header')?.offsetHeight || 70) + 20;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });

                // Close mobile menu if open after clicking a link
                if (mobileNavMenu?.classList.contains('active')) {
                   mobileNavToggle?.click();
                }
            }
        });
    });
}

// --- Page-Specific Functions (Run after DOM is loaded) ---
document.addEventListener('DOMContentLoaded', () => {
    // Run global setup functions
    setActiveNavLink();
    smoothScrollSetup();

    // --- HOME PAGE SPECIFIC FUNCTIONS ---
    if (bodyElement.id === 'page-home') {
        // Add any JavaScript specific to your homepage here
        console.log('Homepage scripts initialized!');
    }

    // --- PRICING PAGE SPECIFIC FUNCTIONS ---
    if (bodyElement.id === 'page-pricing') {
        const toggle = document.getElementById('billingCycleToggle') as HTMLInputElement;
        const monthlyLabel = document.getElementById('monthlyLabel') as HTMLLabelElement;
        const annualLabel = document.getElementById('annualLabel') as HTMLLabelElement;
        const pricingCards = document.querySelectorAll('.pricing-card[data-plan]');

        const updatePrices = () => {
            if (!toggle) return;
            const isAnnual = toggle.checked;

            monthlyLabel?.classList.toggle('active', !isAnnual);
            annualLabel?.classList.toggle('active', isAnnual);

            pricingCards.forEach(card => {
                const cardElement = card as HTMLElement;
                const priceValueElement = cardElement.querySelector('.price-value') as HTMLSpanElement;
                const billingPeriodElement = cardElement.querySelector('.billing-period') as HTMLSpanElement;
                const monthlyPrice = cardElement.dataset.monthlyPrice;
                const annualPrice = cardElement.dataset.annualPrice;
                const monthlyCta = cardElement.querySelector('.cta-' + cardElement.dataset.plan + '-monthly') as HTMLElement;
                const annualCta = cardElement.querySelector('.cta-' + cardElement.dataset.plan + '-annual') as HTMLElement;

                if (monthlyCta) monthlyCta.style.display = isAnnual ? 'none' : 'block';
                if (annualCta) annualCta.style.display = isAnnual ? 'block' : 'none';

                if (priceValueElement && monthlyPrice) {
                    if (isAnnual && annualPrice) {
                        const effectiveMonthlyPrice = (parseInt(annualPrice) / 12).toFixed(0);
                        priceValueElement.textContent = effectiveMonthlyPrice;
                        if (billingPeriodElement) billingPeriodElement.textContent = '/ month';
                    } else {
                        priceValueElement.textContent = monthlyPrice;
                        if (billingPeriodElement) billingPeriodElement.textContent = '/ month';
                    }
                }
            });
        };

        if (toggle) {
            toggle.addEventListener('change', updatePrices);
            updatePrices(); // Set initial state
        }
        
        const faqItems = document.querySelectorAll('.faq-item');
        faqItems.forEach(item => {
            const button = item.querySelector('.faq-question') as HTMLButtonElement;
            button?.addEventListener('click', () => {
                const answer = button.nextElementSibling as HTMLElement;
                const isExpanded = button.getAttribute('aria-expanded') === 'true';
                
                button.setAttribute('aria-expanded', String(!isExpanded));
                if (answer) {
                    answer.style.maxHeight = !isExpanded ? answer.scrollHeight + 'px' : '0';
                }
            });
        });

        console.log('Pricing page scripts initialized!');
    }

    // ==========================================================
    // === YENİ EKLENEN TEXT HUMANIZER SAYFASI KODLARI BAŞLANGICI ===
    // ==========================================================
// Dosyanın en başı
if (document.body.id === 'page-text-humanizer') {
    // Tüm elementleri seçme (Bu kısım aynı kalıyor)
    const textInput = document.getElementById('text-input') as HTMLTextAreaElement | null;
    const textOutput = document.getElementById('text-output') as HTMLDivElement | null;
    const charCount = document.getElementById('char-count') as HTMLSpanElement | null;
    const pasteButton = document.getElementById('paste-button') as HTMLButtonElement | null;
    const copyButton = document.getElementById('copy-button') as HTMLButtonElement | null;
    const humanizeButton = document.getElementById('humanize-button') as HTMLButtonElement | null;
    const loadingSpinner = textOutput?.querySelector('.loading-spinner') as HTMLElement | null;

    const MAX_CHARS = 5000;

    // --- İŞLEV 1: Karakter sayacını güncelle (KORUNUYOR) ---
    if (textInput && charCount) {
        textInput.addEventListener('input', () => {
            const count = textInput.value.length;
            charCount.textContent = `${count} / ${MAX_CHARS}`;
            charCount.style.color = count > MAX_CHARS ? 'var(--color-danger)' : 'var(--color-text-medium)';
        });
    }

    // --- İŞLEV 2: "Paste" butonu (KORUNUYOR) ---
    if (pasteButton && textInput) {
        pasteButton.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                textInput.value = text;
                // Karakter sayacının güncellenmesi için 'input' event'ini tetikle
                textInput.dispatchEvent(new Event('input')); 
            } catch (err) {
                console.error('Failed to paste:', err);
            }
        });
    }

    // --- İŞLEV 3: "Copy" butonu (KORUNUYOR) ---
    if (copyButton && textOutput) {
        copyButton.addEventListener('click', () => {
            // ÖNEMLİ: Kopyalama yaparken loading spinner'ı hariç tutmalıyız.
            // innerText bunu zaten yapar ama daha garantili bir yöntem klonlamaktır.
            const outputClone = textOutput.cloneNode(true) as HTMLElement;
            outputClone.querySelector('.loading-spinner')?.remove();
            const textToCopy = outputClone.innerText;

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const copyBtnSpan = copyButton.querySelector('span');
                    if (copyBtnSpan) copyBtnSpan.textContent = 'Copied!';
                    setTimeout(() => {
                        if (copyBtnSpan) copyBtnSpan.textContent = 'Copy';
                    }, 2000);
                });
            }
        });
    }

    // --- İŞLEV 4: "Humanize" butonu (GÜNCELLENDİ) ---
    if (humanizeButton && textInput && textOutput && loadingSpinner) {
        humanizeButton.addEventListener('click', async () => { // Fonksiyonu async yapıyoruz
            if (!textInput.value.trim() || textInput.value.length > MAX_CHARS) {
                // Eğer metin boşsa veya karakter limitini aşıyorsa işlem yapma
                if (textInput.value.length > MAX_CHARS) {
                    alert(`Maximum character limit (${MAX_CHARS}) exceeded.`);
                }
                return;
            }

            // n8n Webhook PRODUCTION URL'nizi buraya yapıştırın
            const n8nWebhookUrl = 'https://n8n.swiftscriptify.com/webhook/78fec90e-aa0f-4814-a0b5-95d2e0a220a7';

            // Yükleniyor durumunu başlat
            humanizeButton.disabled = true;
            textOutput.innerHTML = ''; // Önceki içeriği temizle
            if(loadingSpinner) loadingSpinner.style.display = 'block';

            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: textInput.value // Kullanıcının girdiği metni gönderiyoruz
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API error: ${response.statusText}`);
                }

                const data = await response.json(); // n8n'den gelen JSON'ı al

                // Gelen veriyi ekranda göster
                if (data && data.humanizedText) {
                    textOutput.innerText = data.humanizedText;
                } else {
                    textOutput.innerText = 'Received an empty response from the server.';
                }
                
            } catch (error) {
                console.error('Failed to humanize text:', error);
                textOutput.innerText = 'An error occurred while processing your request. Please try again later.';
                textOutput.style.color = 'var(--color-danger)';
            } finally {
                // Her durumda yükleniyor durumunu bitir
                if(loadingSpinner) loadingSpinner.style.display = 'none';
                humanizeButton.disabled = false;
                // textOutput rengini normale döndür
                setTimeout(() => textOutput.style.color = '', 5000);
            }
        });
    }
    
    console.log('Text Humanizer page scripts fully initialized!');
}
     // ========================================================
    // === YENİ EKLENEN TEXT HUMANIZER SAYFASI KODLARI SONU ===
    // ========================================================

});

// Update active link on browser back/forward navigation
window.addEventListener('popstate', setActiveNavLink);