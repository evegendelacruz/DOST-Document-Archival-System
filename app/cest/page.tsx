'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import DashboardLayout from '../components/DashboardLayout';

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
  coordinates: string | null;
  beneficiaries: string | null;
  programFunding: string | null;
  status: string | null;
  approvedAmount: number | null;
  releasedAmount: number | null;
  projectDuration: string | null;
  staffAssigned: string | null;
  year: string | null;
  dateOfApproval: string | null;
  companyLogoUrl: string | null;
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—';
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const addressData: Record<string, Record<string, string[]>> = {
  'Misamis Oriental': {
    'Cagayan de Oro City': ['Agusan','Balulang','Bayabas','Bayanga','Besigan','Bonbon','Bugo','Bulua','Camaman-an','Canitoan','Carmen','Consolacion','Cugman','Dansolihon','F.S. Catanico','Gusa','Iponan','Kauswagan','Lapasan','Macabalan','Macasandig','Mambuaya','Nazareth','Pagalungan','Pagatpat','Patag','Puerto','Puntod','San Simon','Tablon','Tagpangi','Taglimao','Tignapoloan','Tuburan','Tumpagon'],
    'Opol': ['Awang','Bagocboc','Barra','Bonbon','Cauyonan','Igpit','Luyong Bonbon','Poblacion','Taboc'],
    'El Salvador': ['Amoros','Bolisong','Cogon','Hinigdaan','Kibonbon','Molugan','Poblacion','Sinaloc','Taytay'],
    'Alubijid': ['Baybay','Benigwayan','Calatcat','Lanao','Larapan','Libertad','Mandahican','Poblacion','Samay','Sungay'],
    'Laguindingan': ['Aromahon','Gasi','Kibaghot','Moog','Poblacion','Sinai','Tubajon'],
    'Gitagum': ['Burnay','Cogon','Manaka','Matangad','Pangayawan','Poblacion','Tala-o'],
    'Libertad': ['Ane-i','Caluya','Coracon','Gimangpang','Kimalok','Poblacion','San Juan','Solana'],
    'Initao': ['Aloe','Gimangpang','Jampason','Kamelon','Poblacion','San Pedro','Tawantawan','Tubigan'],
    'Naawan': ['Don Pedro','Linangkayan','Lubilan','Mapulog','Maputi','Poblacion','Tagbalogo'],
    'Manticao': ['Argayoso','Camanga','Kauswagan','Pagawan','Poblacion','Punta Silum','Tuod'],
    'Lugait': ['Aya-aya','Betahon','Biga','Lower Talacogon','Poblacion','Upper Talacogon'],
    'Tagoloan': ['Balubal','Casinglot','Gracia','Mohon','Nangcaon','Natumolan','Poblacion','Tagoloan Poblacion','Villanueva'],
    'Villanueva': ['Balacanas','Imelda','Katipunan','Looc','Poblacion','San Martin','Tambobong'],
    'Jasaan': ['Aplaya','Bobuntugan','Corrales','Danao','Jampason','Kimaya','Lower Jasaan','Poblacion','San Isidro','Upper Jasaan'],
    'Balingasag': ['Baliwagan','Cogon','Dasigon','Linugos','Mambayaan','Poblacion','San Juan','Talusan'],
    'Lagonglong': ['Banglay','Gaston','Kabulawan','Poblacion','Tabok','Umagos'],
    'Salay': ['Alipuaton','Bunal','Casulog','Dasigon','Looc','Matampa','Poblacion','Rizal'],
    'Binuangan': ['Dampias','Kitamban','Mabini','Poblacion','Silo-o','Sto. Rosario'],
    'Sugbongcogon': ['Alicomohan','Kaulayanan','Kinoguitan','Poblacion','San Jose'],
    'Kinoguitan': ['Baliangao','Caluya','Esperanza','Poblacion','Sanghan','Sugbongcogon'],
    'Claveria': ['Ane-i','Aposkahoy','Hinaplanan','Lanise','Luna','Minalwang','Poblacion','Rizal','San Vicente'],
    'Medina': ['Banglay','Cabug','Duka','Gingoog','Poblacion','San Roque'],
    'Talisayan': ['Camuayan','Casibole','Katipunan','Poblacion','San Isidro','Sindangan'],
    'Magsaysay': ['Candiis','Damayuhan','Kakuigan','Poblacion','San Isidro'],
    'Balingoan': ['Baukbauk','Dolores','Hambabauyon','Poblacion','Waterfalls'],
  },
  'Bukidnon': {
    'Malaybalay City': ['Aglayan','Bangcud','Busdi','Casisang','Dalwangan','Imbayao','Laguitas','Patpat','Poblacion','San Jose','Sumpong'],
    'Valencia City': ['Bagontaas','Batangan','Catumbalon','Colonia','Lumbayao','Mailag','Poblacion','San Carlos','Tongantongan'],
    'Manolo Fortich': ['Alae','Dahilayan','Dalirig','Kulaman','Linabo','Poblacion','Tankulan'],
    'Sumilao': ['Kisolon','Licoan','Poblacion','San Roque','Vista Villa'],
  },
  'Lanao del Norte': {
    'Iligan City': ['Buruun','Dalipuga','Del Carmen','Hinaplanon','Kiwalan','Mahayahay','Maria Cristina','Pala-o','Poblacion','Santiago','Suarez','Tambacan','Tibanga','Tubod','Villaverde'],
    'Kapatagan': ['Balonging','Daan Lanao','Mabatao','Maranding','Nangka','Poblacion','Taguitic'],
    'Tubod': ['Baroy','Lala','Maigo','Poblacion'],
  },
  'Camiguin': {
    'Mambajao': ['Agoho','Baylao','Benoni','Bug-ong','Kuguita','Poblacion','Tupsan','Yumbing'],
    'Catarman': ['Benoni','Bonbon','Hubangon','Mainit','Poblacion'],
    'Sagay': ['Alangilan','Bonbon','Maac','Poblacion'],
    'Guinsiliban': ['Butay','Cantaan','Liong','Poblacion'],
  },
};

