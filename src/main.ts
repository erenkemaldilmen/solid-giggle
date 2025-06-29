import './style.css';
import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// --- Global Supabase Client ---
const SUPABASE_URL = 'https://abteqgahhnnxiudbgrqf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidGVxZ2FoaG5ueGl1ZGJncnFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzQyMTgsImV4cCI6MjA2NjUxMDIxOH0.fy1f6SbmTMeZU_A5PG2PPA2lGGfRz-j8K6G2hhYr8hA';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Element Selections ---
const mobileNavToggle = document.querySelector('.mobile-nav-toggle') as HTMLButtonElement | null;
const mobileNavMenu = document.getElementById('nav-links-mobile') as HTMLElement | null;
const currentYearElement = document.getElementById('currentYear') as HTMLSpanElement | null;
const bodyElement = document.body;

// --- Global Functions (Run on all pages) ---

if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear().toString();
}

if (mobileNavToggle && mobileNavMenu) {
    mobileNavToggle.addEventListener('click', () => {
        const isExpanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
        mobileNavToggle.setAttribute('aria-expanded', String(!isExpanded));
        mobileNavMenu.classList.toggle('active');
        bodyElement.classList.toggle('no-scroll', !isExpanded);
    });
}

function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const linkElement = link as HTMLAnchorElement;
        if (linkElement.pathname === currentPath) {
            linkElement.classList.add('active');
        } else {
            linkElement.classList.remove('active');
        }
    });
}

function smoothScrollSetup() {
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (this: HTMLAnchorElement, e) {
            const href = this.getAttribute('href');
            if (!href || !href.includes('#') || this.pathname !== window.location.pathname) return;
            
            const targetId = href.substring(href.indexOf('#') + 1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                const headerOffset = (document.getElementById('main-header')?.offsetHeight || 70) + 20;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                if (mobileNavMenu?.classList.contains('active')) mobileNavToggle?.click();
            }
        });
    });
}

