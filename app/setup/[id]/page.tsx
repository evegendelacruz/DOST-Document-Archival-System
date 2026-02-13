'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

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

interface ProjectDocument {
  id: string;
  phase: string;
  templateItemId: string | null;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

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

function DocumentTable({
  title,
  docs,
  projectId,
  phase,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: 'INITIATION' | 'IMPLEMENTATION';
}) {
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetItemIdRef = useRef<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/setup-projects/${projectId}/documents`);
      if (!res.ok) return;
      const allDocs: ProjectDocument[] = await res.json();
      setDocuments(allDocs.filter(d => d.phase === phase));
    } catch {
      // silently fail
    }
  }, [projectId, phase]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const toggleDropdown = (key: string) => {
    setExpandedDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDocForItem = (templateItemId: string): ProjectDocument | undefined => {
    return documents.find(d => d.templateItemId === templateItemId);
  };

  const handleUploadClick = (templateItemId: string) => {
    targetItemIdRef.current = templateItemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const templateItemId = targetItemIdRef.current;
    if (!file || !templateItemId) return;

    // Reset the input so the same file can be re-selected
    e.target.value = '';

    setUploadingItemId(templateItemId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('phase', phase);
      formData.append('templateItemId', templateItemId);

      const res = await fetch(`/api/setup-projects/${projectId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      await fetchDocuments();
    } catch {
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingItemId(null);
      targetItemIdRef.current = null;
    }
  };

  const handleView = (doc: ProjectDocument) => {
    setPreviewDoc(doc);
  };

