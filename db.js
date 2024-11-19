const { Sequelize, DataTypes } = require('sequelize');

// Konfigurasi koneksi ke MySQL
const sequelize = new Sequelize('praktik_be', 'root', '', {
  host: 'localhost',
  port: '3306', // atau alamat server MySQL Anda
  dialect: 'mysql',
});

// Definisi Model
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'psikolog', 'tim medis', 'tim keamanan'), allowNull: false },
});

const RoomChat = sequelize.define('RoomChat', {
  tanggal: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('menunggu', 'dilayani', 'selesai'), allowNull: false },
});

const Pesan = sequelize.define('Pesan', {
  isi_pesan: { type: DataTypes.STRING, allowNull: false },
  tanggal_pesan: { type: DataTypes.DATE, allowNull: false },
  pesan_dari: { type: DataTypes.STRING, allowNull: false },
  room_chat_id: { type: DataTypes.INTEGER, allowNull: false },
});

const Peta = sequelize.define('Peta', {
  lokasi_cctv: { type: DataTypes.STRING, allowNull: false },
  koordinat: { type: DataTypes.STRING, allowNull: false },
});

const History = sequelize.define('History', {
  lokasi: { type: DataTypes.STRING, allowNull: false },
  nama_perilaku: {
    type: DataTypes.ENUM(
      'mencoba meloncat',
      'mondar mandir',
      'berhenti lama',
      'gerakan tubuh tidak stabil',
      'mengangkat kaki ke pagar',
      'menatap ke bawah'
    ),
    allowNull: false,
  },
  level_peringatan: { type: DataTypes.ENUM('merah', 'kuning', 'hijau'), allowNull: false },
  bukti: { type: DataTypes.STRING, allowNull: true },
  tanggal: { type: DataTypes.DATE, allowNull: false },
});

// Ekspor modul
module.exports = {
  sequelize,
  User,
  RoomChat,
  Pesan,
  Peta,
  History,
};