async function updateUserStatusUI() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    const loginButton = document.getElementById('loginButton');
    const signupButton = document.getElementById('signupButton');
    const headerActions = document.querySelector('.header-actions');
    const mobileHeaderActions = document.querySelector('.mobile-header-actions');

    document.getElementById('dashboardButton')?.remove();
    document.getElementById('logoutButton')?.remove();
    document.getElementById('mobileDashboardButton')?.remove();
    document.getElementById('mobileLogoutButton')?.remove();

    if (user) {
        if (loginButton) loginButton.style.display = 'none';
        if (signupButton) signupButton.style.display = 'none';

        if (headerActions) {
            const dashboardButton = document.createElement('a');
            dashboardButton.href = '/dashboard.html';
            dashboardButton.textContent = 'Dashboard';
            dashboardButton.className = 'btn btn-outline';
            dashboardButton.id = 'dashboardButton';

            const logoutButton = document.createElement('button');
            logoutButton.textContent = 'Logout';
            logoutButton.className = 'btn btn-primary';
            logoutButton.id = 'logoutButton';
            logoutButton.onclick = () => supabase.auth.signOut();
            
            headerActions.appendChild(dashboardButton);
            headerActions.appendChild(logoutButton);
        }
        if (mobileHeaderActions) {
            mobileHeaderActions.innerHTML = '';
            const mobileDashboard = document.createElement('a');
            mobileDashboard.href = '/dashboard.html';
            mobileDashboard.textContent = 'Dashboard';
            mobileDashboard.className = 'btn btn-outline btn-full-width';
            mobileDashboard.id = 'mobileDashboardButton';

            const mobileLogout = document.createElement('a');
            mobileLogout.textContent = 'Logout';
            mobileLogout.className = 'btn btn-primary btn-full-width';
            mobileLogout.id = 'mobileLogoutButton';
            mobileLogout.onclick = () => supabase.auth.signOut();
            
            mobileHeaderActions.appendChild(mobileDashboard);
            mobileHeaderActions.appendChild(mobileLogout);
        }

    } else {
        if (loginButton) loginButton.style.display = 'flex';
        if (signupButton) signupButton.style.display = 'flex';

        if (mobileHeaderActions) {
            mobileHeaderActions.innerHTML = `
                <a href="/login.html" class="btn btn-outline btn-full-width">Login</a>
                <a href="/signup.html" class="btn btn-primary btn-full-width">Sign Up Free</a>
            `;
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();
    smoothScrollSetup();
    updateUserStatusUI();

    if (bodyElement.id === 'page-home') {
        // Ana sayfa scriptleri
    }

    if (bodyElement.id === 'page-pricing') {
        const billingToggle = document.getElementById('billingCycleToggle') as HTMLInputElement | null;
        
        const proMonthlyBtn = document.querySelector('.cta-pro-monthly') as HTMLElement | null;
        const proAnnualBtn = document.querySelector('.cta-pro-annual') as HTMLElement | null;
        const businessMonthlyBtn = document.querySelector('.cta-business-monthly') as HTMLElement | null;
        const businessAnnualBtn = document.querySelector('.cta-business-annual') as HTMLElement | null;

        const handleBillingToggle = () => {
            const monthlyLabel = document.getElementById('monthlyLabel');
            const annualLabel = document.getElementById('annualLabel');
            
            if (!billingToggle || !proMonthlyBtn || !proAnnualBtn || !businessMonthlyBtn || !businessAnnualBtn || !monthlyLabel || !annualLabel) return; 

            const isAnnual = billingToggle.checked;
            
            monthlyLabel.classList.toggle('active', !isAnnual);
            annualLabel.classList.toggle('active', isAnnual);
            
            document.querySelectorAll<HTMLElement>('.pricing-card[data-plan]').forEach(card => {
                const priceElement = card.querySelector('.price-value');
                const periodElement = card.querySelector('.billing-period');
                const priceContainer = card.querySelector('.price') as HTMLElement;

                const monthlyPrice = priceContainer?.dataset.monthlyPrice;
                const annualPrice = priceContainer?.dataset.annualPrice;

                if (priceElement && periodElement && monthlyPrice && annualPrice) {
                    priceElement.textContent = isAnnual ? annualPrice : monthlyPrice;
                    periodElement.textContent = isAnnual ? '/ year' : '/ month';
                }
            });
            
            proMonthlyBtn.style.display = isAnnual ? 'none' : 'block';
            proAnnualBtn.style.display = isAnnual ? 'block' : 'none';
            businessMonthlyBtn.style.display = isAnnual ? 'none' : 'block';
            businessAnnualBtn.style.display = isAnnual ? 'block' : 'none';
        }

        billingToggle?.addEventListener('change', handleBillingToggle);
        handleBillingToggle();

        document.querySelectorAll('.lemon-button').forEach(button => {
            button.addEventListener('click', async (event: Event) => {
                event.preventDefault(); 
                
                let checkoutUrl = (event.currentTarget as HTMLAnchorElement).href;
                
                const { data: { session } } = await supabase.auth.getSession();
                if (!session || !session.user) {
                    window.location.href = '/login.html';
                    return;
                }
                                
                checkoutUrl += `?checkout[email]=${encodeURIComponent(session.user.email || '')}&checkout[custom][user_id]=${session.user.id}`;

                if (window.LemonSqueezy && window.LemonSqueezy.Url && typeof window.LemonSqueezy.Url.Open === 'function') {
                    window.LemonSqueezy.Url.Open(checkoutUrl);
                } else {
                    console.warn('Lemon.js is not loaded or is corrupted. Redirecting to checkout page directly.');
                    window.location.href = checkoutUrl;
                }
            });
        });
    }


    // ===================================================================
    // === DEĞİŞİKLİK BURADA: Text Humanizer bloğunun içi boşaltıldı ===
    // ===================================================================
    if (bodyElement.id === 'page-text-humanizer') {
        // Bu sayfanın mantığı artık 'src/text-humanizer.ts' dosyası tarafından yönetiliyor.
        // Bu bloğu boş bırakmak, çakışmaları ve çift işlemleri önler.
    }
});


// --- Global Auth State Listener ---
supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
    updateUserStatusUI();

    if (event === "SIGNED_IN" && (window.location.pathname.includes('login') || window.location.pathname.includes('signup'))) {
       window.location.href = '/text-humanizer.html';
    }

    if (event === "SIGNED_OUT" && window.location.pathname.includes('dashboard')) {
       window.location.href = '/';
    }
});

// Update active link on browser back/forward navigation
window.addEventListener('popstate', setActiveNavLink);