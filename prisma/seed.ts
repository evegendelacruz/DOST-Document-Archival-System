import { PrismaClient, SetupStatus, MapProgram } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ─── 1. Users ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@dost.gov.ph' },
    update: {},
    create: {
      email: 'admin@dost.gov.ph',
      passwordHash,
      fullName: 'DOST Admin',
      role: 'ADMIN',
    },
  });
  console.log('  Users seeded');

  // ─── 2. SETUP Projects ──────────────────────────────────────────
  const setupStatuses: SetupStatus[] = [
    'PROPOSAL', 'PROPOSAL', 'APPROVED', 'ONGOING',
    'WITHDRAWN', 'TERMINATED', 'EVALUATED', 'PROPOSAL',
  ];

  const firmSizes = ['Small', 'Small', 'Small', 'Medium', 'Small', 'Small', 'Large', 'Small'];

  await prisma.setupProject.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      code: String(i + 1).padStart(3, '0'),
      title: 'Acquisition of Equipment for the Mass Production',
      firm: 'Best Friend Goodies',
      typeOfFirm: 'Agri-processing',
      address: 'Purok 4, Dansolihon, Cagayan de Oro City',
      corporatorName: 'Sergio Maria Lucia Sanico',
      contactNumbers: ['09123456789'],
      emails: ['sample@gmail.com'],
      status: setupStatuses[i],
      prioritySector: 'Food Processing',
      firmSize: firmSizes[i],
      assignee: 'Jane Doe',
    })),
    skipDuplicates: true,
  });
  console.log('  SETUP projects seeded');

  // ─── 3. CEST Projects ───────────────────────────────────────────
  const cestFunding = ['CEST', 'LIRA', 'SWEP', 'CEST', 'LIRA', 'SWEP', 'CEST', 'Other'];

  for (let i = 0; i < 8; i++) {
    const code = String(i + 1).padStart(3, '0');
    await prisma.cestProject.upsert({
      where: { code },
      update: {},
      create: {
        code,
        projectTitle: 'Acquisition of Equipment for the Mass Production',
        location: 'Cagayan de Oro City',
        beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
        programFunding: cestFunding[i],
        status: 'Approved',
        approvedAmount: 200000,
        releasedAmount: 150000,
        projectDuration: '12 months',
        staffAssigned: 'Jane Doe',
        year: '2025',
        dateOfApproval: '01-15-2025',
      },
    });
  }
  console.log('  CEST projects seeded');

  // ─── 4. Map Pins ─────────────────────────────────────────────────
  // Clear existing pins to avoid duplicates on re-seed
  await prisma.mapPin.deleteMany();

  const pinData: { lat: number; lng: number; label: string; district: number; program: MapProgram }[] = [
    // SETUP pins (20)
    { lat: 8.4756, lng: 124.6422, label: 'Cagayan de Oro City', district: 0, program: 'SETUP' },
    { lat: 8.4470, lng: 124.5363, label: 'Opol', district: 2, program: 'SETUP' },
    { lat: 8.5597, lng: 124.5271, label: 'El Salvador', district: 2, program: 'SETUP' },
    { lat: 8.5705, lng: 124.4712, label: 'Alubijid', district: 2, program: 'SETUP' },
    { lat: 8.5747, lng: 124.4409, label: 'Laguindingan', district: 2, program: 'SETUP' },
    { lat: 8.5944, lng: 124.4058, label: 'Gitagum', district: 2, program: 'SETUP' },
    { lat: 8.5627, lng: 124.3523, label: 'Libertad', district: 2, program: 'SETUP' },
    { lat: 8.4975, lng: 124.3056, label: 'Initao', district: 2, program: 'SETUP' },
    { lat: 8.4033, lng: 124.2888, label: 'Manticao', district: 2, program: 'SETUP' },
    { lat: 8.3432, lng: 124.2598, label: 'Lugait', district: 2, program: 'SETUP' },
    { lat: 8.5387, lng: 124.7544, label: 'Tagoloan', district: 2, program: 'SETUP' },
    { lat: 8.5837, lng: 124.7699, label: 'Villanueva', district: 2, program: 'SETUP' },
    { lat: 8.6504, lng: 124.7547, label: 'Jasaan', district: 2, program: 'SETUP' },
    { lat: 8.7429, lng: 124.7756, label: 'Balingasag', district: 1, program: 'SETUP' },
    { lat: 8.8059, lng: 124.7877, label: 'Lagonglong', district: 1, program: 'SETUP' },
    { lat: 8.8589, lng: 124.7868, label: 'Salay', district: 1, program: 'SETUP' },
    { lat: 8.9211, lng: 124.7850, label: 'Binuangan', district: 1, program: 'SETUP' },
    { lat: 8.9563, lng: 124.7881, label: 'Sugbongcogon', district: 1, program: 'SETUP' },
    { lat: 8.9840, lng: 124.7911, label: 'Kinoguitan', district: 1, program: 'SETUP' },
    { lat: 8.6119, lng: 124.8934, label: 'Claveria', district: 2, program: 'SETUP' },
    // CEST pins (15)
    { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 0, program: 'CEST' },
    { lat: 8.5039, lng: 124.6162, label: 'CDO - Bulua', district: 0, program: 'CEST' },
    { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Centro', district: 2, program: 'CEST' },
    { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.4336, lng: 124.2910, label: 'Naawan', district: 2, program: 'CEST' },
    { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Centro', district: 2, program: 'CEST' },
    { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2, program: 'CEST' },
    { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1, program: 'CEST' },
    { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1, program: 'CEST' },
    { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1, program: 'CEST' },
    { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2, program: 'CEST' },
    // SSCP pins (15)
    { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 0, program: 'SSCP' },
    { lat: 8.4992, lng: 124.6391, label: 'CDO - Kauswagan', district: 0, program: 'SSCP' },
    { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 0, program: 'SSCP' },
    { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.5749, lng: 124.4439, label: 'Laguindingan - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.5950, lng: 124.4078, label: 'Gitagum - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.3432, lng: 124.2598, label: 'Lugait - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2, program: 'SSCP' },
    { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1, program: 'SSCP' },
    { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1, program: 'SSCP' },
    { lat: 8.9194, lng: 124.7846, label: 'Binuangan - Poblacion', district: 1, program: 'SSCP' },
    { lat: 8.9561, lng: 124.7879, label: 'Sugbongcogon - Poblacion', district: 1, program: 'SSCP' },
    { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1, program: 'SSCP' },
    // LGIA pins (15)
    { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 0, program: 'LGIA' },
    { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 0, program: 'LGIA' },
    { lat: 8.4964, lng: 124.6051, label: 'CDO - Iponan', district: 0, program: 'LGIA' },
    { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.4033, lng: 124.2888, label: 'Manticao - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1, program: 'LGIA' },
    { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1, program: 'LGIA' },
    { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1, program: 'LGIA' },
    { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2, program: 'LGIA' },
    { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1, program: 'LGIA' },
  ];

  await prisma.mapPin.createMany({ data: pinData });
  console.log('  Map pins seeded (65 total)');

  // ─── 5. Archival Records ─────────────────────────────────────────
  await prisma.archivalRecord.deleteMany();

  const archivalRecords = Array.from({ length: 5 }, () => ({
    userName: 'Jane Doe',
    title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology',
    company: 'Best Friend Goodies',
    contact: 'Ms. Nenita M. Tan',
    year: '2025',
  }));

  await prisma.archivalRecord.createMany({ data: archivalRecords });
  console.log('  Archival records seeded');

  // ─── 6. Address Hierarchy ────────────────────────────────────────
  const addressData: Record<string, Record<string, string[]>> = {
    'Misamis Oriental': {
      'Cagayan de Oro City': [
        'Agusan', 'Balulang', 'Bayabas', 'Bayanga', 'Besigan', 'Bonbon', 'Bugo', 'Bulua',
        'Camaman-an', 'Canitoan', 'Carmen', 'Consolacion', 'Cugman', 'Dansolihon', 'F.S. Catanico',
        'Gusa', 'Iponan', 'Kauswagan', 'Lapasan', 'Macabalan', 'Macasandig', 'Mambuaya',
        'Nazareth', 'Pagalungan', 'Pagatpat', 'Patag', 'Puerto', 'Puntod', 'San Simon',
        'Tablon', 'Tagpangi', 'Taglimao', 'Tignapoloan', 'Tuburan', 'Tumpagon',
      ],
      'Opol': ['Awang', 'Bagocboc', 'Barra', 'Bonbon', 'Cauyonan', 'Igpit', 'Luyong Bonbon', 'Poblacion', 'Taboc'],
      'El Salvador': ['Amoros', 'Bolisong', 'Cogon', 'Hinigdaan', 'Kibonbon', 'Molugan', 'Poblacion', 'Sinaloc', 'Taytay'],
      'Alubijid': ['Baybay', 'Benigwayan', 'Calatcat', 'Lanao', 'Larapan', 'Libertad', 'Mandahican', 'Poblacion', 'Samay', 'Sungay'],
      'Laguindingan': ['Aromahon', 'Gasi', 'Kibaghot', 'Moog', 'Poblacion', 'Sinai', 'Tubajon'],
      'Gitagum': ['Burnay', 'Cogon', 'Manaka', 'Matangad', 'Pangayawan', 'Poblacion', 'Tala-o'],
      'Libertad': ['Ane-i', 'Caluya', 'Coracon', 'Gimangpang', 'Kimalok', 'Poblacion', 'San Juan', 'Solana'],
      'Initao': ['Aloe', 'Gimangpang', 'Jampason', 'Kamelon', 'Poblacion', 'San Pedro', 'Tawantawan', 'Tubigan'],
      'Naawan': ['Don Pedro', 'Linangkayan', 'Lubilan', 'Mapulog', 'Maputi', 'Poblacion', 'Tagbalogo'],
      'Manticao': ['Argayoso', 'Camanga', 'Kauswagan', 'Pagawan', 'Poblacion', 'Punta Silum', 'Tuod'],
      'Lugait': ['Aya-aya', 'Betahon', 'Biga', 'Lower Talacogon', 'Poblacion', 'Upper Talacogon'],
      'Tagoloan': ['Balubal', 'Casinglot', 'Gracia', 'Mohon', 'Nangcaon', 'Natumolan', 'Poblacion', 'Tagoloan Poblacion', 'Villanueva'],
      'Villanueva': ['Balacanas', 'Imelda', 'Katipunan', 'Looc', 'Poblacion', 'San Martin', 'Tambobong'],
      'Jasaan': ['Aplaya', 'Bobuntugan', 'Corrales', 'Danao', 'Jampason', 'Kimaya', 'Lower Jasaan', 'Poblacion', 'San Isidro', 'Upper Jasaan'],
      'Balingasag': ['Baliwagan', 'Cogon', 'Dasigon', 'Linugos', 'Mambayaan', 'Poblacion', 'San Juan', 'Talusan'],
      'Lagonglong': ['Banglay', 'Gaston', 'Kabulawan', 'Poblacion', 'Tabok', 'Umagos'],
      'Salay': ['Alipuaton', 'Bunal', 'Casulog', 'Dasigon', 'Looc', 'Matampa', 'Poblacion', 'Rizal'],
      'Binuangan': ['Dampias', 'Kitamban', 'Mabini', 'Poblacion', 'Silo-o', 'Sto. Rosario'],
      'Sugbongcogon': ['Alicomohan', 'Kaulayanan', 'Kinoguitan', 'Poblacion', 'San Jose'],
      'Kinoguitan': ['Baliangao', 'Caluya', 'Esperanza', 'Poblacion', 'Sanghan', 'Sugbongcogon'],
      'Claveria': ['Ane-i', 'Aposkahoy', 'Hinaplanan', 'Lanise', 'Luna', 'Minalwang', 'Poblacion', 'Rizal', 'San Vicente'],
      'Medina': ['Banglay', 'Cabug', 'Duka', 'Gingoog', 'Poblacion', 'San Roque'],
      'Talisayan': ['Camuayan', 'Casibole', 'Katipunan', 'Poblacion', 'San Isidro', 'Sindangan'],
      'Magsaysay': ['Candiis', 'Damayuhan', 'Kakuigan', 'Poblacion', 'San Isidro'],
      'Balingoan': ['Baukbauk', 'Dolores', 'Hambabauyon', 'Poblacion', 'Waterfalls'],
    },
    'Bukidnon': {
      'Malaybalay City': ['Aglayan', 'Bangcud', 'Busdi', 'Casisang', 'Dalwangan', 'Imbayao', 'Laguitas', 'Patpat', 'Poblacion', 'San Jose', 'Sumpong'],
      'Valencia City': ['Bagontaas', 'Batangan', 'Catumbalon', 'Colonia', 'Lumbayao', 'Mailag', 'Poblacion', 'San Carlos', 'Tongantongan'],
      'Manolo Fortich': ['Alae', 'Dahilayan', 'Dalirig', 'Kulaman', 'Linabo', 'Poblacion', 'Tankulan'],
      'Sumilao': ['Kisolon', 'Licoan', 'Poblacion', 'San Roque', 'Vista Villa'],
    },
    'Lanao del Norte': {
      'Iligan City': ['Buruun', 'Dalipuga', 'Del Carmen', 'Hinaplanon', 'Kiwalan', 'Mahayahay', 'Maria Cristina', 'Pala-o', 'Poblacion', 'Santiago', 'Suarez', 'Tambacan', 'Tibanga', 'Tubod', 'Villaverde'],
      'Kapatagan': ['Balonging', 'Daan Lanao', 'Mabatao', 'Maranding', 'Nangka', 'Poblacion', 'Taguitic'],
      'Tubod': ['Baroy', 'Lala', 'Maigo', 'Poblacion'],
    },
    'Camiguin': {
      'Mambajao': ['Agoho', 'Baylao', 'Benoni', 'Bug-ong', 'Kuguita', 'Poblacion', 'Tupsan', 'Yumbing'],
      'Catarman': ['Benoni', 'Bonbon', 'Hubangon', 'Mainit', 'Poblacion'],
      'Sagay': ['Alangilan', 'Bonbon', 'Maac', 'Poblacion'],
      'Guinsiliban': ['Butay', 'Cantaan', 'Liong', 'Poblacion'],
    },
  };

  // Clear existing address data to avoid duplicates on re-seed
  await prisma.barangay.deleteMany();
  await prisma.municipality.deleteMany();
  await prisma.province.deleteMany();

  for (const [provinceName, municipalities] of Object.entries(addressData)) {
    const province = await prisma.province.create({
      data: { name: provinceName },
    });

    for (const [municipalityName, barangays] of Object.entries(municipalities)) {
      const municipality = await prisma.municipality.create({
        data: {
          name: municipalityName,
          provinceId: province.id,
        },
      });

      await prisma.barangay.createMany({
        data: barangays.map(name => ({
          name,
          municipalityId: municipality.id,
        })),
      });
    }
  }
  console.log('  Address hierarchy seeded (4 provinces, ~36 municipalities, ~280 barangays)');

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
