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
      <main className="flex-1 py-5 px-[30px] bg-[#f5f5f5] overflow-x-auto">
        {/* CEST Header */}
        <div className="flex justify-between items-center bg-white py-[15px] px-[25px] rounded-[15px] mb-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] gap-[30px]">
          <div className="flex items-center gap-[15px]">
            <div className="w-[50px] h-[50px] flex items-center justify-center">
              <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="25" cy="25" r="23" stroke="#2e7d32" strokeWidth="2" fill="none"/>
                <path d="M25 10 L25 25 L35 35" stroke="#4caf50" strokeWidth="3" fill="none"/>
                <circle cx="25" cy="25" r="5" fill="#8bc34a"/>
                <path d="M15 20 Q25 5 35 20" stroke="#2e7d32" strokeWidth="2" fill="none"/>
                <path d="M20 35 Q25 45 30 35" stroke="#4caf50" strokeWidth="2" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[28px] font-bold text-[#2e7d32] m-0 leading-none">CEST</h1>
              <p className="text-[10px] text-[#666] m-0 leading-[1.3]">Community Empowerment thru<br/>Science and Technology</p>
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
          <button className="flex items-center gap-2 py-3 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover">
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

        {/* Approved Section */}
        <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-5 pb-[15px] border-b border-[#e0e0e0]">
            <h2 className="text-lg font-bold text-primary m-0 flex items-center gap-2.5">
              <Icon icon="mdi:check-circle" width={24} height={24} color="#2e7d32" />
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
            <table className="w-full border-collapse text-xs [&_th]:py-3 [&_th]:px-2.5 [&_th]:text-left [&_th]:border-b [&_th]:border-[#e0e0e0] [&_th]:bg-[#f9f9f9] [&_th]:font-semibold [&_th]:text-[#333] [&_th]:whitespace-normal [&_th]:min-w-[80px] [&_th]:align-middle [&_th]:text-center [&_td]:py-3 [&_td]:px-2.5 [&_td]:text-left [&_td]:border-b [&_td]:border-[#e0e0e0] [&_tbody_tr:hover]:bg-[#f9f9f9]">
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
                    <td className="text-primary font-semibold whitespace-nowrap">{project.code}</td>
                    <td className="max-w-[250px] text-[#333] font-medium whitespace-normal break-words">{project.projectTitle}</td>
                    <td>{project.location}</td>
                    <td>{project.beneficiaries}</td>
                    <td><span className="inline-block py-1 px-2.5 bg-[#e3f2fd] text-[#1565c0] rounded-[15px] text-[11px] font-medium">{project.programFunding}</span></td>
                    <td><span className="inline-block py-1 px-3 rounded-[15px] text-[11px] font-medium bg-[#e8f5e9] text-[#2e7d32]">{project.status}</span></td>
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
