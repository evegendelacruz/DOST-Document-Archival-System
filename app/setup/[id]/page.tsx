'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  options?: string[];
  subItems?: DocRow[];
};

const initiationDocs: DocRow[] = [
  { id: 1, label: 'Letter of Intent', type: 'item' },
  { id: 2, label: 'Business Permit', type: 'item' },
  { 
    id: 3, 
    label: 'Type of Business', 
    type: 'dropdown',
    options: ['Sole Proprietorship', 'Partnership', 'Corporation', 'Cooperative'],
    subItems: [
      { id: 301, label: 'DTI Registration', type: 'item' },
      { id: 302, label: 'CDA/SEC Registration', type: 'item' },
      { id: 303, label: 'Articles of Incorporation', type: 'item' },
      { id: 304, label: 'Board Resolution', type: 'item' },
    ]
  },
  { id: 5, label: 'Financial Statement', type: 'item' },
  { id: 6, label: 'Sworn Affidavit of the Assignee(s)', type: 'item' },
  { id: 7, label: 'BIR Registrar to Operate as Processor', type: 'item' },
  { id: 8, label: 'LBP Regular Current Account', type: 'item' },
  { id: 9, label: 'Barangay Clearance', type: 'item' },
  { id: 10, label: 'Bank Statements', type: 'item' },
  { id: 11, label: 'Biodata of Proponent', type: 'item' },
  { id: 12, label: 'TNA Form 1', type: 'item' },
  { id: 13, label: 'TNA Form 2', type: 'item' },
  { 
    id: 0, 
    label: 'Abstract of Quotation', 
    type: 'dropdown',
    options: ['Equipment', 'Non-equipment']
  },
  { id: 14, label: 'Project Proposal', type: 'item' },
  { id: 15, label: 'Internal Evaluation (Date, PPT Presentation, Compliance Report)', type: 'item' },
  { id: 16, label: 'External Evaluation (Date, PPT Presentation, Compliance Report)', type: 'item' },
  { id: 17, label: 'Hazard Hunter PH Assessment', type: 'item' },
  { id: 18, label: 'GAD Assessment', type: 'item' },
  { id: 19, label: 'Executive Summary (word template for input)', type: 'item' },
  { 
    id: 0, 
    label: 'List of Intervention', 
    type: 'dropdown'
  },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: 'Pre-PIS', type: 'item' },
  { id: 2, label: 'Approval Letter', type: 'item' },
  { 
    id: 3, 
    label: 'Memorandum of Agreement', 
    type: 'dropdown',
    options: ['Main MOA', 'Supplemental MOA']
  },
  { id: 0, label: 'PHASE 1', type: 'section' },
  { id: 4, label: 'Approved Amount for Release', type: 'item' },
  { 
    id: 5, 
    label: 'Fund Release Date', 
    type: 'dropdown',
    options: ['DV', 'ORS']
  },
  { id: 6, label: 'Project Code', type: 'item' },
  { 
    id: 7, 
    label: 'Authority to Tag', 
    type: 'dropdown',
    options: ['Tagging of Account', 'Tagging of Funds']
  },
  { id: 8, label: 'Official Receipt of DOST Financial Assistance', type: 'item' },
  { id: 9, label: 'Untagging Requirement', type: 'item' },
  { id: 0, label: '1ST', type: 'section' },
  { id: 10, label: 'Irrevocable Purchase Order', type: 'item' },
  { id: 11, label: 'Supplier Documentary Requirements', type: 'item' },
  { id: 12, label: 'Untagging Amount', type: 'item' },
  { 
    id: 13, 
    label: 'Clearance to Untag', 
    type: 'dropdown',
  },
  { id: 0, label: '2ND', type: 'section' },
  { id: 14, label: 'AR', type: 'item' },
  { id: 15, label: 'IAR', type: 'item' },
  { id: 16, label: 'Receipt of Downpayment', type: 'item' },
  { id: 17, label: 'Clearance to Untag', type: 'item' },
  { id: 18, label: 'List of Inventory of Equipment', type: 'item' },
  { id: 0, label: 'LIQUIDATION', type: 'section' },
  { id: 19, label: 'Accepted Liquidation', type: 'item' },
  { id: 20, label: 'Annex E', type: 'item' },
  { id: 21, label: 'Annex F', type: 'item' },
  { id: 22, label: 'Liquidation Report', type: 'item' },
  { id: 23, label: 'Property Acknowledgement Receipt', type: 'item' },
  { 
    id: 24, 
    label: 'Completion Report', 
    type: 'dropdown',
    options: ['Termination/Withdrawal Report', 'Completion Report']
  },
  { id: 0, label: 'PHASE 2', type: 'section' },
  { 
    id: 25, 
    label: 'Annual PIS', 
    type: 'dropdown',
    options: ['2024', '2025', '2026', '2027', '2028']
  },
  { 
    id: 26, 
    label: 'QPR', 
    type: 'dropdown',
    options: ['Q1', 'Q2', 'Q3', 'Q4']
  },
  { id: 27, label: 'Receipt of PDC', type: 'item' },
  { 
    id: 28, 
    label: 'Graduation Report', 
    type: 'dropdown',
    options: ['Termination/Withdrawal Report', 'Graduation Report']
  },
  { id: 29, label: 'Scan copy of Certificate of Ownership', type: 'item' },
];

