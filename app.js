/**
 * Sach.in Premium Links Manager
 * Optimized for Thumbnail Priority & Confirmation
 */
class VidLinkApp {
    constructor() {
        this.links = JSON.parse(localStorage.getItem('vidlinks')) || [];
        this.currentUrl = '';
        this.currentMetadata = null;
        this.selectedThumb = '';
        this.editingId = null;
        this.currentCrop = 1200;
        this.theme = localStorage.getItem('sachin_theme') || 'light';
        this.activeActor = 'all';
        this.tempActors = []; 

        this.initElements();
        this.initEvents();
        this.setTheme(this.theme);
        this.render();
    }

    initElements() {
        this.urlInput = document.getElementById('urlInput');
        this.addBtn = document.getElementById('addBtn');
        this.linkGrid = document.getElementById('linkGrid');
        this.loader = document.getElementById('loader');
        
        this.gridViewBtn = document.getElementById('gridViewBtn');
        this.listViewBtn = document.getElementById('listViewBtn');
        
        // Modals
        this.thumbModal = document.getElementById('thumbModal');
        this.thumbPicker = document.getElementById('thumbPicker');
        this.thumbStatus = document.getElementById('thumbStatus');
        this.confirmThumbBtn = document.getElementById('confirmThumb');
        this.closeModalBtn = document.getElementById('closeModal');
        this.retryFetchBtn = document.getElementById('retryFetchBtn');

        this.editModal = document.getElementById('editModal');
        this.editTitle = document.getElementById('editTitle');
        this.editDesc = document.getElementById('editDesc');
        this.editThumbPicker = document.getElementById('editThumbPicker');
        this.saveEditBtn = document.getElementById('saveEditBtn');
        this.closeEditModalBtn = document.getElementById('closeEditModal');
        this.genScreenshotBtn = document.getElementById('genScreenshotBtn');

        this.shareModal = document.getElementById('shareModal');
        this.shareCodeOutput = document.getElementById('shareCodeOutput');
        this.multiShareBtn = document.getElementById('multiShareBtn');
        this.closeShareModalBtn = document.getElementById('closeShareModal');

        this.importModal = document.getElementById('importModal');
        this.importCodeInput = document.getElementById('importCodeInput');
        this.importBtn = document.getElementById('importBtn');
        this.confirmImportBtn = document.getElementById('confirmImport');
        this.closeImportModalBtn = document.getElementById('closeImportModal');

        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');

        this.actorFilter = document.getElementById('actorFilter');
        this.addActorsInput = document.getElementById('addActorsInput');
        this.addActorBtn = document.getElementById('addActorBtn');
        this.addActorsList = document.getElementById('addActorsList');
        this.editActorsInput = document.getElementById('editActors');
        this.editActorBtn = document.getElementById('editActorBtn');
        this.editActorsList = document.getElementById('editActorsList');

        this.shareStatus = document.getElementById('shareStatus');
        this.importStatus = document.getElementById('importStatus');
        this.peer = null;
    }

