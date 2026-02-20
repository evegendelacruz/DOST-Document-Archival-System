'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import Image from 'next/image';

// Helper to get userId for activity logging
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored)?.id || null;
  } catch {
    return null;
  }
}

// Helper to create headers with userId
function getAuthHeaders(): HeadersInit {
  const userId = getUserId();
  return userId ? { 'x-user-id': userId } : {};
}

interface CestProject {
  id: string;
  code: string;
  projectTitle: string;
  location: string | null;
  beneficiaries: string | null;
  programFunding: string | null;
  status: string | null;
  approvedAmount: number | null;
  releasedAmount: number | null;
  projectDuration: string | null;
  staffAssigned: string | null;
  year: string | null;
  dateOfApproval: string | null;
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—';
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Cascading address data
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

const modalInputCls = "w-full py-2 px-3 border border-[#d0d0d0] rounded-lg text-[13px] font-[inherit] text-[#333] bg-white transition-all duration-200 placeholder:text-[#aaa] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";
const modalSelectCls = `${modalInputCls} modal-select`;
const errCls = "border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!";

export default function CestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<CestProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDate: '',
    province: '',
    municipality: '',
    barangay: '',
    beneficiaries: '',
    typeOfBeneficiary: '',
    partnerLGU: '',
    cooperatorName: '',
    contactNumber: '',
    emailAddress: '',
    programFunding: '',
    status: '',
    approvedAmount: '',
    releasedAmount: '',
    projectDuration: '',
    dateOfRelease: '',
    companyLogo: null as File | null,
  });

  const resetForm = () => {
    setFormData({
      projectTitle: '', projectDate: '', province: '', municipality: '', barangay: '',
      beneficiaries: '', typeOfBeneficiary: '', partnerLGU: '', cooperatorName: '',
      contactNumber: '', emailAddress: '', programFunding: '', status: '',
      approvedAmount: '', releasedAmount: '', projectDuration: '', dateOfRelease: '',
      companyLogo: null,
    });
    setFormErrors({});
    setSaveError('');
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cest-projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch CEST projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const filteredProjects = projects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) ||
      p.projectTitle.toLowerCase().includes(q) ||
      (p.location?.toLowerCase().includes(q) ?? false) ||
      (p.staffAssigned?.toLowerCase().includes(q) ?? false);
  });

  const totalApproved = projects.reduce((sum, p) => sum + (p.approvedAmount ?? 0), 0);
  const totalReleased = projects.reduce((sum, p) => sum + (p.releasedAmount ?? 0), 0);
  const cestCount = projects.filter(p => p.programFunding === 'CEST').length;
  const liraCount = projects.filter(p => p.programFunding === 'LIRA').length;
  const swepCount = projects.filter(p => p.programFunding === 'SWEP').length;
  const otherCount = projects.filter(p => p.programFunding && !['CEST', 'LIRA', 'SWEP'].includes(p.programFunding)).length;

  const filterCards = [
    { id: 'approved-amount', label: 'Total Approved Amount', value: formatCurrency(totalApproved), isAmount: true },
    { id: 'released-amount', label: 'Total Released Amount', value: formatCurrency(totalReleased), isAmount: true },
    { id: 'cest-program', label: 'Total CEST Program', value: String(cestCount), isAmount: false },
    { id: 'lira-program', label: 'Total LGIA Program', value: String(liraCount), isAmount: false },
    { id: 'swep-program', label: 'Total SSCP Program', value: String(swepCount), isAmount: false },
    { id: 'other-funding', label: 'Total Other Funding Source', value: String(otherCount), isAmount: false },
  ];

  const handleDeleteSelected = async () => {
    if (selectedProjects.length === 0) return;
    const confirmMsg = selectedProjects.length === 1
      ? 'Are you sure you want to delete this project?'
      : `Are you sure you want to delete ${selectedProjects.length} projects?`;
    if (!confirm(confirmMsg)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedProjects.map(id =>
        fetch(`/api/cest-projects/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      ));
      setSelectedProjects([]);
      await fetchProjects();
    } catch {
      console.error('Failed to delete projects');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (projectId: string) => {
    // TODO: Implement edit modal logic
    console.log('Edit project:', projectId);
  };

  const municipalities = formData.province && addressData[formData.province] ? Object.keys(addressData[formData.province]) : [];
  const barangays = formData.province && formData.municipality && addressData[formData.province]?.[formData.municipality] ? addressData[formData.province][formData.municipality] : [];

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, companyLogo: e.target.files![0] }));
    }
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};

    if (!formData.projectTitle.trim()) errors.projectTitle = 'Project title is required';
    if (!formData.programFunding) errors.programFunding = 'Program/Funding is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaveError('');
    setSaving(true);

    try {
      // Generate code: CEST-XXXX based on count
      const codeNum = String(projects.length + 1).padStart(4, '0');
      const code = `CEST-${codeNum}`;

      // Build location from address fields
      const locationParts = [formData.barangay, formData.municipality, formData.province].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;

      const payload: Record<string, unknown> = {
        code,
        projectTitle: formData.projectTitle,
        location,
        beneficiaries: formData.beneficiaries || null,
        programFunding: formData.programFunding || null,
        status: formData.status || null,
        approvedAmount: formData.approvedAmount ? parseFloat(formData.approvedAmount) : null,
        releasedAmount: formData.releasedAmount ? parseFloat(formData.releasedAmount) : null,
        projectDuration: formData.projectDuration || null,
        staffAssigned: formData.cooperatorName || null,
        year: formData.projectDate ? new Date(formData.projectDate).getFullYear().toString() : null,
        dateOfApproval: formData.dateOfRelease || null,
      };

      const res = await fetch('/api/cest-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save project');
      }

      setShowAddModal(false);
      resetForm();
      await fetchProjects();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout activePath="/cest">
      <main className="flex-1 py-5 px-[30px] bg-[#f5f5f5] overflow-x-auto">
        {/* CEST Header */}
        <div className="flex justify-between items-center bg-white py-[15px] px-[25px] rounded-[15px] mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] gap-[30px]">
            <div className="flex items-center gap-[15px]">
              <div className="flex flex-col">
                 <Image 
                   src="/cest-logo-text.png" 
                   alt="CEST Community Empowerment Thru Science and Technology" 
                   width={110}
                   height={25}
                   style={{ width: '110px', height: 'auto', marginTop: '-10px' }}
                  />
                </div>
              </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-[600px] h-[50px]">
              <Icon icon="mdi:magnify" className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999]" width={20} height={20} />
              <input
                type="text"
                className="w-full h-full py-0 pr-[25px] pl-[50px] border border-[#e0e0e0] rounded-[25px] text-[15px] bg-[#f5f5f5] transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_2px_8px_rgba(20,97,132,0.1)] placeholder:text-[#999]"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover"
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>
        {/* Filter Cards */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterCards.map(card => (
            <div key={card.id} className="flex-1 flex flex-col items-start justify-start py-5 px-[15px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <span className="text-[11px] text-[#666] mb-2 font-medium w-full leading-[11px]">{card.label}</span>
              <span className={`font-bold w-full leading-none ${card.isAmount ? 'text-xl text-[#2e7d32]' : 'text-[28px] text-primary'}`}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Approved Section */}
        <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-[15px] border-b border-[#e0e0e0]">
            <h2 className="text-lg font-bold text-primary m-0 flex items-center gap-2.5">
              APPROVED
            </h2>
            <div className="flex gap-2.5">
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-white border border-[#d0d0d0] rounded-lg text-[13px] text-[#333] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary">
                <Icon icon="mdi:sort" width={16} height={16} />
                Sort
              </button>
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-white border border-[#d0d0d0] rounded-lg text-[13px] text-[#333] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary">
                <Icon icon="mdi:filter-variant" width={16} height={16} />
                Filter
              </button>
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-[#dc3545] text-white border border-[#dc3545] rounded-lg text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#c82333]">
                <Icon icon="mdi:file-pdf-box" width={16} height={16} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-5 min-w-[10px] text-left py-3 px-2.5 border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal align-middle">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-accent cursor-pointer" 
                      checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0} 
                      onChange={(e) => setSelectedProjects(e.target.checked ? filteredProjects.map(p => p.id) : [])} 
                    />
                  </th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Code</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[200px] align-middle">Project Title</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Location</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[180px] align-middle">Beneficiaries</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Program/<br/>Funding</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Status</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Approved<br/>Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Released Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Project Duration</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Staff<br/>Assigned</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[60px] align-middle">Year</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Date of Approval (Ref.<br/>Approval Letter)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-[#999]">Loading projects...</td>
                  </tr>
                ) : filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-[#999]">No projects found</td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-[#f9f9f9]">
                      <td className="w-9 min-w-[36px] text-center py-3 px-2.5 border-b border-[#e0e0e0]">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-accent cursor-pointer" 
                          checked={selectedProjects.includes(project.id)} 
                          onChange={(e) => setSelectedProjects(prev => e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id))} 
                        />
                      </td>
                      <td className="text-primary font-semibold whitespace-nowrap py-3 px-1.5 border-b border-[#e0e0e0]">{project.code}</td>
                      <td className="max-w-[250px] text-[#333] font-medium whitespace-normal break-words py-3 px-1.5 border-b border-[#e0e0e0]">
                        <Link href={`/cest/${project.id}`} className="text-primary hover:text-accent no-underline hover:underline transition-colors">
                          {project.projectTitle}
                        </Link>
                      </td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.location ?? '—'}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.beneficiaries ?? '—'}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">
                        <span className="inline-block py-1 px-2.5 bg-[#e3f2fd] text-[#1565c0] rounded-[15px] text-[11px] font-medium">
                          {project.programFunding ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">
                        <span className="inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium bg-[#e8f5e9] text-[#2e7d32]">
                          {project.status ?? '—'}
                        </span>
                      </td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{formatCurrency(project.approvedAmount)}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{formatCurrency(project.releasedAmount)}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.projectDuration ?? '—'}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.staffAssigned ?? '—'}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.year ?? '—'}</td>
                      <td className="py-3 px-1.5 border-b border-[#e0e0e0]">{project.dateOfApproval ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Selection Toaster */}
        {selectedProjects.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1050] flex items-center gap-3 bg-[#1e293b] text-white py-3 px-5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
            <button className="flex items-center justify-center bg-transparent border-none text-white/70 cursor-pointer p-0.5 rounded hover:text-white hover:bg-white/10 transition-colors" onClick={() => setSelectedProjects([])}>
              <Icon icon="mdi:close" width={18} height={18} />
            </button>
            <span className="text-[13px] font-medium whitespace-nowrap">{selectedProjects.length} Item{selectedProjects.length > 1 ? 's' : ''} Selected</span>
            <div className="w-px h-5 bg-white/20" />
            {selectedProjects.length === 1 && (
              <button className="flex items-center gap-1.5 py-1.5 px-3 bg-accent text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={() => openEditModal(selectedProjects[0])}>
                <Icon icon="mdi:pencil" width={14} height={14} /> Edit
              </button>
            )}
            <button className="flex items-center gap-1.5 py-1.5 px-3 bg-[#dc3545] text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#c82333] disabled:opacity-60" onClick={handleDeleteSelected} disabled={deleting}>
              <Icon icon="mdi:delete" width={14} height={14} /> {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </main>

      {/* Add New Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-[20px] py-[25px] px-[35px] w-full max-w-[680px] max-h-[85vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => setShowAddModal(false)}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-[3px]">Add New Project</h2>
            <p className="text-xs text-[#888] m-0 mb-[15px]">Complete the form to register a new CEST project</p>

            <div className="flex flex-col gap-3">
              {/* Row 1: Project Title + Project Date */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Project Title<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <input type="text" placeholder="Enter project title" value={formData.projectTitle} onChange={(e) => handleFormChange('projectTitle', e.target.value)} className={`${modalInputCls} ${formErrors.projectTitle ? errCls : ''}`} />
                  {formErrors.projectTitle && <span className="text-[#dc3545] text-[11px]">{formErrors.projectTitle}</span>}
                </div>
                <div className="flex flex-col gap-1 w-[160px]">
                  <label className="text-[13px] font-semibold text-[#333]">Project Date</label>
                  <input type="date" value={formData.projectDate} onChange={(e) => handleFormChange('projectDate', e.target.value)} className={modalInputCls} />
                </div>
              </div>

              {/* Row 2: Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#333]">Address</label>
                <div className="grid grid-cols-3 gap-3">
                  <select value={formData.province} onChange={(e) => handleFormChange('province', e.target.value)} className={modalSelectCls}>
                    <option value="">Select Province</option>
                    {Object.keys(addressData).map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                  </select>
                  <select value={formData.municipality} onChange={(e) => handleFormChange('municipality', e.target.value)} disabled={!formData.province} className={modalSelectCls}>
                    <option value="">Select City/Municipality</option>
                    {municipalities.map(mun => (<option key={mun} value={mun}>{mun}</option>))}
                  </select>
                  <select value={formData.barangay} onChange={(e) => handleFormChange('barangay', e.target.value)} disabled={!formData.municipality} className={modalSelectCls}>
                    <option value="">Barangay / Village / Purok</option>
                    {barangays.map(brgy => (<option key={brgy} value={brgy}>{brgy}</option>))}
                  </select>
                </div>
              </div>

              {/* Row 3: Beneficiaries, Type of Beneficiary, Partner LGU */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Beneficiaries</label>
                  <input type="text" placeholder="Enter beneficiaries" value={formData.beneficiaries} onChange={(e) => handleFormChange('beneficiaries', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Type of Beneficiary</label>
                  <select value={formData.typeOfBeneficiary} onChange={(e) => handleFormChange('typeOfBeneficiary', e.target.value)} className={modalSelectCls}>
                    <option value="">Select Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Organization">Organization</option>
                    <option value="Community">Community</option>
                    <option value="LGU">LGU</option>
                    <option value="Cooperative">Cooperative</option>
                    <option value="Association">Association</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Partner LGU</label>
                  <input type="text" placeholder="Enter partner LGU" value={formData.partnerLGU} onChange={(e) => handleFormChange('partnerLGU', e.target.value)} className={modalInputCls} />
                </div>
              </div>

              {/* Row 4: Cooperator's Name, Contact Number, Email Address */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Cooperator&apos;s Name</label>
                  <input type="text" placeholder="Enter cooperator's name" value={formData.cooperatorName} onChange={(e) => handleFormChange('cooperatorName', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Contact Number</label>
                  <input type="text" placeholder="e.g. 09123456789" value={formData.contactNumber} onChange={(e) => handleFormChange('contactNumber', e.target.value.replace(/\D/g, '').slice(0, 11))} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Email Address</label>
                  <input type="email" placeholder="Enter email address" value={formData.emailAddress} onChange={(e) => handleFormChange('emailAddress', e.target.value)} className={modalInputCls} />
                </div>
              </div>

              {/* Row 5: Program/Funding, Status, Approved Amount */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Program/Funding<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.programFunding} onChange={(e) => handleFormChange('programFunding', e.target.value)} className={`${modalSelectCls} ${formErrors.programFunding ? errCls : ''}`}>
                    <option value="">Select Program</option>
                    <option value="CEST">CEST</option>
                    <option value="LIRA">LIRA</option>
                    <option value="SWEP">SWEP</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.programFunding && <span className="text-[#dc3545] text-[11px]">{formErrors.programFunding}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Status</label>
                  <select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)} className={modalSelectCls}>
                    <option value="">Select Status</option>
                    <option value="Approved">Approved</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Approved Amount</label>
                  <input type="text" placeholder="e.g. 200000" value={formData.approvedAmount} onChange={(e) => handleFormChange('approvedAmount', e.target.value.replace(/[^\d.]/g, ''))} className={modalInputCls} />
                </div>
              </div>

              {/* Row 6: Released Amount, Project Duration, Date of Release */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Released Amount</label>
                  <input type="text" placeholder="e.g. 150000" value={formData.releasedAmount} onChange={(e) => handleFormChange('releasedAmount', e.target.value.replace(/[^\d.]/g, ''))} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Project Duration</label>
                  <input type="text" placeholder="e.g. 12 months" value={formData.projectDuration} onChange={(e) => handleFormChange('projectDuration', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Date of Release</label>
                  <input type="date" value={formData.dateOfRelease} onChange={(e) => handleFormChange('dateOfRelease', e.target.value)} className={modalInputCls} />
                </div>
              </div>

              {/* Row 7: Company Logo */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Company Logo</label>
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleLogoChange} id="cest-logo-upload" className="absolute opacity-0 w-0 h-0" />
                  <label htmlFor="cest-logo-upload" className="flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed border-[#d0d0d0] rounded-[10px] cursor-pointer text-[#999] text-[13px] transition-all duration-200 hover:border-primary hover:text-primary hover:bg-[#f0f8ff]">
                    <Icon icon="mdi:cloud-upload-outline" width={28} height={28} />
                    <span>{formData.companyLogo ? formData.companyLogo.name : 'Drag & Drop your file here'}</span>
                    <span className="text-accent text-[12px] font-semibold mt-1">Select Files</span>
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
    </DashboardLayout>
  );
}