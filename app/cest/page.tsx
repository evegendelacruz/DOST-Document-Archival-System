'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';

const filterCards = [
  { id: 'approved-amount', label: 'Total Approved Amount', value: '₱200,000.00', isAmount: true },
  { id: 'released-amount', label: 'Total Released Amount', value: '₱1,000,000.00', isAmount: true },
  { id: 'cest-program', label: 'Total CEST Program', value: '5', isAmount: false },
  { id: 'lira-program', label: 'Total LIRA Program', value: '5', isAmount: false },
  { id: 'swep-program', label: 'Total SWEP Program', value: '5', isAmount: false },
  { id: 'other-funding', label: 'Total Other Funding Source', value: '5', isAmount: false },
];

const projectData = [
  {
    id: 1,
    code: '001',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'CEST',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 2,
    code: '002',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'LIRA',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 3,
    code: '003',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'SWEP',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 4,
    code: '004',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'CEST',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 5,
    code: '005',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'LIRA',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 6,
    code: '006',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'SWEP',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 7,
    code: '007',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'CEST',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
  {
    id: 8,
    code: '008',
    projectTitle: 'Acquisition of Equipment for the Mass Production',
    location: 'Cagayan de Oro City',
    beneficiaries: 'Tabuan Organic Farmers Multi-Purpose Cooperative',
    programFunding: 'Other',
    status: 'Approved',
    approvedAmount: '₱200,000.00',
    releasedAmount: '₱150,000.00',
    projectDuration: '12 months',
    staffAssigned: 'Jane Doe',
    year: '2025',
    dateOfApproval: '01-15-2025',
  },
];

export default function CestPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DashboardLayout activePath="/cest">
      <main className="setup-main">
        {/* CEST Header */}
        <div className="setup-header">
          <div className="setup-title-section">
            <div className="cest-logo-icon">
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="23" stroke="#2e7d32" strokeWidth="2" fill="none"/>
                <path d="M25 10 L25 25 L35 35" stroke="#4caf50" strokeWidth="3" fill="none"/>
                <circle cx="25" cy="25" r="5" fill="#8bc34a"/>
                <path d="M15 20 Q25 5 35 20" stroke="#2e7d32" strokeWidth="2" fill="none"/>
                <path d="M20 35 Q25 45 30 35" stroke="#4caf50" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className="setup-title-text">
              <h1 className="setup-title cest-title">CEST</h1>
              <p className="setup-subtitle">Community Empowerment thru<br/>Science and Technology</p>
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
          <button className="add-project-btn">
            <Icon icon="mdi:plus" width={20} height={20} />
            Add New Project
          </button>
        </div>

        {/* Filter Cards */}
        <div className="cest-filter-cards">
          {filterCards.map(card => (
            <div key={card.id} className="cest-filter-card">
              <span className="cest-card-label">{card.label}</span>
              <span className={`cest-card-value ${card.isAmount ? 'amount' : ''}`}>{card.value}</span>
            </div>
          ))}
        </div>

        {/* Approved Section */}
        <div className="masterlist-section">
          <div className="masterlist-header">
            <h2 className="masterlist-title approved-title">
              <Icon icon="mdi:check-circle" width={24} height={24} color="#2e7d32" />
              APPROVED
            </h2>
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
                  <th>Code</th>
                  <th>Project Title</th>
                  <th>Location</th>
                  <th>Beneficiaries</th>
                  <th>Program/<br/>Funding</th>
                  <th>Status</th>
                  <th>Approved<br/>Amount</th>
                  <th>Released Amount</th>
                  <th>Project Duration</th>
                  <th>Staff<br/>Assigned</th>
                  <th>Year</th>
                  <th>Date of Approval (Ref.<br/>Approval Letter)</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map((project) => (
                  <tr key={project.id}>
                    <td className="code-cell">{project.code}</td>
                    <td className="project-title-cell">{project.projectTitle}</td>
                    <td>{project.location}</td>
                    <td>{project.beneficiaries}</td>
                    <td><span className="program-badge">{project.programFunding}</span></td>
                    <td><span className="status-badge status-approved">{project.status}</span></td>
                    <td>{project.approvedAmount}</td>
                    <td>{project.releasedAmount}</td>
                    <td>{project.projectDuration}</td>
                    <td>{project.staffAssigned}</td>
                    <td>{project.year}</td>
                    <td>{project.dateOfApproval}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