    initEvents() {
        this.addBtn.addEventListener('click', () => this.handleAddLink());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddLink();
        });

        if (this.gridViewBtn && this.listViewBtn) {
            this.gridViewBtn.addEventListener('click', () => this.setLayout('grid'));
            this.listViewBtn.addEventListener('click', () => this.setLayout('list'));
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeAllModals();
        });

        this.closeModalBtn.addEventListener('click', () => {
            this.hideModal(this.thumbModal);
            if (this.links.length === 0) this.render();
        });
        this.confirmThumbBtn.addEventListener('click', () => this.confirmThumbnail());
        this.retryFetchBtn.addEventListener('click', () => this.handleRetryFetch());

        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        this.closeEditModalBtn.addEventListener('click', () => this.hideModal(this.editModal));
        this.genScreenshotBtn.addEventListener('click', () => this.generateScreenshot());

        document.querySelectorAll('.crop-presets button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.crop-presets button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCrop = parseInt(btn.dataset.crop);
            });
        });

        this.multiShareBtn.addEventListener('click', () => this.shareCollection());
        this.closeShareModalBtn.addEventListener('click', () => {
            this.hideModal(this.shareModal);
            if (this.peer) this.peer.destroy();
        });

        this.importBtn.addEventListener('click', () => this.showModal(this.importModal));
        this.closeImportModalBtn.addEventListener('click', () => {
            this.hideModal(this.importModal);
            if (this.peer) this.peer.destroy();
        });
        this.confirmImportBtn.addEventListener('click', () => this.importCollection());

        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        this.actorFilter.addEventListener('click', (e) => {
            const pill = e.target.closest('.cat-pill');
            if (pill) {
                this.activeActor = pill.dataset.actor;
                this.actorFilter.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.render();
            }
        });

        this.addActorBtn.addEventListener('click', () => this.handleAddFormActor('add'));
        this.editActorBtn.addEventListener('click', () => this.handleAddFormActor('edit'));

        this.addActorsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddFormActor('add');
            }
        });

        this.editActorsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAddFormActor('edit');
            }
        });
    }

    showLoader(show) {
        if (show) this.loader.classList.remove('hidden');
        else this.loader.classList.add('hidden');
    }

    setLayout(layout) {
        if (!this.gridViewBtn || !this.listViewBtn) return;
        if (layout === 'grid') {
            this.gridViewBtn.classList.add('active');
            this.listViewBtn.classList.remove('active');
            this.linkGrid.classList.remove('list-view');
        } else {
            this.listViewBtn.classList.add('active');
            this.gridViewBtn.classList.remove('active');
            this.linkGrid.classList.add('list-view');
        }
        localStorage.setItem('sachin_layout', layout);
    }

    setTheme(theme) {
        this.theme = theme;
        document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
        localStorage.setItem('sachin_theme', theme);
        
        if (this.themeIcon) {
            this.themeIcon.innerHTML = theme === 'dark' 
                ? '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>'
                : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        }
    }

    toggleTheme() {
        this.setTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    closeAllModals() {
        [this.thumbModal, this.editModal, this.shareModal, this.importModal].forEach(m => {
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                if (m === this.thumbModal && this.links.length === 0) this.render();
            }
        });
    }

    async handleAddLink() {
        const url = this.urlInput.value.trim();
        if (!url) return;

        this.currentUrl = url;
        this.addBtn.disabled = true;

        const skeletonHtml = `
            <div class="skeleton-card" id="tempSkeleton">
                <div class="skeleton-img"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line tiny" style="margin-top: auto;"></div>
                </div>
            </div>
        `;
        if (this.linkGrid.querySelector('.empty-state')) this.linkGrid.innerHTML = '';
        this.linkGrid.insertAdjacentHTML('afterbegin', skeletonHtml);

        try {
            // Check for duplicates
            const existingLink = this.links.find(l => l.url === url);
            if (existingLink) {
                this.showToast('Link already in vault!', 'error');
                this.urlInput.value = '';
                this.addActorsInput.value = '';
                this.tempActors = [];
                this.renderFormActors('add');
                const skel = document.getElementById('tempSkeleton');
                if (skel) skel.remove();
                this.addBtn.disabled = false;
                
                // Optional: Scroll to existing link
                const card = document.querySelector(`[data-id="${existingLink.id}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.classList.add('highlight-flash');
                    setTimeout(() => card.classList.remove('highlight-flash'), 2000);
                }
                return;
            }

            const metadata = await this.fetchMetadata(url);
            this.currentMetadata = metadata;
            this.showThumbPicker(metadata.images || []);
        } catch (error) {
            console.error('Metadata error:', error);
            const fb = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200`;
            this.showThumbPicker([], fb);
        } finally {
            this.addBtn.disabled = false;
            this.urlInput.value = '';
            this.addActorsInput.value = '';
            this.tempActors = [];
            this.renderFormActors('add');
            const skel = document.getElementById('tempSkeleton');
            if (skel) skel.remove();
            if (this.links.length === 0 && document.getElementById('thumbModal').classList.contains('hidden')) {
                this.render();
            }
        }
    }

    async handleRetryFetch() {
        this.hideModal(this.thumbModal);
        this.urlInput.value = this.currentUrl;
        this.handleAddLink();
    }

    async fetchMetadata(url) {
        let results = {
            title: url,
            description: 'Fetching metadata...',
            images: [],
            fallback: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200`,
            url: url,
            isScreenshot: false
        };

        const resolveUrl = (relative) => {
            try { return new URL(relative, url).href; } catch (e) { return relative; }
        };

        // Try YouTube OEmbed fast path
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            try {
                let ytUrl = url;
                if (url.includes('youtu.be/')) {
                    const id = url.split('youtu.be/')[1].split('?')[0];
                    ytUrl = `https://www.youtube.com/watch?v=${id}`;
                }
                const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(ytUrl)}&format=json`);
                const data = await res.json();
                if (data.title) {
                    results.title = data.title;
                    results.description = `YouTube Video by ${data.author_name}`;
                    if (data.thumbnail_url) results.images.push(data.thumbnail_url);
                    return results;
                }
            } catch (e) {}
        }

        // Run other fetchers in parallel to get max images faster
        await Promise.allSettled([
            fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.title && results.title === url) results.title = data.title;
                    if (data.author_name && results.description === 'Fetching metadata...') results.description = `Shared by ${data.author_name || 'user'}`;
                    if (data.thumbnail_url) results.images.push(data.thumbnail_url);
                }),
            fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        const m = data.data;
                        if (m.title && results.title === url) results.title = m.title;
                        if (m.description && results.description === 'Fetching metadata...') results.description = m.description;
                        if (m.image?.url) results.images.push(m.image.url);
                        if (m.logo?.url) results.images.push(m.logo.url);
                    }
                }),
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
                .then(res => res.json())
                .then(data => {
                    const doc = new DOMParser().parseFromString(data.contents, 'text/html');
                    const getM = (s) => doc.querySelector(`meta[property="${s}"], meta[name="${s}"]`)?.getAttribute('content');
                    
                    const title = getM('og:title') || getM('twitter:title') || doc.querySelector('[itemprop="name"]')?.getAttribute('content') || doc.title;
                    if (title && results.title === url) results.title = title;
                    
                    const desc = getM('og:description') || getM('twitter:description') || doc.querySelector('[itemprop="description"]')?.getAttribute('content') || getM('description');
                    if (desc && results.description === 'Fetching metadata...') results.description = desc || 'No description.';
                    
                    const og = getM('og:image') || getM('twitter:image') || doc.querySelector('[itemprop="image"]')?.getAttribute('content');
                    if (og) results.images.push(resolveUrl(og));

                    // Extract more images (icons and img tags)
                    ['apple-touch-icon', 'icon', 'shortcut icon'].forEach(rel => {
                        const href = doc.querySelector(`link[rel="${rel}"]`)?.getAttribute('href');
                        if (href) results.images.push(resolveUrl(href));
                    });

                    Array.from(doc.querySelectorAll('img'))
                        .map(img => img.getAttribute('src'))
                        .filter(Boolean)
                        .filter(src => src.startsWith('http') || src.startsWith('/'))
                        .slice(0, 15)
                        .forEach(src => results.images.push(resolveUrl(src)));
                })
        ]).catch(err => console.warn('Parallel fetch error:', err));

        // If no title found, use hostname
        if (results.title === url) {
            try {
                results.title = new URL(url).hostname;
            } catch(e) {}
        }

        // Remove duplicates and empty
        results.images = [...new Set(results.images.filter(Boolean))];

        if (results.images.length === 0) {
            results.images = [results.fallback];
            results.isScreenshot = true;
        }

        return results;
    }

    showThumbPicker(images, overrideFB) {
        this.thumbPicker.innerHTML = '';
        const allImages = overrideFB ? [overrideFB] : images;
        const isScreenshotOnly = this.currentMetadata?.isScreenshot || (allImages.length === 1 && allImages[0].includes('mshots'));

        if (isScreenshotOnly) {
            this.thumbStatus.innerText = "OG Image not found. Use this screenshot or try again?";
            this.thumbStatus.style.color = "#d9534f"; // Alert color
        } else {
            this.thumbStatus.innerText = "Select your preferred thumbnail:";
            this.thumbStatus.style.color = "#666";
        }

        allImages.forEach((img, index) => {
            const div = document.createElement('div');
            div.className = 'thumb-option' + (index === 0 ? ' selected' : '');
            div.innerHTML = `<img src="${img}">`;
            div.onclick = () => {
                this.thumbPicker.querySelectorAll('.thumb-option').forEach(o => o.classList.remove('selected'));
                div.classList.add('selected');
                this.selectedThumb = img;
            };
            this.thumbPicker.appendChild(div);
        });
        this.selectedThumb = allImages[0];
        this.showModal(this.thumbModal);
    }

    confirmThumbnail() {
        // Auto-add any text left in the input
        this.handleAddFormActor('add');
        this.saveLink(this.selectedThumb, this.currentMetadata.title, this.currentMetadata.description, [...this.tempActors]);
        this.hideModal(this.thumbModal);
    }

    saveLink(thumb, title, desc, actors) {
        const link = { id: 'l_' + Date.now(), url: this.currentUrl, thumb, title, desc, actors: actors || [], date: Date.now() };
        this.links.unshift(link);
        this.updateStorage();
        this.render();
    }

    editLink(id) {
        const link = this.links.find(l => l.id === id);
        if (!link) return;
        this.editingId = id;
        this.editTitle.value = link.title;
        this.editDesc.value = link.desc;
        this.tempActors = Array.isArray(link.actors) ? [...link.actors] : (link.category ? [link.category] : []);
        this.renderFormActors('edit');
        this.editActorsInput.value = '';
        this.selectedThumb = link.thumb;
        this.currentUrl = link.url;
        this.renderEditThumbPicker([link.thumb]);
        this.fetchMetadata(link.url).then(m => this.renderEditThumbPicker(m.images || []));
        this.showModal(this.editModal);
    }

    renderEditThumbPicker(images) {
        const unique = [...new Set([...(images || []), this.selectedThumb])];
        this.editThumbPicker.innerHTML = unique.map(img => {
            const escapedImg = img.replace(/'/g, "\\'");
            return `
                <div class="thumb-option ${img === this.selectedThumb ? 'selected' : ''}" onclick="window.vidLinkApp.selectEditThumb('${escapedImg}')">
                    <img src="${img}">
                </div>
            `;
        }).join('');
    }

    selectEditThumb(img) {
        this.selectedThumb = img;
        this.editThumbPicker.querySelectorAll('.thumb-option').forEach(o => {
            o.classList.remove('selected');
            const imgEl = o.querySelector('img');
            if (imgEl && (imgEl.src === img || imgEl.getAttribute('src') === img)) o.classList.add('selected');
        });
    }

    generateScreenshot() {
        const ss = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(this.currentUrl)}?w=${this.currentCrop}`;
        this.selectEditThumb(ss);
        const div = document.createElement('div');
        div.className = 'thumb-option selected';
        div.innerHTML = `<img src="${ss}">`;
        div.onclick = () => this.selectEditThumb(ss);
        this.editThumbPicker.prepend(div);
    }

    saveEdit() {
        const link = this.links.find(l => l.id === this.editingId);
        if (link) {
            // Auto-add any text left in the input
            this.handleAddFormActor('edit');
            link.title = this.editTitle.value;
            link.desc = this.editDesc.value;
            link.actors = [...this.tempActors];
            link.thumb = this.selectedThumb;
            this.updateStorage();
            this.render();
        }
        this.hideModal(this.editModal);
        this.tempActors = [];
    }

    removeLink(id) {
        this.links = this.links.filter(l => l.id !== id);
        this.updateStorage();
        this.render();
        this.showToast('Link removed from vault', 'success');
    }

    updateStorage() { localStorage.setItem('vidlinks', JSON.stringify(this.links)); }
    showModal(m) { if (m) m.classList.remove('hidden'); }
    hideModal(m) { if (m) m.classList.add('hidden'); }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 3000);
    }

    copyLink(url) {
        navigator.clipboard.writeText(url).then(() => this.showToast('Copied to clipboard!'));
    }

    async shareCollection() {
        if (this.links.length === 0) return this.showToast('No links to share.', 'error');
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const peerId = `sachin_v1_sync_${code}`;
        
        this.showLoader(true);
        this.shareStatus.innerText = "Initializing P2P...";
        this.shareStatus.style.color = "#666";

        if (this.peer) this.peer.destroy();
        this.peer = new Peer(peerId);

        this.peer.on('open', (id) => {
            this.showLoader(false);
            this.shareCodeOutput.textContent = code;
            this.showModal(this.shareModal);
            this.shareStatus.innerText = "Waiting for connection...";
        });

        this.peer.on('connection', (conn) => {
            this.shareStatus.innerText = "Connected! Sending data...";
            this.shareStatus.style.color = "#4CAF50";
            conn.on('open', () => {
                conn.send(this.links);
                setTimeout(() => {
                    this.shareStatus.innerText = "Data sent successfully!";
                }, 1000);
            });
        });

        this.peer.on('error', (err) => {
            this.showLoader(false);
            if (err.type === 'unavailable-id') {
                // Limit retries
                this.retryCount = (this.retryCount || 0) + 1;
                if (this.retryCount < 3) {
                    this.shareCollection();
                } else {
                    this.showToast('Unable to generate unique share code. Try again later.', 'error');
                }
            } else {
                console.error('Peer Error:', err);
                this.showToast('P2P Error: ' + err.type, 'error');
            }
        });
    }

    async importCollection() {
        const code = this.importCodeInput.value.trim();
        if (code.length !== 6) return this.showToast('Enter a valid 6-digit code.', 'error');
        
        const targetId = `sachin_v1_sync_${code}`;
        this.showLoader(true);
        this.importStatus.innerText = "Connecting to peer...";
        this.importStatus.style.color = "#666";

        if (this.peer) this.peer.destroy();
        this.peer = new Peer(); // Random ID for importer

        this.peer.on('open', () => {
            const conn = this.peer.connect(targetId);
            
            // Timeout if cannot connect in 10s
            const timeout = setTimeout(() => {
                this.showLoader(false);
                this.importStatus.innerText = "Connection timed out. Is the sender online?";
                this.importStatus.style.color = "#d9534f";
                this.peer.destroy();
            }, 10000);

            conn.on('open', () => {
                clearTimeout(timeout);
                this.importStatus.innerText = "Connected! Receiving data...";
            });

            conn.on('data', (data) => {
                if (Array.isArray(data)) {
                    const oldLen = this.links.length;
                    this.links = [...data, ...this.links];
                    const seen = new Set();
                    this.links = this.links.filter(l => seen.has(l.url) ? false : seen.add(l.url));
                    const added = this.links.length - oldLen;
                    
                    this.updateStorage();
                    this.render();
                    
                    this.importStatus.innerText = `Success! ${added} links added.`;
                    this.importStatus.style.color = "#4CAF50";
                    
                    setTimeout(() => {
                        this.showLoader(false);
                        this.hideModal(this.importModal);
                        this.peer.destroy();
                    }, 1500);
                }
            });

            conn.on('error', (err) => {
                clearTimeout(timeout);
                this.showLoader(false);
                this.importStatus.innerText = "Connection error.";
                this.importStatus.style.color = "#d9534f";
            });
        });

        this.peer.on('error', (err) => {
            this.showLoader(false);
            console.error('Peer Error:', err);
            this.importStatus.innerText = "P2P Error: " + err.type;
            this.importStatus.style.color = "#d9534f";
        });
    }



    render() {
        if (!this.linkGrid) return;
        
        // Update Actor Bar
        this.updateActorBar();

        let filtered = [...this.links];

        // Actor filter
        if (this.activeActor !== 'all') {
            filtered = filtered.filter(l => Array.isArray(l.actors) && l.actors.includes(this.activeActor));
        }

        // Sorting (Always Newest First)
        filtered.sort((a, b) => (b.date || 0) - (a.date || 0));

        if (filtered.length === 0) {
            const isFiltering = this.activeActor !== 'all';
            this.linkGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${isFiltering ? '🔍' : '🌐'}</div>
                    <div class="empty-title">${isFiltering ? 'No results found' : 'Your vault is empty'}</div>
                    <div class="empty-sub">${isFiltering ? 'Try adjusting your filters.' : 'Paste any URL above to save it with a rich preview.'}</div>
                </div>`;
            return;
        }

        this.linkGrid.innerHTML = filtered.map(l => {
            const actors = Array.isArray(l.actors) ? l.actors : (l.category ? [l.category] : []);
            return `
            <div class="card" data-id="${l.id}">
                <div class="card-img-wrapper">
                    <img src="${l.thumb}" class="card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400?text=Image+Unavailable'">
                </div>
                <div class="card-content">
                    <div class="card-actor-tags">
                        ${actors.map(a => `<span class="card-actor-tag">${a}</span>`).join('')}
                    </div>
                    <h3>${l.title}</h3>
                    <p class="card-desc">${l.desc}</p>
                    <div class="card-actions">
                        <button class="btn open-btn" onclick="window.open('${l.url}', '_blank')" title="Open">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 4px;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                            Open
                        </button>
                        <button class="btn default-btn" onclick="window.vidLinkApp.copyLink('${l.url}')" title="Copy">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="btn default-btn" onclick="window.vidLinkApp.editLink('${l.id}')" title="Edit">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn default-btn delete-btn" onclick="window.vidLinkApp.removeLink('${l.id}')" title="Remove">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;}).join('');
    }

    updateActorBar() {
        const allActors = this.links.flatMap(l => Array.isArray(l.actors) ? l.actors : (l.category ? [l.category] : []));
        const uniqueActors = [...new Set(allActors)].filter(Boolean).sort();
        
        const html = [
            `<button class="cat-pill ${this.activeActor === 'all' ? 'active' : ''}" data-actor="all">All Actors</button>`,
            ...uniqueActors.map(actor => `<button class="cat-pill ${this.activeActor === actor ? 'active' : ''}" data-actor="${actor}">${actor}</button>`)
        ].join('');
        
        if (this.actorFilter.innerHTML !== html) {
            this.actorFilter.innerHTML = html;
        }
    }

    handleAddFormActor(formType) {
        const input = formType === 'add' ? this.addActorsInput : this.editActorsInput;
        const name = input.value.trim();
        if (name) {
            // Support comma-separated batch add even in the input
            const names = name.split(',').map(n => n.trim()).filter(Boolean);
            names.forEach(n => {
                if (!this.tempActors.includes(n)) {
                    this.tempActors.push(n);
                }
            });
            input.value = '';
            this.renderFormActors(formType);
        }
    }

    removeFormActor(formType, index) {
        this.tempActors.splice(index, 1);
        this.renderFormActors(formType);
    }

    renderFormActors(formType) {
        const list = formType === 'add' ? this.addActorsList : this.editActorsList;
        list.innerHTML = this.tempActors.map((a, i) => `
            <div class="form-actor-tag">
                ${a}
                <button type="button" onclick="window.vidLinkApp.removeFormActor('${formType}', ${i})">×</button>
            </div>
        `).join('');
    }
}

window.vidLinkApp = new VidLinkApp();
