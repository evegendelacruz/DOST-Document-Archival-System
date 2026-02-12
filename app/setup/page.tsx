'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';
import 'leaflet/dist/leaflet.css';

// Cascading address data: Province → Municipality → Barangays
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

const filterTabs = [
  { id: 'PROPOSAL', label: 'Proposal', color: '#1565c0' },
  { id: 'APPROVED', label: 'Approved', color: '#2e7d32' },
  { id: 'ONGOING', label: 'Ongoing', color: '#f57f17' },
  { id: 'WITHDRAWN', label: 'Withdrawal', color: '#c62828' },
  { id: 'TERMINATED', label: 'Terminated', color: '#ad1457' },
  { id: 'GRADUATED', label: 'Graduated', color: '#00695c' },
];

interface Project {
  id: string;
  code: string;
  title: string;
  firm: string | null;
  typeOfFirm: string | null;
  address: string | null;
  coordinates: string | null;
  corporatorName: string | null;
  contactNumbers: string[];
  emails: string[];
  status: string;
  prioritySector: string | null;
  firmSize: string | null;
  fund: string | null;
  typeOfFund: string | null;
  assignee: string | null;
  companyLogoUrl: string | null;
}

const statusDisplay: Record<string, string> = {
  PROPOSAL: 'Proposal',
  APPROVED: 'Approved',
  ONGOING: 'Ongoing',
  WITHDRAWN: 'Withdrawal',
  TERMINATED: 'Terminated',
  GRADUATED: 'Graduated',
  EVALUATED: 'Evaluated',
};

const statusColors: Record<string, string> = {
  PROPOSAL: 'bg-[#e3f2fd] text-[#1565c0]',
  APPROVED: 'bg-[#e8f5e9] text-[#2e7d32]',
  ONGOING: 'bg-[#fff8e1] text-[#f57f17]',
  WITHDRAWN: 'bg-[#ffebee] text-[#c62828]',
  TERMINATED: 'bg-[#fce4ec] text-[#ad1457]',
  GRADUATED: 'bg-[#e0f2f1] text-[#00695c]',
  EVALUATED: 'bg-[#e3f2fd] text-[#1565c0]',
};

const modalInputCls = "w-full py-2 px-3 border border-[#d0d0d0] rounded-lg text-[13px] font-[inherit] text-[#333] bg-white transition-all duration-200 placeholder:text-[#aaa] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";
const modalSelectCls = `${modalInputCls} modal-select`;

