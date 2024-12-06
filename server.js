const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); // Untuk hashing password
const multer = require("multer");
const path = require("path");
require('dotenv').config();
const {diskStorage} =require("./multer");

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Untuk parsing request body ke JSON

// Register Route
app.post('/register',  multer({ storage: diskStorage }).single("img"), (req, res) => {
    const { name, password, role, no_whatsapp, foto_profile } = req.body;
    const fileName = path.basename(req.file.path);
    // Hash password menggunakan bcrypt
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error hashing password');
        }

        // Query untuk memasukkan user ke database dengan password yang sudah di-hash
        const query = 'INSERT INTO user (name, password, role, no_whatsapp, foto_profile) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [name, hashedPassword, role, no_whatsapp, fileName], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error creating user');
            }
            res.status(201).send('User registered successfully');
            
        });
    });
});
    

// Login Route
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    // Query untuk mencari user berdasarkan nama
    const query = 'SELECT * FROM user WHERE name = ?';
    db.query(query, [name], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error logging in');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        // Membandingkan password yang dimasukkan dengan yang ada di database
        const user = results[0]; // Ambil user pertama (karena nama harus unik)
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error comparing password');
            }

            if (isMatch) {
                const accessToken = jwt.sign({name}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
                res.status(200).json({token:accessToken});
            } else {
                res.status(401).send('Incorrect password');
            }
        });
    });
});
// Get user by id (route baru)
app.get('/user/:id', (req, res) => {
    const userId = req.params.id; // Mengambil id dari URL

    // Query untuk mengambil user berdasarkan id
    const query = 'SELECT * FROM user WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching user');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).json(results[0]); // Mengembalikan data user yang ditemukan
    });
});

// Update user (hash password jika ada perubahan password)
app.put('/user/:id', (req, res) => {
    const { name, password, role } = req.body;
    const userId = req.params.id;

    // Jika ada password, hash password sebelum update
    let hashedPassword = password;

    if (password) {
        hashedPassword = bcrypt.hashSync(password, 10); // Hanya hash password jika ada perubahan
    }

    // Gunakan query untuk update tanpa mengganti ID
    const query = 'UPDATE user SET name = ?, password = ?, role = ? WHERE id = ?';
    db.query(query, [name, hashedPassword, role, userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating user');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found');
        }

        res.status(200).send('User updated');
    });
});

// Delete user
app.delete('/user/:id', (req, res) => {
    const query = 'DELETE FROM user WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting user');
        }
        res.status(200).send('User deleted');
    });
});

// API untuk tabel 'room_chat'
app.post('/room_chat', (req, res) => {
    const { tanggal, status } = req.body;
    const query = 'INSERT INTO roomchat (tanggal, status) VALUES (?, ?)';
    db.query(query, [tanggal, status], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error creating room_chat');
        }
        res.status(201).send('Room_chat created');
    });
});

// GET untuk mengambil room_chat berdasarkan ID
app.get('/room_chat/:id', (req, res) => {
    const query = 'SELECT * FROM roomchat WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching room_chat by ID');
        }
        if (results.length === 0) {
            return res.status(404).send('Room_chat not found');
        }
        res.status(200).json(results[0]); // Mengembalikan data room_chat berdasarkan ID
    });
});


app.put('/room_chat/:id', (req, res) => {
    const { tanggal, status } = req.body;
    const query = 'UPDATE roomchat SET tanggal = ?, status = ? WHERE id = ?';
    db.query(query, [tanggal, status, req.params.id], (err, result) => {
        if (err) {
            console.log(err);  // Log untuk error
            return res.status(500).send('Error updating room_chat');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Room_chat not found');
        }
        res.status(200).send('Room_chat updated');
    });
});

app.delete('/room_chat/:id', (req, res) => {
    const query = 'DELETE FROM roomchat WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.log(err);  // Log untuk error
            return res.status(500).send('Error deleting room_chat');
        }
        if (result.affectedRows === 0) {
            return res.status(404).send('Room_chat not found');
        }
        res.status(200).send('Room_chat deleted');
    });
});