const modalInputCls = "w-full py-2 px-3 border border-[#d0d0d0] rounded-lg text-[13px] font-[inherit] text-[#333] bg-white transition-all duration-200 placeholder:text-[#aaa] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";
const modalSelectCls = `${modalInputCls} modal-select`;
const errCls = "border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!";

export default function CestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<CestProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showAddFunding, setShowAddFunding] = useState(false);
  const [newFundingName, setNewFundingName] = useState('');
  const [extraFundingOptions, setExtraFundingOptions] = useState<string[]>([]);
  const [mapFlyTarget, setMapFlyTarget] = useState<[number, number] | null>(null);

  // ── Dual scrollbar refs (same pattern as SETUP) ──
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);

  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDate: '',
    province: '',
    municipality: '',
    barangay: '',
    coordinates: '',
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

  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const existingLogoUrlRef = useRef<string | null>(null);
  const setExistingLogoUrlWithRef = (url: string | null) => {
    existingLogoUrlRef.current = url;
    setExistingLogoUrl(url);
  };

  const resetForm = () => {
    setFormData({
      projectTitle: '', projectDate: '', province: '', municipality: '', barangay: '', coordinates: '',
      beneficiaries: '', typeOfBeneficiary: '', partnerLGU: '', cooperatorName: '',
      contactNumber: '', emailAddress: '', programFunding: '', status: '',
      approvedAmount: '', releasedAmount: '', projectDuration: '', dateOfRelease: '',
      companyLogo: null,
    });
    setFormErrors({});
    setSaveError('');
    setEditingProjectId(null);
    setExistingLogoUrlWithRef(null);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cest-projects');
      if (!res.ok) {
        console.error('API error:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch CEST projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ── Keep top scrollbar width in sync with table content width ──
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;
    const update = () => setTableScrollWidth(tableEl.scrollWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [projects, searchQuery]);

  const handleTableScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
    isSyncingScroll.current = false;
  }, []);

  const handleTopScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    isSyncingScroll.current = false;
  }, []);

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
  const standardPrograms = ['CEST', 'LGIA', 'SSCP'];
  const customPrograms = [...new Set(
    projects.map(p => p.programFunding).filter((f): f is string => !!f && !standardPrograms.includes(f))
  )];

  const cestCount = projects.filter(p => p.programFunding === 'CEST').length;
  const otherCount = projects.filter(p => p.programFunding && !standardPrograms.includes(p.programFunding)).length;

  const filterCards = [
    { id: 'approved-amount', label: 'Total Approved Amount', value: formatCurrency(totalApproved), isAmount: true },
    { id: 'released-amount', label: 'Total Released Amount', value: formatCurrency(totalReleased), isAmount: true },
    { id: 'cest-program', label: 'Total CEST Program', value: String(cestCount), isAmount: false },
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

  // Auto-geocode municipality for map picker
  useEffect(() => {
    if (!formData.municipality) return;
    const query = `${formData.municipality}${formData.province ? ', ' + formData.province : ''}, Philippines`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => { if (data[0]) setMapFlyTarget([parseFloat(data[0].lat), parseFloat(data[0].lon)]); })
      .catch(() => {});
  }, [formData.municipality, formData.province]);

  const openEditModal = (project: CestProject) => {
    const parts = project.location?.split(', ') ?? [];
    const barangay = parts[0] ?? '';
    const municipality = parts[1] ?? '';
    const province = parts[2] ?? '';
    setFormData({
      projectTitle: project.projectTitle,
      projectDate: project.dateOfApproval ? project.dateOfApproval.slice(0, 10) : '',
      province, municipality, barangay,
      coordinates: project.coordinates ?? '',
      beneficiaries: project.beneficiaries ?? '',
      typeOfBeneficiary: '',
      partnerLGU: '',
      cooperatorName: project.staffAssigned ?? '',
      contactNumber: '',
      emailAddress: '',
      programFunding: project.programFunding ?? '',
      status: project.status ?? '',
      approvedAmount: project.approvedAmount != null ? String(project.approvedAmount) : '',
      releasedAmount: project.releasedAmount != null ? String(project.releasedAmount) : '',
      projectDuration: project.projectDuration ?? '',
      dateOfRelease: project.dateOfApproval ? project.dateOfApproval.slice(0, 10) : '',
      companyLogo: null,
    });
    setExistingLogoUrlWithRef(project.companyLogoUrl);
    setEditingProjectId(project.id);
    setFormErrors({});
    setSaveError('');
    setShowAddModal(true);
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};
    if (!formData.projectTitle.trim()) errors.projectTitle = 'Project title is required';
    if (!formData.programFunding) errors.programFunding = 'Program/Funding is required';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    setFormErrors({});
    setSaveError('');
    setSaving(true);
    try {
      let logoUrl: string | null = existingLogoUrlRef.current ?? null;
      if (formData.companyLogo) {
        logoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.companyLogo!);
        });
      }
      const locationParts = [formData.barangay, formData.municipality, formData.province].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;
      const payload: Record<string, unknown> = {
        projectTitle: formData.projectTitle,
        location,
        coordinates: formData.coordinates || null,
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
      payload.companyLogoUrl = logoUrl;

      if (editingProjectId) {
        const res = await fetch(`/api/cest-projects/${editingProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error || 'Failed to update project'); }
      } else {
        const codeNum = String(projects.length + 1).padStart(4, '0');
        payload.code = `CEST-${codeNum}`;
        const res = await fetch('/api/cest-projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error || 'Failed to save project'); }
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
          <div className="flex items-center gap-0">
            <div className="w-[100px] h-[100px] flex items-center justify-center -mr-2">
              <img src="/cest-sidebar-logo.png" alt="CEST Logo" className="w-[100px] h-[100px] object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[28px] font-bold text-[#2e7d32] m-0 leading-none">CEST</h1>
              <p className="text-[10px] text-[#666] m-0 leading-[1.3]">Community Empowerment thru<br/>Science and Technology</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-[600px] h-[50px]">
              <Icon icon="mdi:magnify" className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999]" width={20} height={20} />
              <input type="text" className="w-full h-full py-0 pr-[25px] pl-[50px] border border-[#e0e0e0] rounded-[25px] text-[15px] bg-[#f5f5f5] transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_2px_8px_rgba(20,97,132,0.1)] placeholder:text-[#999]" placeholder="Search here" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover" onClick={() => { resetForm(); setShowAddModal(true); }}>
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>

        {/* Filter Cards */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterCards.map(card => (
            <div key={card.id} className="flex-1 flex flex-col items-center justify-center py-5 px-[15px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <span className="text-[11px] text-[#666] mb-2 font-medium text-center">{card.label}</span>
              <span className={`font-bold ${card.isAmount ? 'text-xl text-[#2e7d32]' : 'text-[28px] text-primary'}`}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Masterlist Table */}
        <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-[15px] border-b border-[#e0e0e0]">
            <h2 className="text-lg font-bold text-primary m-0 flex items-center gap-2.5">
              APPROVED
            </h2>
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

          {/* ── Top scrollbar (sticky, synced with table) ── */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden sticky top-0 z-10 bg-white"
            style={{ height: '12px', marginBottom: '-1px' }}
          >
            <div style={{ width: tableScrollWidth, height: '1px' }} />
          </div>

          {/* ── Table with bottom scrollbar ── */}
          <div className="overflow-x-auto scrollbar-hide" ref={tableScrollRef} onScroll={handleTableScroll}>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-5 min-w-[10px] text-left py-3 px-2.5 border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal align-middle">
                    <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0} onChange={(e) => setSelectedProjects(e.target.checked ? filteredProjects.map(p => p.id) : [])} />
                  </th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[10px] align-middle">Code</th>
                  <th className="py-3 px-1.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Logo</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[250px] align-middle">Project Title</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Location</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Beneficiaries</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Program/<br/>Funding</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Status</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Approved<br/>Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Released Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Project Duration</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Staff<br/>Assigned</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Year</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Date of Approval (Ref.<br/>Approval Letter)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} className="text-center py-8 text-[#999]">Loading projects...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={14} className="text-center py-8 text-[#999]">No projects found</td></tr>
                ) : filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="py-3 px-2 text-center border-b border-[#e0e0e0]">
                      <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.includes(project.id)} onChange={(e) => setSelectedProjects(prev => e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id))} />
                    </td>
                    <td className="text-primary font-semibold whitespace-nowrap py-3 px-2 text-left border-b border-[#e0e0e0]">#{project.code.replace(/^0+/, '').padStart(3, '0')}</td>

                    {/* Company Logo */}
                    <td className="py-3 px-1.5 text-center border-b border-[#e0e0e0]">
                      {project.companyLogoUrl ? (
                        <img src={project.companyLogoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover inline-block border border-[#d0d0d0]" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center inline-flex border border-[#d0d0d0]">
                          <Icon icon="mdi:domain" width={18} height={18} color="#999" />
                        </div>
                      )}
                    </td>

                    <td className="max-w-[300px] text-[#333] font-medium whitespace-normal break-words py-3 px-2 text-left border-b border-[#e0e0e0]"><Link href={`/cest/${project.id}`} className="text-primary no-underline font-medium hover:text-accent hover:underline">{project.projectTitle}</Link></td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.location ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.beneficiaries ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      <span className="inline-block py-1 px-2.5 bg-[#e3f2fd] text-[#1565c0] rounded-[15px] text-[11px] font-medium">
                        {project.programFunding ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      <span className="inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium bg-[#e8f5e9] text-[#2e7d32]">
                        {project.status ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{formatCurrency(project.approvedAmount)}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{formatCurrency(project.releasedAmount)}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.projectDuration ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.staffAssigned ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.year ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.dateOfApproval ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Selection Toaster */}
      {selectedProjects.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1050] flex items-center gap-3 bg-[#1e293b] text-white py-3 px-5 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
          <button className="flex items-center justify-center bg-transparent border-none text-white/70 cursor-pointer p-0.5 rounded hover:text-white hover:bg-white/10 transition-colors" onClick={() => setSelectedProjects([])}>
            <Icon icon="mdi:close" width={18} height={18} />
          </button>
          <span className="text-[13px] font-medium whitespace-nowrap">{selectedProjects.length} Item{selectedProjects.length > 1 ? 's' : ''} Selected</span>
          <div className="w-px h-5 bg-white/20" />
          {selectedProjects.length === 1 && (
            <button className="flex items-center gap-1.5 py-1.5 px-3 bg-accent text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={() => { const project = projects.find(p => p.id === selectedProjects[0]); if (project) openEditModal(project); }}>
              <Icon icon="mdi:pencil" width={14} height={14} /> Edit
            </button>
          )}
          <button className="flex items-center gap-1.5 py-1.5 px-3 bg-[#dc3545] text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#c82333] disabled:opacity-60" onClick={handleDeleteSelected} disabled={deleting}>
            <Icon icon="mdi:delete" width={14} height={14} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="bg-white rounded-[20px] py-[25px] px-[35px] w-full max-w-[680px] max-h-[85vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => { setShowAddModal(false); resetForm(); }}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-[3px]">{editingProjectId ? 'Edit Project' : 'Add New Project'}</h2>
            <p className="text-xs text-[#888] m-0 mb-[15px]">{editingProjectId ? 'Update the CEST project details below' : 'Complete the form to register a new CEST project'}</p>

            <div className="flex flex-col gap-3">
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

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Coordinates</label>
                <div className="relative flex items-center">
                  <input type="text" placeholder="e.g. 8.465281,124.623238" value={formData.coordinates} readOnly className={`${modalInputCls} pr-9!`} />
                  <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-none border-none p-0 m-0 text-[#999] flex items-center justify-center cursor-pointer transition-colors duration-200 hover:text-accent" onClick={() => setShowMapPicker(true)} title="Pick on Map">
                    <Icon icon="mdi:map-marker-plus-outline" width={20} height={20} />
                  </button>
                </div>
              </div>

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

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Program/Funding<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select
                    value={formData.programFunding}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowAddFunding(true);
                      } else {
                        handleFormChange('programFunding', e.target.value);
                      }
                    }}
                    className={`${modalSelectCls} ${formErrors.programFunding ? errCls : ''}`}
                  >
                    <option value="">Select Program</option>
                    <option value="CEST">CEST</option>
                    <option value="LGIA">LGIA</option>
                    <option value="SSCP">SSCP</option>
                    {[...customPrograms, ...extraFundingOptions].map(prog => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                    <option value="__add_new__" style={{ color: '#146184', fontWeight: 'bold' }}>+ Add Other Funding</option>
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

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Company Logo</label>
                {existingLogoUrl && !formData.companyLogo && (
                  <div className="flex items-center gap-3 p-3 bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg mb-1">
                    <img src={existingLogoUrl} alt="Current logo" className="w-10 h-10 rounded-full object-cover border border-[#d0d0d0]" />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium text-[#333]">Current logo</span>
                      <span className="text-[11px] text-[#888]">Upload a new image to replace it</span>
                    </div>
                  </div>
                )}
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleLogoChange} id="cest-logo-upload" className="absolute opacity-0 w-0 h-0" />
                  <label htmlFor="cest-logo-upload" className="flex flex-row items-center justify-center gap-2 p-3 border-2 border-dashed border-[#d0d0d0] rounded-[10px] cursor-pointer text-[#999] text-[13px] transition-all duration-200 hover:border-primary hover:text-primary hover:bg-[#f0f8ff]">
                    <Icon icon="mdi:cloud-upload-outline" width={28} height={28} />
                    <span>{formData.companyLogo ? formData.companyLogo.name : 'Click to upload logo'}</span>
                  </label>
                </div>
              </div>

              {saveError && <p className="text-[#dc3545] text-[13px] text-center m-0">{saveError}</p>}
              <div className="flex justify-center mt-0.5">
                <button className="py-2.5 px-[50px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 font-[inherit] hover:bg-accent-hover active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleSaveProject} disabled={saving}>
                  {saving ? 'Saving...' : editingProjectId ? 'Update Project' : 'Save Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Funding Modal */}
      {showAddFunding && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
          <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-base font-bold text-primary mb-3">Add Funding Source</h3>
            <input
              type="text"
              value={newFundingName}
              onChange={(e) => setNewFundingName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { if (newFundingName.trim()) { setExtraFundingOptions(prev => prev.includes(newFundingName.trim()) ? prev : [...prev, newFundingName.trim()]); handleFormChange('programFunding', newFundingName.trim()); } setShowAddFunding(false); setNewFundingName(''); } }}
              placeholder="Enter funding source name"
              className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddFunding(false); setNewFundingName(''); }} className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (newFundingName.trim()) {
                    setExtraFundingOptions(prev => prev.includes(newFundingName.trim()) ? prev : [...prev, newFundingName.trim()]);
                    handleFormChange('programFunding', newFundingName.trim());
                  }
                  setShowAddFunding(false);
                  setNewFundingName('');
                }}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-accent"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => setShowMapPicker(false)}>
          <div className="bg-white rounded-2xl w-[700px] max-w-[95vw] max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between py-4 px-6 border-b border-[#eee]">
              <h3 className="m-0 text-base text-primary font-bold">Pick Location on Map</h3>
              <button className="bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => setShowMapPicker(false)}>
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>
            <p className="m-0 py-2 px-6 text-xs text-[#888]">Click on the map to place a pin and auto-generate coordinates</p>
            <div className="flex items-center justify-between px-6 pb-2">
              <span className="text-[13px] text-[#555]">Coordinates: <strong className="text-primary">{formData.coordinates || '—'}</strong></span>
            </div>
            {/* Real-time search bar */}
            <div className="px-6 pb-3">
              <MapSearchBar onSelect={(coords) => setMapFlyTarget(coords)} initialQuery={formData.municipality} />
            </div>
            <div className="w-full h-[400px]">
              <MapPickerInner
                lat={formData.coordinates ? parseFloat(formData.coordinates.split(',')[0]) : null}
                lng={formData.coordinates ? parseFloat(formData.coordinates.split(',')[1]) : null}
                onPick={(lat, lng) => { setFormData(prev => ({ ...prev, coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}` })); }}
                flyTo={mapFlyTarget}
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