  const handleDownload = async (doc: ProjectDocument) => {
    try {
      const response = await fetch(`/api/setup-projects/${projectId}/documents/${doc.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download file. Please try again.');
    }
  };

  const handlePrint = () => {
    if (!previewDoc) return;
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleDelete = async (doc: ProjectDocument) => {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;

    try {
      const res = await fetch(`/api/setup-projects/${projectId}/documents/${doc.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      await fetchDocuments();
    } catch {
      alert('Failed to delete file. Please try again.');
    }
  };

  let itemCounter = 0;

  return (
    <>
      <div className="bg-white rounded-xl mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <h2 className="text-base font-bold text-primary pt-5 px-7 m-0 mb-3">{title}</h2>
        <div className="flex items-start gap-2 bg-[#e1f5fe] border border-[#b3e5fc] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#0277bd] leading-[1.4]">
          <Icon icon="mdi:information-outline" width={16} height={16} className="min-w-4 mt-px" />
          <span>To ensure that the document you uploaded is viewable in our system, click the View button below and check the document you uploaded. If it is not viewable, re-upload the document</span>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />

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
                const templateItemId = `${phase}-${doc.id}`;
                const uploadedDoc = getDocForItem(templateItemId);
                const isUploading = uploadingItemId === templateItemId;
                const hasFile = !!uploadedDoc;

                return (
                  <tr key={`${title}-${doc.id}-${idx}`}>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">{doc.label}</td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      {hasFile ? (
                        <span className="text-[#333] text-xs truncate block max-w-[150px]" title={uploadedDoc.fileName}>
                          {uploadedDoc.fileName}
                        </span>
                      ) : (
                        <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                      {hasFile
                        ? new Date(uploadedDoc.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      <div className="flex gap-1.5">
                        {/* Upload */}
                        <button
                          className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 text-white bg-[#f5a623] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Upload"
                          onClick={() => handleUploadClick(templateItemId)}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                          ) : (
                            <Icon icon="mdi:upload" width={14} height={14} />
                          )}
                        </button>
                        {/* View */}
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                            hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                          }`}
                          title="View"
                          onClick={() => hasFile && handleView(uploadedDoc)}
                          disabled={!hasFile}
                        >
                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                        </button>
                        {/* Delete */}
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                            hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                          }`}
                          title="Delete"
                          onClick={() => hasFile && handleDelete(uploadedDoc)}
                          disabled={!hasFile}
                        >
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
        <div className="py-5" />
      </div>

      {/* Modal Preview */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPreviewDoc(null)}>
          {/* A4 aspect ratio: 210mm x 297mm = 1:1.414 */}
          <div className="bg-white rounded-lg w-[calc(90vh/1.414)] h-[90vh] max-w-full flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-sm font-semibold text-gray-800 truncate pr-4">{previewDoc.fileName}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                title="Close"
              >
                <Icon icon="mdi:close" width={20} height={20} className="text-gray-600" />
              </button>
            </div>

            {/* Modal Body - Document Preview */}
            <div className="flex-1 overflow-hidden bg-white">
              <iframe
                id="preview-iframe"
                src={`/api/setup-projects/${projectId}/documents/${previewDoc.id}/download#toolbar=0`}
                className="w-full h-full border-none"
                title={previewDoc.fileName}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => handleDownload(previewDoc)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00bcd4] text-white rounded-md font-semibold text-xs hover:bg-[#0097a7] transition-colors"
              >
                <Icon icon="mdi:download" width={16} height={16} />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#ff9800] text-white rounded-md font-semibold text-xs hover:bg-[#f57c00] transition-colors"
              >
                <Icon icon="mdi:printer" width={16} height={16} />
                Print
              </button>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold text-xs hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/setup-projects/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => setProject(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout activePath="/setup">
        <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
          <p className="text-[#999] text-sm">Loading project...</p>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !project) {
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

  const datePublished = new Date(project.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
        {/* Back Button */}
        <Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {/* Header with SETUP logo and Edit button */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3.5">
            {/* SETUP 4.0 Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-[120px] h-auto flex items-center justify-center">
                <img src="/setup-4.0-logo.png" alt="SETUP" className="w-[120px] h-auto" />
              </div>
            </div>
            </div>
            <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover">
              <Icon icon="mdi:pencil-outline" width={16} height={16} />
              Edit Mode
            </button>
          </div>

        {/* Project Content */}
        <div className="flex gap-5 items-start">
          <div className="w-[100px] h-[100px] min-w-[100px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {/* Default circle for project logo - can upload image here */}
            <Icon icon="mdi:store" width={48} height={48} color="#999" />
          </div>
          <div className="flex-1 flex gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-[13px] mb-1">
                <span className="text-[#555] font-medium">{project.firm || '—'}</span>
                <span className="text-[#ccc]">|</span>
                <span className="text-[#555]">{project.firmSize || '—'}</span>
              </div>
              <h2 className="text-[18px] font-bold text-[#146184] m-0 mb-1 leading-[1.3]">{project.title}</h2>
              <p className="text-[14px] text-[#555] m-0 mb-2">{project.typeOfFirm || ''}</p>
              <div className="inline-block bg-[#ff9800] text-white text-[11px] font-semibold px-3 py-1 rounded-full mb-3">
                Ongoing
              </div>
            </div>
            <div className="[&_p]:my-1 [&_p]:text-[13px] [&_p]:text-[#555] [&_strong]:text-[#222] [&_strong]:font-semibold">
              <p><strong>Cooperator&apos;s Name:</strong> {project.corporatorName || '—'}</p>
              <p><strong>Address:</strong> {project.address || '—'}</p>
              <p><strong>Priority Sector:</strong> {project.prioritySector || '—'}</p>
              <p><strong>Assignee:</strong> {project.assignee || '—'}</p>
              <p><strong>Date Published:</strong> {datePublished}</p>
            </div>
          </div>
        </div>
      </div>
  


        {/* Project Initiation */}
        <DocumentTable title="Project Initiation" docs={initiationDocs} projectId={id} phase="INITIATION" />

        {/* Project Implementation */}
        <DocumentTable title="Project Implementation" docs={implementationDocs} projectId={id} phase="IMPLEMENTATION" />
      </main>
    </DashboardLayout>
  );
}