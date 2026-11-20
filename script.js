// ==========================================
// DATA STORE & AUTH STORAGE (LocalStorage)
// ==========================================
const DEFAULT_USERS = [
  {
    id: 1,
    nama: 'Administrator',
    username: 'admin',
    email: 'admin@comicread.com',
    password: '123456'
  }
]

const DEFAULT_DATA = {
  genres: [
    { id: 1, nama: 'Action' },
    { id: 2, nama: 'Romance' },
    { id: 3, nama: 'Comedy' },
    { id: 4, nama: 'Fantasy' }
  ],
  koleksi: [
    {
      id: 101,
      judul: 'The Quintessential Quintuplets Vol. 1',
      genreId: 2,
      tipe: 'Manga',
      status: 'Tersedia'
    },
    {
      id: 102,
      judul: 'One Piece Vol. 105',
      genreId: 1,
      tipe: 'Manga',
      status: 'Tersedia'
    },
    {
      id: 103,
      judul: 'Solo Leveling Vol. 3',
      genreId: 4,
      tipe: 'Manhwa',
      status: 'Tersedia'
    }
  ],
  teman: [
    { id: 201, nama: 'Edi', kontak: '0812-3456-7890' },
    { id: 202, nama: 'Ayu', kontak: '0821-9876-5432' }
  ],
  peminjaman: []
}

let usersData =
  JSON.parse(localStorage.getItem('comicReadUsers')) || DEFAULT_USERS
let appData = JSON.parse(localStorage.getItem('comicReadData')) || DEFAULT_DATA
let currentUser = JSON.parse(localStorage.getItem('comicReadSession')) || null

function saveUsers () {
  localStorage.setItem('comicReadUsers', JSON.stringify(usersData))
}

function saveData () {
  localStorage.setItem('comicReadData', JSON.stringify(appData))
  initCurrentPage()
}

// ==========================================
// PROTEKSI HALAMAN (AUTH GUARD)
// ==========================================
function checkAuthGuard () {
  const page = document.body.getAttribute('data-page')
  const isAuthPage = page === 'login' || page === 'daftar'

  if (!currentUser && !isAuthPage) {
    // Jika belum login dan mencoba masuk halaman dashboard/fitur -> arahkan ke login
    window.location.href = 'login.html'
  } else if (currentUser && isAuthPage) {
    // Jika sudah login dan membuka login/daftar -> arahkan ke dashboard
    window.location.href = 'index.html'
  }
}

// Jalankan pengecekan sesi secepat mungkin
checkAuthGuard()

// ==========================================
// FUNGSI HELPER ALERT AUTH
// ==========================================
function showAuthAlert (message, type = 'danger') {
  const alertEl = document.getElementById('authAlert')
  if (alertEl) {
    alertEl.className = `alert alert-${type} py-2 small`
    alertEl.textContent = message
    alertEl.classList.remove('d-none')
  }
}

// ==========================================
// DETEKSI HALAMAN AKTIF & RENDER
// ==========================================
function initCurrentPage () {
  const page = document.body.getAttribute('data-page')

  if (page === 'dashboard') renderDashboard()
  if (page === 'genre') renderGenre()
  if (page === 'koleksi') {
    populateFilterGenre()
    renderKoleksi()
  }
  if (page === 'teman') renderTeman()
  if (page === 'peminjaman') {
    populatePinjamOptions()
    renderPeminjaman()
  }
  if (page === 'laporan') renderLaporan()
}

// 1. DASHBOARD
function renderDashboard () {
  const total = appData.koleksi.length
  const dipinjam = appData.koleksi.filter(k => k.status === 'Dipinjam').length
  const tersedia = total - dipinjam
  const totalTeman = appData.teman.length

  document.getElementById('stat-total').textContent = total
  document.getElementById('stat-tersedia').textContent = tersedia
  document.getElementById('stat-dipinjam').textContent = dipinjam
  document.getElementById('stat-teman').textContent = totalTeman

  const activeLoans = appData.peminjaman.filter(p => p.status === 'Dipinjam')
  const tbody = document.getElementById('dashboard-loan-table')

  if (activeLoans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Belum ada koleksi yang sedang dipinjam.</td></tr>`
    return
  }

  tbody.innerHTML = activeLoans
    .map(loan => {
      const buku = appData.koleksi.find(k => k.id === loan.koleksiId)
      const teman = appData.teman.find(t => t.id === loan.temanId)
      return `
            <tr>
                <td class="ps-3 fw-medium">${buku ? buku.judul : '-'}</td>
                <td>${teman ? teman.nama : '-'}</td>
                <td>${loan.tglPinjam}</td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-success" onclick="kembalikanBuku(${
                      loan.id
                    })">
                        <i class="bi bi-check2-circle"></i> Kembalikan
                    </button>
                </td>
            </tr>`
    })
    .join('')
}

// 2. GENRE
function renderGenre () {
  const tbody = document.getElementById('table-genre')
  tbody.innerHTML = appData.genres
    .map((g, idx) => {
      const count = appData.koleksi.filter(k => k.genreId === g.id).length
      return `
            <tr>
                <td class="ps-3">${idx + 1}</td>
                <td class="fw-medium">${g.nama}</td>
                <td><span class="badge bg-secondary-subtle text-dark">${count} judul</span></td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-danger" onclick="hapusGenre(${
                      g.id
                    })"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`
    })
    .join('')
}