function DocumentTable({
  title,
  docs,
  projectId,
  phase,
  onProgressUpdate,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: 'INITIATION' | 'IMPLEMENTATION';
  onProgressUpdate?: (progress: number) => void;
}) {
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imgPan, setImgPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [uploadSuccess, setUploadSuccess] = useState<{
    fileName: string;
    fileType: string;
    fileSize: string;
    uploadedBy: string;
    date: string;
  } | null>(null);
  const [fileListModal, setFileListModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetItemIdRef = useRef<string | null>(null);
  const [moaType, setMoaType] = useState<string>('');
  const [fundReleaseType, setFundReleaseType] = useState<string>('');
  const [authorityTagType, setAuthorityTagType] = useState<string>('');
  const [clearanceUntagType, setClearanceUntagType] = useState<string>('');
  const [completionReportType, setCompletionReportType] = useState<string>('');
  const [annualPISYear, setAnnualPISYear] = useState<string>('');
  const [qprQuarter, setQPRQuarter] = useState<string>('');
  const [graduationReportType, setGraduationReportType] = useState<string>('');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [untaggingAmount, setUntaggingAmount] = useState<string>('');
  const [moaSupplementalCount, setMoaSupplementalCount] = useState<number>(0);
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string>>({});
  const [abstractQuotationType, setAbstractQuotationType] = useState<string>('');
  const [interventionInputs, setInterventionInputs] = useState<Array<{
    type: 'equipment' | 'non-equipment';
    name?: string;
    cost?: string;
    status?: string;
    propertyCode?: string;
    serviceType?: string;
  }>>([]);
  const [clearanceUntagRows, setClearanceUntagRows] = useState<Array<{
    amount: string;
    equipment: string;
    supplier: string;
  }>>([{ amount: '', equipment: '', supplier: '' }]);
  const [completionReportRows, setCompletionReportRows] = useState<Array<{
    type: string;
  }>>([]);
  const [annualPISRows, setAnnualPISRows] = useState<Array<{
    year: string;
  }>>([]);

  useEffect(() => {
    if (onProgressUpdate) {
      const { percent } = calculateProgress();
      onProgressUpdate(percent);
    }
  }, [documents, annualPISRows, completionReportRows, moaSupplementalCount, dropdownSelections]);

  const calculateProgress = () => {
    let totalItems = 0;
    let uploadedItems = 0;

    const countItems = (docList: DocRow[]) => {
      docList.forEach(doc => {
        if (doc.type === 'section' || doc.type === 'note') return;

        if (doc.type === 'dropdown') {
          if (doc.label === 'Annual PIS') {
            annualPISRows.forEach((_, idx) => {
              totalItems++;
              const templateItemId = `${phase}-${doc.id}-${idx}`;
              if (getDocForItem(templateItemId)) uploadedItems++;
            });
          } else if (doc.label === 'Completion Report' || doc.label === 'Graduation Report') {
            completionReportRows.forEach((row, idx) => {
              totalItems++;
              const templateItemId = `${phase}-${doc.id}-${row.type}-${idx}`;
              if (getDocForItem(templateItemId)) uploadedItems++;
            });
          } else if (doc.label === 'Memorandum of Agreement') {
            totalItems++;
            const mainId = `${phase}-${doc.id}-default`;
            if (getDocForItem(mainId)) uploadedItems++;
            
            for (let i = 0; i < moaSupplementalCount; i++) {
              totalItems++;
              const suppId = `${phase}-${doc.id}-supplemental-${i}`;
              if (getDocForItem(suppId)) uploadedItems++;
            }
          } else if (doc.label === 'Type of Business' && doc.subItems) {
            const businessType = dropdownSelections[doc.id];
            if (businessType) {
              const itemsToCount = businessType === 'Sole Proprietorship'
                ? doc.subItems.filter(sub => sub.id === 301)
                : doc.subItems.filter(sub => sub.id !== 301);
              
              itemsToCount.forEach(subItem => {
                totalItems++;
                const templateItemId = `${phase}-${subItem.id}`;
                if (getDocForItem(templateItemId)) uploadedItems++;
              });
            }
          } else if (doc.options) {
            doc.options.forEach((_, idx) => {
              totalItems++;
              const templateItemId = `${phase}-${doc.id}-${idx}`;
              if (getDocForItem(templateItemId)) uploadedItems++;
            });
          }
        } else {
          totalItems++;
          const templateItemId = `${phase}-${doc.id}`;
          if (getDocForItem(templateItemId)) uploadedItems++;
        }
      });
    };

    countItems(docs);
    return { totalItems, uploadedItems, percent: totalItems > 0 ? Math.round((uploadedItems / totalItems) * 100) : 0 };
  };

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

  const getDocsForItem = (templateItemId: string): ProjectDocument[] => {
    return documents.filter(d => d.templateItemId === templateItemId);
  };

  const getDocForItem = (templateItemId: string): ProjectDocument | undefined => {
    return documents.find(d => d.templateItemId === templateItemId);
  };

  const handleUploadClick = (templateItemId: string) => {
    targetItemIdRef.current = templateItemId;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const templateItemId = targetItemIdRef.current;
    if (!fileList || fileList.length === 0 || !templateItemId) return;

    const files = Array.from(fileList);
    e.target.value = '';

    setUploadingItemId(templateItemId);
    try {
      let lastUploaded: { fileName: string; fileType: string; fileSize: string; date: string } | null = null;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phase', phase);
        formData.append('templateItemId', templateItemId);

        const res = await fetch(`/api/setup-projects/${projectId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');

        const sizeKB = (file.size / 1024).toFixed(1);
        const sizeStr = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${sizeKB} KB`;
        lastUploaded = {
          fileName: file.name,
          fileType: file.type.split('/').pop()?.toUpperCase() || 'FILE',
          fileSize: sizeStr,
          date: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
        };
      }
      await fetchDocuments();
      if (lastUploaded) {
        setUploadSuccess({
          ...lastUploaded,
          uploadedBy: 'User',
        });
      }
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
    } catch {
      alert('Failed to download file. Please try again.');
    }
  };

  const handlePrint = (doc: ProjectDocument) => {
    const url = `/api/setup-projects/${projectId}/documents/${doc.id}/download`;
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
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

  const handleDeleteAll = async (templateItemId: string) => {
    const docs = getDocsForItem(templateItemId);
    if (docs.length === 0) return;
    const msg = docs.length === 1
      ? `Delete "${docs[0].fileName}"?`
      : `Delete all ${docs.length} files for this item?`;
    if (!confirm(msg)) return;
    try {
      await Promise.all(docs.map(d =>
        fetch(`/api/setup-projects/${projectId}/documents/${d.id}`, { method: 'DELETE' })
      ));
      await fetchDocuments();
    } catch {
      alert('Failed to delete files. Please try again.');
    }
  };

  const handleDeleteSingle = async (docId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    try {
      await fetch(`/api/setup-projects/${projectId}/documents/${docId}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch {
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleDropdownSelection = (docId: number, value: string) => {
    setDropdownSelections(prev => ({ ...prev, [docId]: value }));
  };

  const handleSaveDropdownSelection = (docId: number) => {
    // Save the selection (you can add API call here if needed)
    alert(`Selection saved: ${dropdownSelections[docId]}`);
  };

  const addInterventionItem = () => {
    const type = abstractQuotationType.toLowerCase() as 'equipment' | 'non-equipment';
    setInterventionInputs(prev => [...prev, { type }]);
  };

  const updateInterventionItem = (index: number, field: string, value: string) => {
    setInterventionInputs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeInterventionItem = (index: number) => {
    setInterventionInputs(prev => prev.filter((_, i) => i !== index));
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

      <input
        ref={fileInputRef}
        type="file"
        multiple
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
                const isExpanded = expandedDropdowns[key];
                
                // Special handling for List of Intervention
                if (doc.label === 'List of Intervention') {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button 
                            className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                {abstractQuotationType && (
                                  <button
                                    onClick={addInterventionItem}
                                    className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                                  >
                                    Add {abstractQuotationType} Item
                                  </button>
                                )}
                                
                                {interventionInputs.length > 0 && (
                                  <button
                                    onClick={() => alert(`Saved ${interventionInputs.length} intervention item(s)`)}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors ml-auto"
                                  >
                                    Save All Items
                                  </button>
                                )}
                              </div>
                              
                              {interventionInputs.map((item, index) => (
                                <div key={index} className="border border-[#ddd] rounded p-3 bg-white">
                                  <div className="flex justify-between items-center mb-2">
                                    <strong className="text-xs text-[#2e7d32]">
                                      {item.type === 'equipment' ? 'Equipment' : 'Non-Equipment'} #{index + 1}
                                    </strong>
                                    <button
                                      onClick={() => removeInterventionItem(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Icon icon="mdi:close" width={16} height={16} />
                                    </button>
                                  </div>
                                  
                                  {item.type === 'equipment' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-[#555] mb-1">Name of Equipment</label>
                                        <input
                                          type="text"
                                          value={item.name || ''}
                                          onChange={(e) => updateInterventionItem(index, 'name', e.target.value)}
                                          className="w-full border border-[#ddd] rounded px-2 py-1 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-[#555] mb-1">Cost</label>
                                        <input
                                          type="text"
                                          value={item.cost || ''}
                                          onChange={(e) => updateInterventionItem(index, 'cost', e.target.value)}
                                          className="w-full border border-[#ddd] rounded px-2 py-1 text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-[#555] mb-1">Status</label>
                                        <select
                                          value={item.status || ''}
                                          onChange={(e) => updateInterventionItem(index, 'status', e.target.value)}
                                          className="w-full border border-[#ddd] rounded px-2 py-1 text-xs"
                                        >
                                          <option value="">Select...</option>
                                          <option value="Procured">Procured</option>
                                          <option value="Pulled Out">Pulled Out</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs text-[#555] mb-1">Equipment Property Code</label>
                                        <input
                                          type="text"
                                          value={item.propertyCode || ''}
                                          onChange={(e) => updateInterventionItem(index, 'propertyCode', e.target.value)}
                                          className="w-full border border-[#ddd] rounded px-2 py-1 text-xs"
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <label className="block text-xs text-[#555] mb-1">Service Type</label>
                                      <select
                                        value={item.serviceType || ''}
                                        onChange={(e) => updateInterventionItem(index, 'serviceType', e.target.value)}
                                        className="w-full border border-[#ddd] rounded px-2 py-1 text-xs"
                                      >
                                        <option value="">Select...</option>
                                        <option value="Laboratory Testing">Laboratory Testing</option>
                                        <option value="Packaging">Packaging</option>
                                        <option value="Labelling">Labelling</option>
                                        <option value="Trainings">Trainings</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {!abstractQuotationType && (
                                <p className="text-xs text-[#999] italic">
                                  Please select a type in &quot;Abstract of Quotation&quot; first
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
                
                // Type of Business dropdown
                if (doc.label === 'Type of Business' && doc.options) {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button 
                            className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="flex items-center gap-3">
                              <select
                                value={dropdownSelections[doc.id] || ''}
                                onChange={(e) => handleDropdownSelection(doc.id, e.target.value)}
                                className="border border-[#ddd] rounded px-3 py-2 text-xs flex-1"
                              >
                                <option value="">Select business type...</option>
                                {doc.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveDropdownSelection(doc.id)}
                                disabled={!dropdownSelections[doc.id]}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                Save
                              </button>
                            </div>
                            
                            {/* Show sub-items based on selection */}
                            {dropdownSelections[doc.id] && doc.subItems && (
                              <div className="mt-4 space-y-2">
                                {dropdownSelections[doc.id] === 'Sole Proprietorship' ? (
                                  // Show only DTI Registration for Sole Proprietorship
                                  doc.subItems.filter(subItem => subItem.id === 301).map((subItem) => {
                                    const templateItemId = `${phase}-${subItem.id}`;
                                    const uploadedDoc = getDocForItem(templateItemId);
                                    const isUploading = uploadingItemId === templateItemId;
                                    const hasFile = !!uploadedDoc;
                                    
                                    return (
                                      <div key={subItem.id} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                        <span className="flex-1 text-xs text-[#333]">{subItem.label}</span>
                                        <div className="flex gap-1.5">
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
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="View"
                                            onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:eye-outline" width={14} height={14} />
                                          </button>
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="Delete"
                                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:delete-outline" width={14} height={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  // Show other documents for other business types
                                  doc.subItems.filter(subItem => subItem.id !== 301).map((subItem) => {
                                    const templateItemId = `${phase}-${subItem.id}`;
                                    const uploadedDoc = getDocForItem(templateItemId);
                                    const isUploading = uploadingItemId === templateItemId;
                                    const hasFile = !!uploadedDoc;
                                    
                                    return (
                                      <div key={subItem.id} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                        <span className="flex-1 text-xs text-[#333]">{subItem.label}</span>
                                        <div className="flex gap-1.5">
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
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="View"
                                            onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:eye-outline" width={14} height={14} />
                                          </button>
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="Delete"
                                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:delete-outline" width={14} height={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
                
                // Abstract of Quotation dropdown
                if (doc.label === 'Abstract of Quotation' && doc.options) {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button 
                            className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="flex items-center gap-3">
                              <select
                                value={abstractQuotationType}
                                onChange={(e) => setAbstractQuotationType(e.target.value)}
                                className="border border-[#ddd] rounded px-3 py-2 text-xs flex-1"
                              >
                                <option value="">Select type...</option>
                                {doc.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => alert(`Abstract type saved: ${abstractQuotationType}`)}
                                disabled={!abstractQuotationType}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
                // Memorandum of Agreement dropdown handler
                if (doc.label === 'Memorandum of Agreement' && doc.options) {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button 
                            className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              {/* Default MOA */}
                              <div>
                                <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333] font-semibold">Memorandum of Agreement</span>
                                  <div className="flex gap-1.5">
                                    {(() => {
                                      const templateItemId = `${phase}-${doc.id}-default`;
                                      const uploadedDoc = getDocForItem(templateItemId);
                                      const isUploading = uploadingItemId === templateItemId;
                                      const hasFile = !!uploadedDoc;
                                      
                                      return (
                                        <>
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
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="View"
                                            onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:eye-outline" width={14} height={14} />
                                          </button>
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="Delete"
                                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:delete-outline" width={14} height={14} />
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* Supplemental MOAs */}
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-[#555]">Supplemental MOAs</span>
                                  <button
                                    onClick={() => {
                                      setMoaSupplementalCount(prev => prev + 1);
                                    }}
                                    className="bg-[#2e7d32] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                                  >
                                    + Add Supplemental MOA
                                  </button>
                                </div>
                                
                                {moaSupplementalCount > 0 && (
                                  <div className="space-y-2">
                                    {Array.from({ length: moaSupplementalCount }, (_, idx) => {
                                      const templateItemId = `${phase}-${doc.id}-supplemental-${idx}`;
                                      const uploadedDoc = getDocForItem(templateItemId);
                                      const isUploading = uploadingItemId === templateItemId;
                                      const hasFile = !!uploadedDoc;
                                      
                                      return (
                                        <div key={idx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                          <span className="flex-1 text-xs text-[#333]">Supplemental MOA #{idx + 1}</span>
                                          <div className="flex gap-1.5">
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
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                                hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                              }`}
                                              title="View"
                                              onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                              disabled={!hasFile}
                                            >
                                              <Icon icon="mdi:eye-outline" width={14} height={14} />
                                            </button>
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                                hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                              }`}
                                              title="Delete"
                                              onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                              disabled={!hasFile}
                                            >
                                              <Icon icon="mdi:delete-outline" width={14} height={14} />
                                            </button>
                                            <button
                                              className="w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white bg-[#757575] hover:opacity-80"
                                              title="Remove Slot"
                                              onClick={() => {
                                                if (confirm(`Remove Supplemental MOA #${idx + 1} slot?`)) {
                                                  setMoaSupplementalCount(prev => Math.max(0, prev - 1));
                                                }
                                              }}
                                            >
                                              <Icon icon="mdi:minus" width={14} height={14} />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

              // Fund Release Date dropdown handler
              if (doc.label === 'Fund Release Date' && doc.options) {
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button 
                          className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-[#555] font-semibold min-w-[100px]">Release Date:</label>
                              <input
                                type="date"
                                className="border border-[#ddd] rounded px-3 py-2 text-xs flex-1"
                                placeholder="Select date"
                              />
                            </div>
                            <div className="space-y-2">
                              {doc.options.map((type, idx) => {
                                const templateItemId = `${phase}-${doc.id}-${idx}`;
                                const uploadedDoc = getDocForItem(templateItemId);
                                const isUploading = uploadingItemId === templateItemId;
                                const hasFile = !!uploadedDoc;
                                
                                return (
                                  <div key={idx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                    <span className="flex-1 text-xs text-[#333] font-semibold">{type}</span>
                                    <div className="flex gap-1.5">
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
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                          hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                        }`}
                                        title="View"
                                        onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                        disabled={!hasFile}
                                      >
                                        <Icon icon="mdi:eye-outline" width={14} height={14} />
                                      </button>
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                          hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                        }`}
                                        title="Delete"
                                        onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                        disabled={!hasFile}
                                      >
                                        <Icon icon="mdi:delete-outline" width={14} height={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }
              // Authority to Tag dropdown handler
              if (doc.label === 'Authority to Tag' && doc.options) {
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button 
                          className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-2">
                            {doc.options.map((type, idx) => {
                              const templateItemId = `${phase}-${doc.id}-${idx}`;
                              const uploadedDoc = getDocForItem(templateItemId);
                              const isUploading = uploadingItemId === templateItemId;
                              const hasFile = !!uploadedDoc;
                              
                              return (
                                <div key={idx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333]">{type}</span>
                                  <div className="flex gap-1.5">
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
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                        hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title="View"
                                      onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                      disabled={!hasFile}
                                    >
                                      <Icon icon="mdi:eye-outline" width={14} height={14} />
                                    </button>
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                        hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title="Delete"
                                      onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile}
                                    >
                                      <Icon icon="mdi:delete-outline" width={14} height={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }

              // Clearance to Untag dropdown handler
              if (doc.label === 'Clearance to Untag' && doc.type === 'dropdown') {
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button 
                          className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-3">
                            <div className="bg-white border border-[#ddd] rounded p-3">
                              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-2 text-xs font-semibold text-[#555]">
                                <div>Amount</div>
                                <div>Equipment</div>
                                <div>Supplier</div>
                                <div className="w-7"></div>
                              </div>
                              
                              {clearanceUntagRows.map((row, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-2">
                                  <input
                                    type="text"
                                    value={row.amount}
                                    onChange={(e) => {
                                      const updated = [...clearanceUntagRows];
                                      updated[idx].amount = e.target.value;
                                      setClearanceUntagRows(updated);
                                    }}
                                    placeholder="Enter amount"
                                    className="border border-[#ddd] rounded px-2 py-1.5 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={row.equipment}
                                    onChange={(e) => {
                                      const updated = [...clearanceUntagRows];
                                      updated[idx].equipment = e.target.value;
                                      setClearanceUntagRows(updated);
                                    }}
                                    placeholder="Enter equipment"
                                    className="border border-[#ddd] rounded px-2 py-1.5 text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={row.supplier}
                                    onChange={(e) => {
                                      const updated = [...clearanceUntagRows];
                                      updated[idx].supplier = e.target.value;
                                      setClearanceUntagRows(updated);
                                    }}
                                    placeholder="Enter supplier"
                                    className="border border-[#ddd] rounded px-2 py-1.5 text-xs"
                                  />
                                  <button
                                    onClick={() => {
                                      if (clearanceUntagRows.length > 1) {
                                        setClearanceUntagRows(clearanceUntagRows.filter((_, i) => i !== idx));
                                      }
                                    }}
                                    disabled={clearanceUntagRows.length === 1}
                                    className="w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white bg-[#c62828] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove row"
                                  >
                                    <Icon icon="mdi:close" width={14} height={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  setClearanceUntagRows([...clearanceUntagRows, { amount: '', equipment: '', supplier: '' }]);
                                }}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                              >
                                + Add More Row
                              </button>
                              <button
                                onClick={() => {
                                  alert(`Saved ${clearanceUntagRows.length} row(s)`);
                                  console.log('Clearance to Untag data:', clearanceUntagRows);
                                }}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors ml-auto"
                              >
                                Save All
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }

              // Completion Report dropdown handler
              if (doc.label === 'Completion Report' && doc.options) {
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button 
                          className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-3">
                            {doc.options.map((option, optIdx) => (
                              <div key={optIdx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-[#555]">{option}</span>
                                  <button
                                    onClick={() => {
                                      setCompletionReportRows([...completionReportRows, { type: option }]);
                                    }}
                                    className="bg-[#2e7d32] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                                  >
                                    + Add {option}
                                  </button>
                                </div>
                                
                                {completionReportRows
                                  .map((row, rowIdx) => ({ row, rowIdx }))
                                  .filter(({ row }) => row.type === option)
                                  .map(({ row, rowIdx }) => {
                                    const templateItemId = `${phase}-${doc.id}-${option}-${rowIdx}`;
                                    const uploadedDoc = getDocForItem(templateItemId);
                                    const isUploading = uploadingItemId === templateItemId;
                                    const hasFile = !!uploadedDoc;
                                    
                                    return (
                                      <div key={rowIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                        <span className="flex-1 text-xs text-[#333]">
                                          {option} #{completionReportRows.filter(r => r.type === option).indexOf(row) + 1}
                                        </span>
                                        <div className="flex gap-1.5">
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
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="View"
                                            onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:eye-outline" width={14} height={14} />
                                          </button>
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                              hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title="Delete"
                                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:delete-outline" width={14} height={14} />
                                          </button>
                                          <button
                                            className="w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white bg-[#757575] hover:opacity-80"
                                            title="Remove Row"
                                            onClick={() => {
                                              if (confirm(`Remove this ${option}?`)) {
                                                setCompletionReportRows(completionReportRows.filter((_, i) => i !== rowIdx));
                                              }
                                            }}
                                          >
                                            <Icon icon="mdi:close" width={14} height={14} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ))}
                            
                            {completionReportRows.length > 0 && (
                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => {
                                    alert(`Saved ${completionReportRows.length} completion report(s)`);
                                    console.log('Completion Report data:', completionReportRows);
                                  }}
                                  className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors"
                                >
                                  Save All
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }

              if (doc.label === 'Annual PIS' && doc.options) {
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button 
                        className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                        onClick={() => toggleDropdown(key)}
                      >
                        <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                        <span>{doc.label}</span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#555]">Annual PIS Reports</span>
                            <button
                              onClick={() => {
                                setAnnualPISRows([...annualPISRows, { year: '' }]);
                              }}
                              className="bg-[#2e7d32] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                            >
                              + Add Annual PIS
                            </button>
                          </div>
                          
                          {annualPISRows.map((row, rowIdx) => {
                            const templateItemId = `${phase}-${doc.id}-${rowIdx}`;
                            const uploadedDoc = getDocForItem(templateItemId);
                            const isUploading = uploadingItemId === templateItemId;
                            const hasFile = !!uploadedDoc;
                            
                            return (
                              <div key={rowIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                <select
                                  value={row.year}
                                  onChange={(e) => {
                                    const updated = [...annualPISRows];
                                    updated[rowIdx].year = e.target.value;
                                    setAnnualPISRows(updated);
                                  }}
                                  className="border border-[#ddd] rounded px-2 py-1.5 text-xs w-32"
                                >
                                  <option value="">Select year...</option>
                                  {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                  ))}
                                </select>
                                <span className="flex-1 text-xs text-[#333]">
                                  Annual PIS {row.year ? `(${row.year})` : `#${rowIdx + 1}`}
                                </span>
                                <div className="flex gap-1.5">
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
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                      hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title="View"
                                    onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                    disabled={!hasFile}
                                  >
                                    <Icon icon="mdi:eye-outline" width={14} height={14} />
                                  </button>
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                      hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title="Delete"
                                    onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                    disabled={!hasFile}
                                  >
                                    <Icon icon="mdi:delete-outline" width={14} height={14} />
                                  </button>
                                  <button
                                    className="w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white bg-[#757575] hover:opacity-80"
                                    title="Remove Row"
                                    onClick={() => {
                                      if (confirm(`Remove this Annual PIS?`)) {
                                        setAnnualPISRows(annualPISRows.filter((_, i) => i !== rowIdx));
                                      }
                                    }}
                                  >
                                    <Icon icon="mdi:close" width={14} height={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          
                          {annualPISRows.length > 0 && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => {
                                  alert(`Saved ${annualPISRows.length} Annual PIS report(s)`);
                                  console.log('Annual PIS data:', annualPISRows);
                                }}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors"
                              >
                                Save All
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }

            // QPR dropdown handler
            if (doc.label === 'QPR' && doc.options) {
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button 
                        className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                        onClick={() => toggleDropdown(key)}
                      >
                        <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                        <span>{doc.label}</span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                        <div className="space-y-3">
                          {doc.options.map((quarter, qIdx) => {
                            const templateItemId = `${phase}-${doc.id}-${quarter}`;
                            const uploadedDoc = getDocForItem(templateItemId);
                            const isUploading = uploadingItemId === templateItemId;
                            const hasFile = !!uploadedDoc;
                            
                            return (
                              <div key={qIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                <span className="flex-1 text-xs text-[#333] font-semibold">
                                  Quarter {quarter.replace('Q', '')} Report
                                </span>
                                <div className="flex gap-1.5">
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
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                      hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title="View"
                                    onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                    disabled={!hasFile}
                                  >
                                    <Icon icon="mdi:eye-outline" width={14} height={14} />
                                  </button>
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                      hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title="Delete"
                                    onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                    disabled={!hasFile}
                                  >
                                    <Icon icon="mdi:delete-outline" width={14} height={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }

            // Graduation Report dropdown handler
            if (doc.label === 'Graduation Report' && doc.options) {
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button 
                        className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                        onClick={() => toggleDropdown(key)}
                      >
                        <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                        <span>{doc.label}</span>
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                        <div className="space-y-3">
                          {doc.options.map((option, optIdx) => (
                            <div key={optIdx} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#555]">{option}</span>
                                <button
                                  onClick={() => {
                                    setCompletionReportRows([...completionReportRows, { type: option }]);
                                  }}
                                  className="bg-[#2e7d32] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors"
                                >
                                  + Add {option}
                                </button>
                              </div>
                              
                              {completionReportRows
                                .map((row, rowIdx) => ({ row, rowIdx }))
                                .filter(({ row }) => row.type === option)
                                .map(({ row, rowIdx }) => {
                                  const templateItemId = `${phase}-${doc.id}-${option}-${rowIdx}`;
                                  const uploadedDoc = getDocForItem(templateItemId);
                                  const isUploading = uploadingItemId === templateItemId;
                                  const hasFile = !!uploadedDoc;
                                  
                                  return (
                                    <div key={rowIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333]">
                                        {option} #{completionReportRows.filter(r => r.type === option).indexOf(row) + 1}
                                      </span>
                                      <div className="flex gap-1.5">
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
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="View"
                                          onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                          disabled={!hasFile}
                                        >
                                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="Delete"
                                          onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                          disabled={!hasFile}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className="w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white bg-[#757575] hover:opacity-80"
                                          title="Remove Row"
                                          onClick={() => {
                                            if (confirm(`Remove this ${option}?`)) {
                                              setCompletionReportRows(completionReportRows.filter((_, i) => i !== rowIdx));
                                            }
                                          }}
                                        >
                                          <Icon icon="mdi:close" width={14} height={14} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ))}
                          
                          {completionReportRows.length > 0 && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => {
                                  alert(`Saved ${completionReportRows.length} report(s)`);
                                  console.log('Graduation Report data:', completionReportRows);
                                }}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors"
                              >
                                Save All
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            }
                              
                // Default dropdown (no options)
                return (
                  <tr key={key}>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button 
                        className="flex items-center gap-1.5 bg-[#e8f5e9] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
                        onClick={() => toggleDropdown(key)}
                      >
                        <Icon icon={expandedDropdowns[key] ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                        <span>{doc.label}</span>
                      </button>
                    </td>
                  </tr>
                );
              }

              itemCounter++;
              const templateItemId = `${phase}-${doc.id}`;
              const allDocsForItem = getDocsForItem(templateItemId);
              const latestDoc = allDocsForItem[0];
              const isUploading = uploadingItemId === templateItemId;
              const hasFile = allDocsForItem.length > 0;

              return (
                <tr key={`${title}-${doc.id}-${idx}`}>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">{doc.label}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    {hasFile ? (() => {
                      const visibleDocs = allDocsForItem.slice(0, 3);
                      const hasMore = allDocsForItem.length > 3;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {visibleDocs.map((d) => {
                            const ext = d.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                            const extColor = ext === 'PDF' ? '#e53935' : ext === 'DOCX' || ext === 'DOC' ? '#1565c0' : ext === 'XLSX' || ext === 'XLS' ? '#2e7d32' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#f57c00' : '#607d8b';
                            return (
                              <button
                                key={d.id}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: '5px', padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#e8ecf1')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#f5f7fa')}
                                onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); setPreviewDoc(d); }}
                                title={d.fileName}
                              >
                                <span style={{ flexShrink: 0, fontSize: '7px', fontWeight: 700, color: '#fff', padding: '1px 3px', borderRadius: '2px', backgroundColor: extColor }}>{ext}</span>
                                <span style={{ fontSize: '10px', color: '#333', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</span>
                              </button>
                            );
                          })}
                          {hasMore && (
                            <button
                              onClick={() => setFileListModal(templateItemId)}
                              title={`Show all ${allDocsForItem.length} files`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: '#555', flexShrink: 0, whiteSpace: 'nowrap' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#ccc')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                            >
                              +{allDocsForItem.length - 3}
                            </button>
                          )}
                        </div>
                      );
                    })() : (
                      <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                    {hasFile
                      ? new Date(latestDoc.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    <div className="flex gap-1.5">
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
                      <button
                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                          hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                        }`}
                        title="Delete"
                        onClick={() => hasFile && handleDeleteAll(templateItemId)}
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
    {/* Upload Count */}
    {(() => {
      const { totalItems, uploadedItems } = calculateProgress();
      return (
        <div style={{ textAlign: 'right', padding: '0 8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>{uploadedItems}/{totalItems} files uploaded</span>
        </div>
      );
    })()}

    {/* File List Modal */}
    {fileListModal && (() => {
      const modalDocs = getDocsForItem(fileListModal);
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={() => setFileListModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-[420px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div style={{ background: '#F59E0B', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>Uploaded Files ({modalDocs.length})</span>
              <button onClick={() => setFileListModal(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '12px 16px', maxHeight: '360px', overflowY: 'auto' }}>
              {modalDocs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '20px 0' }}>No files uploaded</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modalDocs.map((d) => {
                    const ext = d.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                    const extColor = ext === 'PDF' ? '#e53935' : ext === 'DOCX' || ext === 'DOC' ? '#1565c0' : ext === 'XLSX' || ext === 'XLS' ? '#2e7d32' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#f57c00' : '#607d8b';
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f9fafb', border: '1px solid #eee', borderRadius: '8px', padding: '10px 12px' }}>
                        <div style={{ flexShrink: 0, width: '36px', height: '42px', borderRadius: '4px', backgroundColor: extColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '10px', fontWeight: 700 }}>{ext}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <button
                            onClick={() => { setFileListModal(null); setPreviewDoc(d); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 500, color: '#333', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', textAlign: 'left' }}
                            title={d.fileName}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#00AEEF')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#333')}
                          >
                            {d.fileName}
                          </button>
                          <span style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSingle(d.id, d.fileName)}
                          title="Delete file"
                          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', background: '#fee2e2', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#e53935')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#fee2e2')}
                        >
                          <Icon icon="mdi:delete-outline" width={16} height={16} color="#e53935" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button
                onClick={() => setFileListModal(null)}
                style={{ background: '#fff', color: '#333', border: '1px solid #d0d0d0', borderRadius: '6px', padding: '8px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* Upload Success Modal */}
    {uploadSuccess && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setUploadSuccess(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[440px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-5">File Upload Successfully!</h3>
          {/* File shape preview */}
          <div className="flex items-center gap-3 bg-[#f5f7fa] rounded-lg px-4 py-3 mb-5 text-left">
            <div className="flex-shrink-0 w-10 h-12 bg-[#e53935] rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold uppercase">
                {uploadSuccess.fileName.split('.').pop() || 'FILE'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#333] m-0 truncate" title={uploadSuccess.fileName}>{uploadSuccess.fileName}</p>
              <p className="text-[11px] text-[#888] m-0 mt-0.5">{uploadSuccess.fileSize}</p>
            </div>
          </div>
          <div className="text-left space-y-2 mb-6 pl-1">
            <div className="flex justify-between text-[13px]">
              <span className="text-[#888]">File Name:</span>
              <span className="text-[#333] font-medium truncate max-w-[220px]" title={uploadSuccess.fileName}>{uploadSuccess.fileName}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#888]">File Type:</span>
              <span className="text-[#333] font-medium">{uploadSuccess.fileType}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#888]">File Size:</span>
              <span className="text-[#333] font-medium">{uploadSuccess.fileSize}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#888]">Uploaded By:</span>
              <span className="text-[#333] font-medium">{uploadSuccess.uploadedBy}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-[#888]">Date:</span>
              <span className="text-[#333] font-medium">{uploadSuccess.date}</span>
            </div>
          </div>
          <button
            className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1b5e20]"
            onClick={() => setUploadSuccess(null)}
          >
            Okay
          </button>
        </div>
      </div>
    )}

    {/* File Preview Modal */}
    {previewDoc && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100]" onClick={() => setPreviewDoc(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[750px] max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.3)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between py-3 px-5 border-b border-[#eee] bg-[#f9f9f9]">
            <div className="flex items-center gap-2 min-w-0">
              <Icon icon="mdi:file-document-outline" width={20} height={20} className="text-primary shrink-0" />
              <span className="text-[13px] font-semibold text-[#333] truncate">{previewDoc.fileName}</span>
            </div>
            <button className="bg-transparent border-none cursor-pointer text-[#999] p-1 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#e0e0e0] hover:text-[#333] shrink-0" onClick={() => setPreviewDoc(null)}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
          </div>
          {/* Preview Content */}
          {(() => {
            const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(previewDoc.fileName);
            return isImage ? (
              <div
                className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh] flex items-center justify-center"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onWheel={(e) => {
                  e.preventDefault();
                  setZoomLevel(z => {
                    const delta = e.deltaY < 0 ? 10 : -10;
                    return Math.min(300, Math.max(25, z + delta));
                  });
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                  dragStart.current = { x: e.clientX, y: e.clientY, panX: imgPan.x, panY: imgPan.y };
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return;
                  setImgPan({
                    x: dragStart.current.panX + (e.clientX - dragStart.current.x),
                    y: dragStart.current.panY + (e.clientY - dragStart.current.y),
                  });
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <img
                  src={`/api/setup-projects/${projectId}/documents/${previewDoc.id}/download`}
                  alt={previewDoc.fileName}
                  draggable={false}
                  style={{ transform: `scale(${zoomLevel / 100}) translate(${imgPan.x}px, ${imgPan.y}px)`, transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.1s ease', maxWidth: '100%', userSelect: 'none' }}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh]">
                <iframe
                  src={`/api/setup-projects/${projectId}/documents/${previewDoc.id}/download`}
                  className="w-full h-full min-h-[400px] border-none"
                  title={`Preview: ${previewDoc.fileName}`}
                />
              </div>
            );
          })()}
          {/* Footer with actions */}
          <div className="flex items-center justify-between py-3.5 px-5 border-t border-[#eee] bg-[#f9f9f9]">
            {/* Zoom controls - only for images */}
            {/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(previewDoc.fileName) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setZoomLevel(z => Math.max(25, z - 25))}
                  disabled={zoomLevel <= 25}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #d0d0d0', background: zoomLevel <= 25 ? '#f0f0f0' : '#fff', cursor: zoomLevel <= 25 ? 'not-allowed' : 'pointer', color: zoomLevel <= 25 ? '#bbb' : '#333' }}
                >
                  <Icon icon="mdi:minus" width={16} height={16} />
                </button>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#555', minWidth: '40px', textAlign: 'center' }}>{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(300, z + 25))}
                  disabled={zoomLevel >= 300}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #d0d0d0', background: zoomLevel >= 300 ? '#f0f0f0' : '#fff', cursor: zoomLevel >= 300 ? 'not-allowed' : 'pointer', color: zoomLevel >= 300 ? '#bbb' : '#333' }}
                >
                  <Icon icon="mdi:plus" width={16} height={16} />
                </button>
                <button
                  onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); }}
                  style={{ fontSize: '11px', color: '#00AEEF', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, marginLeft: '4px' }}
                >
                  Reset
                </button>
              </div>
            ) : <div />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="flex items-center gap-1.5 py-2 px-5 bg-[#00AEEF] text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                onClick={() => handleDownload(previewDoc)}
              >
                <Icon icon="mdi:download" width={16} height={16} />
                Download
              </button>
              <button
                className="flex items-center gap-1.5 py-2 px-5 bg-[#F59E0B] text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                onClick={() => handlePrint(previewDoc)}
              >
                <Icon icon="mdi:printer" width={16} height={16} />
                Print
              </button>
              <button
                className="flex items-center gap-1.5 py-2 px-5 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[13px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </button>
            </div>
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
  const [initiationProgress, setInitiationProgress] = useState(0);
  const [implementationProgress, setImplementationProgress] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const overallProgress = Math.round((initiationProgress + implementationProgress) / 2);

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project || newStatus === project.status) {
      setShowStatusDropdown(false);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/setup-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setProject(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
      setShowStatusDropdown(false);
    }
  };

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

  const statusConfig: Record<string, { label: string; bg: string; text: string; bar: string }> = {
    PROPOSAL: { label: 'Proposal', bg: '#e3f2fd', text: '#1565c0', bar: '#1565c0' },
    APPROVED: { label: 'Approved', bg: '#e8f5e9', text: '#2e7d32', bar: '#2e7d32' },
    ONGOING: { label: 'Ongoing', bg: '#fff8e1', text: '#f57f17', bar: '#ffa726' },
    WITHDRAWN: { label: 'Withdrawal', bg: '#f0f0f0', text: '#757575', bar: '#9e9e9e' },
    TERMINATED: { label: 'Terminated', bg: '#fce4ec', text: '#ad1457', bar: '#ad1457' },
    GRADUATED: { label: 'Graduated', bg: '#e0f2f1', text: '#00695c', bar: '#00695c' },
  };
  const currentStatus = statusConfig[project.status] || statusConfig.PROPOSAL;

  return (
    <DashboardLayout activePath="/setup">
      <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
        {/* Back Button */}
        <Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
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
              <div className="relative inline-block mb-3" ref={statusDropdownRef}>
                <button
                  className="text-[11px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer flex items-center gap-1 transition-opacity duration-200 hover:opacity-80"
                  style={{ backgroundColor: currentStatus.bg, color: currentStatus.text }}
                  onClick={() => setShowStatusDropdown(v => !v)}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : currentStatus.label}
                  <Icon icon="mdi:chevron-down" width={14} height={14} />
                </button>
                {showStatusDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-[160px] bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 py-1">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        className={`w-full flex items-center gap-2 py-2 px-3 text-[12px] text-left border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#f5f5f5] ${project.status === key ? 'font-semibold' : ''}`}
                        onClick={() => handleStatusUpdate(key)}
                      >
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.bar }}></span>
                        {cfg.label}
                        {project.status === key && <Icon icon="mdi:check" width={14} height={14} className="ml-auto" style={{ color: cfg.bar }} />}
                      </button>
                    ))}
                  </div>
                )}
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

        {/* Project Progress */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-3 gap-6">
            {/* Project Initiation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Project Initiation</h3>
                <span className="text-[13px] font-semibold text-[#333]">{initiationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${initiationProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
            </div>

            {/* Project Implementation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Project Implementation</h3>
                <span className="text-[13px] font-semibold text-[#333]">{implementationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${implementationProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
            </div>

            {/* Overall Project Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Overall Project Progress</h3>
                <span className="text-[13px] font-semibold text-[#333]">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${overallProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Initiation */}
          <DocumentTable 
            title="Project Initiation" 
            docs={initiationDocs} 
            projectId={id} 
            phase="INITIATION"
            onProgressUpdate={setInitiationProgress}
          />

          {/* Project Implementation */}
          <DocumentTable 
            title="Project Implementation" 
            docs={implementationDocs} 
            projectId={id} 
            phase="IMPLEMENTATION"
            onProgressUpdate={setImplementationProgress}
          />
      </main>
    </DashboardLayout>
  );
}


