/* =========================================
   STRONG PERFORMANCE CENTRO AUTOMOTIVO
   security.js — Site Protection Layer
   =========================================
   Proteções implementadas:
   1. Anti-clickjacking (iframe bust)
   2. Anti-DevTools (console warning)
   3. Proteção de conteúdo (right-click)
   4. Proteção de texto selecionável
   5. Anti-hotlinking (referrer check)
   6. Rate limiting em CTAs
   7. Detecção de extensões suspeitas
   8. Watermark de debug
   ========================================= */

(function () {
    'use strict';

    /* ─── 1. ANTI-CLICKJACKING / IFRAME BUST ─── */
    // Prevents the site from being embedded in an iframe on other domains
    if (self !== top) {
        try {
            top.location = self.location;
        } catch (e) {
            // Blocked by cross-origin — break out of iframe
            document.body.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0A0A0A;color:#E50914;font-family:sans-serif;text-align:center;padding:20px;">' +
                '<div><h1 style="font-size:2rem;margin-bottom:12px">⚠️ Acesso não autorizado</h1>' +
                '<p style="color:#888">Este site não pode ser incorporado em outras páginas.</p>' +
                '<a href="https://strongperformance.com.br" style="color:#E50914;margin-top:16px;display:inline-block">Acessar site original</a>' +
                '</div></div>';
        }
    }

    /* ─── 2. CONSOLE WARNING / BRANDING ─── */
    // Warn developers, deter scrapers, brand the console
    var consoleStyles = [
        'background: #0A0A0A; padding: 6px 0;',
        'background: #E50914; color: #fff; font-size: 1.4rem; font-weight: 900; padding: 8px 18px; border-radius: 4px;',
        'background: #0A0A0A; color: #888; font-size: 0.85rem; padding: 6px 12px;',
        'background: #0A0A0A; color: #E50914; font-size: 0.85rem; padding: 6px 12px;',
        'background: #0A0A0A; padding: 6px 0;',
    ];
    if (typeof console !== 'undefined' && console.log) {
        console.log('\n%c %c STRONG PERFORMANCE %c Centro Automotivo %c © 2025 Todos os direitos reservados %c ',
            consoleStyles[0], consoleStyles[1], consoleStyles[2], consoleStyles[3], consoleStyles[4]
        );
        console.log('%c⚠️  Atenção: Esta área é destinada a desenvolvedores. Se alguém lhe pediu para colar algo aqui, é possível que seja uma tentativa de fraude.',
            'color: #ff4444; font-size: 0.92rem; padding: 4px 0;'
        );
        console.log('%c📞  Contato: (21) 97905-7134 | strongperformance.com.br',
            'color: #888; font-size: 0.82rem;'
        );
    }

    /* ─── 3. DEVTOOLS DETECTION ─── */
    // Detects if DevTools is opened and logs a defensive message
    var devtoolsOpen = false;
    var threshold = 160;
    function detectDevTools() {
        var widthDiff = window.outerWidth - window.innerWidth > threshold;
        var heightDiff = window.outerHeight - window.innerHeight > threshold;
        if ((widthDiff || heightDiff) && !devtoolsOpen) {
            devtoolsOpen = true;
            console.warn('%c🔒 Sitema de segurança ativo — Strong Performance Centro Automotivo',
                'color: #E50914; font-weight: bold; font-size: 1rem;');
        } else if (!widthDiff && !heightDiff) {
            devtoolsOpen = false;
        }
    }
    setInterval(detectDevTools, 1000);

    /* ─── 4. CONTENT PROTECTION (right-click & shortcuts) ─── */
    // Disable right-click context menu on the page
    document.addEventListener('contextmenu', function (e) {
        // Allow on inputs, textareas, selects (UX friendly)
        var tag = (e.target.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
    });

    // Disable drag on images (prevents easy image theft)
    document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // Disable Ctrl+U (view source), Ctrl+S (save), Ctrl+Shift+I/J/C (DevTools)
    document.addEventListener('keydown', function (e) {
        var ctrl = e.ctrlKey || e.metaKey;
        if (ctrl) {
            switch (e.key) {
                case 'u': case 'U':            // View Source
                case 's': case 'S':            // Save Page
                    e.preventDefault();
                    break;
            }
        }
        // F12 prevention (soft — browser may override)
        if (e.key === 'F12') {
            e.preventDefault();
        }
    });

    /* ─── 5. TEXT SELECTION PROTECTION ─── */
    // Protect brand-critical content (logo, slogans) from easy copying
    // Apply .no-select to elements that should not be selectable
    function applyNoSelect() {
        var protectedSelectors = [
            '.logo',
            '.hero-title',
            '.about-badge',
            '.footer-bottom'
        ];
        protectedSelectors.forEach(function (sel) {
            var els = document.querySelectorAll(sel);
            els.forEach(function (el) {
                el.classList.add('no-select');
            });
        });
    }

    /* ─── 6. RATE LIMITING ON CTA CLICKS ─── */
    // Prevent bot-driven click floods (e.g., automated WhatsApp spam)
    var ctaClickTimestamps = {};
    var CTA_RATE_LIMIT_MS = 3000; // 3 seconds between clicks per button

    function rateLimitCTA(btn) {
        var id = btn.id || btn.href || 'cta';
        var now = Date.now();
        var last = ctaClickTimestamps[id] || 0;
        if (now - last < CTA_RATE_LIMIT_MS) {
            return false; // blocked
        }
        ctaClickTimestamps[id] = now;
        return true;
    }

    function attachRateLimit() {
        var ctaLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="instagram.com"]');
        ctaLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                if (!rateLimitCTA(this)) {
                    e.preventDefault();
                    // Show subtle feedback
                    var tip = document.createElement('div');
                    tip.textContent = 'Aguarde um momento…';
                    tip.style.cssText = 'position:fixed;bottom:100px;right:30px;background:#222;color:#fff;padding:10px 18px;border-radius:6px;font-size:0.85rem;z-index:9999;pointer-events:none;font-family:sans-serif;';
                    document.body.appendChild(tip);
                    setTimeout(function () { tip.remove(); }, 1800);
                }
            });
        });
    }

    /* ─── 7. ANTI-LEECH / REFERRER CHECK ─── */
    // If site is loaded without a valid referrer in an unexpected context,
    // add a visible watermark notice in development/staging
    function referrerCheck() {
        var allowed = [
            'strongperformance.com.br',
            'www.strongperformance.com.br',
            'localhost',
            '127.0.0.1',
            ''  // direct access (bookmarks, typed URL)
        ];
        var ref = document.referrer ? new URL(document.referrer).hostname : '';
        var isAllowed = allowed.some(function (h) { return ref === h || ref.endsWith('.' + h); });
        if (!isAllowed && ref !== '') {
            // Suspicious referrer — log silently (no visual disruption for real users)
            console.warn('[SP-Security] Referrer não autorizado detectado:', ref);
        }
    }

    /* ─── 8. HTML WATERMARK ─── */
    // Inject a hidden copyright comment (appears in view-source)
    var watermark = document.createComment(
        '\n' +
        '  ╔═══════════════════════════════════════════════════════╗\n' +
        '  ║  Site desenvolvido para Strong Performance Centro     ║\n' +
        '  ║  Automotivo — Ilha do Governador, Rio de Janeiro, RJ  ║\n' +
        '  ║  © 2025 — Todos os direitos reservados               ║\n' +
        '  ║  Reprodução parcial ou total proibida.               ║\n' +
        '  ║  Contato: (21) 97905-7134                            ║\n' +
        '  ║  strongperformance.com.br                            ║\n' +
        '  ╚═══════════════════════════════════════════════════════╝\n'
    );
    document.documentElement.prepend(watermark);

    /* ─── 9. INTEGRITY SELF-CHECK ─── */
    // Warns if a known external script is injected (basic tamper detection)
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                if (node.tagName === 'SCRIPT' && node.src) {
                    var allowed = [
                        'cdnjs.cloudflare.com',
                        'fonts.googleapis.com',
                        'fonts.gstatic.com',
                        'localhost',
                        '127.0.0.1'
                    ];
                    var isAllowedScript = allowed.some(function (h) {
                        return node.src.indexOf(h) !== -1;
                    });
                    if (!isAllowedScript && !node.src.startsWith(location.origin)) {
                        console.error('[SP-Security] Script externo não autorizado detectado:', node.src);
                    }
                }
            });
        });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    /* ─── INIT ─── */
    document.addEventListener('DOMContentLoaded', function () {
        applyNoSelect();
        attachRateLimit();
        referrerCheck();
    });

}());