// 3. KOLEKSI
function populateFilterGenre () {
  const genreOptions = appData.genres
    .map(g => `<option value="${g.id}">${g.nama}</option>`)
    .join('')
  document.getElementById('inputKoleksiGenre').innerHTML = genreOptions
  const filterEl = document.getElementById('filterGenre')
  const currentVal = filterEl.value
  filterEl.innerHTML = `<option value="">Semua Genre</option>` + genreOptions
  filterEl.value = currentVal
}

function renderKoleksi () {
  const search = document.getElementById('searchKoleksi').value.toLowerCase()
  const filterG = document.getElementById('filterGenre').value
  const filterS = document.getElementById('filterStatus').value

  const filtered = appData.koleksi.filter(item => {
    const matchSearch =
      item.judul.toLowerCase().includes(search) ||
      item.tipe.toLowerCase().includes(search)
    const matchGenre = filterG === '' || item.genreId == filterG
    const matchStatus = filterS === '' || item.status === filterS
    return matchSearch && matchGenre && matchStatus
  })

  const tbody = document.getElementById('table-koleksi')
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Data koleksi tidak ditemukan.</td></tr>`
    return
  }

  tbody.innerHTML = filtered
    .map(item => {
      const genre = appData.genres.find(g => g.id === item.genreId)
      const badgeClass =
        item.status === 'Tersedia'
          ? 'bg-success-subtle text-success'
          : 'bg-warning-subtle text-dark'
      return `
            <tr>
                <td class="ps-3 fw-semibold">${item.judul}</td>
                <td>${genre ? genre.nama : 'Umum'}</td>
                <td>${item.tipe}</td>
                <td><span class="badge ${badgeClass}">${item.status}</span></td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-danger" onclick="hapusKoleksi(${
                      item.id
                    })" ${item.status === 'Dipinjam' ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`
    })
    .join('')
}

// 4. TEMAN
function renderTeman () {
  const tbody = document.getElementById('table-teman')
  tbody.innerHTML = appData.teman
    .map((t, idx) => {
      const activeCount = appData.peminjaman.filter(
        p => p.temanId === t.id && p.status === 'Dipinjam'
      ).length
      return `
            <tr>
                <td class="ps-3">${idx + 1}</td>
                <td class="fw-semibold">${t.nama}</td>
                <td>${t.kontak}</td>
                <td><span class="badge bg-primary-subtle text-primary">${activeCount} buku</span></td>
                <td class="text-end pe-3">
                    <button class="btn btn-sm btn-outline-danger" onclick="hapusTeman(${
                      t.id
                    })" ${activeCount > 0 ? 'disabled' : ''}>
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`
    })
    .join('')
}

// 5. PEMINJAMAN
function populatePinjamOptions () {
  const availableBooks = appData.koleksi.filter(k => k.status === 'Tersedia')
  document.getElementById('inputPinjamKoleksi').innerHTML =
    availableBooks.length
      ? availableBooks
          .map(b => `<option value="${b.id}">${b.judul}</option>`)
          .join('')
      : `<option value="">Tidak ada koleksi tersedia</option>`

  document.getElementById('inputPinjamTeman').innerHTML = appData.teman
    .map(t => `<option value="${t.id}">${t.nama}</option>`)
    .join('')
  document.getElementById('inputPinjamTanggal').value = new Date()
    .toISOString()
    .split('T')[0]
}

