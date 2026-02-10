'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

// Mock project data (same as setup page)
const projectData: Record<string, {
  id: number; code: string; title: string; firm: string; typeOfFirm: string;
  address: string; cooperatorName: string; contactNo: string; email: string;
  status: string; prioritySector: string; firmSize: string; assignee: string;
  datePublished: string;
}> = {
  '1': { id: 1, code: '001', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Proposal', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '2': { id: 2, code: '002', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Proposal', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '3': { id: 3, code: '003', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Approved', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '4': { id: 4, code: '004', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Ongoing', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '5': { id: 5, code: '005', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Withdrawn', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '6': { id: 6, code: '006', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Terminated', prioritySector: 'Agri-based Processing', firmSize: 'Medium', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '7': { id: 7, code: '007', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Evaluated', prioritySector: 'Agri-based Processing', firmSize: 'Large', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
  '8': { id: 8, code: '008', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technology', firm: 'Best Friend Goodies', typeOfFirm: 'Agri-processing', address: 'Purok 5, Kauswagan, Cagayan de Oro City', cooperatorName: 'Engr. Neriñosa T. Morales', contactNo: '09123456789', email: 'sample@gmail.com', status: 'Proposal', prioritySector: 'Agri-based Processing', firmSize: 'Small', assignee: 'Jane Doe', datePublished: 'February 14, 2026' },
};

type DocRow = {
  id: number;
  label: string;
  type: 'item' | 'dropdown' | 'section' | 'note';
};

const initiationDocs: DocRow[] = [
  { id: 1, label: 'Cover Sheet (Quotation)', type: 'dropdown' },
  { id: 2, label: 'Letter of Intent', type: 'item' },
  { id: 3, label: 'DTI Registration', type: 'item' },
  { id: 4, label: 'Business Permit', type: 'item' },
  { id: 5, label: 'Sworn Affidavit of the Assignee(s)', type: 'item' },
  { id: 6, label: 'ARA Certificate of Registration', type: 'item' },
  { id: 7, label: 'BIR Registrar to Operate as Processor', type: 'item' },
  { id: 8, label: 'Marriage Contract', type: 'item' },
  { id: 9, label: 'Bank Specifications', type: 'item' },
  { id: 10, label: 'Notice of Expansion', type: 'item' },
  { id: 11, label: 'TNA Form 1', type: 'item' },
  { id: 12, label: 'TNA Form 2', type: 'item' },
  { id: 0, label: 'Note: Notarize all Quotations', type: 'dropdown' },
  { id: 13, label: 'Potential Evaluation', type: 'item' },
  { id: 14, label: 'Internal Evaluation', type: 'item' },
  { id: 15, label: 'Forward Form for Equipment', type: 'item' },
  { id: 16, label: 'GMA Assessment', type: 'item' },
  { id: 0, label: 'List of Attachments', type: 'dropdown' },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: 'Checklist', type: 'item' },
  { id: 2, label: 'Approval Letter', type: 'item' },
  { id: 3, label: 'Confirmation of Agreement', type: 'item' },
  { id: 0, label: 'PHASE 1', type: 'section' },
  { id: 4, label: 'Approved Amount for Release', type: 'item' },
  { id: 5, label: 'Sub-Provincial Sector Approval (SPSA)', type: 'item' },
  { id: 6, label: 'Project Cost', type: 'item' },
  { id: 7, label: 'Authority to Pay, Landed Charges of Equipment, Deposit of Goods', type: 'item' },
  { id: 8, label: 'Official Receipt of DOST Financial Assistance', type: 'item' },
  { id: 9, label: 'Packaging Requirement', type: 'item' },
  { id: 0, label: 'MIE', type: 'section' },
  { id: 10, label: 'Consumable Purchase Order', type: 'item' },
  { id: 11, label: 'Supplier Recommendation Purchase', type: 'item' },
  { id: 12, label: 'Unloading Schedule', type: 'dropdown' },
  { id: 13, label: 'Wholesale Payment for Equipment', type: 'item' },
  { id: 14, label: 'Wholesale Payment for Supplies', type: 'item' },
  { id: 0, label: 'DRE', type: 'section' },
  { id: 15, label: 'DRE', type: 'item' },
  { id: 16, label: 'DRE', type: 'item' },
  { id: 0, label: 'LIQUIDATION', type: 'section' },
  { id: 17, label: 'Accepted Liquidation', type: 'item' },
  { id: 18, label: 'Annex 1', type: 'item' },
  { id: 19, label: 'Annex 2', type: 'item' },
  { id: 20, label: 'Liquidation Report', type: 'item' },
  { id: 21, label: 'Property Acknowledgement Receipt', type: 'item' },
  { id: 22, label: 'Inspection Report', type: 'item' },
  { id: 0, label: 'PHASE 2', type: 'section' },
  { id: 23, label: 'Demand Letter / Notice', type: 'item' },
  { id: 24, label: 'Clearance for Issuance', type: 'item' },
  { id: 25, label: 'List of Inventory of Equipment', type: 'item' },
  { id: 26, label: 'Accepted Liquidation', type: 'item' },
  { id: 27, label: 'Annex 1', type: 'item' },
  { id: 28, label: 'Annex 2', type: 'item' },
  { id: 29, label: 'Liquidation Report', type: 'item' },
  { id: 30, label: 'Property Acknowledgement Receipt', type: 'item' },
  { id: 0, label: 'COMPLETION', type: 'section' },
  { id: 31, label: 'Completion Report', type: 'item' },
  { id: 32, label: 'Issuance of Certificate of Ownership', type: 'item' },
  { id: 33, label: 'Completion Report', type: 'item' },
];

function DocumentTable({ title, docs }: { title: string; docs: DocRow[] }) {
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({});

  const toggleDropdown = (key: string) => {
    setExpandedDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  let itemCounter = 0;

  return (
    <div className="bg-white rounded-xl mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <h2 className="text-base font-bold text-primary pt-5 px-7 m-0 mb-3">{title}</h2>
      <div className="flex items-start gap-2 bg-[#e1f5fe] border border-[#b3e5fc] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#0277bd] leading-[1.4]">
        <Icon icon="mdi:information-outline" width={16} height={16} className="min-w-4 mt-px" />
        <span>To ensure that the document you uploaded is viewable in our system, click the View button below and check the document you uploaded. If it is not viewable, re-upload the document</span>
      </div>
      <div className="overflow-x-auto px-7">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-primary text-white">
              <th className="w-9 py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">#</th>
              <th className="min-w-[240px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">Documentary Requirements</th>
              <th className="w-40 py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">File</th>
              <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">Date Uploaded</th>
              <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, idx) => {
              if (doc.type === 'section') {
                return (
                  <tr key={`section-${idx}`}>
                    <td colSpan={5} className="py-2.5 px-3 bg-[#f0f0f0] border-b border-[#ddd] text-[13px] text-primary">
                      <strong>{doc.label}</strong>
                    </td>
                  </tr>
                );
              }

              if (doc.type === 'dropdown') {
                const key = `dropdown-${idx}`;
                return (
                  <tr key={key}>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" onClick={() => toggleDropdown(key)}>
                        <Icon icon={expandedDropdowns[key] ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                        <span>{doc.label}</span>
                      </button>
                    </td>
                  </tr>
                );
              }

              itemCounter++;
              const rowKey = `${title}-${doc.id}-${idx}`;

              return (
                <tr key={rowKey}>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">{doc.label}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">—</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    <div className="flex gap-1.5">
                      <button className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 text-white bg-[#f5a623] hover:opacity-80" title="Upload">
                        <Icon icon="mdi:upload" width={14} height={14} />
                      </button>
                      <button className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 text-white bg-[#2e7d32] hover:opacity-80" title="View">
                        <Icon icon="mdi:eye-outline" width={14} height={14} />
                      </button>
                      <button className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 text-white bg-[#c62828] hover:opacity-80" title="Delete">
                        <Icon icon="mdi:delete-outline" width={14} height={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center py-5 px-7">
        <button className="bg-accent text-white border-none rounded-[20px] py-2.5 px-12 text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover">Save</button>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const project = projectData[id];

  if (!project) {
    return (
      <DashboardLayout activePath="/setup">
        <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
          <p>Project not found.</p>
          <Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            Back
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
        {/* Back Button */}
        <Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* SETUP 4.0 Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-[50px] h-[50px] flex items-center justify-center">
            <img src="/setup-logo.png" alt="SETUP" className="w-[50px] h-[50px] object-contain bg-primary rounded-full p-2" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[28px] font-bold text-primary m-0 leading-none">SETUP 4.0</h1>
            <p className="text-[10px] text-[#666] m-0 leading-[1.3]">Small Enterprise Technology<br/>Upgrading Program</p>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 flex justify-between items-start mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex gap-5 flex-1">
            <div className="w-[70px] h-[70px] min-w-[70px] rounded-full bg-[#e3f2fd] flex items-center justify-center overflow-hidden">
              <Icon icon="mdi:store" width={48} height={48} color="#146184" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[13px] text-[#888] mb-1">
                <span className="text-[#c62828] font-semibold">{project.firm}</span>
                <span className="text-[#ccc]">|</span>
                <span className="text-[#555]">{project.firmSize}</span>
              </div>
              <h2 className="text-lg font-bold text-[#222] m-0 mb-0.5 leading-[1.3]">{project.title}</h2>
              <p className="text-sm text-[#555] m-0 mb-3">Acquisition of Equipment for the Mass</p>
              <div className="[&_p]:my-0.5 [&_p]:text-[13px] [&_p]:text-[#555] [&_strong]:text-[#c62828] [&_strong]:font-semibold">
                <p><strong>Cooperator&apos;s Name:</strong> {project.cooperatorName}</p>
                <p><strong>Address:</strong> {project.address}</p>
                <p><strong>Priority Sector:</strong> {project.prioritySector}</p>
                <p><strong>Assignee:</strong> {project.assignee}</p>
                <p><strong>Date Published:</strong> {project.datePublished}</p>
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover">
              <Icon icon="mdi:pencil-outline" width={16} height={16} />
              Edit Mode
            </button>
          </div>
        </div>

        {/* Project Initiation */}
        <DocumentTable title="Project Initiation" docs={initiationDocs} />

        {/* Project Implementation */}
        <DocumentTable title="Project Implementation" docs={implementationDocs} />
      </main>
    </DashboardLayout>
  );
}
