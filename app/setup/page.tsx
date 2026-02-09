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
  { id: 'proposal', label: 'Proposal', count: 5, color: '#1565c0' },
  { id: 'approved', label: 'Approved', count: 5, color: '#2e7d32' },
  { id: 'ongoing', label: 'Ongoing', count: 5, color: '#f57f17' },
  { id: 'withdrawal', label: 'Withdrawal', count: 5, color: '#c62828' },
  { id: 'terminated', label: 'Terminated', count: 5, color: '#ad1457' },
  { id: 'graduated', label: 'Graduated', count: 5, color: '#00695c' },
];

const projectData = [
  {
    id: 1,
    code: '001',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Proposal',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
  {
    id: 2,
    code: '002',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Proposal',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
  {
    id: 3,
    code: '003',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Approved',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
  {
    id: 4,
    code: '004',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Ongoing',
    prioritySector: 'Food Processing',
    firmSize: 'Medium',
    assignee: 'Jane Doe',
  },
  {
    id: 5,
    code: '005',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Withdrawn',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
  {
    id: 6,
    code: '006',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Terminated',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
  {
    id: 7,
    code: '007',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Evaluated',
    prioritySector: 'Food Processing',
    firmSize: 'Large',
    assignee: 'Jane Doe',
  },
  {
    id: 8,
    code: '008',
    title: 'Acquisition of Equipment for the Mass Production',
    firm: 'Best Friend Goodies',
    typeOfFirm: 'Agri-processing',
    address: 'Purok 4, Dansolihon, Cagayan de Oro City',
    corporatorName: 'Sergio Maria Lucia Sanico',
    contactNo: '09123456789',
    email: 'sample@gmail.com',
    status: 'Proposal',
    prioritySector: 'Food Processing',
    firmSize: 'Small',
    assignee: 'Jane Doe',
  },
];

export default function SetupPage() {
  const [activeFilter, setActiveFilter] = useState('proposal');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [emails, setEmails] = useState(['']);
  const [contactNumbers, setContactNumbers] = useState(['']);
  const [formData, setFormData] = useState({
    projectTitle: '',
    fund: '',
    typeOfFund: '',
    firmSize: '',
    province: '',
    municipality: '',
    barangay: '',
    coordinates: '',
    firmName: '',
    firmType: '',
    cooperatorName: '',
    projectStatus: '',
    prioritySector: '',
    companyLogo: null as File | null,
  });
  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'province') {
        updated.municipality = '';
        updated.barangay = '';
      }
      if (field === 'municipality') {
        updated.barangay = '';
      }
      return updated;
    });
  };

  const municipalities = formData.province && addressData[formData.province]
    ? Object.keys(addressData[formData.province])
    : [];

  const barangays = formData.province && formData.municipality && addressData[formData.province]?.[formData.municipality]
    ? addressData[formData.province][formData.municipality]
    : [];

  const handleEmailChange = (index: number, value: string) => {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  };

  const addEmail = () => {
    setEmails(prev => [...prev, '']);
  };

  const removeEmail = (index: number) => {
    setEmails(prev => prev.filter((_, i) => i !== index));
  };

  const handleContactChange = (index: number, value: string) => {
    const updated = [...contactNumbers];
    updated[index] = value;
    setContactNumbers(updated);
  };

  const addContact = () => {
    setContactNumbers(prev => [...prev, '']);
  };

  const removeContact = (index: number) => {
    setContactNumbers(prev => prev.filter((_, i) => i !== index));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, companyLogo: e.target.files![0] }));
    }
  };

  const handleSaveProject = () => {
    // TODO: handle save logic
    setShowAddModal(false);
    setFormData({
      projectTitle: '', fund: '', typeOfFund: '', firmSize: '',
      province: '', municipality: '', barangay: '',
      coordinates: '',
      firmName: '', firmType: '', cooperatorName: '',
      projectStatus: '', prioritySector: '', companyLogo: null,
    });
    setEmails(['']);
    setContactNumbers(['']);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'proposal': return 'status-proposal';
      case 'approved': return 'status-approved';
      case 'ongoing': return 'status-ongoing';
      case 'withdrawal': return 'status-withdrawal';
      case 'terminated': return 'status-terminated';
      case 'graduated': return 'status-graduated';
      default: return 'status-proposal';
    }
  };

  return (
    <DashboardLayout activePath="/setup">
      <main className="setup-main">
        {/* SETUP Header */}
        <div className="setup-header">
          <div className="setup-title-section">
            <div className="setup-logo-icon">
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
            <div className="setup-title-text">
              <h1 className="setup-title">SETUP 4.0</h1>
              <p className="setup-subtitle">Small Enterprise Technology<br/>Upgrading Program</p>
            </div>
          </div>
          <div className="setup-search-section">
            <div className="setup-search-container">
              <Icon icon="mdi:magnify" className="setup-search-icon" width={20} height={20} />
              <input
                type="text"
                className="setup-search-input"
                placeholder="Search here"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button className="add-project-btn" onClick={() => setShowAddModal(true)}>
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              <div className="filter-label-row">
                <span className="filter-label">{tab.label}</span>
                <span className="filter-dot" style={{ backgroundColor: tab.color }}></span>
              </div>
              <span className="filter-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Masterlist Section */}
        <div className="masterlist-section">
          <div className="masterlist-header">
            <h2 className="masterlist-title">MASTERLIST</h2>
            <div className="masterlist-actions">
              <button className="masterlist-btn">
                <Icon icon="mdi:sort" width={16} height={16} />
                Sort
              </button>
              <button className="masterlist-btn">
                <Icon icon="mdi:filter-variant" width={16} height={16} />
                Filter
              </button>
              <button className="masterlist-btn export">
                <Icon icon="mdi:file-pdf-box" width={16} height={16} />
                Export PDF
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="masterlist-table">
              <thead>
                <tr>
                  <th className="th-check">
                    <input
                      type="checkbox"
                      className="masterlist-checkbox"
                      checked={selectedProjects.length === projectData.length && projectData.length > 0}
                      onChange={(e) => setSelectedProjects(e.target.checked ? projectData.map(p => p.id) : [])}
                    />
                  </th>
                  <th>Code</th>
                  <th>Project Title</th>
                  <th>Firm</th>
                  <th>Type of Firm</th>
                  <th>Address</th>
                  <th>Corporator&apos;s Name</th>
                  <th>Contact No.</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Priority Sector</th>
                  <th>Firm Size</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map((project) => (
                  <tr key={project.id}>
                    <td className="td-check">
                      <input
                        type="checkbox"
                        className="masterlist-checkbox"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => setSelectedProjects(prev =>
                          e.target.checked ? [...prev, project.id] : prev.filter(id => id !== project.id)
                        )}
                      />
                    </td>
                    <td className="code-cell">{project.code}</td>
                    <td className="project-title-cell"><Link href={`/setup/${project.id}`}>{project.title}</Link></td>
                    <td>{project.firm}</td>
                    <td><span className="firm-badge">{project.typeOfFirm}</span></td>
                    <td>{project.address}</td>
                    <td>{project.corporatorName}</td>
                    <td>{project.contactNo}</td>
                    <td>{project.email}</td>
                    <td><span className={`status-badge ${getStatusClass(project.status)}`}>{project.status}</span></td>
                    <td>{project.prioritySector}</td>
                    <td>{project.firmSize}</td>
                    <td>{project.assignee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add New Project Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-project-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
            <h2 className="add-modal-title">Add New Project</h2>
            <p className="add-modal-subtitle">Complete the form to register a new project</p>

            <div className="add-modal-form">
              {/* Project Title */}
              <div className="modal-form-group full-width">
                <label>Project Title<span className="required">*</span></label>
                <input
                  type="text"
                  placeholder="Enter project title"
                  value={formData.projectTitle}
                  onChange={(e) => handleFormChange('projectTitle', e.target.value)}
                />
              </div>

              {/* Fund Row */}
              <div className="modal-form-row three-col">
                <div className="modal-form-group">
                  <label>Fund<span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter fund"
                    value={formData.fund}
                    onChange={(e) => handleFormChange('fund', e.target.value)}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Type of Fund<span className="required">*</span></label>
                  <select
                    value={formData.typeOfFund}
                    onChange={(e) => handleFormChange('typeOfFund', e.target.value)}
                  >
                    <option value="">Select Type</option>
                    <option value="GIA">GIA</option>
                    <option value="Loan">Loan</option>
                    <option value="Grant">Grant</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Firm Size<span className="required">*</span></label>
                  <select
                    value={formData.firmSize}
                    onChange={(e) => handleFormChange('firmSize', e.target.value)}
                  >
                    <option value="">Select Size</option>
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Large">Large</option>
                  </select>
                </div>
              </div>

              {/* Address Row */}
              <div className="modal-form-row three-col">
                <div className="modal-form-group">
                  <label>Province<span className="required">*</span></label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleFormChange('province', e.target.value)}
                  >
                    <option value="">Select Province</option>
                    {Object.keys(addressData).map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Municipality/City<span className="required">*</span></label>
                  <select
                    value={formData.municipality}
                    onChange={(e) => handleFormChange('municipality', e.target.value)}
                    disabled={!formData.province}
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Barangay<span className="required">*</span></label>
                  <select
                    value={formData.barangay}
                    onChange={(e) => handleFormChange('barangay', e.target.value)}
                    disabled={!formData.municipality}
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map(brgy => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="modal-form-group full-width">
                <label>Coordinates</label>
                <div className="coordinates-input-wrapper">
                  <input
                    type="text"
                    placeholder="e.g. 8.465281,124.623238"
                    value={formData.coordinates}
                    readOnly
                    className="coordinates-input"
                  />
                  <button
                    type="button"
                    className="coordinates-map-btn"
                    onClick={() => setShowMapPicker(true)}
                    title="Pick on Map"
                  >
                    <Icon icon="mdi:map-marker-plus-outline" width={20} height={20} />
                  </button>
                </div>
              </div>

              {/* Firm Row */}
              <div className="modal-form-row two-col">
                <div className="modal-form-group">
                  <label>Firm Name <span className="optional">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="Enter firm/establishment name"
                    value={formData.firmName}
                    onChange={(e) => handleFormChange('firmName', e.target.value)}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Firm/Establishment Type</label>
                  <input
                    type="text"
                    placeholder="Enter firm type/municipality"
                    value={formData.firmType}
                    onChange={(e) => handleFormChange('firmType', e.target.value)}
                  />
                </div>
              </div>

              {/* Cooperator Row */}
              <div className="modal-form-row two-col">
                <div className="modal-form-group">
                  <label>Cooperator&apos;s Name<span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter cooperator's name"
                    value={formData.cooperatorName}
                    onChange={(e) => handleFormChange('cooperatorName', e.target.value)}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Contact Number<span className="required">*</span></label>
                  {contactNumbers.map((num, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder="Enter contact number"
                      value={num}
                      onChange={(e) => handleContactChange(idx, e.target.value)}
                      className={idx > 0 ? 'mt-8' : ''}
                    />
                  ))}
                  <button type="button" className="add-email-btn" onClick={addContact}>
                    <Icon icon="mdi:plus" width={14} height={14} />
                    Add More Number
                  </button>
                </div>
              </div>

              {/* Email + Status + Priority Row */}
              <div className="modal-form-row three-col">
                <div className="modal-form-group">
                  <label>Email<span className="required">*</span></label>
                  {emails.map((email, idx) => (
                    <input
                      key={idx}
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                      className={idx > 0 ? 'mt-8' : ''}
                    />
                  ))}
                  <button type="button" className="add-email-btn" onClick={addEmail}>
                    <Icon icon="mdi:plus" width={14} height={14} />
                    Add More Email
                  </button>
                </div>
                <div className="modal-form-group">
                  <label>Project Status<span className="required">*</span></label>
                  <select
                    value={formData.projectStatus}
                    onChange={(e) => handleFormChange('projectStatus', e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Approved">Approved</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Priority Sector<span className="required">*</span></label>
                  <select
                    value={formData.prioritySector}
                    onChange={(e) => handleFormChange('prioritySector', e.target.value)}
                  >
                    <option value="">Select Sector</option>
                    <option value="Food Processing">Food Processing</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Aquaculture">Aquaculture</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Gifts & Housewares">Gifts & Housewares</option>
                  </select>
                </div>
              </div>

              {/* Company Logo */}
              <div className="modal-form-group full-width">
                <label>Company Logo</label>
                <div className="logo-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    id="logo-upload"
                    className="logo-upload-input"
                  />
                  <label htmlFor="logo-upload" className="logo-upload-label">
                    <Icon icon="mdi:cloud-upload-outline" width={28} height={28} />
                    <span>{formData.companyLogo ? formData.companyLogo.name : 'Click to upload logo'}</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="modal-form-actions">
                <button className="save-project-btn" onClick={handleSaveProject}>
                  Save Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      {showMapPicker && (
        <div className="modal-overlay map-picker-overlay" onClick={() => setShowMapPicker(false)}>
          <div className="map-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="map-picker-header">
              <h3>Pick Location on Map</h3>
              <button className="modal-close-btn" onClick={() => setShowMapPicker(false)}>
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>
            <p className="map-picker-hint">Click on the map to place a pin and auto-generate coordinates</p>
            <div className="map-picker-coords">
              <span>Coordinates: <strong>{formData.coordinates || '—'}</strong></span>
            </div>
            <div className="map-picker-container">
              <MapPickerInner
                lat={formData.coordinates ? parseFloat(formData.coordinates.split(',')[0]) : null}
                lng={formData.coordinates ? parseFloat(formData.coordinates.split(',')[1]) : null}
                onPick={(lat, lng) => {
                  setFormData(prev => ({
                    ...prev,
                    coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}`,
                  }));
                }}
              />
            </div>
            <div className="map-picker-actions">
              <button className="map-picker-confirm" onClick={() => setShowMapPicker(false)}>
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
    return <div className="maps-loading">Loading map...</div>;
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
    <MapContainer
      center={[lat || 8.477, lng || 124.646]}
      zoom={12}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler />
      {lat !== null && lng !== null && (
        <Marker position={[lat, lng]} icon={markerIcon} />
      )}
    </MapContainer>
  );
}