function renderPeminjaman () {
  const tbody = document.getElementById('table-peminjaman')
  if (appData.peminjaman.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Belum ada riwayat peminjaman.</td></tr>`
    return
  }

  tbody.innerHTML = [...appData.peminjaman]
    .reverse()
    .map(loan => {
      const buku = appData.koleksi.find(k => k.id === loan.koleksiId)
      const teman = appData.teman.find(t => t.id === loan.temanId)
      const isDipinjam = loan.status === 'Dipinjam'

      return `
            <tr>
                <td class="ps-3 fw-medium">${buku ? buku.judul : '-'}</td>
                <td>${teman ? teman.nama : '-'}</td>
                <td>${loan.tglPinjam}</td>
                <td><span class="badge ${
                  isDipinjam
                    ? 'bg-warning text-dark'
                    : 'bg-success-subtle text-success'
                }">${loan.status}</span></td>
                <td class="text-end pe-3">
                    ${
                      isDipinjam
                        ? `<button class="btn btn-sm btn-success" onclick="kembalikanBuku(${loan.id})">Kembalikan</button>`
                        : `<span class="text-muted small">Selesai (${loan.tglKembali})</span>`
                    }
                </td>
            </tr>`
    })
    .join('')
}

// 6. LAPORAN
function renderLaporan () {
  document.getElementById('lap-total-buku').textContent = appData.koleksi.length
  document.getElementById('lap-total-transaksi').textContent =
    appData.peminjaman.length
  document.getElementById('lap-aktif').textContent = appData.peminjaman.filter(
    p => p.status === 'Dipinjam'
  ).length

  const tbody = document.getElementById('table-laporan')
  tbody.innerHTML = appData.peminjaman
    .map(loan => {
      const buku = appData.koleksi.find(k => k.id === loan.koleksiId)
      const teman = appData.teman.find(t => t.id === loan.temanId)
      return `
            <tr>
                <td>${buku ? buku.judul : '-'}</td>
                <td>${teman ? teman.nama : '-'}</td>
                <td>${loan.tglPinjam}</td>
                <td>${loan.tglKembali || '-'}</td>
                <td>${loan.status}</td>
            </tr>`
    })
    .join('')
}

// ==========================================
// EVENT LISTENERS (AUTH & FITUR)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Tanggal di Dashboard
  const dateEl = document.getElementById('currentDate')
  if (dateEl && currentUser) {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    dateEl.innerHTML = `Halo, <strong>${currentUser.nama}</strong> &bull; ${todayStr}`
  }

  // Toggle Show/Hide Password
  const togglePassBtn = document.getElementById('togglePassword')
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const passInput =
        document.getElementById('loginPassword') ||
        document.getElementById('regPassword')
      const icon = togglePassBtn.querySelector('i')
      if (passInput.type === 'password') {
        passInput.type = 'text'
        icon.classList.replace('bi-eye', 'bi-eye-slash')
      } else {
        passInput.type = 'password'
        icon.classList.replace('bi-eye-slash', 'bi-eye')
      }
    })
  }

  // Handler Form Login
  const formLogin = document.getElementById('formLogin')
  if (formLogin) {
    formLogin.addEventListener('submit', e => {
      e.preventDefault()
      const identity = document
        .getElementById('loginIdentity')
        .value.trim()
        .toLowerCase()
      const password = document.getElementById('loginPassword').value

      const foundUser = usersData.find(
        u =>
          (u.username.toLowerCase() === identity ||
            u.email.toLowerCase() === identity) &&
          u.password === password
      )

      if (foundUser) {
        localStorage.setItem(
          'comicReadSession',
          JSON.stringify({
            id: foundUser.id,
            nama: foundUser.nama,
            username: foundUser.username
          })
        )
        showAuthAlert('Login berhasil! Mengalihkan ke Dashboard...', 'success')
        setTimeout(() => {
          window.location.href = 'index.html'
        }, 700)
      } else {
        showAuthAlert('Username/Email atau Password salah!', 'danger')
      }
    })
  }

  // Handler Form Daftar
  const formDaftar = document.getElementById('formDaftar')
  if (formDaftar) {
    formDaftar.addEventListener('submit', e => {
      e.preventDefault()
      const nama = document.getElementById('regNama').value.trim()
      const username = document.getElementById('regUsername').value.trim()
      const email = document.getElementById('regEmail').value.trim()
      const password = document.getElementById('regPassword').value
      const confirmPassword =
        document.getElementById('regConfirmPassword').value

      if (password !== confirmPassword) {
        return showAuthAlert('Konfirmasi password tidak cocok!', 'danger')
      }

      const isExist = usersData.some(
        u =>
          u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === email.toLowerCase()
      )

      if (isExist) {
        return showAuthAlert('Username atau Email sudah terdaftar!', 'danger')
      }

      usersData.push({
        id: Date.now(),
        nama,
        username,
        email,
        password
      })
      saveUsers()

      showAuthAlert(
        'Pendaftaran berhasil! Silakan login dengan akun barumu.',
        'success'
      )
      formDaftar.reset()
      setTimeout(() => {
        window.location.href = 'login.html'
      }, 1200)
    })
  }

  // Form Genre
  const formGenre = document.getElementById('formGenre')
  if (formGenre) {
    formGenre.addEventListener('submit', e => {
      e.preventDefault()
      const nama = document.getElementById('inputGenreNama').value.trim()
      if (nama) {
        appData.genres.push({ id: Date.now(), nama })
        e.target.reset()
        bootstrap.Modal.getInstance(
          document.getElementById('modalGenre')
        ).hide()
        saveData()
      }
    })
  }

  // Form Koleksi
  const formKoleksi = document.getElementById('formKoleksi')
  if (formKoleksi) {
    formKoleksi.addEventListener('submit', e => {
      e.preventDefault()
      appData.koleksi.push({
        id: Date.now(),
        judul: document.getElementById('inputKoleksiJudul').value.trim(),
        genreId: parseInt(document.getElementById('inputKoleksiGenre').value),
        tipe: document.getElementById('inputKoleksiTipe').value.trim(),
        status: 'Tersedia'
      })
      e.target.reset()
      bootstrap.Modal.getInstance(
        document.getElementById('modalKoleksi')
      ).hide()
      saveData()
    })

    document
      .getElementById('searchKoleksi')
      .addEventListener('input', renderKoleksi)
    document
      .getElementById('filterGenre')
      .addEventListener('change', renderKoleksi)
    document
      .getElementById('filterStatus')
      .addEventListener('change', renderKoleksi)
  }

  // Form Teman
  const formTeman = document.getElementById('formTeman')
  if (formTeman) {
    formTeman.addEventListener('submit', e => {
      e.preventDefault()
      appData.teman.push({
        id: Date.now(),
        nama: document.getElementById('inputTemanNama').value.trim(),
        kontak: document.getElementById('inputTemanKontak').value.trim()
      })
      e.target.reset()
      bootstrap.Modal.getInstance(document.getElementById('modalTeman')).hide()
      saveData()
    })
  }

  // Form Peminjaman
  const formPinjam = document.getElementById('formPinjam')
  if (formPinjam) {
    formPinjam.addEventListener('submit', e => {
      e.preventDefault()
      const koleksiId = parseInt(
        document.getElementById('inputPinjamKoleksi').value
      )
      const temanId = parseInt(
        document.getElementById('inputPinjamTeman').value
      )
      const tglPinjam = document.getElementById('inputPinjamTanggal').value

      if (!koleksiId || !temanId)
        return alert('Pastikan koleksi tersedia dan teman sudah dipilih!')

      const buku = appData.koleksi.find(k => k.id === koleksiId)
      if (buku) buku.status = 'Dipinjam'

      appData.peminjaman.push({
        id: Date.now(),
        koleksiId,
        temanId,
        tglPinjam,
        tglKembali: null,
        status: 'Dipinjam'
      })

      e.target.reset()
      bootstrap.Modal.getInstance(document.getElementById('modalPinjam')).hide()
      saveData()
    })
  }

  // Logout
  const btnLogout = document.getElementById('btnLogout')
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin keluar dari sesi Comic Read?')) {
        localStorage.removeItem('comicReadSession')
        window.location.href = 'login.html'
      }
    })
  }

  initCurrentPage()
})

// Global Action Functions
function kembalikanBuku (loanId) {
  const loan = appData.peminjaman.find(p => p.id === loanId)
  if (loan) {
    loan.status = 'Dikembalikan'
    loan.tglKembali = new Date().toISOString().split('T')[0]
    const buku = appData.koleksi.find(k => k.id === loan.koleksiId)
    if (buku) buku.status = 'Tersedia'
    saveData()
  }
}

function hapusGenre (id) {
  if (confirm('Hapus genre ini?')) {
    appData.genres = appData.genres.filter(g => g.id !== id)
    saveData()
  }
}

function hapusKoleksi (id) {
  if (confirm('Hapus koleksi ini?')) {
    appData.koleksi = appData.koleksi.filter(k => k.id !== id)
    saveData()
  }
}

function hapusTeman (id) {
  if (confirm('Hapus data teman ini?')) {
    appData.teman = appData.teman.filter(t => t.id !== id)
    saveData()
  }
}
