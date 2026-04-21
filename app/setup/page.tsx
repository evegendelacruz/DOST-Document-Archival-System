'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import DashboardLayout from '../components/DashboardLayout';
import 'leaflet/dist/leaflet.css';
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


const filterTabs = [
  { id: 'PROPOSAL', label: 'Proposal', color: '#1565c0' },
  { id: 'APPROVED', label: 'Approved', color: '#2e7d32' },
  { id: 'ONGOING', label: 'Ongoing', color: '#f57f17' },
  { id: 'WITHDRAWN', label: 'Withdrawal', color: '#757575' },
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
  assigneeProfileUrl: string | null;
  year: string | null;
  companyLogoUrl: string | null;
  createdAt: string;
}

const statusDisplay: Record<string, string> = {
  PROPOSAL: 'Proposal',
  APPROVED: 'Approved',
  ONGOING: 'Ongoing',
  WITHDRAWN: 'Withdrawal',
  TERMINATED: 'Terminated',
  GRADUATED: 'Graduated',
};

const statusColors: Record<string, string> = {
  PROPOSAL: 'bg-[#e3f2fd] text-[#1565c0]',
  APPROVED: 'bg-[#e8f5e9] text-[#2e7d32]',
  ONGOING: 'bg-[#fff8e1] text-[#f57f17]',
  WITHDRAWN: 'bg-[#f0f0f0] text-[#757575]',
  TERMINATED: 'bg-[#fce4ec] text-[#ad1457]',
  GRADUATED: 'bg-[#e0f2f1] text-[#00695c]',
};

const sortFilterCategories = [
  { key: 'title', label: 'Project Title' },
  { key: 'code', label: 'Project Code' },
  { key: 'createdAt', label: 'Year' },
  { key: 'firm', label: 'Firm' },
  { key: 'firmSize', label: 'Firm Size' },
  { key: 'status', label: 'Status' },
  { key: 'corporatorName', label: "Corporator's Name" },
  { key: 'address', label: 'Address' },
  { key: 'prioritySector', label: 'Priority Sector' },
];

const modalInputCls = "w-full py-2 px-3 border border-[#d0d0d0] rounded-lg text-[13px] font-[inherit] text-[#333] bg-white transition-all duration-200 placeholder:text-[#aaa] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";
const modalSelectCls = `${modalInputCls} modal-select`;

