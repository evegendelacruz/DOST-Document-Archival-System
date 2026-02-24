'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
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

interface PartnerLGU {
  name: string;
  logoUrl: string | null;
}

interface CestProject {
  id: string;
  code: string;
  projectTitle: string;
  location: string | null;
  coordinates: string | null;
  beneficiaries: string | null;
  typeOfBeneficiary: string | null;
  programFunding: string | null;
  status: string | null;
  approvedAmount: number | null;
  releasedAmount: number | null;
  counterpartAmount: number | null;
  projectDuration: string | null;
  staffAssigned: string | null;
  assigneeProfileUrl: string | null;
  year: string | null;
  dateOfApproval: string | null;
  companyLogoUrl: string | null;
  partnerLGUs: PartnerLGU[] | null;
  categories: string[] | null;
  emails: string[] | null;
  contactNumbers: string[] | null;
}

interface DropdownOption {
  id: string;
  type: string;
  value: string;
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
  const [showAddBeneficiaryType, setShowAddBeneficiaryType] = useState(false);
  const [newBeneficiaryTypeName, setNewBeneficiaryTypeName] = useState('');
  const [mapFlyTarget, setMapFlyTarget] = useState<[number, number] | null>(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  // ── Dual scrollbar refs (same pattern as SETUP) ──
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);

  const [formData, setFormData] = useState({
    projectCode: '',
    projectTitle: '',
    projectDate: '',
    province: '',
    municipality: '',
    barangay: '',
    villaPurok: '',
    coordinates: '',
    beneficiaries: '',
    typeOfBeneficiary: '',
    cooperatorName: '',
    programFunding: '',
    status: '',
    approvedAmount: '',
    releasedAmount: '',
    counterpartAmount: '',
    projectDuration: '',
    dateOfRelease: '',
    companyLogo: null as File | null,
  });