export default function SetupPage() {
  const [activeFilter, setActiveFilter] = useState('PROPOSAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [emails, setEmails] = useState(['']);
  const [contactNumbers, setContactNumbers] = useState(['']);
  const [formData, setFormData] = useState({
    projectTitle: '', fund: '', typeOfFund: '', firmSize: '',
    province: '', municipality: '', barangay: '', coordinates: '',
    firmName: '', firmType: '', cooperatorName: '',
    projectStatus: '', prioritySector: '', companyLogo: null as File | null,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/setup-projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch {
      console.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // Filter projects by active tab and search query
  const filteredProjects = projects
    .filter(p => p.status === activeFilter)
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        (p.firm?.toLowerCase().includes(q)) ||
        p.code.toLowerCase().includes(q)
      );
    });

  // Compute counts per status from all projects
  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'province') { updated.municipality = ''; updated.barangay = ''; }
      if (field === 'municipality') { updated.barangay = ''; }
      return updated;
    });
    if (formErrors[field]) {
      setFormErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const municipalities = formData.province && addressData[formData.province] ? Object.keys(addressData[formData.province]) : [];
  const barangays = formData.province && formData.municipality && addressData[formData.province]?.[formData.municipality] ? addressData[formData.province][formData.municipality] : [];

  const handleEmailChange = (index: number, value: string) => { const updated = [...emails]; updated[index] = value; setEmails(updated); if (formErrors.emails) setFormErrors(prev => { const next = { ...prev }; delete next.emails; return next; }); };
  const addEmail = () => { setEmails(prev => [...prev, '']); };
  const removeEmail = (index: number) => { setEmails(prev => prev.filter((_, i) => i !== index)); };
  const handleContactChange = (index: number, value: string) => { const cleaned = value.replace(/\D/g, '').slice(0, 11); const updated = [...contactNumbers]; updated[index] = cleaned; setContactNumbers(updated); if (formErrors.contactNumbers) setFormErrors(prev => { const next = { ...prev }; delete next.contactNumbers; return next; }); };
  const isContactValid = (num: string) => num.length === 11 && num.startsWith('09');
  const addContact = () => { setContactNumbers(prev => [...prev, '']); };
  const removeContact = (index: number) => { setContactNumbers(prev => prev.filter((_, i) => i !== index)); };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, companyLogo: e.target.files![0] }));
    }
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};

    if (!formData.projectTitle.trim()) errors.projectTitle = 'Project title is required';
    if (!formData.fund.trim()) errors.fund = 'Fund is required';
    if (!formData.typeOfFund) errors.typeOfFund = 'Type of fund is required';
    if (!formData.firmSize) errors.firmSize = 'Firm size is required';
    if (!formData.province) errors.province = 'Province is required';
    if (!formData.municipality) errors.municipality = 'Municipality is required';
    if (!formData.barangay) errors.barangay = 'Barangay is required';
    if (!formData.cooperatorName.trim()) errors.cooperatorName = 'Cooperator\'s name is required';
    if (!formData.projectStatus) errors.projectStatus = 'Project status is required';
    if (!formData.prioritySector) errors.prioritySector = 'Priority sector is required';

    if (!contactNumbers.some(c => c.trim())) {
      errors.contactNumbers = 'At least one contact number is required';
    } else if (contactNumbers.some(c => c.trim() && !isContactValid(c))) {
      errors.contactNumbers = 'All contact numbers must be 11 digits starting with 09';
    }
    if (!emails.some(e => e.trim())) {
      errors.emails = 'At least one email is required';
    } else if (emails.some(e => e.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()))) {
      errors.emails = 'Please enter valid email addresses';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaveError('');
    setSaving(true);

    try {
      const res = await fetch('/api/setup-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.projectTitle,
          fund: formData.fund,
          typeOfFund: formData.typeOfFund,
          firmSize: formData.firmSize,
          address: `${formData.barangay}, ${formData.municipality}, ${formData.province}`,
          coordinates: formData.coordinates || null,
          firm: formData.firmName || null,
          typeOfFirm: formData.firmType || null,
          corporatorName: formData.cooperatorName,
          contactNumbers: contactNumbers.filter(c => c.trim()),
          emails: emails.filter(e => e.trim()),
          status: formData.projectStatus,
          prioritySector: formData.prioritySector,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save project');
      }

      setShowAddModal(false);
      setFormData({ projectTitle: '', fund: '', typeOfFund: '', firmSize: '', province: '', municipality: '', barangay: '', coordinates: '', firmName: '', firmType: '', cooperatorName: '', projectStatus: '', prioritySector: '', companyLogo: null });
      setEmails(['']); setContactNumbers(['']);
      await fetchProjects();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status: string) => statusColors[status] || statusColors.PROPOSAL;

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-5 px-[30px] bg-[#f5f5f5] overflow-x-auto">
        {/* SETUP Header */}
        <div className="flex justify-between items-center bg-white py-[15px] px-[25px] rounded-[15px] mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] gap-[30px]">
          <div className="flex items-center gap-[15px]">
            <div className="w-[50px] h-[50px] flex items-center justify-center">
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="23" stroke="#146184" strokeWidth="3" fill="none"/>
                <circle cx="25" cy="25" r="15" stroke="#00AEEF" strokeWidth="3" fill="none"/>
                <circle cx="25" cy="25" r="7" fill="#F5A623"/>
                <path d="M25 2 L25 10" stroke="#146184" strokeWidth="3"/>
                <path d="M25 40 L25 48" stroke="#146184" strokeWidth="3"/>
                <path d="M2 25 L10 25" stroke="#146184" strokeWidth="3"/>
                <path d="M40 25 L48 25" stroke="#146184" strokeWidth="3"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[28px] font-bold text-primary m-0 leading-none">SETUP 4.0</h1>
              <p className="text-[10px] text-[#666] m-0 leading-[1.3]">Small Enterprise Technology<br/>Upgrading Program</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-[600px] h-[50px]">
              <Icon icon="mdi:magnify" className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] w-5 h-5" width={20} height={20} />
              <input type="text" className="w-full h-full pl-[50px] pr-[25px] border border-[#e0e0e0] rounded-[25px] text-[15px] bg-[#f5f5f5] transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_2px_8px_rgba(20,97,132,0.1)] placeholder:text-[#999]" placeholder="Search here" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover" onClick={() => { setShowAddModal(true); setFormErrors({}); }}>
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterTabs.map(tab => (
            <button key={tab.id} className={`flex-1 flex flex-col items-center justify-center py-5 px-[15px] border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${activeFilter === tab.id ? 'bg-primary' : 'bg-white hover:bg-[#f0f8ff] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'}`} onClick={() => setActiveFilter(tab.id)}>
              <div className="inline-flex items-center gap-[5px] mb-2">
                <span className={`text-[13px] font-medium leading-none ${activeFilter === tab.id ? 'text-white' : 'text-[#666]'}`}>{tab.label}</span>
                <span className="w-1.5 h-1.5 rounded-full inline-block align-middle" style={{ backgroundColor: tab.color }}></span>
              </div>
              <span className={`text-[32px] font-bold ${activeFilter === tab.id ? 'text-white' : 'text-primary'}`}>{statusCounts[tab.id] || 0}</span>
            </button>
          ))}
        </div>

        {/* Masterlist Section */}
        <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-[15px] border-b border-[#e0e0e0]">
            <h2 className="text-lg font-bold text-primary m-0">MASTERLIST</h2>
            <div className="flex gap-2.5">
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-white border border-[#d0d0d0] rounded-lg text-[13px] text-[#333] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary">
                <Icon icon="mdi:sort" width={16} height={16} /> Sort
              </button>
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-white border border-[#d0d0d0] rounded-lg text-[13px] text-[#333] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary">
                <Icon icon="mdi:filter-variant" width={16} height={16} /> Filter
              </button>
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-[#dc3545] text-white border border-[#dc3545] rounded-lg text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#c82333]">
                <Icon icon="mdi:file-pdf-box" width={16} height={16} /> Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-9 min-w-[36px] text-center py-3 px-2.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">
                    <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0} onChange={(e) => setSelectedProjects(e.target.checked ? filteredProjects.map(p => p.id) : [])} />
                  </th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Code</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Project Title</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Firm</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Type of Firm</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Address</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Corporator&apos;s Name</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Contact No.</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Email</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Status</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Priority Sector</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Firm Size</th>
                  <th className="py-3 px-2.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={13} className="py-8 text-center text-[#999] text-sm">Loading projects...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={13} className="py-8 text-center text-[#999] text-sm">No projects found</td></tr>
                ) : filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-[#f9f9f9]">
                    <td className="w-9 min-w-[36px] text-center py-3 px-2.5 text-left border-b border-[#e0e0e0]">
                      <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.includes(project.id)} onChange={(e) => setSelectedProjects(prev => e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id))} />
                    </td>
                    <td className="text-primary font-semibold whitespace-nowrap py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.code}</td>
                    <td className="max-w-[250px] text-[#333] font-medium whitespace-normal break-words py-3 px-2.5 text-left border-b border-[#e0e0e0]"><Link href={`/setup/${project.id}`} className="text-primary no-underline font-medium hover:text-accent hover:underline">{project.title}</Link></td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.firm}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.typeOfFirm && <span className="inline-block py-1 px-2.5 bg-[#fff3cd] text-[#856404] rounded-[15px] text-[11px] font-medium">{project.typeOfFirm}</span>}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.address}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.corporatorName}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.contactNumbers.join(', ')}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.emails.join(', ')}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]"><span className={`inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium ${getStatusClass(project.status)}`}>{statusDisplay[project.status] || project.status}</span></td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.prioritySector}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.firmSize}</td>
                    <td className="py-3 px-2.5 text-left border-b border-[#e0e0e0]">{project.assignee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add New Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowAddModal(false)}>
          <div className="add-project-modal bg-white rounded-[20px] py-[25px] px-[35px] w-full max-w-[680px] max-h-[85vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => setShowAddModal(false)}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-[3px]">Add New Project</h2>
            <p className="text-xs text-[#888] m-0 mb-[15px]">Complete the form to register a new project</p>

            <div className="flex flex-col gap-3">
              {/* Project Title */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Project Title<span className="text-[#dc3545] ml-0.5">*</span></label>
                <input type="text" placeholder="Enter project title" value={formData.projectTitle} onChange={(e) => handleFormChange('projectTitle', e.target.value)} className={`${modalInputCls} ${formErrors.projectTitle ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                {formErrors.projectTitle && <span className="text-[#dc3545] text-[11px]">{formErrors.projectTitle}</span>}
              </div>

              {/* Fund Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Fund<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <input type="text" placeholder="Enter fund" value={formData.fund} onChange={(e) => handleFormChange('fund', e.target.value)} className={`${modalInputCls} ${formErrors.fund ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                  {formErrors.fund && <span className="text-[#dc3545] text-[11px]">{formErrors.fund}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Type of Fund<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.typeOfFund} onChange={(e) => handleFormChange('typeOfFund', e.target.value)} className={`${modalSelectCls} ${formErrors.typeOfFund ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Type</option>
                    <option value="GIA">GIA</option>
                    <option value="Loan">Loan</option>
                    <option value="Grant">Grant</option>
                  </select>
                  {formErrors.typeOfFund && <span className="text-[#dc3545] text-[11px]">{formErrors.typeOfFund}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Firm Size<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.firmSize} onChange={(e) => handleFormChange('firmSize', e.target.value)} className={`${modalSelectCls} ${formErrors.firmSize ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Size</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                  {formErrors.firmSize && <span className="text-[#dc3545] text-[11px]">{formErrors.firmSize}</span>}
                </div>
              </div>

              {/* Address Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Province<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.province} onChange={(e) => handleFormChange('province', e.target.value)} className={`${modalSelectCls} ${formErrors.province ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Province</option>
                    {Object.keys(addressData).map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                  </select>
                  {formErrors.province && <span className="text-[#dc3545] text-[11px]">{formErrors.province}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Municipality/City<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.municipality} onChange={(e) => handleFormChange('municipality', e.target.value)} disabled={!formData.province} className={`${modalSelectCls} ${formErrors.municipality ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Municipality</option>
                    {municipalities.map(mun => (<option key={mun} value={mun}>{mun}</option>))}
                  </select>
                  {formErrors.municipality && <span className="text-[#dc3545] text-[11px]">{formErrors.municipality}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Barangay<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.barangay} onChange={(e) => handleFormChange('barangay', e.target.value)} disabled={!formData.municipality} className={`${modalSelectCls} ${formErrors.barangay ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Barangay</option>
                    {barangays.map(brgy => (<option key={brgy} value={brgy}>{brgy}</option>))}
                  </select>
                  {formErrors.barangay && <span className="text-[#dc3545] text-[11px]">{formErrors.barangay}</span>}
                </div>
              </div>

              {/* Coordinates */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Coordinates</label>
                <div className="relative flex items-center">
                  <input type="text" placeholder="e.g. 8.465281,124.623238" value={formData.coordinates} readOnly className={`${modalInputCls} pr-9!`} />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 text-[#999] flex items-center justify-center cursor-pointer transition-colors duration-200 hover:text-accent" onClick={() => setShowMapPicker(true)} title="Pick on Map">
                    <Icon icon="mdi:map-marker-plus-outline" width={20} height={20} />
                  </button>
                </div>
              </div>

              {/* Firm Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Firm Name <span className="text-[#999] font-normal text-xs">(optional)</span></label>
                  <input type="text" placeholder="Enter firm/establishment name" value={formData.firmName} onChange={(e) => handleFormChange('firmName', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Firm/Establishment Type</label>
                  <input type="text" placeholder="Enter firm type/municipality" value={formData.firmType} onChange={(e) => handleFormChange('firmType', e.target.value)} className={modalInputCls} />
                </div>
              </div>

              {/* Cooperator Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Cooperator&apos;s Name<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <input type="text" placeholder="Enter cooperator's name" value={formData.cooperatorName} onChange={(e) => handleFormChange('cooperatorName', e.target.value)} className={`${modalInputCls} ${formErrors.cooperatorName ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                  {formErrors.cooperatorName && <span className="text-[#dc3545] text-[11px]">{formErrors.cooperatorName}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Contact Number<span className="text-[#dc3545] ml-0.5">*</span></label>
                  {contactNumbers.map((num, idx) => (
                    <div key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      <div className="flex items-center gap-1.5">
                        <input type="text" placeholder="e.g. 09123456789" value={num} onChange={(e) => handleContactChange(idx, e.target.value)} className={`${modalInputCls} flex-1 ${num.length > 0 ? (isContactValid(num) ? 'border-green-600! shadow-[0_0_0_2px_rgba(22,163,74,0.1)]!' : 'border-red-600! shadow-[0_0_0_2px_rgba(220,38,38,0.1)]!') : formErrors.contactNumbers ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                        {contactNumbers.length > 1 && (
                          <button type="button" className="w-[22px] h-[22px] min-w-[22px] bg-[#f5f5f5] border border-[#ddd] rounded-full flex items-center justify-center cursor-pointer text-[#c62828] p-0 transition-all duration-200 hover:bg-[#fce4ec] hover:border-[#c62828]" onClick={() => removeContact(idx)}>
                            <Icon icon="mdi:close" width={14} height={14} />
                          </button>
                        )}
                      </div>
                      {num.length > 0 && !isContactValid(num) && <span className="text-red-600 text-[11px] mt-0.5 block">Must be 11 digits starting with 09</span>}
                    </div>
                  ))}
                  {formErrors.contactNumbers && <span className="text-[#dc3545] text-[11px]">{formErrors.contactNumbers}</span>}
                  <button type="button" className="inline-flex items-center gap-1 bg-transparent border-none text-accent text-xs font-semibold cursor-pointer p-0 py-1 mt-1 font-[inherit] hover:text-accent-hover hover:underline" onClick={addContact}>
                    <Icon icon="mdi:plus" width={14} height={14} /> Add More Number
                  </button>
                </div>
              </div>

              {/* Email + Status + Priority Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Email<span className="text-[#dc3545] ml-0.5">*</span></label>
                  {emails.map((email, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 ${idx > 0 ? 'mt-2' : ''}`}>
                      <input type="email" placeholder="Enter email" value={email} onChange={(e) => handleEmailChange(idx, e.target.value)} className={`${modalInputCls} flex-1 ${formErrors.emails ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                      {emails.length > 1 && (
                        <button type="button" className="w-[22px] h-[22px] min-w-[22px] bg-[#f5f5f5] border border-[#ddd] rounded-full flex items-center justify-center cursor-pointer text-[#c62828] p-0 transition-all duration-200 hover:bg-[#fce4ec] hover:border-[#c62828]" onClick={() => removeEmail(idx)}>
                          <Icon icon="mdi:close" width={14} height={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {formErrors.emails && <span className="text-[#dc3545] text-[11px]">{formErrors.emails}</span>}
                  <button type="button" className="inline-flex items-center gap-1 bg-transparent border-none text-accent text-xs font-semibold cursor-pointer p-0 py-1 mt-1 font-[inherit] hover:text-accent-hover hover:underline" onClick={addEmail}>
                    <Icon icon="mdi:plus" width={14} height={14} /> Add More Email
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Project Status<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.projectStatus} onChange={(e) => handleFormChange('projectStatus', e.target.value)} className={`${modalSelectCls} ${formErrors.projectStatus ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Status</option>
                    <option value="PROPOSAL">Proposal</option><option value="APPROVED">Approved</option><option value="ONGOING">Ongoing</option><option value="WITHDRAWN">Withdrawal</option><option value="TERMINATED">Terminated</option><option value="GRADUATED">Graduated</option>
                  </select>
                  {formErrors.projectStatus && <span className="text-[#dc3545] text-[11px]">{formErrors.projectStatus}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Priority Sector<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.prioritySector} onChange={(e) => handleFormChange('prioritySector', e.target.value)} className={`${modalSelectCls} ${formErrors.prioritySector ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Sector</option>
                    <option value="Food Processing">Food Processing</option><option value="Agriculture">Agriculture</option><option value="Aquaculture">Aquaculture</option><option value="Furniture">Furniture</option><option value="Gifts & Housewares">Gifts & Housewares</option>
                  </select>
                  {formErrors.prioritySector && <span className="text-[#dc3545] text-[11px]">{formErrors.prioritySector}</span>}
                </div>
              </div>

              {/* Company Logo */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Company Logo</label>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleLogoChange} id="logo-upload" className="absolute opacity-0 w-0 h-0" />
                  <label htmlFor="logo-upload" className="flex flex-row items-center justify-center gap-2 p-3 border-2 border-dashed border-[#d0d0d0] rounded-[10px] cursor-pointer text-[#999] text-[13px] transition-all duration-200 hover:border-primary hover:text-primary hover:bg-[#f0f8ff]">
                    <Icon icon="mdi:cloud-upload-outline" width={28} height={28} />
                    <span>{formData.companyLogo ? formData.companyLogo.name : 'Click to upload logo'}</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              {saveError && <p className="text-[#dc3545] text-[13px] text-center m-0">{saveError}</p>}
              <div className="flex justify-center mt-0.5">
                <button className="py-2.5 px-[50px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 font-[inherit] hover:bg-accent-hover active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSaveProject} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => setShowMapPicker(false)}>
          <div className="bg-white rounded-2xl w-[700px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4 px-6 border-b border-[#eee]">
              <h3 className="m-0 text-base text-primary font-bold">Pick Location on Map</h3>
              <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => setShowMapPicker(false)}>
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>
            <p className="m-0 py-2 px-6 text-xs text-[#888]">Click on the map to place a pin and auto-generate coordinates</p>
            <div className="flex gap-6 px-6 pb-3 text-[13px] text-[#555]">
              <span>Coordinates: <strong className="text-primary">{formData.coordinates || '—'}</strong></span>
            </div>
            <div className="map-picker-container w-full h-[400px] relative">
              <MapPickerInner
                lat={formData.coordinates ? parseFloat(formData.coordinates.split(',')[0]) : null}
                lng={formData.coordinates ? parseFloat(formData.coordinates.split(',')[1]) : null}
                onPick={(lat, lng) => { setFormData(prev => ({ ...prev, coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}` })); }}
              />
            </div>
            <div className="flex justify-center py-4 px-6 border-t border-[#eee]">
              <button className="bg-accent text-white border-none rounded-[20px] py-2.5 px-10 text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={() => setShowMapPicker(false)}>
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapPickerInner({ lat, lng, onPick }: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comps, setComps] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, leaflet]) => {
      setComps(rl);
      setL(leaflet.default || leaflet);
    });
  }, []);

  if (!comps || !L) {
    return <div className="w-full h-full flex items-center justify-center text-base text-[#666] bg-[#f5f5f5]">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Marker, useMapEvents } = comps;

  const markerIcon = L.divIcon({
    html: `<div style="position:relative;width:30px;height:40px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C7 0 0 7 0 15c0 11 15 25 15 25s15-14 15-25C30 7 23 0 15 0z" fill="#c62828" stroke="#8e0000" stroke-width="1"/>
        <circle cx="15" cy="13" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    className: '',
  });

  function ClickHandler() {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        onPick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer center={[lat || 8.477, lng || 124.646]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={true}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler />
      {lat !== null && lng !== null && (<Marker position={[lat, lng]} icon={markerIcon} />)}
    </MapContainer>
  );
}
