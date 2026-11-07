# Aplikasi Asesmen Fikih Online 2026 — MTs Raudlatul Ulum VI

Paket baru ini disesuaikan dengan struktur database yang dikirim pengguna (CSV, 46 kolom, 5 tabel):
- `admin_users`
- `participants`
- `pengaturan_ujian`
- `soal_fikih`
- `submission_answers`

Tidak membuat tabel baru dan tidak mengganti nama tabel yang sudah ada.

## Fitur
- Tampilan biru tua dengan aksen emas; warna hitam sangat minim.
- Satu ujian gabungan Thaharah dan Salat.
- 50 soal: 40 LOTS dan 10 HOTS.
- Opsi jawaban hanya A, B, C, D.
- Timer default 90 menit.
- Penilaian dilakukan di Edge Function, bukan di browser.
- Nomor peserta tidak dapat digunakan dua kali.
- Dashboard admin memakai Supabase Auth dan daftar izin `admin_users`.
- Rekap nilai dan unduh CSV.
- Kunci jawaban tidak dikirim ke browser.

## PENTING: urutan pemasangan

### 1. Masukkan 50 soal ke tabel yang sudah ada
1. Buka Supabase → SQL Editor → New query.
2. Buka file `supabase/seed-soal.sql` dari paket ini.
3. Salin seluruh isinya ke SQL Editor.
4. Klik Run.
5. Pastikan tabel `soal_fikih` berisi 50 baris aktif. Jangan jalankan berulang kali jika 50 soal sudah masuk.

File seed mengisi `pilihan_e` dengan teks kosong karena aplikasi hanya menampilkan A–D, sedangkan kolom `pilihan_e` pada database lama bersifat wajib.

### 2. Masukkan publishable key ke halaman
1. Supabase → Project Settings → API Keys.
2. Salin **Publishable key** (`sb_publishable_...`), bukan secret key.
3. Buka `index.html`.
4. Cari `TEMPEL_PUBLISHABLE_KEY_SUPABASE_DI_SINI`.
5. Ganti teks tersebut dengan publishable key milik proyek.
6. Jangan memasukkan Secret key atau `service_role` ke `index.html`.

Project URL sudah diisi sesuai proyek: `https://cpmbdmujazeahhjidbpi.supabase.co`.

### 3. Deploy Edge Functions
Paket ini menyediakan empat fungsi:
- `start-assessment`
- `submit-assessment`
- `admin-data`
- `get-result`

Deploy dengan Supabase CLI dari folder proyek:
```bash
supabase login
supabase link --project-ref cpmbdmujazeahhjidbpi
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=ISI_SECRET_KEY_SERVER
supabase secrets set SUPABASE_ANON_KEY=ISI_PUBLISHABLE_KEY
supabase functions deploy start-assessment
supabase functions deploy submit-assessment
supabase functions deploy admin-data
supabase functions deploy get-result
```
Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` pada file HTML, GitHub, atau Vercel. Secret tersebut hanya disimpan sebagai Supabase Function Secret.

Jika fungsi `start-assessment` lama sudah ada, deploy versi baru dari paket ini untuk memperbaruinya.

### 4. Siapkan akun administrator
1. Supabase → Authentication → Users → Add user.
2. Buat email dan password administrator.
3. Salin UUID user yang baru dibuat.
4. Jalankan query berikut di SQL Editor, ganti UUID:
```sql
INSERT INTO public.admin_users (user_id)
VALUES ('UUID-USER-ADMIN');
```
Jika admin sudah terdaftar di `admin_users`, jangan masukkan lagi.

### 5. Publikasikan ke GitHub dan Vercel
- Unggah `index.html` ke root repository GitHub.
- Unggah folder `supabase` juga agar file fungsi dan SQL tersimpan.
- Import repository ke Vercel, Framework Preset: Other.
- Build command kosong; Output Directory `.`.
- Deploy dan buka URL Vercel.

## Cara kerja pengaturan ujian
- Jika tabel `pengaturan_ujian` belum memiliki baris aktif, aplikasi memakai nama default Asesmen Fikih 2026, durasi 90 menit, dan PIN tidak diwajibkan.
- Jika ada baris dengan `status_aktif = true`, aplikasi menggunakan `durasi_menit`, `pin_akses`, `tanggal_mulai`, `tanggal_selesai`, dan `nama_ujian` dari baris tersebut.
- Jika PIN diisi pada pengaturan aktif, siswa wajib memasukkan PIN tersebut.

## Catatan sebelum dipakai siswa
1. Jalankan seed soal dan pastikan 50 soal aktif.
2. Pastikan empat Edge Functions sudah berstatus deployed.
3. Pastikan publishable key sudah ditempel di `index.html`.
4. Pastikan minimal satu akun admin telah masuk ke `admin_users`.
5. Uji satu peserta percobaan dari awal sampai nilai tersimpan.
6. Hapus data peserta percobaan sebelum ujian resmi jika diperlukan.

Paket ini adalah source code untuk dipasang ke proyek Supabase dan hosting. File ZIP tidak otomatis mengubah atau menerbitkan proyek Vercel/Supabase.
