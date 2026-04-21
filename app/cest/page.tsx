'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
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
  code: string | null;
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


const modalInputCls = "w-full py-2 px-3 border border-[#d0d0d0] rounded-lg text-[13px] font-[inherit] text-[#333] bg-white transition-all duration-200 placeholder:text-[#aaa] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";
const modalSelectCls = `${modalInputCls} modal-select`;
const errCls = "border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!";

const sortFilterCategories = [
  { key: 'projectTitle', label: 'Project Title' },
  { key: 'code', label: 'Project Code' },
  { key: 'year', label: 'Year' },
  { key: 'location', label: 'Location' },
  { key: 'beneficiaries', label: 'Beneficiaries' },
  { key: 'typeOfBeneficiary', label: 'Type of Beneficiary' },
  { key: 'programFunding', label: 'Program/Funding' },
  { key: 'status', label: 'Status' },
  { key: 'staffAssigned', label: 'Assignee' },
  { key: 'approvedAmount', label: 'Approved Amount' },
];

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
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showAddFunding, setShowAddFunding] = useState(false);
  const [newFundingName, setNewFundingName] = useState('');
  const [showAddBeneficiaryType, setShowAddBeneficiaryType] = useState(false);
  const [newBeneficiaryTypeName, setNewBeneficiaryTypeName] = useState('');
  const [mapFlyTarget, setMapFlyTarget] = useState<[number, number] | null>(null);

  // Import modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<{ current: number; total: number } | null>(null);
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; geocoded: number; skipped: number; skippedTitles: string[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  // Sort and filter state
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  // Address data states (fetched from API)
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string }[]>([]);
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>([]);

  // Barangay searchable dropdown state
  const [barangaySearch, setBarangaySearch] = useState('');
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const barangayRef = useRef<HTMLDivElement>(null);

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

  // Fetch provinces on mount
  useEffect(() => {
    fetch('/api/address/provinces')
      .then(res => res.json())
      .then((data: { id: string; name: string }[]) => setProvinces(data))
      .catch(() => console.error('Failed to fetch provinces'));
  }, []);

  // Fetch municipalities when province changes
  useEffect(() => {
    if (!formData.province) {
      setMunicipalities([]);
      return;
    }
    const province = provinces.find(p => p.name === formData.province);
    if (!province) {
      setMunicipalities([]);
      return;
    }
    fetch(`/api/address/municipalities?provinceId=${encodeURIComponent(province.id)}`)
      .then(res => res.json())
      .then((data: { id: string; name: string }[]) => setMunicipalities(data))
      .catch(() => console.error('Failed to fetch municipalities'));
  }, [formData.province, provinces]);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (!formData.municipality) {
      setBarangays([]);
      return;
    }
    const municipality = municipalities.find(m => m.name === formData.municipality);
    if (!municipality) {
      setBarangays([]);
      return;
    }
    fetch(`/api/address/barangays?municipalityId=${encodeURIComponent(municipality.id)}`)
      .then(res => res.json())
      .then((data: { id: string; name: string }[]) => {
        // Remove duplicates by name and sort alphabetically
        const uniqueMap = new Map<string, { id: string; name: string }>();
        data.forEach(b => {
          if (!uniqueMap.has(b.name)) uniqueMap.set(b.name, b);
        });
        const unique = Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        setBarangays(unique);
      })
      .catch(() => console.error('Failed to fetch barangays'));
  }, [formData.municipality, municipalities]);

  // Auto-geocode when address fields change
  useEffect(() => {
    // Only geocode if at least barangay is selected
    if (!formData.barangay || !formData.municipality || !formData.province) return;

    // Build the query from most specific to least specific
    const addressParts = [
      formData.villaPurok,
      formData.barangay,
      formData.municipality,
      formData.province,
      'Philippines'
    ].filter(Boolean);

    const query = addressParts.join(', ');

    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          const lat = parseFloat(data[0].lat).toFixed(6);
          const lng = parseFloat(data[0].lon).toFixed(6);
          setFormData(prev => ({ ...prev, coordinates: `${lat},${lng}` }));
        }
      })
      .catch(() => console.error('Failed to geocode address'));
  }, [formData.barangay, formData.villaPurok, formData.municipality, formData.province]);

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
    setBarangaySearch('');
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
  }, [projects, searchQuery, filterCategory, filterValue]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);
      if (barangayRef.current && !barangayRef.current.contains(e.target as Node)) setShowBarangayDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Filter projects by search query, column filter, then sort
  const filteredProjects = projects
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (p.code ?? '').toLowerCase().includes(q) ||
        p.projectTitle.toLowerCase().includes(q) ||
        (p.location?.toLowerCase().includes(q) ?? false) ||
        (p.staffAssigned?.toLowerCase().includes(q) ?? false) ||
        (p.beneficiaries?.toLowerCase().includes(q) ?? false) ||
        (p.typeOfBeneficiary?.toLowerCase().includes(q) ?? false) ||
        (p.programFunding?.toLowerCase().includes(q) ?? false) ||
        (p.status?.toLowerCase().includes(q) ?? false);
    })
    .filter(p => {
      if (!filterCategory || !filterValue.trim()) return true;
      const v = filterValue.toLowerCase();
      if (filterCategory === 'year') {
        return p.year ? p.year.toLowerCase().includes(v) : false;
      }
      if (filterCategory === 'approvedAmount') {
        return p.approvedAmount != null ? p.approvedAmount.toString().includes(v) : false;
      }
      const fieldVal = (p as unknown as Record<string, unknown>)[filterCategory];
      return typeof fieldVal === 'string' && fieldVal.toLowerCase().includes(v);
    })
    .sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'approvedAmount' || sortField === 'releasedAmount' || sortField === 'counterpartAmount') {
        const valA = (a as unknown as Record<string, number | null>)[sortField] ?? 0;
        const valB = (b as unknown as Record<string, number | null>)[sortField] ?? 0;
        return dir * (valA - valB);
      }
      if (sortField === 'code') {
        // Extract numeric part for proper sorting
        const numA = parseInt((a.code ?? '').replace(/\D/g, '')) || 0;
        const numB = parseInt((b.code ?? '').replace(/\D/g, '')) || 0;
        return dir * (numA - numB);
      }
      const valA = ((a as unknown as Record<string, string>)[sortField]) || '';
      const valB = ((b as unknown as Record<string, string>)[sortField]) || '';
      return dir * valA.localeCompare(valB);
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
    const total = selectedProjects.length;
    setDeleting(true);
    setDeleteProgress({ current: 0, total });
    try {
      for (let i = 0; i < selectedProjects.length; i++) {
        await fetch(`/api/cest-projects/${selectedProjects[i]}`, { method: 'DELETE', headers: getAuthHeaders() });
        setDeleteProgress({ current: i + 1, total });
      }
      setSelectedProjects([]);
      await fetchProjects();
    } catch {
      console.error('Failed to delete projects');
    } finally {
      setDeleting(false);
      setDeleteProgress(null);
    }
  };

  const handleExportExcel = () => {
    const projectsToExport = selectedProjects.length > 0
      ? filteredProjects.filter(p => selectedProjects.includes(p.id))
      : filteredProjects;
    if (projectsToExport.length === 0) return;

    const wb = XLSX.utils.book_new();

    // Title row + metadata
    const titleRows = [
      ['CEST — Project Masterlist'],
      [`Exported: ${new Date().toLocaleDateString()} | ${projectsToExport.length} project(s)`],
      [], // blank spacer
      ['#', 'Code', 'Project Title', 'Location', 'Beneficiaries', 'Type of Beneficiary', 'Program/Funding', 'Status', 'Entry Point', 'Approved Amount', 'Released Amount', 'Counterpart Amount', 'Project Duration', 'Year', 'Date of Approval', 'Assignee', 'Partner LGUs', 'Contact No.', 'Email'],
      ...projectsToExport.map((p, i) => [
        i + 1,
        p.code,
        p.projectTitle,
        p.location || '—',
        p.beneficiaries || '—',
        p.typeOfBeneficiary || '—',
        p.programFunding || '—',
        p.status || '—',
        p.categories?.join(', ') || '—',
        p.approvedAmount != null ? p.approvedAmount : '—',
        p.releasedAmount != null ? p.releasedAmount : '—',
        p.counterpartAmount != null ? p.counterpartAmount : '—',
        p.projectDuration || '—',
        p.year || '—',
        p.dateOfApproval || '—',
        p.staffAssigned || '—',
        p.partnerLGUs?.map(l => l.name).join(', ') || '—',
        p.contactNumbers?.join(', ') || '—',
        p.emails?.join(', ') || '—',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(titleRows);

    const totalCols = 19;

    // Merge title across all columns
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Subtitle
    ];

    // Column widths
    ws['!cols'] = [
      { wch: 4 },  // #
      { wch: 12 }, // Code
      { wch: 40 }, // Project Title
      { wch: 28 }, // Location
      { wch: 25 }, // Beneficiaries
      { wch: 18 }, // Type of Beneficiary
      { wch: 14 }, // Program/Funding
      { wch: 12 }, // Status
      { wch: 20 }, // Entry Point
      { wch: 14 }, // Approved Amount
      { wch: 14 }, // Released Amount
      { wch: 14 }, // Counterpart Amount
      { wch: 16 }, // Project Duration
      { wch: 7 },  // Year
      { wch: 14 }, // Date of Approval
      { wch: 18 }, // Assignee
      { wch: 22 }, // Partner LGUs
      { wch: 16 }, // Contact No.
      { wch: 26 }, // Email
    ];

    // Row heights
    ws['!rows'] = [
      { hpt: 28 }, // Title
      { hpt: 16 }, // Subtitle
      { hpt: 8 },  // Spacer
      { hpt: 20 }, // Header
      ...projectsToExport.map(() => ({ hpt: 16 })),
    ];

    // Style helpers
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '146184' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
    const subtitleStyle = {
      font: { sz: 10, color: { rgb: 'FFFFFF' }, italic: true },
      fill: { fgColor: { rgb: '1a7a9a' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
    const headerStyle = {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1a6b7a' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'FFFFFF' } },
        bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
        left: { style: 'thin', color: { rgb: 'FFFFFF' } },
        right: { style: 'thin', color: { rgb: 'FFFFFF' } },
      },
    };
    const evenRowStyle = {
      font: { sz: 9 },
      fill: { fgColor: { rgb: 'F0F8FA' } },
      alignment: { vertical: 'center', wrapText: false },
      border: {
        bottom: { style: 'hair', color: { rgb: 'D0E8EE' } },
      },
    };
    const oddRowStyle = {
      font: { sz: 9 },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', wrapText: false },
      border: {
        bottom: { style: 'hair', color: { rgb: 'D0E8EE' } },
      },
    };

    // Apply title styles
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!ws[titleCell]) ws[titleCell] = {};
    ws[titleCell].s = titleStyle;

    const subtitleCell = XLSX.utils.encode_cell({ r: 1, c: 0 });
    if (!ws[subtitleCell]) ws[subtitleCell] = {};
    ws[subtitleCell].s = subtitleStyle;

    // Fill title/subtitle bg across all merged cols
    for (let c = 1; c < totalCols; c++) {
      const r0 = XLSX.utils.encode_cell({ r: 0, c });
      const r1 = XLSX.utils.encode_cell({ r: 1, c });
      ws[r0] = { s: { fill: { fgColor: { rgb: '146184' } } } };
      ws[r1] = { s: { fill: { fgColor: { rgb: '1a7a9a' } } } };
    }

    // Apply header row styles (row index 3)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 3, c });
      if (!ws[cellRef]) ws[cellRef] = {};
      ws[cellRef].s = headerStyle;
    }

    // Apply data row styles
    projectsToExport.forEach((_, i) => {
      const rowIdx = 4 + i;
      const style = i % 2 === 0 ? evenRowStyle : oddRowStyle;
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        ws[cellRef].s = { ...style };
      }
    });

    XLSX.utils.book_append_sheet(wb, ws, 'CEST Masterlist');
    XLSX.writeFile(wb, `CEST_Masterlist_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    const projectsToExport = selectedProjects.length > 0
      ? filteredProjects.filter(p => selectedProjects.includes(p.id))
      : filteredProjects;
    if (projectsToExport.length === 0) return;

    // A4 landscape for more columns
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = 297;
    const marginLeft = 10;
    const marginRight = 10;
    const tableWidth = pageWidth - marginLeft - marginRight; // 277mm

    doc.setFontSize(14);
    doc.setTextColor(20, 97, 132);
    doc.text('CEST — Project Masterlist', marginLeft, 14);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleDateString()} | ${projectsToExport.length} project(s)`, marginLeft, 19);

    // Column widths proportional to tableWidth
    const colWidths = [6, 12, 35, 30, 25, 18, 15, 22, 22, 22, 20, 10, 20, 20].map(w => w / 277 * tableWidth);

    autoTable(doc, {
      startY: 23,
      head: [['#', 'Code', 'Project Title', 'Location', 'Beneficiaries', 'Program', 'Status', 'Approved Amt', 'Released Amt', 'Counterpart', 'Duration', 'Year', 'Date Approved', 'Assignee']],
      body: projectsToExport.map((p, i) => [
        i + 1,
        p.code,
        p.projectTitle,
        p.location || '—',
        p.beneficiaries || '—',
        p.programFunding || '—',
        p.status || '—',
        p.approvedAmount != null ? formatCurrency(p.approvedAmount) : '—',
        p.releasedAmount != null ? formatCurrency(p.releasedAmount) : '—',
        p.counterpartAmount != null ? formatCurrency(p.counterpartAmount) : '—',
        p.projectDuration || '—',
        p.year || '—',
        p.dateOfApproval || '—',
        p.staffAssigned || '—',
      ]),
      styles: { fontSize: 5.5, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [20, 97, 132], textColor: 255, fontStyle: 'bold', fontSize: 5.5 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: tableWidth,
      columnStyles: Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }])),
    });

    doc.save(`CEST_Masterlist_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'province') { updated.municipality = ''; updated.barangay = ''; updated.coordinates = ''; }
      if (field === 'municipality') { updated.barangay = ''; updated.coordinates = ''; }
      return updated;
    });
    // Reset barangay search when province or municipality changes
    if (field === 'province' || field === 'municipality') {
      setBarangaySearch('');
    }
    // Sync barangay search when barangay is directly set
    if (field === 'barangay') {
      setBarangaySearch(value);
    }
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
    setBarangaySearch(barangay);
    setEditingProjectId(project.id);
    setFormErrors({});
    setSaveError('');
    setShowAddModal(true);
  };

  // Available fields for CEST column mapping
  const cestFields = [
    { key: '', label: '-- Skip this column --' },
    { key: 'code', label: 'Project Code' },
    { key: 'projectTitle', label: 'Project Title' },
    { key: 'location', label: 'Location' },
    { key: 'coordinates', label: 'Coordinates' },
    { key: 'beneficiaries', label: 'Beneficiaries' },
    { key: 'typeOfBeneficiary', label: 'Type of Beneficiary' },
    { key: 'programFunding', label: 'Program/Funding' },
    { key: 'stakeholderCounterparts', label: 'Partner Stakeholder' },
    { key: 'status', label: 'Status' },
    { key: 'approvedAmount', label: 'Approved Amount' },
    { key: 'releasedAmount', label: 'Released Amount' },
    { key: 'counterpartAmount', label: 'Counterpart Amount' },
    { key: 'projectDuration', label: 'Project Duration' },
    { key: 'staffAssigned', label: 'Staff Assigned' },
    { key: 'year', label: 'Year' },
    { key: 'dateOfApproval', label: 'Date of Approval' },
    { key: 'emails', label: 'Emails' },
    { key: 'contactNumbers', label: 'Contact Numbers' },
    { key: 'categories', label: 'Categories' },
  ];

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError('');
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(allRows.length, 10); i++) {
          const row = allRows[i];
          if (Array.isArray(row)) {
            const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
            if (rowStr.includes('project title') || rowStr.includes('project name') ||
                (rowStr.includes('title') && rowStr.includes('code'))) {
              headerRowIndex = i;
              break;
            }
          }
        }
        if (headerRowIndex === -1) {
          setImportError('Could not find header row. Please ensure your Excel file has a row with column headers like "Project Title", "Code", etc.');
          return;
        }

        const headerRow = allRows[headerRowIndex];
        const headers = (headerRow as string[]).map(h => String(h || '').trim()).filter(h => h && h !== '#');
        setImportColumns(headers);

        const autoMapping: Record<string, string> = {};
        headers.forEach((header) => {
          const h = header.toLowerCase();
          if (h.includes('code') && !h.includes('contact')) autoMapping[header] = 'code';
          else if (h.includes('title') || h.includes('project name')) autoMapping[header] = 'projectTitle';
          else if (h.includes('location') || h.includes('address')) autoMapping[header] = 'location';
          else if (h.includes('coordinate')) autoMapping[header] = 'coordinates';
          else if (h.includes('beneficiar') && h.includes('type')) autoMapping[header] = 'typeOfBeneficiary';
          else if (h.includes('beneficiar')) autoMapping[header] = 'beneficiaries';
          else if (h.includes('funding') || h.includes('program')) autoMapping[header] = 'programFunding';
          else if (h.includes('status')) autoMapping[header] = 'status';
          else if (h.includes('approved') && h.includes('amount')) autoMapping[header] = 'approvedAmount';
          else if (h.includes('released') && h.includes('amount')) autoMapping[header] = 'releasedAmount';
          else if (h.includes('counterpart')) autoMapping[header] = 'counterpartAmount';
          else if (h.includes('duration')) autoMapping[header] = 'projectDuration';
          else if (h.includes('staff') || h.includes('assigned') || h.includes('assignee')) autoMapping[header] = 'staffAssigned';
          else if (h.includes('year')) autoMapping[header] = 'year';
          else if (h.includes('approval') && h.includes('date')) autoMapping[header] = 'dateOfApproval';
          else if (h.includes('email')) autoMapping[header] = 'emails';
          else if (h.includes('contact') || h.includes('phone')) autoMapping[header] = 'contactNumbers';
          else if (h.includes('categor')) autoMapping[header] = 'categories';
          else if (h.includes('partner') || h.includes('lgu') || h.includes('stakeholder')) autoMapping[header] = 'stakeholderCounterparts';
        });
        setColumnMapping(autoMapping);

        const fullHeaderRow = headerRow as string[];
        const headerIndexMap: Record<string, number> = {};
        fullHeaderRow.forEach((h, idx) => { const s = String(h || '').trim(); if (s && s !== '#') headerIndexMap[s] = idx; });

        const dataRows = allRows.slice(headerRowIndex + 1).map((row) => {
          const rowArray = row as string[];
          const obj: Record<string, string> = {};
          headers.forEach((header) => { const idx = headerIndexMap[header]; if (idx !== undefined) obj[header] = String(rowArray[idx] || '').trim(); });
          return obj;
        }).filter(row => Object.values(row).some(v => v && v.trim() !== ''));

        if (dataRows.length === 0) { setImportError('No valid data rows found in the Excel file.'); return; }
        setImportData(dataRows);
        setImportPreview(true);
      } catch { setImportError('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'); }
    };
    reader.readAsBinaryString(file);
  };

  const handleImportSubmit = async () => {
    const titleColumn = Object.entries(columnMapping).find(([, field]) => field === 'projectTitle')?.[0];
    if (!titleColumn) { setImportError('You must map a column to "Project Title"'); return; }
    setImporting(true);
    setImportError('');
    try {
      const projectsToImport = importData.map(row => {
        const project: Record<string, unknown> = {};
        Object.entries(columnMapping).forEach(([column, field]) => {
          if (field && row[column]) {
            if (field === 'contactNumbers' || field === 'emails' || field === 'categories' || field === 'stakeholderCounterparts') {
              project[field] = row[column].split(/[,;]/).map(v => v.trim()).filter(v => v);
            } else if (field === 'approvedAmount' || field === 'releasedAmount' || field === 'counterpartAmount') {
              const numValue = parseFloat(row[column].replace(/[^0-9.-]/g, ''));
              project[field] = isNaN(numValue) ? null : numValue;
            } else {
              project[field] = row[column];
            }
          }
        });
        return project;
      }).filter(p => p.projectTitle);

      const existingTitles = projects.map(p => p.projectTitle.toLowerCase());
      const uniqueProjects = projectsToImport.filter(p => !existingTitles.includes(String(p.projectTitle).toLowerCase()));
      const skippedProjects = projectsToImport.filter(p => existingTitles.includes(String(p.projectTitle).toLowerCase()));

      if (uniqueProjects.length === 0) { setImportError('All projects already exist (duplicate titles). No projects imported.'); setImporting(false); return; }

      const res = await fetch('/api/cest-projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ projects: uniqueProjects }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => null); throw new Error(errData?.error || 'Failed to import projects'); }
      const result = await res.json();

      await fetchProjects();

      // Geocode missing pins with float loader
      let geocodedCount = 0;
      try {
        setGeocoding(true);
        let geoTotal = 0;
        try {
          const snapRes = await fetch('/api/cest-projects', { headers: getAuthHeaders() });
          const snapData: { coordinates: string | null }[] = await snapRes.json();
          geoTotal = snapData.filter(p => !p.coordinates).length;
          if (geoTotal > 0) setGeocodingProgress({ current: 0, total: geoTotal });
        } catch { /* non-fatal */ }

        const batchPromise = fetch('/api/cest-projects/geocode-batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({}),
        });
        let pollInterval: ReturnType<typeof setInterval> | null = null;
        if (geoTotal > 0) {
          const baseline = geoTotal;
          pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch('/api/cest-projects', { headers: getAuthHeaders() });
              const pollData: { coordinates: string | null }[] = await pollRes.json();
              const done = baseline - pollData.filter(p => !p.coordinates).length;
              setGeocodingProgress({ current: Math.max(0, done), total: baseline });
            } catch { /* non-fatal */ }
          }, 2000);
        }
        const geoRes = await batchPromise;
        if (pollInterval) clearInterval(pollInterval);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          geocodedCount = geoData.updated ?? 0;
          if (geoTotal > 0) setGeocodingProgress({ current: geoTotal, total: geoTotal });
          await fetchProjects();
        }
      } catch { /* non-fatal */ } finally { setGeocoding(false); setGeocodingProgress(null); }

      setImportResult({
        success: result.imported || uniqueProjects.length,
        geocoded: geocodedCount,
        skipped: skippedProjects.length,
        skippedTitles: skippedProjects.map(p => String(p.projectTitle)),
      });
      setImportPreview(false);
      setImportData([]);
      setImportColumns([]);
      setColumnMapping({});
      setImportFile(null);
      if (importFileRef.current) importFileRef.current.value = '';
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import projects');
    } finally {
      setImporting(false);
    }
  };

  const resetImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportData([]);
    setImportColumns([]);
    setColumnMapping({});
    setImportError('');
    setImportPreview(false);
    setImportResult(null);
    if (importFileRef.current) importFileRef.current.value = '';
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
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 py-3 px-5 bg-[#217346] text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-[#1a5c38] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setShowImportModal(true)}
              disabled={importing || geocoding}
            >
              <Icon icon="mdi:upload" width={20} height={20} />
              Import Project
            </button>
            <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover" onClick={() => { resetForm(); setShowAddModal(true); }}>
              <Icon icon="mdi:plus" width={20} height={20} />
              Add New Project
            </button>
          </div>
        </div>


        {/* Filter Cards */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterCards.map(card => (
            <div key={card.id} className="flex-1 flex flex-col items-center justify-center py-5 px-[15px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <span className="text-[11px] text-[#666] mb-2 font-medium text-center">{card.label}</span>
              {loading ? (
                <span className="inline-block w-12 h-8 rounded-lg bg-[#e0eaf0] animate-pulse" />
              ) : (typeof card.value === 'number' ? card.value > 0 : !!card.value) ? (
                <span className={`font-bold ${card.isAmount ? 'text-xl text-[#2e7d32]' : 'text-[28px] text-primary'}`}>{card.value}</span>
              ) : (
                <span className={`font-bold opacity-30 ${card.isAmount ? 'text-xl text-[#2e7d32]' : 'text-[28px] text-primary'}`}>—</span>
              )}
            </div>
          ))}
        </div>

        {/* Masterlist Table */}
        <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-[15px] border-b border-[#e0e0e0]">
            <h2 className="text-lg font-bold text-primary m-0">MASTERLIST</h2>
            {/* Search Bar */}
            <div className="flex-1 flex justify-center items-center mx-4">
              <div className="relative w-full max-w-[400px]">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" width={18} height={18} />
                <input type="text" className="w-full py-2 pl-10 pr-4 border border-[#e0e0e0] rounded-lg text-[13px] bg-[#f9f9f9] transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)] placeholder:text-[#999]" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2.5">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortRef}>
                <button className="flex items-center gap-[5px] py-2 px-[15px] bg-white border border-[#d0d0d0] rounded-lg text-[13px] text-[#333] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary" onClick={() => { setShowSortDropdown(v => !v); setShowFilterDropdown(false); }}>
                  <Icon icon="mdi:sort" width={16} height={16} /> Sort
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-[200px] bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 py-1">
                    {sortFilterCategories.map(cat => (
                      <button key={cat.key} className={`w-full flex items-center justify-between py-2 px-3 text-[13px] text-left border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#f0f8ff] ${sortField === cat.key ? 'text-primary font-semibold' : 'text-[#333]'}`} onClick={() => { if (sortField === cat.key) { setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); } else { setSortField(cat.key); setSortDirection('asc'); } setShowSortDropdown(false); }}>
                        <span>{cat.label}</span>
                        {sortField === cat.key && <Icon icon={sortDirection === 'asc' ? 'mdi:arrow-up' : 'mdi:arrow-down'} width={14} height={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Dropdown */}
              <div className="relative" ref={filterRef}>
                <button className={`flex items-center gap-[5px] py-2 px-[15px] border rounded-lg text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#f5f5f5] hover:border-primary ${filterCategory && filterValue ? 'bg-[#e3f2fd] border-primary text-primary font-semibold' : 'bg-white border-[#d0d0d0] text-[#333]'}`} onClick={() => { setShowFilterDropdown(v => !v); setShowSortDropdown(false); }}>
                  <Icon icon="mdi:filter-variant" width={16} height={16} /> Filter
                  {filterCategory && filterValue && <span className="ml-1 w-[6px] h-[6px] rounded-full bg-primary inline-block" />}
                </button>
                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-[260px] bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 p-3 flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-[#555]">Category</label>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded text-[13px] bg-white focus:outline-none focus:border-primary">
                      <option value="">Select category</option>
                      {sortFilterCategories.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.label}</option>
                      ))}
                    </select>
                    <label className="text-[12px] font-semibold text-[#555]">Value</label>
                    <input type="text" placeholder="Type to filter..." value={filterValue} onChange={e => setFilterValue(e.target.value)} className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded text-[13px] bg-white focus:outline-none focus:border-primary placeholder:text-[#aaa]" />
                    <div className="flex gap-2 mt-1">
                      <button className="flex-1 py-1.5 bg-accent text-white border-none rounded text-[12px] font-semibold cursor-pointer hover:bg-accent-hover" onClick={() => setShowFilterDropdown(false)}>Apply</button>
                      <button className="flex-1 py-1.5 bg-[#f5f5f5] text-[#333] border border-[#d0d0d0] rounded text-[12px] font-semibold cursor-pointer hover:bg-[#e8e8e8]" onClick={() => { setFilterCategory(''); setFilterValue(''); }}>Clear</button>
                    </div>
                  </div>
                )}
              </div>

              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-[#dc3545] text-white border border-[#dc3545] rounded-lg text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#c82333]" onClick={handleExportPDF}>
                <Icon icon="mdi:file-pdf-box" width={16} height={16} /> Export PDF
              </button>
              <button className="flex items-center gap-[5px] py-2 px-[15px] bg-[#217346] text-white border border-[#217346] rounded-lg text-[13px] cursor-pointer transition-all duration-200 hover:bg-[#1a5c38]" onClick={handleExportExcel}>
                <Icon icon="mdi:file-excel-box" width={16} height={16} /> Export Excel
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
                    {provinces.map((prov) => (<option key={prov.id} value={prov.name}>{prov.name}</option>))}
                  </select>
                  <select value={formData.municipality} onChange={(e) => handleFormChange('municipality', e.target.value)} disabled={!formData.province || municipalities.length === 0} className={modalSelectCls}>
                    <option value="">{!formData.province ? 'Select Province first' : municipalities.length === 0 ? 'Loading...' : 'Select City/Municipality'}</option>
                    {municipalities.map((mun) => (<option key={mun.id} value={mun.name}>{mun.name}</option>))}
                  </select>
                  <div ref={barangayRef} className="relative">
                    <input
                      type="text"
                      placeholder={!formData.municipality ? 'Select Municipality first' : barangays.length === 0 ? 'Loading...' : 'Search barangay...'}
                      value={barangaySearch}
                      onChange={(e) => {
                        setBarangaySearch(e.target.value);
                        setShowBarangayDropdown(true);
                        if (e.target.value !== formData.barangay) {
                          setFormData(prev => ({ ...prev, barangay: '' }));
                        }
                      }}
                      onFocus={() => formData.municipality && barangays.length > 0 && setShowBarangayDropdown(true)}
                      disabled={!formData.municipality || barangays.length === 0}
                      className={`${modalInputCls} pr-8`}
                    />
                    <Icon
                      icon={showBarangayDropdown ? "mdi:chevron-up" : "mdi:chevron-down"}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
                      width={18}
                      height={18}
                    />
                    {showBarangayDropdown && barangays.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 max-h-[200px] overflow-y-auto">
                        {barangays
                          .filter(brgy => brgy.name.toLowerCase().includes(barangaySearch.toLowerCase()))
                          .map((brgy) => (
                            <button
                              key={brgy.id}
                              type="button"
                              className={`w-full text-left py-2 px-3 text-[13px] border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#f0f8ff] ${formData.barangay === brgy.name ? 'bg-[#e3f2fd] text-primary font-medium' : 'text-[#333]'}`}
                              onClick={() => {
                                handleFormChange('barangay', brgy.name);
                                setBarangaySearch(brgy.name);
                                setShowBarangayDropdown(false);
                              }}
                            >
                              {brgy.name}
                            </button>
                          ))}
                        {barangays.filter(brgy => brgy.name.toLowerCase().includes(barangaySearch.toLowerCase())).length === 0 && (
                          <div className="py-2 px-3 text-[13px] text-[#999]">No barangays found</div>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* Geocoding Float Loader */}
      {geocoding && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1300] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.25)] p-8 w-[380px] flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#e0f7fa]">
              <Icon icon="mdi:map-marker-radius-outline" width={30} height={30} color="#00838f" />
            </div>
            <div className="text-center w-full">
              <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-1">Setting Up Map Pins...</h3>
              <p className="text-[13px] text-[#666] mb-4">
                {geocodingProgress ? `${geocodingProgress.current} of ${geocodingProgress.total} pins geocoded` : 'Preparing pins...'}
              </p>
              <div className="w-full h-2.5 bg-[#e0eaf0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 bg-[#00838f]"
                  style={{ width: geocodingProgress && geocodingProgress.total > 0 ? `${Math.round((geocodingProgress.current / geocodingProgress.total) * 100)}%` : '4%' }} />
              </div>
              <p className="text-[12px] font-semibold mt-2 text-[#00838f]">
                {geocodingProgress && geocodingProgress.total > 0 ? `${Math.round((geocodingProgress.current / geocodingProgress.total) * 100)}%` : '...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Float Progress Loader */}
      {deleteProgress && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1300] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.25)] p-8 w-[380px] flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#fdecea]">
              <Icon icon="mdi:delete-sweep-outline" width={30} height={30} color="#c62828" />
            </div>
            <div className="text-center w-full">
              <h3 className="text-[17px] font-bold text-[#1a1a2e] mb-1">Deleting Projects...</h3>
              <p className="text-[13px] text-[#666] mb-4">
                {deleteProgress.current} of {deleteProgress.total} project{deleteProgress.total > 1 ? 's' : ''} deleted
              </p>
              <div className="w-full h-2.5 bg-[#f5e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300 bg-[#c62828]"
                  style={{ width: deleteProgress.total > 0 ? `${Math.round((deleteProgress.current / deleteProgress.total) * 100)}%` : '4%' }} />
              </div>
              <p className="text-[12px] font-semibold mt-2 text-[#c62828]">
                {deleteProgress.total > 0 ? `${Math.round((deleteProgress.current / deleteProgress.total) * 100)}%` : '...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Project Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={resetImportModal}>
          <div className="bg-white rounded-[20px] py-[25px] px-[35px] w-full max-w-[800px] max-h-[85vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <input ref={importFileRef} type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} className="hidden" id="cest-import-file-input" />
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={resetImportModal}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-1">Import CEST Projects</h2>
            <p className="text-xs text-[#888] m-0 mb-4">Upload an Excel file (.xlsx, .xls) to import multiple projects at once</p>

            {importResult && (
              <div className="mb-4 p-4 rounded-lg bg-[#e8f5e9] border border-[#4caf50]">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:check-circle" width={24} height={24} className="text-[#2e7d32]" />
                  <span className="text-[#2e7d32] font-semibold">Import Complete</span>
                </div>
                <div className="flex gap-6 mb-2">
                  <div className="text-center">
                    <p className="text-[22px] font-bold text-[#2e7d32] m-0">{importResult.success}</p>
                    <p className="text-[11px] text-[#666] m-0">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[22px] font-bold text-[#00838f] m-0">{importResult.geocoded}</p>
                    <p className="text-[11px] text-[#666] m-0">Map Pins Set</p>
                  </div>
                  {importResult.skipped > 0 && (
                    <div className="text-center">
                      <p className="text-[22px] font-bold text-[#f57c00] m-0">{importResult.skipped}</p>
                      <p className="text-[11px] text-[#666] m-0">Skipped</p>
                    </div>
                  )}
                </div>
                {importResult.skipped > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-[#f57c00] m-0">Skipped duplicates:</p>
                    <ul className="text-xs text-[#666] m-0 mt-1 pl-4">
                      {importResult.skippedTitles.slice(0, 5).map((title, idx) => <li key={idx}>{title}</li>)}
                      {importResult.skippedTitles.length > 5 && <li>...and {importResult.skippedTitles.length - 5} more</li>}
                    </ul>
                  </div>
                )}
                <button className="mt-3 py-2 px-6 bg-[#2e7d32] text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#1b5e20]" onClick={resetImportModal}>Done</button>
              </div>
            )}

            {!importResult && (
              <>
                {!importPreview && (
                  <div className="mb-4">
                    <label htmlFor="cest-import-file-input" className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-[#d0d0d0] rounded-xl cursor-pointer text-[#999] transition-all duration-200 hover:border-primary hover:text-primary hover:bg-[#f0f8ff]">
                      <Icon icon="mdi:file-excel" width={48} height={48} />
                      <span className="text-sm font-medium">{importFile ? importFile.name : 'Click to upload Excel file'}</span>
                      <span className="text-xs">Supports .xlsx and .xls files</span>
                    </label>
                  </div>
                )}

                {importPreview && importColumns.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-[#333] m-0">Map Excel Columns to Project Fields</h3>
                      <span className="text-xs text-[#888]">{importData.length} row(s) found</span>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto border border-[#e0e0e0] rounded-lg mb-4">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f5f5f5] sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-left font-semibold text-[#333] border-b border-[#e0e0e0]">Excel Column</th>
                            <th className="py-2 px-3 text-left font-semibold text-[#333] border-b border-[#e0e0e0]">Map To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importColumns.map((col, idx) => (
                            <tr key={idx} className="border-b border-[#eee] last:border-b-0">
                              <td className="py-2 px-3 font-medium text-[#333]">{col}</td>
                              <td className="py-2 px-3">
                                <select value={columnMapping[col] || ''} onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))} className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded text-xs focus:outline-none focus:border-primary">
                                  {cestFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-[#333] m-0 mb-2">Data Preview ({importData.length} rows)</h3>
                      <div className="max-h-[250px] overflow-auto border border-[#e0e0e0] rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-[#f5f5f5] sticky top-0">
                            <tr>
                              <th className="py-2 px-2 text-left font-semibold text-[#333] border-b border-[#e0e0e0] whitespace-nowrap">#</th>
                              {importColumns.slice(0, 6).map((col, idx) => <th key={idx} className="py-2 px-2 text-left font-semibold text-[#333] border-b border-[#e0e0e0] whitespace-nowrap max-w-[150px]">{col}</th>)}
                              {importColumns.length > 6 && <th className="py-2 px-2 text-left font-semibold text-[#888] border-b border-[#e0e0e0]">+{importColumns.length - 6} more</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {importData.map((row, rowIdx) => (
                              <tr key={rowIdx} className={`border-b border-[#eee] last:border-b-0 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                                <td className="py-1.5 px-2 text-[#999] font-medium">{rowIdx + 1}</td>
                                {importColumns.slice(0, 6).map((col, colIdx) => <td key={colIdx} className="py-1.5 px-2 text-[#333] max-w-[150px] truncate" title={row[col] || ''}>{row[col] || '-'}</td>)}
                                {importColumns.length > 6 && <td className="py-1.5 px-2 text-[#888]">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="p-3 bg-[#fff3e0] rounded-lg">
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:information" width={18} height={18} className="text-[#f57c00] mt-0.5" />
                        <div className="text-xs text-[#333]">
                          <p className="m-0 font-semibold">Note:</p>
                          <p className="m-0">• "Project Title" mapping is required</p>
                          <p className="m-0">• Projects with duplicate titles will be skipped</p>
                          <p className="m-0">• Contact numbers, emails, and categories can be separated by commas</p>
                          <p className="m-0">• Map pins will be auto-generated after import</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {importError && (
                  <div className="mb-4 p-3 bg-[#ffebee] border border-[#ef5350] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:alert-circle" width={18} height={18} className="text-[#c62828]" />
                      <span className="text-sm text-[#c62828]">{importError}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  {importPreview && (
                    <button className="py-2.5 px-6 bg-[#f5f5f5] text-[#333] border border-[#d0d0d0] rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#e0e0e0]"
                      onClick={() => { setImportPreview(false); setImportData([]); setImportColumns([]); setColumnMapping({}); setImportFile(null); if (importFileRef.current) importFileRef.current.value = ''; }}>
                      Back
                    </button>
                  )}
                  <button className="py-2.5 px-6 bg-[#217346] text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#1a5c38] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleImportSubmit} disabled={!importPreview || importing}>
                    {importing ? 'Importing...' : `Import ${importData.length} Project(s)`}
                  </button>
                </div>
              </>
            )}
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
              <MapSearchBar onSelect={(coords) => setMapFlyTarget(coords)} initialQuery={[formData.villaPurok, formData.barangay, formData.municipality, formData.province].filter(Boolean).join(', ')} />
            </div>
            <div className="w-full h-[400px]">
              <MapPickerInner
                lat={formData.coordinates ? parseFloat(formData.coordinates.split(',')[0]) : null}
                lng={formData.coordinates ? parseFloat(formData.coordinates.split(',')[1]) : null}
                onPick={(lat, lng) => { setFormData(prev => ({ ...prev, coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}` })); }}
                flyTo={formData.coordinates
                  ? [parseFloat(formData.coordinates.split(',')[0]), parseFloat(formData.coordinates.split(',')[1])] as [number, number]
                  : mapFlyTarget}
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
  // Use a stable key to avoid dependency array size changes
  const targetKey = flyTo ? `${flyTo[0]},${flyTo[1]}` : (lat !== null && lng !== null ? `${lat},${lng}` : null);
  useEffect(() => {
    if (!targetKey) return;
    const [targetLat, targetLng] = targetKey.split(',').map(Number);
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
    }, 500);
    return () => clearTimeout(timer);
  }, [targetKey, comps]);

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