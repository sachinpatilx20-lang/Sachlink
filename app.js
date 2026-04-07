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
        this.bucket = 'sachin_v1_links';

        this.initElements();
        this.initEvents();
        this.render();
    }

    initElements() {
        this.urlInput = document.getElementById('urlInput');
        this.addBtn = document.getElementById('addBtn');
        this.linkGrid = document.getElementById('linkGrid');
        this.loader = document.getElementById('loader');
        
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

        this.backupBtn = document.getElementById('backupBtn');
        this.backupModal = document.getElementById('backupModal');
        this.showExportBtn = document.getElementById('showExportBtn');
        this.showImportBtn = document.getElementById('showImportBtn');
        this.exportArea = document.getElementById('exportArea');
        this.importArea = document.getElementById('importArea');
        this.exportCodeArea = document.getElementById('exportCode');
        this.localImportCodeInput = document.getElementById('localImportCodeInput');
        this.copyCodeBtn = document.getElementById('copyCodeBtn');
        this.importSubmitBtn = document.getElementById('importSubmitBtn');
        this.importError = document.getElementById('importError');
        this.closeBackupModalBtn = document.getElementById('closeBackupModal');

        this.shareStatus = document.getElementById('shareStatus');
        this.importStatus = document.getElementById('importStatus');
        this.peer = null;
    }

    initEvents() {
        this.addBtn.addEventListener('click', () => this.handleAddLink());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddLink();
        });

        this.closeModalBtn.addEventListener('click', () => this.hideModal(this.thumbModal));
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

        this.backupBtn.addEventListener('click', () => this.openBackupModal());
        this.showExportBtn.addEventListener('click', () => this.switchBackupView('export'));
        this.showImportBtn.addEventListener('click', () => this.switchBackupView('import'));
        this.copyCodeBtn.addEventListener('click', () => this.copyBackupCode());
        this.importSubmitBtn.addEventListener('click', () => this.handleLocalImport());
        this.closeBackupModalBtn.addEventListener('click', () => this.hideModal(this.backupModal));
    }

    showLoader(show) {
        if (show) this.loader.classList.remove('hidden');
        else this.loader.classList.add('hidden');
    }

    async handleAddLink() {
        const url = this.urlInput.value.trim();
        if (!url) return;

        this.currentUrl = url;
        this.addBtn.disabled = true;
        this.showLoader(true);

        try {
            const metadata = await this.fetchMetadata(url);
            this.currentMetadata = metadata;
            
            // PRIORITY CHANGE: Always show picker if any image exists (even just fallback)
            // This ensures user can confirm if they want the screenshot or "Try Again"
            this.showThumbPicker(metadata.images || []);
        } catch (error) {
            console.error('Metadata error:', error);
            const fb = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1200`;
            this.showThumbPicker([], fb);
        } finally {
            this.addBtn.disabled = false;
            this.urlInput.value = '';
            this.showLoader(false);
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

        // Try NoEmbed
        try {
            const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.title) {
                results.title = data.title;
                results.description = `Shared by ${data.author_name || 'user'}`;
                if (data.thumbnail_url) results.images.push(data.thumbnail_url);
                return results;
            }
        } catch (e) {}

        // Try Microlink
        try {
            const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data.status === 'success') {
                const m = data.data;
                results.title = m.title || results.title;
                results.description = m.description || results.description;
                if (m.image?.url) results.images.push(m.image.url);
                if (m.logo?.url) results.images.push(m.logo.url);
                if (results.images.length > 0) return results;
            }
        } catch (e) {}

        // Final proxy fallback
        try {
            const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            const doc = new DOMParser().parseFromString(data.contents, 'text/html');
            const getM = (s) => doc.querySelector(`meta[property="${s}"], meta[name="${s}"]`)?.getAttribute('content');
            results.title = getM('og:title') || doc.title || results.title;
            results.description = getM('og:description') || getM('description') || 'No description.';
            const og = getM('og:image');
            if (og) results.images.push(og);
        } catch (e) {}

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
        this.saveLink(this.selectedThumb, this.currentMetadata.title, this.currentMetadata.description);
        this.hideModal(this.thumbModal);
    }

    saveLink(thumb, title, desc) {
        const link = { id: 'l_' + Date.now(), url: this.currentUrl, thumb, title, desc };
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
        this.selectedThumb = link.thumb;
        this.currentUrl = link.url;
        this.renderEditThumbPicker([link.thumb]);
        this.fetchMetadata(link.url).then(m => this.renderEditThumbPicker(m.images || []));
        this.showModal(this.editModal);
    }

    renderEditThumbPicker(images) {
        const unique = [...new Set([...(images || []), this.selectedThumb])];
        this.editThumbPicker.innerHTML = unique.map(img => `
            <div class="thumb-option ${img === this.selectedThumb ? 'selected' : ''}" onclick="window.vidLinkApp.selectEditThumb('${img}')">
                <img src="${img}">
            </div>
        `).join('');
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
            link.title = this.editTitle.value;
            link.desc = this.editDesc.value;
            link.thumb = this.selectedThumb;
            this.updateStorage();
            this.render();
        }
        this.hideModal(this.editModal);
    }

    removeLink(id) {
        if (confirm('Delete this link?')) {
            this.links = this.links.filter(l => l.id !== id);
            this.updateStorage();
            this.render();
        }
    }

    updateStorage() { localStorage.setItem('vidlinks', JSON.stringify(this.links)); }
    showModal(m) { if (m) m.classList.remove('hidden'); }
    hideModal(m) { if (m) m.classList.add('hidden'); }

    copyLink(url) {
        navigator.clipboard.writeText(url).then(() => alert('Copied to clipboard!'));
    }

    async shareCollection() {
        if (this.links.length === 0) return alert('No links to share.');
        
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
                // If code taken, try once more automatically
                this.shareCollection();
            } else {
                console.error('Peer Error:', err);
                alert('P2P Error: ' + err.type);
            }
        });
    }

    async importCollection() {
        const code = this.importCodeInput.value.trim();
        if (code.length !== 6) return alert('Enter 6-digit code.');
        
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

    openBackupModal() {
        this.switchBackupView('export');
        this.showModal(this.backupModal);
    }

    handleLocalExport() {
        this.exportCodeArea.value = JSON.stringify(this.links, null, 2);
    }

    copyBackupCode() {
        if (!this.exportCodeArea.value) return;
        navigator.clipboard.writeText(this.exportCodeArea.value).then(() => {
            const originalText = this.copyCodeBtn.innerText;
            this.copyCodeBtn.innerText = 'Copied!';
            this.copyCodeBtn.classList.add('active');
            setTimeout(() => {
                this.copyCodeBtn.innerText = originalText;
                this.copyCodeBtn.classList.remove('active');
            }, 2000);
        });
    }

    handleLocalImport() {
        try {
            const code = this.localImportCodeInput.value.trim();
            if (!code) {
                this.importError.innerText = "Please paste your backup code first.";
                this.importError.classList.remove('hidden');
                return;
            }
            const data = JSON.parse(code);
            if (Array.isArray(data) && data.length > 0) {
                // Basic validation: check if items have url property
                if (!data[0].url) throw new Error('Invalid format');
                
                const oldLen = this.links.length;
                this.links = [...data, ...this.links];
                
                // Remove duplicates based on URL
                const seen = new Set();
                this.links = this.links.filter(l => seen.has(l.url) ? false : seen.add(l.url));
                
                const added = this.links.length - oldLen;
                
                this.updateStorage();
                this.render();
                this.importError.classList.add('hidden');
                this.localImportCodeInput.value = '';
                this.hideModal(this.backupModal);
                alert(`Backup restored! ${added} new links added.`);
            } else {
                throw new Error('Not an array or empty');
            }
        } catch (e) {
            this.importError.innerText = "Error: Invalid JSON format. Make sure it's a valid Sach.in backup array.";
            this.importError.classList.remove('hidden');
        }
    }

    switchBackupView(view) {
        this.importError.classList.add('hidden');
        if (view === 'export') {
            this.exportArea.classList.remove('hidden');
            this.importArea.classList.add('hidden');
            this.showExportBtn.classList.add('active');
            this.showImportBtn.classList.remove('active');
            this.handleLocalExport();
        } else {
            this.exportArea.classList.add('hidden');
            this.importArea.classList.remove('hidden');
            this.showExportBtn.classList.remove('active');
            this.showImportBtn.classList.add('active');
            this.localImportCodeInput.focus();
        }
    }

    render() {
        if (!this.linkGrid) return;
        if (this.links.length === 0) {
            this.linkGrid.innerHTML = '<div class="empty-state"><p>No links found. Add your first link above!</p></div>';
            return;
        }
        this.linkGrid.innerHTML = this.links.map(l => `
            <div class="card">
                <img src="${l.thumb}" class="card-img" onerror="this.src='https://via.placeholder.com/400?text=Wait+for+Screenshot'">
                <div class="card-content">
                    <h3>${l.title}</h3>
                    <p style="display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${l.desc}</p>
                    <div class="card-actions">
                        <button class="btn secondary" onclick="window.open('${l.url}', '_blank')">Open</button>
                        <button class="btn secondary" onclick="window.vidLinkApp.copyLink('${l.url}')">Copy</button>
                        <button class="btn secondary" onclick="window.vidLinkApp.editLink('${l.id}')">Edit</button>
                        <button class="btn secondary" onclick="window.vidLinkApp.removeLink('${l.id}')">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

window.vidLinkApp = new VidLinkApp();