  // Multiple inputs state
  const [emails, setEmails] = useState<string[]>(['']);
  const [contactNumbers, setContactNumbers] = useState<string[]>(['']);
  const [partnerLGUs, setPartnerLGUs] = useState<Array<{ name: string; logoFile: File | null; logoUrl: string | null }>>([{ name: '', logoFile: null, logoUrl: null }]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Dropdown options from database
  const [entryPointOptions, setEntryPointOptions] = useState<DropdownOption[]>([]);
  const [typeOfBeneficiaryOptions, setTypeOfBeneficiaryOptions] = useState<DropdownOption[]>([]);
  const [programFundingOptions, setProgramFundingOptions] = useState<DropdownOption[]>([]);

  // Entry Point input state
  const [newEntryPointInput, setNewEntryPointInput] = useState('');
  const [showEntryPointInput, setShowEntryPointInput] = useState(false);

  // Load dropdown options from database on mount
  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const res = await fetch('/api/cest-dropdown-options');
        if (res.ok) {
          const options: DropdownOption[] = await res.json();
          setEntryPointOptions(options.filter(o => o.type === 'entryPoint'));
          setTypeOfBeneficiaryOptions(options.filter(o => o.type === 'typeOfBeneficiary'));
          setProgramFundingOptions(options.filter(o => o.type === 'programFunding'));
        }
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };
    loadDropdownOptions();
  }, []);

  // Add new entry point to database
  const addNewEntryPoint = async () => {
    const trimmed = newEntryPointInput.trim();
    if (trimmed && !entryPointOptions.some(o => o.value === trimmed)) {
      try {
        const res = await fetch('/api/cest-dropdown-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'entryPoint', value: trimmed }),
        });
        if (res.ok) {
          const newOption = await res.json();
          setEntryPointOptions(prev => [...prev, newOption]);
          setSelectedCategories(prev => [...prev, trimmed]);
        }
      } catch (err) {
        console.error('Failed to add entry point:', err);
      }
    }
    setNewEntryPointInput('');
    setShowEntryPointInput(false);
  };

  // Remove entry point from database
  const removeEntryPoint = async (option: DropdownOption) => {
    try {
      await fetch(`/api/cest-dropdown-options?id=${option.id}`, { method: 'DELETE' });
      setEntryPointOptions(prev => prev.filter(o => o.id !== option.id));
      setSelectedCategories(prev => prev.filter(c => c !== option.value));
    } catch (err) {
      console.error('Failed to remove entry point:', err);
    }
  };

  // Add new type of beneficiary to database
  const addNewBeneficiaryType = async (value: string): Promise<boolean> => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (typeOfBeneficiaryOptions.some(o => o.value === trimmed)) {
      // Already exists, just select it
      handleFormChange('typeOfBeneficiary', trimmed);
      return true;
    }

    setSavingOption(true);
    try {
      const res = await fetch('/api/cest-dropdown-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'typeOfBeneficiary', value: trimmed }),
      });
      if (res.ok) {
        const newOption = await res.json();
        setTypeOfBeneficiaryOptions(prev => [...prev, newOption]);
        handleFormChange('typeOfBeneficiary', trimmed);
        setConfirmationMessage(`"${trimmed}" has been added to Type of Beneficiary options.`);
        setShowConfirmation(true);
        return true;
      } else {
        const error = await res.json().catch(() => null);
        console.error('Failed to add type of beneficiary:', error);
        return false;
      }
    } catch (err) {
      console.error('Failed to add type of beneficiary:', err);
      return false;
    } finally {
      setSavingOption(false);
    }
  };

  // Add new program funding to database
  const addNewProgramFunding = async (value: string): Promise<boolean> => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    if (programFundingOptions.some(o => o.value === trimmed)) {
      // Already exists, just select it
      handleFormChange('programFunding', trimmed);
      return true;
    }

    setSavingOption(true);
    try {
      const res = await fetch('/api/cest-dropdown-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'programFunding', value: trimmed }),
      });
      if (res.ok) {
        const newOption = await res.json();
        setProgramFundingOptions(prev => [...prev, newOption]);
        handleFormChange('programFunding', trimmed);
        setConfirmationMessage(`"${trimmed}" has been added to Program/Funding options.`);
        setShowConfirmation(true);
        return true;
      } else {
        const error = await res.json().catch(() => null);
        console.error('Failed to add program funding:', error);
        return false;
      }
    } catch (err) {
      console.error('Failed to add program funding:', err);
      return false;
    } finally {
      setSavingOption(false);
    }
  };

  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const existingLogoUrlRef = useRef<string | null>(null);
  const setExistingLogoUrlWithRef = (url: string | null) => {
    existingLogoUrlRef.current = url;
    setExistingLogoUrl(url);
  };

  const resetForm = () => {
    setFormData({
      projectCode: '', projectTitle: '', projectDate: '', province: '', municipality: '', barangay: '', villaPurok: '', coordinates: '',
      beneficiaries: '', typeOfBeneficiary: '', cooperatorName: '',
      programFunding: '', status: '',
      approvedAmount: '', releasedAmount: '', counterpartAmount: '', projectDuration: '', dateOfRelease: '',
      companyLogo: null,
    });
    setEmails(['']);
    setContactNumbers(['']);
    setPartnerLGUs([{ name: '', logoFile: null, logoUrl: null }]);
    setSelectedCategories([]);
    setShowEntryPointInput(false);
    setNewEntryPointInput('');
    setFormErrors({});
    setSaveError('');
    setEditingProjectId(null);
    setExistingLogoUrlWithRef(null);
  };

  // Handlers for multiple inputs
  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };
  const addEmail = () => setEmails(prev => [...prev, '']);
  const removeEmail = (index: number) => setEmails(prev => prev.filter((_, i) => i !== index));

  const handleContactChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    const updated = [...contactNumbers];
    updated[index] = cleaned;
    setContactNumbers(updated);
  };
  const isContactValid = (num: string) => num.length === 11 && num.startsWith('09');
  const addContact = () => setContactNumbers(prev => [...prev, '']);
  const removeContact = (index: number) => setContactNumbers(prev => prev.filter((_, i) => i !== index));

  const handlePartnerLGUNameChange = (index: number, value: string) => {
    const updated = [...partnerLGUs];
    updated[index].name = value;
    setPartnerLGUs(updated);
  };
  const handlePartnerLGULogoChange = async (index: number, file: File) => {
    const logoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const updated = [...partnerLGUs];
    updated[index].logoFile = file;
    updated[index].logoUrl = logoUrl;
    setPartnerLGUs(updated);
  };
  const addPartnerLGU = () => setPartnerLGUs(prev => [...prev, { name: '', logoFile: null, logoUrl: null }]);
  const removePartnerLGU = (index: number) => setPartnerLGUs(prev => prev.filter((_, i) => i !== index));

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
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

  const cestCount = projects.filter(p => p.programFunding === 'CEST').length;
  const otherCount = projects.filter(p => p.programFunding && p.programFunding !== 'CEST').length;

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
    // Location format: "VillaPurok, Barangay, Municipality, Province" or "Barangay, Municipality, Province"
    let villaPurok = '';
    let barangay = '';
    let municipality = '';
    let province = '';
    if (parts.length >= 4) {
      villaPurok = parts[0] ?? '';
      barangay = parts[1] ?? '';
      municipality = parts[2] ?? '';
      province = parts[3] ?? '';
    } else {
      barangay = parts[0] ?? '';
      municipality = parts[1] ?? '';
      province = parts[2] ?? '';
    }
    setFormData({
      projectCode: project.code ?? '',
      projectTitle: project.projectTitle,
      projectDate: project.dateOfApproval ? project.dateOfApproval.slice(0, 10) : '',
      province, municipality, barangay, villaPurok,
      coordinates: project.coordinates ?? '',
      beneficiaries: project.beneficiaries ?? '',
      typeOfBeneficiary: project.typeOfBeneficiary ?? '',
      cooperatorName: project.staffAssigned ?? '',
      programFunding: project.programFunding ?? '',
      status: project.status ?? '',
      approvedAmount: project.approvedAmount != null ? String(project.approvedAmount) : '',
      releasedAmount: project.releasedAmount != null ? String(project.releasedAmount) : '',
      counterpartAmount: project.counterpartAmount != null ? String(project.counterpartAmount) : '',
      projectDuration: project.projectDuration ?? '',
      dateOfRelease: project.dateOfApproval ? project.dateOfApproval.slice(0, 10) : '',
      companyLogo: null,
    });
    setEmails(project.emails && project.emails.length > 0 ? project.emails : ['']);
    setContactNumbers(project.contactNumbers && project.contactNumbers.length > 0 ? project.contactNumbers : ['']);
    setPartnerLGUs(project.partnerLGUs && project.partnerLGUs.length > 0
      ? project.partnerLGUs.map(p => ({ name: p.name, logoFile: null, logoUrl: p.logoUrl }))
      : [{ name: '', logoFile: null, logoUrl: null }]);
    setSelectedCategories(project.categories ?? []);
    setExistingLogoUrlWithRef(project.companyLogoUrl);
    setEditingProjectId(project.id);
    setFormErrors({});
    setSaveError('');
    setShowAddModal(true);
  };

  const handleSaveProject = async () => {
    const errors: Record<string, string> = {};
    if (!formData.projectCode.trim()) errors.projectCode = 'Project code is required';
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

      // Process partner LGUs with their logos
      const processedPartnerLGUs = partnerLGUs
        .filter(p => p.name.trim())
        .map(p => ({ name: p.name, logoUrl: p.logoUrl }));

      // Location format: "VillaPurok, Barangay, Municipality, Province" if villaPurok is provided
      const locationParts = [formData.villaPurok, formData.barangay, formData.municipality, formData.province].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;
      const payload: Record<string, unknown> = {
        projectTitle: formData.projectTitle,
        location,
        coordinates: formData.coordinates || null,
        beneficiaries: formData.beneficiaries || null,
        typeOfBeneficiary: formData.typeOfBeneficiary || null,
        programFunding: formData.programFunding || null,
        status: formData.status || null,
        approvedAmount: formData.approvedAmount ? parseFloat(formData.approvedAmount) : null,
        releasedAmount: formData.releasedAmount ? parseFloat(formData.releasedAmount) : null,
        counterpartAmount: formData.counterpartAmount ? parseFloat(formData.counterpartAmount) : null,
        projectDuration: formData.projectDuration || null,
        staffAssigned: formData.cooperatorName || null,
        year: formData.projectDate ? new Date(formData.projectDate).getFullYear().toString() : null,
        dateOfApproval: formData.dateOfRelease || null,
        partnerLGUs: processedPartnerLGUs.length > 0 ? processedPartnerLGUs : null,
        categories: selectedCategories.length > 0 ? selectedCategories : null,
        emails: emails.filter(e => e.trim()).length > 0 ? emails.filter(e => e.trim()) : null,
        contactNumbers: contactNumbers.filter(c => c.trim()).length > 0 ? contactNumbers.filter(c => c.trim()) : null,
      };
      payload.companyLogoUrl = logoUrl;

      // Use user-entered project code
      payload.code = formData.projectCode.trim();

      if (editingProjectId) {
        const res = await fetch(`/api/cest-projects/${editingProjectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error || 'Failed to update project'); }
      } else {
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
          <div className="flex items-center gap-[15px]">
            <div className="flex flex-col">
              <Image 
                src="/cest-logo-text.png" 
                alt="SETUP 4.0 - Small Enterprise Technology Upgrading Program" 
                width={160}
                height={25}
                style={{ width: '120px', height: 'auto', marginTop: '-13px' }}
                />
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
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[5px] align-middle">Code</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[280px] align-middle">Project Title</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[180px] align-middle">Location</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[200px] align-middle">Beneficiaries</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Program/<br/>Funding</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[250px] align-middle">Stakeholder</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[80px] align-middle">Status</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Type of<br/>Beneficiary</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[160px] align-middle">Entry Point</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Approved<br/>Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Released Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Counterpart<br/>Amount</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Project Duration</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Year</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Date of Approval (Ref.<br/>Approval Letter)</th>
                  <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[160px] align-middle">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={17} className="text-center py-8 text-[#999]">Loading projects...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={17} className="text-center py-8 text-[#999]">No projects found</td></tr>
                ) : filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td className="py-3 px-2 text-center border-b border-[#e0e0e0]">
                      <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.includes(project.id)} onChange={(e) => setSelectedProjects(prev => e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id))} />
                    </td>
                    <td className="text-primary font-semibold whitespace-nowrap py-3 px-2 text-left border-b border-[#e0e0e0]">{project.code}</td>
                    <td className="max-w-[300px] text-[#333] font-medium whitespace-normal break-words py-3 px-2 text-left border-b border-[#e0e0e0]"><Link href={`/cest/${project.id}`} className="text-primary no-underline font-medium hover:text-accent hover:underline">{project.projectTitle}</Link></td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.location ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.beneficiaries ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      <span className="inline-block py-1 px-2.5 bg-[#e3f2fd] text-[#1565c0] rounded-[15px] text-[11px] font-medium">
                        {project.programFunding ?? '—'}
                      </span>
                    </td>
                    {/* Stakeholder with Logo */}
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      {project.partnerLGUs && project.partnerLGUs.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {project.partnerLGUs.slice(0, 2).map((lgu, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              {lgu.logoUrl ? (
                                <img src={lgu.logoUrl} alt={lgu.name} className="w-5 h-5 rounded-full object-cover border border-[#d0d0d0]" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#f0f0f0] flex items-center justify-center border border-[#d0d0d0]">
                                  <Icon icon="mdi:domain" width={12} height={12} color="#999" />
                                </div>
                              )}
                              <span className="text-[11px] text-[#333]">{lgu.name}</span>
                            </div>
                          ))}
                          {project.partnerLGUs.length > 2 && (
                            <span className="text-[10px] text-[#666]">+{project.partnerLGUs.length - 2} more</span>
                          )}
                        </div>
                      ) : <span className="text-[#999]">—</span>}
                    </td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      <span className="inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium bg-[#e8f5e9] text-[#2e7d32]">
                        {project.status ?? '—'}
                      </span>
                    </td>
                    

                    {/* Type of Beneficiary */}
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      {project.typeOfBeneficiary ? (
                        <span className="inline-block py-1 px-2 bg-[#f3e5f5] text-[#7b1fa2] rounded text-[10px] font-medium">
                          {project.typeOfBeneficiary}
                        </span>
                      ) : <span className="text-[#999]">—</span>}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      {project.categories && project.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {project.categories.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="inline-block py-0.5 px-1.5 bg-[#fff3e0] text-[#e65100] rounded text-[9px] font-medium">
                              {cat}
                            </span>
                          ))}
                          {project.categories.length > 2 && (
                            <span className="text-[9px] text-[#666]">+{project.categories.length - 2}</span>
                          )}
                        </div>
                      ) : <span className="text-[#999]">—</span>}
                    </td>

                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{formatCurrency(project.approvedAmount)}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{formatCurrency(project.releasedAmount)}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{formatCurrency(project.counterpartAmount)}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0] whitespace-normal break-words">{project.projectDuration ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.year ?? '—'}</td>
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.dateOfApproval ?? '—'}</td>
                    {/* Assignee */}
                    <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                      {project.staffAssigned ? (
                        <div className="flex items-center gap-2">
                          {project.assigneeProfileUrl ? (
                            <img src={project.assigneeProfileUrl} alt={project.staffAssigned} className="w-6 h-6 rounded-full object-cover border border-[#d0d0d0]" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#e3f2fd] flex items-center justify-center">
                              <Icon icon="mdi:account" width={14} height={14} color="#146184" />
                            </div>
                          )}
                          <span className="text-[#333] text-[11px]">{project.staffAssigned}</span>
                        </div>
                      ) : <span className="text-[#999]">—</span>}
                    </td>
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
              <div className="grid grid-cols-[auto_1fr_auto] gap-3">
                <div className="flex flex-col gap-1 w-[140px]">
                  <label className="text-[13px] font-semibold text-[#333]">Project Code<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <input type="text" placeholder="e.g. CEST-001" value={formData.projectCode} onChange={(e) => handleFormChange('projectCode', e.target.value)} className={`${modalInputCls} ${formErrors.projectCode ? errCls : ''}`} />
                  {formErrors.projectCode && <span className="text-[#dc3545] text-[11px]">{formErrors.projectCode}</span>}
                </div>
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
                <div className="grid grid-cols-4 gap-3">
                  <select value={formData.province} onChange={(e) => handleFormChange('province', e.target.value)} className={modalSelectCls}>
                    <option value="">Select Province</option>
                    {Object.keys(addressData).map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                  </select>
                  <select value={formData.municipality} onChange={(e) => handleFormChange('municipality', e.target.value)} disabled={!formData.province} className={modalSelectCls}>
                    <option value="">Select City/Municipality</option>
                    {municipalities.map(mun => (<option key={mun} value={mun}>{mun}</option>))}
                  </select>
                  <select value={formData.barangay} onChange={(e) => handleFormChange('barangay', e.target.value)} disabled={!formData.municipality} className={modalSelectCls}>
                    <option value="">Select Barangay</option>
                    {barangays.map(brgy => (<option key={brgy} value={brgy}>{brgy}</option>))}
                  </select>
                  <input type="text" placeholder="Villa / Purok" value={formData.villaPurok} onChange={(e) => handleFormChange('villaPurok', e.target.value)} className={modalInputCls} />
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

              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#333]">Beneficiaries</label>
                <input type="text" placeholder="Enter beneficiaries" value={formData.beneficiaries} onChange={(e) => handleFormChange('beneficiaries', e.target.value)} className={modalInputCls} />
              </div>

              {/* Type of Beneficiary - Dropdown */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#333]">Type of Beneficiary</label>
                <select
                  value={formData.typeOfBeneficiary}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setShowAddBeneficiaryType(true);
                    } else {
                      handleFormChange('typeOfBeneficiary', e.target.value);
                    }
                  }}
                  className={modalSelectCls}
                >
                  <option value="">Select Type</option>
                  {typeOfBeneficiaryOptions.map(option => (
                    <option key={option.id} value={option.value}>{option.value}</option>
                  ))}
                  <option value="__add_new__" style={{ color: '#146184', fontWeight: 'bold' }}>+ Add New Type</option>
                </select>
              </div>

              {/* Entry Point Multi-Select */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#333]">Entry Point</label>
                <div className="flex flex-wrap gap-2 p-3 border border-[#d0d0d0] rounded-lg bg-[#f9f9f9] min-h-[48px]">
                  {entryPointOptions.length === 0 && !showEntryPointInput && (
                    <span className="text-[11px] text-[#999]">No entry points yet. Click &quot;Add Entry Point&quot; to create one.</span>
                  )}
                  {entryPointOptions.map(option => (
                    <div key={option.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => toggleCategory(option.value)}
                        className={`py-1.5 px-3 pr-6 rounded-full text-[11px] font-medium border transition-all duration-200 cursor-pointer ${
                          selectedCategories.includes(option.value)
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-[#555] border-[#d0d0d0] hover:border-primary hover:text-primary'
                        }`}
                      >
                        {selectedCategories.includes(option.value) && <Icon icon="mdi:check" width={12} height={12} className="inline mr-1" />}
                        {option.value}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeEntryPoint(option); }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-[#dc3545] text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                        title="Remove entry point"
                      >
                        <Icon icon="mdi:close" width={10} height={10} />
                      </button>
                    </div>
                  ))}
                  {showEntryPointInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newEntryPointInput}
                        onChange={(e) => setNewEntryPointInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewEntryPoint(); } if (e.key === 'Escape') { setShowEntryPointInput(false); setNewEntryPointInput(''); } }}
                        placeholder="Type entry point name..."
                        className="py-1 px-2 border border-primary rounded text-[11px] w-[140px] focus:outline-none"
                        autoFocus
                      />
                      <button type="button" onClick={addNewEntryPoint} className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center border-none cursor-pointer hover:bg-accent">
                        <Icon icon="mdi:check" width={14} height={14} />
                      </button>
                      <button type="button" onClick={() => { setShowEntryPointInput(false); setNewEntryPointInput(''); }} className="w-6 h-6 bg-[#f0f0f0] text-[#666] rounded flex items-center justify-center border-none cursor-pointer hover:bg-[#e0e0e0]">
                        <Icon icon="mdi:close" width={14} height={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEntryPointInput(true)}
                      className="py-1.5 px-3 rounded-full text-[11px] font-medium border border-dashed border-[#999] text-[#666] bg-transparent hover:border-primary hover:text-primary transition-all duration-200 cursor-pointer flex items-center gap-1"
                    >
                      <Icon icon="mdi:plus" width={12} height={12} />
                      Add Entry Point
                    </button>
                  )}
                </div>
                {selectedCategories.length > 0 && (
                  <span className="text-[11px] text-[#666]">Selected: {selectedCategories.join(', ')}</span>
                )}
              </div>

              {/* Stakeholder - Multiple with Logo Upload */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold text-[#333]">Stakeholder</label>
                {partnerLGUs.map((lgu, idx) => (
                  <div key={idx} className={`flex items-center gap-2 ${idx > 0 ? 'mt-2' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-[#f0f0f0] border border-[#d0d0d0] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {lgu.logoUrl ? (
                        <img src={lgu.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Icon icon="mdi:domain" width={20} height={20} color="#999" />
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter stakeholder name"
                      value={lgu.name}
                      onChange={(e) => handlePartnerLGUNameChange(idx, e.target.value)}
                      className={`${modalInputCls} flex-1`}
                    />
                    <label className="w-8 h-8 flex items-center justify-center bg-[#f5a623] text-white rounded-md cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                      <Icon icon="mdi:camera" width={16} height={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handlePartnerLGULogoChange(idx, e.target.files[0])}
                      />
                    </label>
                    {partnerLGUs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartnerLGU(idx)}
                        className="w-7 h-7 bg-[#f5f5f5] border border-[#ddd] rounded-full flex items-center justify-center cursor-pointer text-[#c62828] hover:bg-[#fce4ec] hover:border-[#c62828] transition-all flex-shrink-0"
                      >
                        <Icon icon="mdi:close" width={14} height={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPartnerLGU} className="inline-flex items-center gap-1 bg-transparent border-none text-accent text-xs font-semibold cursor-pointer p-0 py-1 mt-1 hover:text-accent-hover hover:underline">
                  <Icon icon="mdi:plus" width={14} height={14} /> Add More Stakeholder
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Cooperator&apos;s Name</label>
                  <input type="text" placeholder="Enter cooperator's name" value={formData.cooperatorName} onChange={(e) => handleFormChange('cooperatorName', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Contact Number</label>
                  {contactNumbers.map((num, idx) => (
                    <div key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="e.g. 09123456789"
                          value={num}
                          onChange={(e) => handleContactChange(idx, e.target.value)}
                          className={`${modalInputCls} flex-1 ${num.length > 0 ? (isContactValid(num) ? 'border-green-600! shadow-[0_0_0_2px_rgba(22,163,74,0.1)]!' : 'border-red-600! shadow-[0_0_0_2px_rgba(220,38,38,0.1)]!') : ''}`}
                        />
                        {contactNumbers.length > 1 && (
                          <button type="button" onClick={() => removeContact(idx)} className="w-[22px] h-[22px] min-w-[22px] bg-[#f5f5f5] border border-[#ddd] rounded-full flex items-center justify-center cursor-pointer text-[#c62828] hover:bg-[#fce4ec] hover:border-[#c62828] transition-all">
                            <Icon icon="mdi:close" width={14} height={14} />
                          </button>
                        )}
                      </div>
                      {num.length > 0 && !isContactValid(num) && <span className="text-red-600 text-[11px] mt-0.5 block">Must be 11 digits starting with 09</span>}
                    </div>
                  ))}
                  <button type="button" onClick={addContact} className="inline-flex items-center gap-1 bg-transparent border-none text-accent text-xs font-semibold cursor-pointer p-0 py-1 mt-1 hover:text-accent-hover hover:underline">
                    <Icon icon="mdi:plus" width={14} height={14} /> Add More
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Email Address</label>
                  {emails.map((email, idx) => (
                    <div key={idx} className={`flex items-center gap-1.5 ${idx > 0 ? 'mt-2' : ''}`}>
                      <input
                        type="email"
                        placeholder="Enter email"
                        value={email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        className={`${modalInputCls} flex-1`}
                      />
                      {emails.length > 1 && (
                        <button type="button" onClick={() => removeEmail(idx)} className="w-[22px] h-[22px] min-w-[22px] bg-[#f5f5f5] border border-[#ddd] rounded-full flex items-center justify-center cursor-pointer text-[#c62828] hover:bg-[#fce4ec] hover:border-[#c62828] transition-all">
                          <Icon icon="mdi:close" width={14} height={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addEmail} className="inline-flex items-center gap-1 bg-transparent border-none text-accent text-xs font-semibold cursor-pointer p-0 py-1 mt-1 hover:text-accent-hover hover:underline">
                    <Icon icon="mdi:plus" width={14} height={14} /> Add More
                  </button>
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
                    {programFundingOptions.map(option => (
                      <option key={option.id} value={option.value}>{option.value}</option>
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

              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Released Amount</label>
                  <input type="text" placeholder="e.g. 150000" value={formData.releasedAmount} onChange={(e) => handleFormChange('releasedAmount', e.target.value.replace(/[^\d.]/g, ''))} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Counterpart Amount</label>
                  <input type="text" placeholder="e.g. 50000" value={formData.counterpartAmount} onChange={(e) => handleFormChange('counterpartAmount', e.target.value.replace(/[^\d.]/g, ''))} className={modalInputCls} />
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
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newFundingName.trim() && !savingOption) {
                  e.preventDefault();
                  await addNewProgramFunding(newFundingName.trim());
                  setShowAddFunding(false);
                  setNewFundingName('');
                }
              }}
              placeholder="Enter funding source name"
              className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
              autoFocus
              disabled={savingOption}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddFunding(false); setNewFundingName(''); }} disabled={savingOption} className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={!newFundingName.trim() || savingOption}
                onClick={async () => {
                  if (newFundingName.trim()) {
                    await addNewProgramFunding(newFundingName.trim());
                    setShowAddFunding(false);
                    setNewFundingName('');
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingOption ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Type of Beneficiary Modal */}
      {showAddBeneficiaryType && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
          <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-base font-bold text-primary mb-3">Add Type of Beneficiary</h3>
            <input
              type="text"
              value={newBeneficiaryTypeName}
              onChange={(e) => setNewBeneficiaryTypeName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && newBeneficiaryTypeName.trim() && !savingOption) {
                  e.preventDefault();
                  await addNewBeneficiaryType(newBeneficiaryTypeName.trim());
                  setShowAddBeneficiaryType(false);
                  setNewBeneficiaryTypeName('');
                }
              }}
              placeholder="Enter type name"
              className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
              autoFocus
              disabled={savingOption}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowAddBeneficiaryType(false); setNewBeneficiaryTypeName(''); }} disabled={savingOption} className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50">Cancel</button>
              <button
                type="button"
                disabled={!newBeneficiaryTypeName.trim() || savingOption}
                onClick={async () => {
                  if (newBeneficiaryTypeName.trim()) {
                    await addNewBeneficiaryType(newBeneficiaryTypeName.trim());
                    setShowAddBeneficiaryType(false);
                    setNewBeneficiaryTypeName('');
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingOption ? 'Saving...' : 'Add'}
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

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1300]">
          <div className="bg-white rounded-lg w-full max-w-[350px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#e8f5e9] rounded-full flex items-center justify-center">
              <Icon icon="mdi:check-circle" width={40} height={40} className="text-[#2e7d32]" />
            </div>
            <h3 className="text-lg font-bold text-[#333] mb-2">Option Added Successfully</h3>
            <p className="text-sm text-[#666] mb-5">{confirmationMessage}</p>
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition-colors"
            >
              OK
            </button>
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