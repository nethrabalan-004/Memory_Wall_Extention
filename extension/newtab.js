const container = document.getElementById('container');
const fabUpload = document.getElementById('fabUpload');
const modal = document.getElementById('uploadModal');
const modalFile = document.getElementById('modalFile');
const modalDesc = document.getElementById('modalDesc');
const btnCancel = document.getElementById('closeModal');
const btnConfirm = document.getElementById('confirmUpload');
const uploadStatus = document.getElementById('uploadStatus');

// Open Modal
fabUpload.addEventListener('click', () => {
    modal.style.display = 'flex';
    modalFile.value = '';
    modalDesc.value = '';
    uploadStatus.textContent = '';
});

// Close Modal
btnCancel.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});

// Upload Handler
btnConfirm.addEventListener('click', async () => {
    const file = modalFile.files[0];
    const description = modalDesc.value.trim();

    if (!file && !description) {
        uploadStatus.textContent = 'Please add a photo or text.';
        uploadStatus.style.color = 'red';
        return;
    }

    uploadStatus.textContent = 'Uploading...';
    uploadStatus.style.color = 'blue';

    try {
        let base64 = null;
        if (file) {
            base64 = await toBase64(file);
        }

        const response = await fetch('https://memory-wall-extention-1.onrender.com/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: base64, description })
        });

        if (response.ok) {
            modal.style.display = 'none';
            loadMemories();
        } else {
            throw new Error('Upload failed');
        }
    } catch (err) {
        console.error(err);
        uploadStatus.textContent = 'Error uploading. Server running?';
        uploadStatus.style.color = 'red';
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

async function loadMemories() {
    try {
        const response = await fetch('https://memory-wall-extention-1.onrender.com/memories');
        if (!response.ok) throw new Error('Failed to load memories');

        const memories = await response.json();

        if (memories.length === 0) {
            container.innerHTML = `
                <div class="error-msg">
                    <div>No memories yet.</div>
                    <button class="empty-state-btn" onclick="document.getElementById('fileInput').click()">Pick Photos</button>
                    <p style="font-size: 0.6em; margin-top: 10px;">(Click + to add)</p>
                </div>`;
            return;
        }

        // Logic: < 20 = Board, >= 20 = Marquee (User requested 20)
        if (memories.length < 20) {
            renderBoard(memories);
        } else {
            renderMarquee(memories);
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="error-msg">
            Server not connected. Run the node app!<br>
            <small>${err.message}</small>
        </div>`;
    }
}

async function deleteMemory(id) {
    if (!confirm('Delete this memory?')) return;
    try {
        await fetch(`https://memory-wall-extention-1.onrender.com/memories/${id}`, { method: 'DELETE' });
        loadMemories();
    } catch (err) {
        console.error(err);
        alert('Failed to delete');
    }
}

function createDeleteBtn(id) {
    const btn = document.createElement('div');
    btn.className = 'delete-btn';
    btn.textContent = '×';
    btn.onclick = (e) => {
        e.stopPropagation(); // Prevent drag/click on parent
        deleteMemory(id);
    };
    return btn;
}

function renderBoard(memories) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'board-wrapper';

    // Divide screen into roughly equal areas or just scatter randomly with checks?
    // Random scatter is easier and looks more organic for a "board".
    // We'll define a safe area (padding) to avoid edges.
    // Use 85% of screen width/height to ensure items stay visible
    const safeMargin = 7.5; // 7.5% padding on each side
    const availableWidth = 85;
    const availableHeight = 85;

    const count = memories.length;
    let cols = Math.ceil(Math.sqrt(count * (16 / 9)));
    let rows = Math.ceil(count / cols);

    if (count < 4) { cols = 2; rows = 2; }

    const cellWidth = availableWidth / cols;
    const cellHeight = availableHeight / rows;

    // Generate positions
    const positions = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (positions.length < count) {
                positions.push({ r, c });
            }
        }
    }

    memories.forEach((mem, index) => {
        const div = document.createElement('div');
        div.className = 'pinned-photo';

        if (count > 12) {
            div.style.transformOrigin = 'center';
            div.style.scale = '0.85';
        }

        const pos = positions[index] || { r: 0, c: 0 };

        // Jitter (Reduced to avoid pushing too far)
        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.3);
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.3);

        // Apply safe margin offset + grid position + center of cell + jitter
        const left = safeMargin + (pos.c * cellWidth) + (cellWidth / 2) + jitterX;
        const top = safeMargin + (pos.r * cellHeight) + (cellHeight / 2) + jitterY;

        div.style.left = `${left}%`;
        div.style.top = `${top}%`;

        // Random Rotation (-10 to 10 deg)
        const rot = Math.floor(Math.random() * 20) - 10;

        // Use translate to center on the point, then rotate
        div.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;

        const pin = document.createElement('div');
        pin.className = 'pin';
        div.appendChild(pin);

        // Delete Button
        div.appendChild(createDeleteBtn(mem._id));

        // CONTENT LOGIC
        if (mem.imageUrl) {
            const img = document.createElement('img');
            img.src = mem.imageUrl;
            div.appendChild(img);

            // If there's also a description, add hover overlay
            if (mem.description) {
                const desc = document.createElement('div');
                desc.className = 'hover-desc';
                desc.textContent = mem.description;
                div.appendChild(desc);
            }
        } else if (mem.description) {
            // Text Only Card
            const textCard = document.createElement('div');
            textCard.className = 'text-card';
            textCard.textContent = mem.description;
            div.appendChild(textCard);
        }

        wrapper.appendChild(div);
    });

    container.appendChild(wrapper);
}