// API untuk tabel 'pesan'
app.post('/pesan', (req, res) => {
    const { isi_pesan, tanggal_pesan, pesan_dari, room_chat_id } = req.body;
    const query = 'INSERT INTO pesan (isi_pesan, tanggal_pesan, pesan_dari, room_chat_id) VALUES (?, ?, ?, ?)';
    db.query(query, [isi_pesan, tanggal_pesan, pesan_dari, room_chat_id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error creating pesan');
        }
        res.status(201).send('Pesan created');
    });
});

// GET untuk mengambil pesan berdasarkan ID
app.get('/pesan/:id', (req, res) => {
    const query = 'SELECT * FROM pesan WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching pesan by ID');
        }
        if (results.length === 0) {
            return res.status(404).send('Pesan not found');
        }
        res.status(200).json(results[0]); // Mengembalikan data pesan berdasarkan ID
    });
});

app.put('/pesan/:id', (req, res) => {
    const { isi_pesan, tanggal_pesan, pesan_dari, room_chat_id } = req.body;
    const query = 'UPDATE pesan SET isi_pesan = ?, tanggal_pesan = ?, pesan_dari = ?, room_chat_id = ? WHERE id = ?';
    db.query(query, [isi_pesan, tanggal_pesan, pesan_dari, room_chat_id, req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating pesan');
        }
        res.status(200).send('Pesan updated');
    });
});

app.delete('/pesan/:id', (req, res) => {
    const query = 'DELETE FROM pesan WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting pesan');
        }
        res.status(200).send('Pesan deleted');
    });
});

// API untuk tabel 'peta'
app.post('/peta', (req, res) => {
    const { lokasi_cctv, koordinat } = req.body;
    // Pastikan kolom tanggal ada dan bertipe DATETIME atau TIMESTAMP
    const query = 'INSERT INTO peta (lokasi_cctv, koordinat) VALUES (?, ?)';
    db.query(query, [lokasi_cctv, koordinat], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error creating peta');
        }
        res.status(201).send('Peta created');
    });
});

// GET untuk mengambil peta berdasarkan ID
app.get('/peta/:id', (req, res) => {
    const query = 'SELECT * FROM peta WHERE id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching peta by ID');
        }
        if (results.length === 0) {
            return res.status(404).send('Peta not found');
        }
        res.status(200).json(results[0]); // Mengembalikan data peta berdasarkan ID
    });
});

// PUT untuk update data peta berdasarkan ID
app.put('/peta/:id', (req, res) => {
    const { lokasi_cctv, koordinat } = req.body;
    const query = 'UPDATE peta SET lokasi_cctv = ?, koordinat = ? WHERE id = ?';
    db.query(query, [lokasi_cctv, koordinat, req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating peta');
        }
        res.status(200).send('Peta updated');
    });
});

// DELETE untuk menghapus peta berdasarkan ID
app.delete('/peta/:id', (req, res) => {
    const query = 'DELETE FROM peta WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting peta');
        }
        res.status(200).send('Peta deleted');
    });
});

// API untuk tabel 'history'
app.post('/history', (req, res) => {
    const { lokasi, nama_perilaku, level_peringatan, bukti, tanggal } = req.body;
    const query = 'INSERT INTO history (lokasi, nama_perilaku, level_peringatan, bukti, tanggal) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [lokasi, nama_perilaku, level_peringatan, bukti, tanggal], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error creating history');
        }
        res.status(201).send('History created');
    });
});

app.get('/history', (req, res) => {
    db.query('SELECT * FROM history', (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error fetching history');
        }
        res.status(200).json(results);
    });
});

app.put('/history/:id', (req, res) => {
    const { lokasi, nama_perilaku, level_peringatan, bukti, tanggal } = req.body;
    const query = 'UPDATE history SET lokasi = ?, nama_perilaku = ?, level_peringatan = ?, bukti = ?, tanggal = ? WHERE id = ?';
    db.query(query, [lokasi, nama_perilaku, level_peringatan, bukti, tanggal, req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error updating history');
        }
        res.status(200).send('History updated');
    });
});

app.delete('/history/:id', (req, res) => {
    const query = 'DELETE FROM history WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error deleting history');
        }
        res.status(200).send('History deleted');
    });
});

// Menjalankan server pada port 3000
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