// ── Nominatim result type ──
interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// ── Real-time search bar with autocomplete suggestions ──
function MapSearchBar({ onSelect, initialQuery }: { onSelect: (coords: [number, number]) => void; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<NominatimResult[]>([]);

  useEffect(() => { setQuery(initialQuery || ''); }, [initialQuery]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=ph`, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then((data: NominatimResult[]) => { setResults(data); setOpen(data.length > 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setOpen(false);
    setResults([]);
    onSelect([parseFloat(result.lat), parseFloat(result.lon)]);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center border border-[#e0e0e0] rounded-lg bg-[#f9f9f9] overflow-hidden focus-within:border-primary focus-within:bg-white transition-all">
        {loading ? (
          <svg className="ml-3 w-4 h-4 text-primary animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <Icon icon="mdi:magnify" className="ml-3 text-[#999] flex-shrink-0" width={16} height={16} />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search location..."
          className="flex-1 py-2 px-2 border-none outline-none text-[13px] bg-transparent placeholder:text-[#aaa] text-[#333]"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="mr-2 text-[#bbb] hover:text-[#999] border-none bg-transparent cursor-pointer flex items-center p-0">
            <Icon icon="mdi:close" width={14} height={14} />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.18)] overflow-hidden z-[9999]">
          {results.map((result, idx) => (
            <button
              key={result.place_id}
              onMouseDown={() => handleSelect(result)}
              className={`w-full text-left px-4 py-2.5 text-[12px] text-[#333] hover:bg-[#f0f8ff] transition-colors flex items-start gap-2 cursor-pointer border-none bg-transparent ${idx !== results.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}
            >
              <Icon icon="mdi:map-marker-outline" width={14} height={14} className="text-primary flex-shrink-0 mt-0.5" />
              <span className="leading-snug line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Map Picker Component ──
function MapPickerInner({
  lat, lng, onPick, flyTo,
}: {
  lat: number | null;
  lng: number | null;
  onPick: (lat: number, lng: number) => void;
  flyTo?: [number, number] | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comps, setComps] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [L, setL] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, leaflet]) => {
      setComps(rl);
      setL(leaflet.default || leaflet);
    });
  }, []);

  // Fly to target with a short delay so user sees the map before it zooms
  useEffect(() => {
    if (!flyTo) return;
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.flyTo(flyTo, 13, { duration: 1.5 });
    }, 700);
    return () => clearTimeout(timer);
  }, [flyTo, comps]);

  if (!comps || !L) {
    return <div className="w-full h-full flex items-center justify-center text-base text-[#666] bg-[#f5f5f5]">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Marker, useMapEvents } = comps;

  const markerIcon = L.divIcon({
    html: `<div style="position:relative;width:30px;height:40px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
        <path d="M15 0C7 0 0 7 0 15c0 11 15 25 15 25s15-14 15-25C30 7 23 0 15 0z" fill="#2e7d32" stroke="#1b5e20" stroke-width="1"/>
        <circle cx="15" cy="13" r="5" fill="white"/>
      </svg>
    </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    className: '',
  });

  function ClickHandler() {
    useMapEvents({ click(e: { latlng: { lat: number; lng: number } }) { onPick(e.latlng.lat, e.latlng.lng); } });
    return null;
  }

  const center: [number, number] = lat !== null && lng !== null
    ? [lat, lng]
    : flyTo ?? [8.4542, 124.6319];

  return (
    <MapContainer ref={mapRef} center={center} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={true}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler />
      {lat !== null && lng !== null && (<Marker position={[lat, lng]} icon={markerIcon} />)}
    </MapContainer>
  );
}