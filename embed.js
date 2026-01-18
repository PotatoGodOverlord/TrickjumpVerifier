// embed.js - All embed functionality
(function() {
    'use strict';
    
    // ========== CONFIGURATION ==========
    const EMBED_WIDTH = '100%';
    const EMBED_HEIGHT = '450px';
    const FALLBACK_TIMEOUT = 3000;
    
    // ========== PUBLIC API ==========
    window.tryEmbedMedia = async function(url) {
        console.log(`Trying to embed: ${url}`);
        
        const container = document.getElementById('videoContainer');
        if (!container) {
            console.error('videoContainer not found');
            return false;
        }
        
        // Clear previous embed
        container.innerHTML = '';
        hideFallbackMessage();
        
        // Check if it's a tweet (twitter/x.com)
        if (isTweetUrl(url)) {
            return embedTwitterVideo(url, container); // Use twitter-video class
        }
        
        // Check if it's a video platform
        if (isVideoUrl(url)) {
            return embedVideo(url, container);
        }
        
        // Not embeddable
        console.log('URL not embeddable');
        return false;
    };
    
    window.showFallbackOption = function(url, autoClick = false) {
        const fallbackEl = document.getElementById('fallbackMessage');
        if (!fallbackEl) {
            console.error('fallbackMessage element not found');
            return;
        }
        
        // Update fallback message
        const message = fallbackEl.querySelector('p');
        if (message) {
            try {
                const hostname = new URL(url).hostname;
                message.textContent = `Cannot embed content from ${hostname}`;
            } catch {
                message.textContent = 'Cannot embed this content';
            }
        }
        
        // Update the button
        const button = fallbackEl.querySelector('button');
        if (button) {
            button.onclick = function() {
                openInTab(url);
            };
        }
        
        fallbackEl.style.display = 'block';
        
        // Auto-fallback if enabled
        if (autoClick) {
            setTimeout(() => {
                if (fallbackEl.style.display !== 'none') {
                    openInTab(url);
                }
            }, FALLBACK_TIMEOUT);
        }
    };
    
    window.openInTab = function(url) {
        // Create temporary link with target
        const tempLink = document.createElement('a');
        tempLink.href = url;
        tempLink.target = 'externalTab';
        tempLink.style.display = 'none';
        
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        
        // Hide fallback message
        hideFallbackMessage();
    };
    
    // ========== PRIVATE FUNCTIONS ==========
    function hideFallbackMessage() {
        const fallbackEl = document.getElementById('fallbackMessage');
        if (fallbackEl) {
            fallbackEl.style.display = 'none';
        }
    }
    
    function isVideoUrl(url) {
        const videoDomains = [
            'youtube.com', 'youtu.be',
            'vimeo.com',
            'twitch.tv',
            'tiktok.com',
            'instagram.com'
        ];
        
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return videoDomains.some(videoDomain => domain.includes(videoDomain));
        } catch {
            return false;
        }
    }
    
    function isTweetUrl(url) {
        const isTwitter = url.includes('twitter.com') || url.includes('x.com');
        const hasStatus = url.includes('/status/');
        return isTwitter && hasStatus;
    }
    
    function embedVideo(url, container) {
        const platform = getVideoPlatform(url);
        
        switch(platform) {
            case 'youtube':
                return embedYouTube(url, container);
            case 'vimeo':
                return embedVimeo(url, container);
            case 'twitch':
                return embedTwitch(url, container);
            case 'tiktok':
                return embedTikTok(url, container);
            case 'instagram':
                return embedInstagram(url, container);
            default:
                console.log(`No video embed handler for: ${platform}`);
                return false;
        }
    }
    
    function getVideoPlatform(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            
            if (domain.includes('youtube') || domain.includes('youtu.be')) return 'youtube';
            if (domain.includes('vimeo')) return 'vimeo';
            if (domain.includes('twitch')) return 'twitch';
            if (domain.includes('tiktok')) return 'tiktok';
            if (domain.includes('instagram')) return 'instagram';
            
            return 'unknown';
        } catch {
            return 'unknown';
        }
    }
    
    // ========== PLATFORM EMBED FUNCTIONS ==========
    
    // YouTube
    function embedYouTube(url, container) {
        const videoId = extractYouTubeId(url);
        if (!videoId) return false;
        
        container.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                width="${EMBED_WIDTH}"
                height="${EMBED_HEIGHT}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>`;
        return true;
    }
    
    // Vimeo
    function embedVimeo(url, container) {
        const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
        if (!match) return false;
        
        const videoId = match[1];
        container.innerHTML = `
            <iframe 
                src="https://player.vimeo.com/video/${videoId}?autoplay=1"
                width="${EMBED_WIDTH}"
                height="${EMBED_HEIGHT}"
                frameborder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowfullscreen>
            </iframe>`;
        return true;
    }
    
    // Twitch
    function embedTwitch(url, container) {
        let embedUrl = '';
        
        if (url.includes('/clip/')) {
            const clipName = url.split('/clip/')[1].split('?')[0];
            embedUrl = `https://clips.twitch.tv/embed?clip=${clipName}&autoplay=true`;
        } else if (url.includes('/videos/')) {
            const videoId = url.split('/videos/')[1].split('?')[0];
            embedUrl = `https://player.twitch.tv/?video=v${videoId}&autoplay=true`;
        } else {
            const channel = url.split('twitch.tv/')[1].split('?')[0];
            embedUrl = `https://player.twitch.tv/?channel=${channel}&autoplay=true`;
        }
        
        container.innerHTML = `
            <iframe 
                src="${embedUrl}"
                width="${EMBED_WIDTH}"
                height="${EMBED_HEIGHT}"
                frameborder="0"
                allowfullscreen>
            </iframe>`;
        return true;
    }
    
    // TikTok
    function embedTikTok(url, container) {
        container.innerHTML = `
            <blockquote class="tiktok-embed" cite="${url}">
                <section></section>
            </blockquote>`;
        
        // Load TikTok script if needed
        if (!window.tiktokEmbedLoaded) {
            const script = document.createElement('script');
            script.src = 'https://www.tiktok.com/embed.js';
            script.async = true;
            script.onload = () => window.tiktokEmbedLoaded = true;
            document.head.appendChild(script);
        }
        
        return true;
    }
    
    // Instagram (FIXED - with https://)
    function embedInstagram(url, container) {
        container.innerHTML = `
            <blockquote class="instagram-media" 
                data-instgrm-captioned 
                data-instgrm-permalink="${url}"
                data-instgrm-version="14">
                <a href="${url}">View on Instagram</a>
            </blockquote>`;
        
        // Load Instagram script if needed
        if (!window.instgrm) {
            const script = document.createElement('script');
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            document.head.appendChild(script);
        } else {
            window.instgrm.Embeds.process();
        }
        
        return true;
    }
    
    // Twitter Video (FIXED - using twitter-video class)
    function embedTwitterVideo(url, container) {
        if (!container || !(container instanceof HTMLElement)) {
            console.error('Invalid container for Twitter embed');
            return false;
        }
        
        // Create Twitter VIDEO embed (not tweet)
        container.innerHTML = `
            <div style="max-width: 560px; margin: 0 auto;">
                <blockquote class="twitter-tweet twitter-video-only" data-conversation="none"
                data-dnt="true"
                data-theme="dark">
                <a href="${url}"></a>
                </blockquote>
            </div>
        `;
        
        // Load Twitter widget
        loadTwitterWidget().then(() => {
            if (window.twttr && window.twttr.widgets) {
                window.twttr.widgets.load();
            }
        }).catch(err => {
            console.error('Failed to load Twitter widget:', err);
        });
        
        return true;
    }
    
    // Helper to load Twitter widget
    function loadTwitterWidget() {
        return new Promise((resolve, reject) => {
            // If already loaded
            if (window.twttr) {
                resolve();
                return;
            }
            
            // If already loading
            if (document.querySelector('script[src*="platform.twitter.com"]')) {
                // Wait for it to load
                const checkInterval = setInterval(() => {
                    if (window.twttr) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                return;
            }
            
            // Load fresh
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.charset = 'utf-8';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Remove the old embedTweet function (not needed anymore)
    // Twitter embeds should use twitter-video class
    
    // ========== HELPER FUNCTIONS ==========
    function extractYouTubeId(url) {
        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
            /youtube\.com\/embed\/([^\/\?]+)/,
            /youtu\.be\/([^\/\?]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }
        return null;
    }
    
    // ========== INITIALIZATION ==========
    document.addEventListener('DOMContentLoaded', function() {
        // Create fallback message if it doesn't exist
        createFallbackElement();
        
        console.log('Embed system initialized');
    });
    
    function createFallbackElement() {
        if (document.getElementById('fallbackMessage')) {
            return;
        }
        
        const fallbackDiv = document.createElement('div');
        fallbackDiv.id = 'fallbackMessage';
        fallbackDiv.style.cssText = `
            display: none;
            text-align: center;
            padding: 20px;
            margin: 20px auto;
            max-width: 800px;
            background: #f8f9fa;
            border-radius: 8px;
        `;
        
        fallbackDiv.innerHTML = `
            <p style="margin-bottom: 10px; color: #666;">Cannot embed this content</p>
            <button style="
                padding: 8px 16px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            ">Open in New Tab Instead</button>
        `;
        
        document.body.appendChild(fallbackDiv);
        console.log('Created fallback message element');
    }
    
})();