function renderMarquee(memories) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'marquee-wrapper';

    // Create 3 rows
    for (let i = 0; i < 3; i++) {
        const row = document.createElement('div');
        row.className = 'marquee-row';

        const content = document.createElement('div');
        content.className = 'marquee-content';

        // Shuffle memories for each row so they look different
        // or just offset them? Shuffling is better for variety.
        let rowMemories = [...memories];
        if (i === 1) rowMemories.reverse(); // Reverse middle row
        if (i === 2) rowMemories.sort(() => 0.5 - Math.random()); // Random last row

        // Duplicate enough times to fill width + scroll buffer
        // With 3 rows, images are smaller (height: 25vh), so we need more images horizontally.
        let displayMemories = [...rowMemories];
        // Ensure enough items for smooth scroll
        while (displayMemories.length < 30) {
            displayMemories = [...displayMemories, ...rowMemories];
        }

        displayMemories.forEach(mem => {
            const item = document.createElement('div');
            item.className = 'marquee-item';

            if (mem.imageUrl) {
                const img = document.createElement('img');
                img.src = mem.imageUrl;
                item.appendChild(img);

                if (mem.description) {
                    const desc = document.createElement('div');
                    desc.className = 'hover-desc';
                    desc.textContent = mem.description;
                    item.appendChild(desc);
                }
            } else if (mem.description) {
                const textCard = document.createElement('div');
                textCard.className = 'text-card';
                textCard.textContent = mem.description;
                item.appendChild(textCard);
            }

            item.appendChild(createDeleteBtn(mem._id));

            content.appendChild(item);
        });

        row.appendChild(content);
        wrapper.appendChild(row);
    }

    container.appendChild(wrapper);
}

loadMemories();

// --- Remove unwanted Chrome footer elements ---
function removeUnwantedElements() {
    // 1. Remove by ID/Class (Standard Chrome NTP)
    const selectors = [
        '#customize-chrome-button',
        '.customize-chrome-button',
        '#customization-menu',
        'footer',
        '#footer'
    ];

    selectors.forEach(sel => {
        const els = document.querySelectorAll(sel);
        els.forEach(el => el.style.display = 'none');
    });

    // 2. Remove by Text Content (Aggressive)
    const allDivs = document.getElementsByTagName('div');
    for (let div of allDivs) {
        if (div.shadowRoot) {
            // Check shadow DOM if accessible
        }

        // Check text content
        const text = div.textContent?.trim() || '';
        if (text === 'Customize Chrome' || text === 'Memories Wall') {
            // Be careful not to hide our own title if it was a div, but title is in head
            // Hiding "Memories Wall" link if it's a footer link
            if (!div.closest('#container') && !div.closest('#uploadModal')) {
                div.style.display = 'none';
                div.style.visibility = 'hidden';
                div.style.opacity = '0';
            }
        }
    }

    // 3. Remove known iframe if injected
    const iframes = document.getElementsByTagName('iframe');
    for (let iframe of iframes) {
        if (iframe.id === 'customize-chrome-iframe') {
            iframe.style.display = 'none';
        }
    }
}

// Run immediately, on load, and on changes
removeUnwantedElements();
window.addEventListener('load', removeUnwantedElements);
const observer = new MutationObserver(removeUnwantedElements);
observer.observe(document.body, { childList: true, subtree: true });
