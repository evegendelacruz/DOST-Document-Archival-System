'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import DashboardLayout from '../components/DashboardLayout';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';

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
    projectTitle: '', fund: '', typeOfFund: '', firmSize: '',
    province: '', municipality: '', barangay: '', coordinates: '',
    firmName: '', firmType: '', cooperatorName: '',
    projectStatus: '', prioritySector: '', year: '', companyLogo: null as File | null,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortDropdown(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterDropdown(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save project');
      }

      setShowAddModal(false);
      setEditingProjectId(null);
      setSelectedProjects([]);
      setFormData({ projectTitle: '', fund: '', typeOfFund: '', firmSize: '', province: '', municipality: '', barangay: '', coordinates: '', firmName: '', firmType: '', cooperatorName: '', projectStatus: '', prioritySector: '', year: '', companyLogo: null });
      setEmails(['']); setContactNumbers(['']);
      await fetchProjects();
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
    const barangay = addressParts[0] || '';
    const municipality = addressParts[1] || '';
    const province = addressParts[2] || '';
    setFormData({
      projectTitle: project.title,
      fund: project.fund || '',
      typeOfFund: project.typeOfFund || '',
      firmSize: project.firmSize || '',
      province,
      municipality,
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
    setEditingProjectId(projectId);
    setFormErrors({});
    setSaveError('');
    setShowAddModal(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedProjects.length === 0) return;
    const confirmMsg = selectedProjects.length === 1
      ? 'Are you sure you want to delete this project?'
      : `Are you sure you want to delete ${selectedProjects.length} projects?`;
    if (!confirm(confirmMsg)) return;
    setDeleting(true);
    try {
      await Promise.all(selectedProjects.map(id =>
        fetch(`/api/setup-projects/${id}`, { method: 'DELETE' })
      ));
      setSelectedProjects([]);
      await fetchProjects();
    } catch {
      console.error('Failed to delete projects');
    } finally {
      setDeleting(false);
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

    const headers = ['#', 'Code', 'Project Title', 'Firm', 'Address', 'Corporator', 'Contact', 'Email', 'Status', 'Sector', 'Size', 'Year'];
    const data = projectsToExport.map((p, i) => [
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
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    // Auto-size columns based on content width
    ws['!cols'] = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...data.map(row => String(row[i]).length));
      return { wch: Math.min(maxLen + 2, 40) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SETUP Masterlist');
    XLSX.writeFile(wb, `SETUP_Masterlist_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusClass = (status: string) => statusColors[status] || statusColors.PROPOSAL;

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-5 px-[30px] bg-[#f5f5f5] overflow-x-auto">
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
          <div className="flex-1 flex justify-center items-center">
            <div className="relative w-[600px] h-[50px]">
              <Icon icon="mdi:magnify" className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#999] w-5 h-5" width={20} height={20} />
              <input type="text" className="w-full h-full pl-[50px] pr-[25px] border border-[#e0e0e0] rounded-[25px] text-[15px] bg-[#f5f5f5] transition-all duration-200 focus:outline-none focus:border-primary focus:bg-white focus:shadow-[0_2px_8px_rgba(20,97,132,0.1)] placeholder:text-[#999]" placeholder="Search here" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover" onClick={() => { setEditingProjectId(null); setFormData({ projectTitle: '', fund: '', typeOfFund: '', firmSize: '', province: '', municipality: '', barangay: '', coordinates: '', firmName: '', firmType: '', cooperatorName: '', projectStatus: '', prioritySector: '', year: '', companyLogo: null }); setEmails(['']); setContactNumbers(['']); setFormErrors({}); setSaveError(''); setShowAddModal(true); }}>
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-[15px] mb-5 w-full">
          {filterTabs.map(tab => (
            <button key={tab.id} className={`flex-1 flex flex-col items-center justify-center py-5 px-[15px] border-none rounded-xl cursor-pointer transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${activeFilter === tab.id ? 'bg-primary' : 'bg-white hover:bg-[#f0f8ff] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]'}`} onClick={() => setActiveFilter(prev => prev === tab.id ? '' : tab.id)}>
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
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[200px] align-middle">Project Title</th>
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
                    <th className="py-3 px-1.5 text-left border-b border-[#e0e0e0] bg-[#f9f9f9] font-semibold text-[#333] whitespace-normal min-w-[100px] align-middle">Assignee</th>
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
                      <td className="text-primary font-semibold whitespace-nowrap py-3 px-2 text-left border-b border-[#e0e0e0]">#{project.code}</td>
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
                      <td className="py-3 px-1.5 text-left border-b border-[#e0e0e0]">{project.assignee}</td>
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
              {/* Project Title */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[13px] font-semibold text-[#333]">Project Title<span className="text-[#dc3545] ml-0.5">*</span></label>
                <input type="text" placeholder="Enter project title" value={formData.projectTitle} onChange={(e) => handleFormChange('projectTitle', e.target.value)} className={`${modalInputCls} ${formErrors.projectTitle ? 'border-[#dc3545]! focus:border-[#dc3545]! focus:shadow-[0_0_0_3px_rgba(220,53,69,0.1)]!' : ''}`} />
                {formErrors.projectTitle && <span className="text-[#dc3545] text-[11px]">{formErrors.projectTitle}</span>}
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
