// Variabel global untuk menyimpan data aset setelah diambil dari JSON
let digitalAssets = [];

// === Helper Functions ===

// Fungsi untuk mendekode link dari format Base64
function decodeLink(encodedLink) {
    if (!encodedLink) return '';
    try {
        return atob(encodedLink);
    } catch (e) {
        console.error("Gagal mendekode link:", e);
        return '';
    }
}

// Fungsi untuk menampilkan notifikasi toast (pop-up kecil)
function showToast(message, type = 'success') {
    const toastArea = document.getElementById('toastArea');
    const toastHtml = `
        <div class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastArea.insertAdjacentHTML('beforeend', toastHtml);
    const toastEl = toastArea.lastElementChild;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}


// === Core Asset Management Functions ===

// Fungsi untuk mengambil data dari file JSON dan menampilkannya
function initializeAndFetchAssets() {
    // PERBAIKAN: Mengambil data dari path yang benar 'js/digital.json'
    fetch('assets/js/digital.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Gagal memuat file JSON: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            digitalAssets = data;
            renderAssetList();
        })
        .catch(error => {
            console.error('Terjadi kesalahan saat mengambil aset digital:', error);
            const container = document.getElementById('assetListContainer');
            container.innerHTML = `<div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Gagal Memuat Data!</h4>
                <p>Tidak dapat mengambil daftar produk dari server. Pastikan file <code>js/digital.json</code> ada dan dapat diakses.</p>
                <hr>
                <p class="mb-0">Silakan coba muat ulang halaman ini nanti.</p>
            </div>`;
            document.getElementById('assetCountBadge').textContent = 'Error';
        });
}

// Fungsi untuk menampilkan daftar aset ke dalam HTML
function renderAssetList() {
    const container = document.getElementById('assetListContainer');
    const emptyMessage = document.getElementById('emptyAssetMessage');
    const assetCountBadge = document.getElementById('assetCountBadge');
    
    container.innerHTML = ''; 

    if (digitalAssets.length === 0) {
        emptyMessage.classList.remove('d-none');
        assetCountBadge.textContent = '0 Produk';
        return;
    } else {
        emptyMessage.classList.add('d-none');
        assetCountBadge.textContent = `${digitalAssets.length} Produk`;
    }

    digitalAssets.forEach(asset => {
        const assetCardHTML = `
            <div class="asset-card card card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="asset-title mb-1 d-flex align-items-center gap-2">
                            <i class="bi ${asset.icon || 'bi-link-45deg'}"></i> ${asset.name}
                        </h5>
                        <span class="badge bg-secondary mb-2">${asset.category}</span>
                        <p class="asset-description">${asset.description || 'Tidak ada deskripsi.'}</p>
                        <button class="btn btn-sm btn-primary mt-2 view-asset-link" data-encoded-link="${asset.link}">
                            <i class="bi bi-box-arrow-up-right"></i> Akses Sekarang
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', assetCardHTML);
    });

    document.querySelectorAll('.view-asset-link').forEach(button => {
        button.addEventListener('click', (event) => {
            const encodedLink = event.currentTarget.dataset.encodedLink;
            if (encodedLink) {
                const decodedLink = decodeLink(encodedLink);
                if (decodedLink) {
                    window.open(decodedLink, '_blank');
                } else {
                    showToast('Tautan produk tidak valid atau rusak.', 'danger');
                }
            } else {
                showToast('Tautan produk tidak ditemukan.', 'danger');
            }
        });
    });
}


// === Event Listeners ===

document.addEventListener('DOMContentLoaded', () => {
    initializeAndFetchAssets();

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        bootstrap.Tooltip.getOrCreateInstance(el);
    });

    const themeModeSelect = document.getElementById('themeMode');
    if (themeModeSelect) {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        themeModeSelect.value = savedTheme;

        themeModeSelect.addEventListener('change', () => {
            const selectedTheme = themeModeSelect.value;
            document.documentElement.setAttribute('data-bs-theme', selectedTheme);
            localStorage.setItem('theme', selectedTheme);
        });
    }

    const btnResetPrefs = document.getElementById('btnResetPrefs');
    if (btnResetPrefs) {
        btnResetPrefs.addEventListener('click', () => {
            if (confirm('Anda yakin ingin mereset pengaturan tampilan ke default?')) {
                localStorage.removeItem('theme');
                document.documentElement.setAttribute('data-bs-theme', 'light');
                if (themeModeSelect) themeModeSelect.value = 'light';
                showToast('Pengaturan tampilan telah direset.', 'info');
            }
        });
    }
});