export default function SetupPage() {
  const [activeFilter, setActiveFilter] = useState('');
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
    projectCode: '', projectTitle: '', fund: '', typeOfFund: '', firmSize: '',
    province: '', municipality: '', district: '', barangay: '', coordinates: '',
    firmName: '', firmType: '', cooperatorName: '',
    projectStatus: '', prioritySector: '', year: '', companyLogo: null as File | null,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapFlyTarget, setMapFlyTarget] = useState<[number, number] | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);

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

  // Address data states (fetched from API)
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string }[]>([]);
  const [barangays, setBarangays] = useState<{ id: string; name: string }[]>([]);

  // Barangay searchable dropdown state
  const [barangaySearch, setBarangaySearch] = useState('');
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(false);
  const barangayRef = useRef<HTMLDivElement>(null);

  // Confirmation modal states
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    count: number;
    projectTitles: string[];
  } | null>(null);
  const [deleteSuccessModal, setDeleteSuccessModal] = useState<{
    show: boolean;
    count: number;
  } | null>(null);
  const [saveSuccessModal, setSaveSuccessModal] = useState<{
    show: boolean;
    isEdit: boolean;
    projectTitle: string;
  } | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const [tableScrollWidth, setTableScrollWidth] = useState(0);
  const isSyncingScroll = useRef(false);

  // Keep top scrollbar width in sync with table content width
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    if (!tableEl) return;
    const update = () => setTableScrollWidth(tableEl.scrollWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(tableEl);
    return () => observer.disconnect();
  }, [projects, activeFilter, searchQuery, filterCategory, filterValue]);

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
    // Find province ID by name
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
    // Find municipality ID by name
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

  // Filter projects by active tab, search query, column filter, then sort
  const filteredProjects = projects
    .filter(p => activeFilter ? p.status === activeFilter : true)
    .filter(p => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().replace(/^#/, '');
      return (
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.firm?.toLowerCase().includes(q)) ||
        (p.address?.toLowerCase().includes(q)) ||
        (p.corporatorName?.toLowerCase().includes(q)) ||
        (p.prioritySector?.toLowerCase().includes(q)) ||
        (p.firmSize?.toLowerCase().includes(q)) ||
        (p.status?.toLowerCase().includes(q))
      );
    })
    .filter(p => {
      if (!filterCategory || !filterValue.trim()) return true;
      const v = filterValue.toLowerCase();
      if (filterCategory === 'createdAt') {
        return p.createdAt ? new Date(p.createdAt).getFullYear().toString().includes(v) : false;
      }
      const fieldVal = (p as unknown as Record<string, unknown>)[filterCategory];
      return typeof fieldVal === 'string' && fieldVal.toLowerCase().includes(v);
    })
    .sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (sortField === 'createdAt') {
        return dir * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
      }
      if (sortField === 'code') {
        const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
        return dir * (numA - numB);
      }
      const valA = ((a as unknown as Record<string, string>)[sortField]) || '';
      const valB = ((b as unknown as Record<string, string>)[sortField]) || '';
      return dir * valA.localeCompare(valB);
    });

  // Compute counts per status from all projects
  const statusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

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

  // Auto-geocode municipality for map picker
  useEffect(() => {
    if (!formData.municipality) return;
    const query = `${formData.municipality}${formData.province ? ', ' + formData.province : ''}, Philippines`;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
      .then(r => r.json())
      .then(data => { if (data[0]) setMapFlyTarget([parseFloat(data[0].lat), parseFloat(data[0].lon)]); })
      .catch(() => {});
  }, [formData.municipality, formData.province]);

  // Available fields for SETUP column mapping
  const setupFields = [
    { key: '', label: '-- Skip this column --' },
    { key: 'code', label: 'Project Code' },
    { key: 'title', label: 'Project Title' },
    { key: 'firm', label: 'Firm / Beneficiary Name' },
    { key: 'typeOfFirm', label: 'Type of Firm' },
    { key: 'address', label: 'Address (combined)' },
    { key: 'province', label: 'Province' },
    { key: 'city', label: 'City / Municipality' },
    { key: 'district', label: 'District' },
    { key: 'coordinates', label: 'Coordinates' },
    { key: 'corporatorName', label: "Cooperator / Collaborator" },
    { key: 'contactNumbers', label: 'Contact Numbers' },
    { key: 'emails', label: 'Emails' },
    { key: 'status', label: 'Project Status' },
    { key: 'prioritySector', label: 'Priority Sector' },
    { key: 'firmSize', label: 'Firm Size' },
    { key: 'fund', label: 'Project Cost / Fund' },
    { key: 'typeOfFund', label: 'Type of Fund / Program' },
    { key: 'year', label: 'Year Approved' },
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
                (rowStr.includes('title') && rowStr.includes('code')) ||
                (rowStr.includes('project') && rowStr.includes('code')) ||
                (rowStr.includes('project') && rowStr.includes('beneficiar'))) {
              headerRowIndex = i;
              break;
            }
          }
        }
        if (headerRowIndex === -1) headerRowIndex = 0;

        const headerRow = allRows[headerRowIndex];
        const headers = (headerRow as string[]).map(h => String(h || '').trim()).filter(h => h && h !== '#');
        if (headers.length === 0) { setImportError('Could not find valid column headers in the Excel file.'); return; }
        setImportColumns(headers);

        const autoMapping: Record<string, string> = {};
        headers.forEach((header) => {
          const h = header.toLowerCase();
          if (h.includes('code') && !h.includes('contact')) autoMapping[header] = 'code';
          else if (h.includes('title') || h === 'project' || h.includes('project name')) autoMapping[header] = 'title';
          else if (h.includes('firm') && h.includes('type')) autoMapping[header] = 'typeOfFirm';
          else if (h.includes('firm') || h.includes('company') || h.includes('beneficiar')) autoMapping[header] = 'firm';
          else if (h.includes('province')) autoMapping[header] = 'province';
          else if (h === 'city' || h.includes('municipality') || (h.includes('city') && !h.includes('district'))) autoMapping[header] = 'city';
          else if (h.includes('district')) autoMapping[header] = 'district';
          else if (h.includes('address') || h.includes('location')) autoMapping[header] = 'address';
          else if (h.includes('coordinate')) autoMapping[header] = 'coordinates';
          else if (h.includes('cooperator') || h.includes('corporator') || h.includes('collaborator') || h.includes('owner')) autoMapping[header] = 'corporatorName';
          else if (h.includes('contact') || h.includes('phone') || h.includes('mobile')) autoMapping[header] = 'contactNumbers';
          else if (h.includes('email')) autoMapping[header] = 'emails';
          else if (h.includes('status')) autoMapping[header] = 'status';
          else if (h.includes('sector')) autoMapping[header] = 'prioritySector';
          else if (h.includes('size')) autoMapping[header] = 'firmSize';
          else if (h.includes('type') && (h.includes('fund') || h.includes('program'))) autoMapping[header] = 'typeOfFund';
          else if (h.includes('type')) autoMapping[header] = 'typeOfFund';
          else if (h.includes('project cost') || h.includes('cost') || h.includes('fund') || h.includes('amount')) autoMapping[header] = 'fund';
          else if (h.includes('year') || h.includes('approved')) autoMapping[header] = 'year';
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
    const titleColumn = Object.entries(columnMapping).find(([, field]) => field === 'title')?.[0];
    if (!titleColumn) { setImportError('You must map a column to "Project Title"'); return; }
    setImporting(true);
    setImportError('');
    try {
      const statusMap: Record<string, string> = { proposal: 'PROPOSAL', new: 'PROPOSAL', approved: 'APPROVED', ongoing: 'ONGOING', 'on-going': 'ONGOING', withdrawal: 'WITHDRAWN', withdrawn: 'WITHDRAWN', terminated: 'TERMINATED', graduated: 'GRADUATED', completed: 'GRADUATED' };
      const projectsToImport = importData.map(row => {
        const project: Record<string, unknown> = {};
        Object.entries(columnMapping).forEach(([column, field]) => {
          if (field && row[column]) {
            if (field === 'contactNumbers' || field === 'emails') {
              project[field] = row[column].split(/[,;]/).map(v => v.trim()).filter(v => v);
            } else if (field === 'status') {
              project[field] = statusMap[row[column].toLowerCase()] || 'PROPOSAL';
            } else {
              project[field] = row[column];
            }
          }
        });
        // Combine province/city/district into address if mapped separately
        const parts = [project.district, project.city, project.province].filter(Boolean);
        if (parts.length > 0 && !project.address) {
          project.address = parts.join(', ');
        }
        delete project.province;
        delete project.city;
        delete project.district;
        return project;
      }).filter(p => p.title);

      const existingTitles = projects.map(p => p.title.toLowerCase());
      const uniqueProjects = projectsToImport.filter(p => !existingTitles.includes(String(p.title).toLowerCase()));
      const skippedProjects = projectsToImport.filter(p => existingTitles.includes(String(p.title).toLowerCase()));

      if (uniqueProjects.length === 0) { setImportError('All projects already exist (duplicate titles). No projects imported.'); setImporting(false); return; }

      const res = await fetch('/api/setup-projects/import', {
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
          const snapRes = await fetch('/api/setup-projects', { headers: getAuthHeaders() });
          const snapData: { coordinates: string | null }[] = await snapRes.json();
          geoTotal = snapData.filter(p => !p.coordinates).length;
          if (geoTotal > 0) setGeocodingProgress({ current: 0, total: geoTotal });
        } catch { /* non-fatal */ }

        const batchPromise = fetch('/api/setup-projects/geocode-batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({}),
        });
        let pollInterval: ReturnType<typeof setInterval> | null = null;
        if (geoTotal > 0) {
          const baseline = geoTotal;
          pollInterval = setInterval(async () => {
            try {
              const pollRes = await fetch('/api/setup-projects', { headers: getAuthHeaders() });
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
        skippedTitles: skippedProjects.map(p => String(p.title)),
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
      // Convert logo to base64 data URL if a new file was selected
      let logoUrl: string | null = null;
      if (formData.companyLogo) {
        logoUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(formData.companyLogo!);
        });
      }

      const payload: Record<string, unknown> = {
        code: formData.projectCode.trim() || null,
        title: formData.projectTitle,
        fund: formData.fund,
        typeOfFund: formData.typeOfFund,
        firmSize: formData.firmSize,
        address: [formData.barangay, formData.municipality, formData.district, formData.province].filter(Boolean).join(', '),
        coordinates: formData.coordinates || null,
        firm: formData.firmName || null,
        typeOfFirm: formData.firmType || null,
        corporatorName: formData.cooperatorName,
        contactNumbers: contactNumbers.filter(c => c.trim()),
        emails: emails.filter(e => e.trim()),
        status: formData.projectStatus,
        prioritySector: formData.prioritySector,
        year: formData.year || null,
      };

      // Only include logo if a new one was uploaded
      if (logoUrl) {
        payload.companyLogoUrl = logoUrl;
      }

      const url = editingProjectId ? `/api/setup-projects/${editingProjectId}` : '/api/setup-projects';
      const method = editingProjectId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save project');
      }

      const isEdit = !!editingProjectId;
      const savedTitle = formData.projectTitle;

      setShowAddModal(false);
      setEditingProjectId(null);
      setSelectedProjects([]);
      setFormData({ projectCode: '', projectTitle: '', fund: '', typeOfFund: '', firmSize: '', province: '', municipality: '', district: '', barangay: '', coordinates: '', firmName: '', firmType: '', cooperatorName: '', projectStatus: '', prioritySector: '', year: '', companyLogo: null });
      setEmails(['']); setContactNumbers(['']);
      await fetchProjects();

      // Show success modal
      setSaveSuccessModal({
        show: true,
        isEdit,
        projectTitle: savedTitle,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const addressParts = project.address?.split(', ') || [];
    // Support both 3-part (barangay, municipality, province) and 4-part (barangay, municipality, district, province)
    const barangay = addressParts[0] || '';
    const municipality = addressParts[1] || '';
    const district = addressParts.length >= 4 ? addressParts[2] || '' : '';
    const province = addressParts.length >= 4 ? addressParts[3] || '' : addressParts[2] || '';
    setFormData({
      projectCode: project.code || '',
      projectTitle: project.title,
      fund: project.fund || '',
      typeOfFund: project.typeOfFund || '',
      firmSize: project.firmSize || '',
      province,
      municipality,
      district,
      barangay,
      coordinates: project.coordinates || '',
      firmName: project.firm || '',
      firmType: project.typeOfFirm || '',
      cooperatorName: project.corporatorName || '',
      projectStatus: project.status,
      prioritySector: project.prioritySector || '',
      year: project.year || '',
      companyLogo: null,
    });
    setEmails(project.emails.length > 0 ? project.emails : ['']);
    setContactNumbers(project.contactNumbers.length > 0 ? project.contactNumbers : ['']);
    setBarangaySearch(barangay);
    setEditingProjectId(projectId);
    setFormErrors({});
    setSaveError('');
    setShowAddModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedProjects.length === 0) return;
    const projectTitles = selectedProjects.map(id => {
      const p = projects.find(proj => proj.id === id);
      return p?.title || 'Unknown';
    });
    setDeleteConfirmModal({
      show: true,
      count: selectedProjects.length,
      projectTitles,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmModal) return;
    const total = selectedProjects.length;
    setDeleting(true);
    setDeleteConfirmModal(null);
    setDeleteProgress({ current: 0, total });
    try {
      for (let i = 0; i < selectedProjects.length; i++) {
        await fetch(`/api/setup-projects/${selectedProjects[i]}`, { method: 'DELETE', headers: getAuthHeaders() });
        setDeleteProgress({ current: i + 1, total });
      }
      setSelectedProjects([]);
      await fetchProjects();
      setDeleteSuccessModal({ show: true, count: total });
    } catch {
      console.error('Failed to delete projects');
    } finally {
      setDeleting(false);
      setDeleteProgress(null);
    }
  };

  const handleExportPDF = () => {
    const projectsToExport = selectedProjects.length > 0
      ? filteredProjects.filter(p => selectedProjects.includes(p.id))
      : filteredProjects;
    if (projectsToExport.length === 0) return;

    // A4 portrait: 210 x 297 mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const marginLeft = 10;
    const marginRight = 10;
    const tableWidth = pageWidth - marginLeft - marginRight; // 190mm

    doc.setFontSize(14);
    doc.setTextColor(20, 97, 132);
    doc.text('SETUP 4.0 — Project Masterlist', marginLeft, 14);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleDateString()} | ${projectsToExport.length} project(s)`, marginLeft, 19);

    // Column widths proportional to tableWidth (190mm total)
    const colWidths = [7, 10, 28, 20, 26, 20, 18, 20, 13, 13, 11, 10].map(w => w / 196 * tableWidth);

    autoTable(doc, {
      startY: 23,
      head: [['#', 'Code', 'Project Title', 'Firm', 'Address', "Corporator", 'Contact', 'Email', 'Status', 'Sector', 'Size', 'Year']],
      body: projectsToExport.map((p, i) => [
        i + 1,
        `#${p.code}`,
        p.title,
        p.firm || '—',
        p.address || '—',
        p.corporatorName || '—',
        p.contactNumbers.join(', ') || '—',
        p.emails.join(', ') || '—',
        statusDisplay[p.status] || p.status,
        p.prioritySector || '—',
        p.firmSize || '—',
        p.year || '—',
      ]),
      styles: { fontSize: 6, cellPadding: 1.5, overflow: 'linebreak' },
      headStyles: { fillColor: [20, 97, 132], textColor: 255, fontStyle: 'bold', fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: marginLeft, right: marginRight },
      tableWidth: tableWidth,
      columnStyles: Object.fromEntries(colWidths.map((w, i) => [i, { cellWidth: w }])),
    });

    doc.save(`SETUP_Masterlist_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleExportExcel = () => {
  const projectsToExport = selectedProjects.length > 0
    ? filteredProjects.filter(p => selectedProjects.includes(p.id))
    : filteredProjects;
  if (projectsToExport.length === 0) return;

  const wb = XLSX.utils.book_new();

  // Title row + metadata
  const titleRows = [
    ['SETUP 4.0 — Project Masterlist'],
    [`Exported: ${new Date().toLocaleDateString()} | ${projectsToExport.length} project(s)`],
    [], // blank spacer
    ['#', 'Code', 'Project Title', 'Firm', 'Type of Firm', 'Address', "Corporator's Name", 'Contact No.', 'Email', 'Status', 'Priority Sector', 'Firm Size', 'Fund', 'Type of Fund', 'Year', 'Assignee'],
    ...projectsToExport.map((p, i) => [
      i + 1,
      `#${p.code}`,
      p.title,
      p.firm || '—',
      p.typeOfFirm || '—',
      p.address || '—',
      p.corporatorName || '—',
      p.contactNumbers.join(', ') || '—',
      p.emails.join(', ') || '—',
      statusDisplay[p.status] || p.status,
      p.prioritySector || '—',
      p.firmSize || '—',
      p.fund || '—',
      p.typeOfFund || '—',
      p.year || '—',
      p.assignee || '—',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(titleRows);

  const totalCols = 16;

  // Merge title across all columns
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }, // Subtitle
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 4 },  // #
    { wch: 8 },  // Code
    { wch: 42 }, // Project Title
    { wch: 22 }, // Firm
    { wch: 18 }, // Type of Firm
    { wch: 28 }, // Address
    { wch: 22 }, // Corporator
    { wch: 16 }, // Contact
    { wch: 26 }, // Email
    { wch: 13 }, // Status
    { wch: 18 }, // Priority Sector
    { wch: 10 }, // Firm Size
    { wch: 12 }, // Fund
    { wch: 13 }, // Type of Fund
    { wch: 7 },  // Year
    { wch: 18 }, // Assignee
  ];

  // Row heights
  ws['!rows'] = [
    { hpt: 28 }, // Title
    { hpt: 16 }, // Subtitle
    { hpt: 8 },  // Spacer
    { hpt: 20 }, // Header
    ...projectsToExport.map((_, i) => ({ hpt: i % 2 === 0 ? 16 : 16 })),
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

  XLSX.utils.book_append_sheet(wb, ws, 'SETUP Masterlist');
  XLSX.writeFile(wb, `SETUP_Masterlist_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

  const getStatusClass = (status: string) => statusColors[status] || statusColors.PROPOSAL;

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-5 px-[30px] bg-[#f5f5f5] overflow-x-auto min-w-0">
        {/* SETUP Header */}
        <div className="flex justify-between items-center bg-white py-[15px] px-[25px] rounded-[15px] mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] gap-[30px]">
          <div className="flex items-center gap-[15px]">
            <div className="flex flex-col">
              <Image 
                src="/setup-4.0-logo.png" 
                alt="SETUP 4.0 - Small Enterprise Technology Upgrading Program" 
                width={160}
                height={25}
                style={{ width: '160px', height: 'auto' }}
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
            <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover" onClick={() => { setEditingProjectId(null); setFormData({ projectCode: '', projectTitle: '', fund: '', typeOfFund: '', firmSize: '', province: '', municipality: '', district: '', barangay: '', coordinates: '', firmName: '', firmType: '', cooperatorName: '', projectStatus: '', prioritySector: '', year: '', companyLogo: null }); setEmails(['']); setContactNumbers(['']); setBarangaySearch(''); setFormErrors({}); setSaveError(''); setShowAddModal(true); }}>
              <Icon icon="mdi:plus" width={20} height={20} />
              Add New Project
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterTabs.map(tab => (
            <button key={tab.id} className={`flex-1 flex flex-col items-center justify-center py-5 px-[15px] border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${activeFilter === tab.id ? 'bg-primary' : 'bg-white hover:bg-[#f0f8ff] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'}`} onClick={() => setActiveFilter(prev => prev === tab.id ? '' : tab.id)}>
              <div className="inline-flex items-center gap-[5px] mb-2">
                <span className={`text-[13px] font-medium leading-none ${activeFilter === tab.id ? 'text-white' : 'text-[#666]'}`}>{tab.label}</span>
                <span className="w-1.5 h-1.5 rounded-full inline-block align-middle" style={{ backgroundColor: tab.color }}></span>
              </div>
              {loading ? (
                <span className={`inline-block w-10 h-8 rounded-lg animate-pulse ${activeFilter === tab.id ? 'bg-white/30' : 'bg-[#e0eaf0]'}`} />
              ) : (statusCounts[tab.id] ?? 0) > 0 ? (
                <span className={`text-[32px] font-bold ${activeFilter === tab.id ? 'text-white' : 'text-primary'}`}>{statusCounts[tab.id]}</span>
              ) : (
                <span className={`text-[22px] font-bold opacity-30 ${activeFilter === tab.id ? 'text-white' : 'text-primary'}`}>—</span>
              )}
            </button>
          ))}
        </div>

        {/* Masterlist Section */}
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

          {/* Top scrollbar - stays sticky when scrolling down */}
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            className="overflow-x-auto overflow-y-hidden sticky top-0 z-10 bg-white"
            style={{ height: '12px', marginBottom: '-1px' }}
          >
            <div style={{ width: tableScrollWidth, height: '1px' }} />
          </div>

          <div className="overflow-x-auto scrollbar-hide" ref={tableScrollRef} onScroll={handleTableScroll}>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="w-5 min-w-[10px] text-left py-3 px-2.5 border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[10px] align-middle">
                    <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0} onChange={(e) => setSelectedProjects(e.target.checked ? filteredProjects.map(p => p.id) : [])} />
                  </th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[10px] align-middle">Code</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[250px] align-middle">Project Title</th>
                    <th className="py-3 px-1.5 text-center border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Logo</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Firm</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[120px] align-middle">Type of Firm</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Address</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Corporator&apos;s Name</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Contact No.</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[30px] align-middle">Email</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[20px] align-middle">Status</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Priority Sector</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Firm Size</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[50px] align-middle">Year</th>
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[150px] align-middle">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={16} className="py-8 text-center text-[#999] text-sm">Loading projects...</td></tr>
                ) : filteredProjects.length === 0 ? (
                  <tr><td colSpan={16} className="py-8 text-center text-[#999] text-sm">No projects found</td></tr>
                ) : filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-[#f9f9f9]">
                    <td className="w-9 min-w-[36px] text-center py-3 px-2.5 text-left border-b border-[#e0e0e0]">
                      <input type="checkbox" className="w-4 h-4 accent-accent cursor-pointer" checked={selectedProjects.includes(project.id)} onChange={(e) => setSelectedProjects(prev => e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id))} />
                    </td>
                      <td className="text-primary font-semibold whitespace-nowrap py-3 px-2 text-left border-b border-[#e0e0e0]">{project.code}</td>
                      <td className="max-w-[250px] text-[#333] font-medium whitespace-normal break-words py-3 px-2 text-left border-b border-[#e0e0e0]"><Link href={`/setup/${project.id}`} className="text-primary no-underline font-medium hover:text-accent hover:underline">{project.title}</Link></td>
                      <td className="py-3 px-1.5 text-center border-b border-[#e0e0e0]">
                        {project.companyLogoUrl ? (
                          <img src={project.companyLogoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover inline-block border-1 border-[#d0d0d0]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#e3f2fd] flex items-center justify-center inline-flex">
                            <Icon icon="mdi:store" width={18} height={18} color="#146184" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.firm}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.typeOfFirm && <span className="inline-block py-1 px-2.5 bg-[#fff3cd] text-[#856404] rounded-[15px] text-[11px] font-medium">{project.typeOfFirm}</span>}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.address}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.corporatorName}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.contactNumbers.join(', ')}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.emails.join(', ')}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]"><span className={`inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium ${getStatusClass(project.status)}`}>{statusDisplay[project.status] || project.status}</span></td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.prioritySector}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.firmSize}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.year || '—'}</td>
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">
                        {project.assignee ? (
                          <div className="flex items-center gap-2">
                            {project.assigneeProfileUrl ? (
                              <img
                                src={project.assigneeProfileUrl}
                                alt={project.assignee}
                                className="w-6 h-6 rounded-full object-cover border border-[#d0d0d0]"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#e3f2fd] flex items-center justify-center">
                                <Icon icon="mdi:account" width={14} height={14} color="#146184" />
                              </div>
                            )}
                            <span className="text-[#333] text-[11px]">{project.assignee}</span>
                          </div>
                        ) : (
                          <span className="text-[#999]">—</span>
                        )}
                      </td>
                  </tr>
                ))}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => { setShowAddModal(false); setEditingProjectId(null); }}>
          <div className="add-project-modal bg-white rounded-[20px] py-[25px] px-[35px] w-full max-w-[680px] max-h-[85vh] overflow-y-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.3)]" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={() => { setShowAddModal(false); setEditingProjectId(null); }}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-[3px]">{editingProjectId ? 'Edit Project' : 'Add New Project'}</h2>
            <p className="text-xs text-[#888] m-0 mb-[15px]">{editingProjectId ? 'Update the project details below' : 'Complete the form to register a new project'}</p>

            <div className="flex flex-col gap-3">
              {/* Project Code + Title Row */}
              <div className="grid grid-cols-[160px_1fr] gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Project Code</label>
                  <input type="text" placeholder="e.g. 001 (optional)" value={formData.projectCode} onChange={(e) => handleFormChange('projectCode', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Project Title<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <input type="text" placeholder="Enter project title" value={formData.projectTitle} onChange={(e) => handleFormChange('projectTitle', e.target.value)} className={`${modalInputCls} ${formErrors.projectTitle ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                  {formErrors.projectTitle && <span className="text-[#dc3545] text-[11px]">{formErrors.projectTitle}</span>}
                </div>
              </div>

              {/* Fund Row */}
              <div className="grid grid-cols-4 gap-3">
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
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Year</label>
                  <input type="text" placeholder="e.g. 2026" value={formData.year} onChange={(e) => handleFormChange('year', e.target.value.replace(/\D/g, '').slice(0, 4))} className={modalInputCls} />
                </div>
              </div>

              {/* Address Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Province<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.province} onChange={(e) => handleFormChange('province', e.target.value)} className={`${modalSelectCls} ${formErrors.province ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">Select Province</option>
                    {provinces.map((prov) => (<option key={prov.id} value={prov.name}>{prov.name}</option>))}
                  </select>
                  {formErrors.province && <span className="text-[#dc3545] text-[11px]">{formErrors.province}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Municipality/City<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <select value={formData.municipality} onChange={(e) => handleFormChange('municipality', e.target.value)} disabled={!formData.province || municipalities.length === 0} className={`${modalSelectCls} ${formErrors.municipality ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}>
                    <option value="">{!formData.province ? 'Select Province first' : municipalities.length === 0 ? 'Loading...' : 'Select Municipality'}</option>
                    {municipalities.map((mun) => (<option key={mun.id} value={mun.name}>{mun.name}</option>))}
                  </select>
                  {formErrors.municipality && <span className="text-[#dc3545] text-[11px]">{formErrors.municipality}</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">District</label>
                  <input type="text" placeholder="e.g. 1st, 2nd" value={formData.district} onChange={(e) => handleFormChange('district', e.target.value)} className={modalInputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold text-[#333]">Barangay<span className="text-[#dc3545] ml-0.5">*</span></label>
                  <div ref={barangayRef} className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={!formData.municipality ? 'Select Municipality first' : barangays.length === 0 ? 'Loading...' : 'Type to search barangay...'}
                        value={barangaySearch}
                        onChange={(e) => {
                          setBarangaySearch(e.target.value);
                          setShowBarangayDropdown(true);
                          // Clear the actual value if user is typing something different
                          if (e.target.value !== formData.barangay) {
                            setFormData(prev => ({ ...prev, barangay: '' }));
                          }
                        }}
                        onFocus={() => formData.municipality && barangays.length > 0 && setShowBarangayDropdown(true)}
                        disabled={!formData.municipality || barangays.length === 0}
                        className={`${modalInputCls} pr-8 ${formErrors.barangay ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`}
                      />
                      <Icon
                        icon={showBarangayDropdown ? "mdi:chevron-up" : "mdi:chevron-down"}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none"
                        width={18}
                        height={18}
                      />
                    </div>
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
                                // Geocode the selected barangay to get coordinates
                                const query = `${brgy.name}, ${formData.municipality}, ${formData.province}, Philippines`;
                                fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
                                  .then(r => r.json())
                                  .then(data => {
                                    if (data[0]) {
                                      const lat = parseFloat(data[0].lat).toFixed(6);
                                      const lng = parseFloat(data[0].lon).toFixed(6);
                                      setFormData(prev => ({ ...prev, coordinates: `${lat},${lng}` }));
                                    }
                                  })
                                  .catch(() => {});
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
                  {saving ? 'Saving...' : editingProjectId ? 'Update Project' : 'Save Project'}
                </button>
              </div>
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
              <MapSearchBar onSelect={(coords) => setMapFlyTarget(coords)} initialQuery={[formData.barangay, formData.municipality, formData.province].filter(Boolean).join(', ')} />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setDeleteConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[420px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:delete-alert" width={36} height={36} color="#c62828" />
            </div>
            <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Confirm Delete</h3>
            <p className="text-[14px] text-[#666] m-0 mb-2">
              {deleteConfirmModal.count === 1
                ? 'Are you sure you want to delete this project?'
                : `Are you sure you want to delete ${deleteConfirmModal.count} projects?`
              }
            </p>
            {deleteConfirmModal.count <= 3 && (
              <div className="text-[13px] text-[#888] mb-4">
                {deleteConfirmModal.projectTitles.map((title, i) => (
                  <div key={i} className="truncate">• {title}</div>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[#999] m-0 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
                onClick={() => setDeleteConfirmModal(null)}
              >
                Cancel
              </button>
              <button
                className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Modal */}
      {deleteSuccessModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setDeleteSuccessModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
            </div>
            <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Deleted Successfully!</h3>
            <p className="text-[14px] text-[#666] m-0 mb-6">
              {deleteSuccessModal.count === 1
                ? 'The project has been deleted.'
                : `${deleteSuccessModal.count} projects have been deleted.`
              }
            </p>
            <button
              className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1b5e20]"
              onClick={() => setDeleteSuccessModal(null)}
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Save Success Modal (Add/Edit) */}
      {saveSuccessModal?.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setSaveSuccessModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[420px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
            </div>
            <h3 className="text-lg font-bold text-[#333] m-0 mb-3">
              {saveSuccessModal.isEdit ? 'Project Updated!' : 'Project Added!'}
            </h3>
            <p className="text-[14px] text-[#666] m-0 mb-2">
              {saveSuccessModal.isEdit
                ? 'The project has been successfully updated.'
                : 'The project has been successfully added.'
              }
            </p>
            <p className="text-[13px] text-primary font-medium m-0 mb-6 truncate" title={saveSuccessModal.projectTitle}>
              "{saveSuccessModal.projectTitle}"
            </p>
            <button
              className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1b5e20]"
              onClick={() => setSaveSuccessModal(null)}
            >
              Okay
            </button>
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
            <input ref={importFileRef} type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} className="hidden" id="setup-import-file-input" />
            <button className="absolute top-[15px] right-[15px] bg-transparent border-none cursor-pointer text-[#999] p-[5px] flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#f0f0f0] hover:text-[#333]" onClick={resetImportModal}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="text-xl font-bold text-primary m-0 mb-1">Import SETUP Projects</h2>
            <p className="text-xs text-[#888] m-0 mb-4">Upload an Excel file (.xlsx, .xls) to import multiple projects at once</p>

            {/* Import Result */}
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
                    <label htmlFor="setup-import-file-input" className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-[#d0d0d0] rounded-xl cursor-pointer text-[#999] transition-all duration-200 hover:border-primary hover:text-primary hover:bg-[#f0f8ff]">
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
                    <div className="max-h-[150px] overflow-y-auto border border-[#e0e0e0] rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-[#f5f5f5] sticky top-0">
                          <tr>
                            <th className="py-2 px-3 text-left font-semibold text-[#333] border-b border-[#e0e0e0]">Excel Column</th>
                            <th className="py-2 px-3 text-left font-semibold text-[#333] border-b border-[#e0e0e0]">Sample Data</th>
                            <th className="py-2 px-3 text-left font-semibold text-[#333] border-b border-[#e0e0e0]">Map To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importColumns.map((col, idx) => (
                            <tr key={idx} className="border-b border-[#eee] last:border-b-0">
                              <td className="py-2 px-3 font-medium text-[#333]">{col}</td>
                              <td className="py-2 px-3 text-[#666] max-w-[200px] truncate" title={importData[0]?.[col]}>{importData[0]?.[col] || '-'}</td>
                              <td className="py-2 px-3">
                                <select value={columnMapping[col] || ''} onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))} className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded text-xs focus:outline-none focus:border-primary">
                                  {setupFields.map(field => <option key={field.key} value={field.key}>{field.label}</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 p-3 bg-[#fff3e0] rounded-lg">
                      <div className="flex items-start gap-2">
                        <Icon icon="mdi:information" width={18} height={18} className="text-[#f57c00] mt-0.5" />
                        <div className="text-xs text-[#333]">
                          <p className="m-0 font-semibold">Note:</p>
                          <p className="m-0">• "Project Title" mapping is required</p>
                          <p className="m-0">• Projects with duplicate titles will be skipped</p>
                          <p className="m-0">• Contact numbers and emails can be separated by commas</p>
                          <p className="m-0">• Map pins will be auto-generated after import</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-[#333] m-0 mb-2">Data Preview ({importData.length} rows)</h3>
                      <div className="max-h-[200px] overflow-auto border border-[#e0e0e0] rounded-lg">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-[#f5f5f5] sticky top-0">
                            <tr>
                              <th className="py-2 px-2 text-left font-semibold text-[#333] border-b border-[#e0e0e0] whitespace-nowrap">#</th>
                              {importColumns.slice(0, 6).map((col, idx) => <th key={idx} className="py-2 px-2 text-left font-semibold text-[#333] border-b border-[#e0e0e0] whitespace-nowrap max-w-[120px] truncate" title={col}>{col}</th>)}
                              {importColumns.length > 6 && <th className="py-2 px-2 text-left font-semibold text-[#666] border-b border-[#e0e0e0] whitespace-nowrap">+{importColumns.length - 6} more</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {importData.map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-b border-[#eee] last:border-b-0 hover:bg-[#f9f9f9]">
                                <td className="py-1.5 px-2 text-[#999] font-medium">{rowIdx + 1}</td>
                                {importColumns.slice(0, 6).map((col, colIdx) => <td key={colIdx} className="py-1.5 px-2 text-[#333] max-w-[120px] truncate" title={row[col] || ''}>{row[col] || '-'}</td>)}
                                {importColumns.length > 6 && <td className="py-1.5 px-2 text-[#999]">...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const flyToLat = flyTo?.[0] ?? null;
  const flyToLng = flyTo?.[1] ?? null;
  useEffect(() => {
    // Determine target: use flyTo prop, or use existing lat/lng if available
    const targetLat = flyToLat ?? lat;
    const targetLng = flyToLng ?? lng;
    if (targetLat === null || targetLng === null) return;
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
    }, 500);
    return () => clearTimeout(timer);
  }, [flyToLat, flyToLng, lat, lng, comps]);

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
