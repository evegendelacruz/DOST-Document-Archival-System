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
    <div className="doc-section">
      <h2 className="doc-section-title">{title}</h2>
      <div className="doc-info-banner">
        <Icon icon="mdi:information-outline" width={16} height={16} />
        <span>To ensure that the document you uploaded is viewable in our system, click the View button below and check the document you uploaded. If it is not viewable, re-upload the document</span>
      </div>
      <div className="doc-table-container">
        <table className="doc-table">
          <thead>
            <tr>
              <th className="doc-th-num">#</th>
              <th className="doc-th-name">Documentary Requirements</th>
              <th className="doc-th-file">File</th>
              <th className="doc-th-date">Date Uploaded</th>
              <th className="doc-th-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc, idx) => {
              if (doc.type === 'section') {
                return (
                  <tr key={`section-${idx}`} className="doc-section-row">
                    <td colSpan={5}>
                      <strong>{doc.label}</strong>
                    </td>
                  </tr>
                );
              }

              if (doc.type === 'dropdown') {
                const key = `dropdown-${idx}`;
                return (
                  <tr key={key} className="doc-dropdown-row">
                    <td colSpan={5}>
                      <button className="doc-dropdown-btn" onClick={() => toggleDropdown(key)}>
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
                <tr key={rowKey} className="doc-item-row">
                  <td className="doc-td-num">{itemCounter}</td>
                  <td className="doc-td-name">{doc.label}</td>
                  <td className="doc-td-file">
                    <span className="doc-no-file">No file uploaded</span>
                  </td>
                  <td className="doc-td-date">—</td>
                  <td className="doc-td-action">
                    <div className="doc-action-btns">
                      <button className="doc-action-btn upload" title="Upload">
                        <Icon icon="mdi:upload" width={14} height={14} />
                      </button>
                      <button className="doc-action-btn view" title="View">
                        <Icon icon="mdi:eye-outline" width={14} height={14} />
                      </button>
                      <button className="doc-action-btn delete" title="Delete">
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
      <div className="doc-save-container">
        <button className="doc-save-btn">Save</button>
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
        <main className="project-detail-main">
          <p>Project not found.</p>
          <Link href="/setup" className="back-link">
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            Back
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activePath="/setup">
      <main className="project-detail-main">
        {/* Back Button */}
        <Link href="/setup" className="back-link">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* SETUP 4.0 Header */}
        <div className="pd-setup-header">
          <div className="setup-logo-icon">
            <img src="/setup-logo.png" alt="SETUP" className="pd-setup-logo" />
          </div>
          <div className="setup-title-text">
            <h1 className="setup-title">SETUP 4.0</h1>
            <p className="setup-subtitle">Small Enterprise Technology<br/>Upgrading Program</p>
          </div>
        </div>

        {/* Project Info Card */}
        <div className="pd-info-card">
          <div className="pd-info-left">
            <div className="pd-company-logo">
              <Icon icon="mdi:store" width={48} height={48} color="#146184" />
            </div>
            <div className="pd-info-text">
              <div className="pd-status-line">
                <span className="pd-firm-name">{project.firm}</span>
                <span className="pd-divider">|</span>
                <span className="pd-firm-size">{project.firmSize}</span>
              </div>
              <h2 className="pd-project-title">{project.title}</h2>
              <p className="pd-project-subtitle">Acquisition of Equipment for the Mass</p>
              <div className="pd-details">
                <p><strong>Cooperator&apos;s Name:</strong> {project.cooperatorName}</p>
                <p><strong>Address:</strong> {project.address}</p>
                <p><strong>Priority Sector:</strong> {project.prioritySector}</p>
                <p><strong>Assignee:</strong> {project.assignee}</p>
                <p><strong>Date Published:</strong> {project.datePublished}</p>
              </div>
            </div>
          </div>
          <div className="pd-info-right">
            <button className="pd-edit-mode-btn">
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
