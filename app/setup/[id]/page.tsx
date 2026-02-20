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
  dropdownData: Record<string, unknown> | null;
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
  { id: 0, label: 'Abstract of Quotation', type: 'dropdown', options: ['Equipment', 'Non-equipment'] },
  { id: 14, label: 'Project Proposal', type: 'item' },
  { id: 15, label: 'Internal Evaluation (Date, PPT Presentation, Compliance Report)', type: 'item' },
  { id: 16, label: 'External Evaluation (Date, PPT Presentation, Compliance Report)', type: 'item' },
  { id: 17, label: 'Hazard Hunter PH Assessment', type: 'item' },
  { id: 18, label: 'GAD Assessment', type: 'item' },
  { id: 19, label: 'Executive Summary (word template for input)', type: 'item' },
  { id: 0, label: 'List of Intervention', type: 'dropdown' },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: 'Pre-PIS', type: 'item' },
  { id: 2, label: 'Approval Letter', type: 'item' },
  { id: 3, label: 'Memorandum of Agreement', type: 'dropdown', options: ['Main MOA', 'Supplemental MOA'] },
  { id: 0, label: 'PHASE 1', type: 'section' },
  { id: 4, label: 'Approved Amount for Release', type: 'item' },
  { id: 5, label: 'Fund Release Date', type: 'dropdown', options: ['DV', 'ORS'] },
  { id: 6, label: 'Project Code', type: 'item' },
  { id: 7, label: 'Authority to Tag', type: 'dropdown', options: ['Tagging of Account', 'Tagging of Funds'] },
  { id: 8, label: 'Official Receipt of DOST Financial Assistance', type: 'item' },
  { id: 9, label: 'Untagging Requirement', type: 'item' },
  { id: 0, label: '1ST', type: 'section' },
  { id: 10, label: 'Irrevocable Purchase Order', type: 'item' },
  { id: 11, label: 'Supplier Documentary Requirements', type: 'item' },
  { id: 12, label: 'Untagging Amount', type: 'item' },
  { id: 13, label: 'Clearance to Untag', type: 'dropdown' },
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
  { id: 24, label: 'Completion Report', type: 'dropdown', options: ['Termination/Withdrawal Report', 'Completion Report'] },
  { id: 0, label: 'PHASE 2', type: 'section' },
  { id: 25, label: 'Annual PIS', type: 'dropdown', options: ['2024', '2025', '2026', '2027', '2028'] },
  { id: 26, label: 'QPR', type: 'dropdown', options: ['Q1', 'Q2', 'Q3', 'Q4'] },
  { id: 27, label: 'Receipt of PDC', type: 'item' },
  { id: 28, label: 'Graduation Report', type: 'dropdown', options: ['Termination/Withdrawal Report', 'Graduation Report'] },
  { id: 29, label: 'Scan copy of Certificate of Ownership', type: 'item' },
];

// ── Shared upload/delete button pair ───────────────────────────────────────
function ActionButtons({
  templateItemId,
  isUploading,
  hasFile,
  onUpload,
  onDelete,
  extra,
}: {
  templateItemId: string;
  isUploading: boolean;
  hasFile: boolean;
  onUpload: () => void;
  onDelete: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer text-white bg-[#f5a623] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Upload" onClick={onUpload} disabled={isUploading}
      >
        {isUploading
          ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
          : <Icon icon="mdi:upload" width={14} height={14} />}
      </button>
      <button
        className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
        title="Delete" onClick={onDelete} disabled={!hasFile}
      >
        <Icon icon="mdi:delete-outline" width={14} height={14} />
      </button>
      {extra}
    </div>
  );
}

function DocumentTable({
  title, docs, projectId, phase, onProgressUpdate, initialDropdownData, onDropdownDataSaved,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: 'INITIATION' | 'IMPLEMENTATION';
  onProgressUpdate?: (progress: number, uploaded: number, total: number) => void;
  initialDropdownData?: Record<string, unknown> | null;
  onDropdownDataSaved?: (data: Record<string, unknown>) => void;
}) {
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [imgPan, setImgPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [uploadSuccess, setUploadSuccess] = useState<{ fileName: string; fileType: string; fileSize: string; uploadedBy: string; date: string } | null>(null);
  const [fileListModal, setFileListModal] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetItemIdRef = useRef<string | null>(null);

  const dd = initialDropdownData ?? {};
  const [moaSupplementalCount, setMoaSupplementalCount] = useState<number>((dd.moaSupplementalCount as number) ?? 0);
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string>>((dd.businessType as Record<string, string>) ?? {});
  const [abstractQuotationType, setAbstractQuotationType] = useState<string>((dd.abstractQuotationType as string) ?? '');
  const [interventionInputs, setInterventionInputs] = useState<Array<{ type: 'equipment' | 'non-equipment'; name?: string; cost?: string; status?: string; propertyCode?: string; serviceType?: string }>>((dd.interventionItems as Array<{ type: 'equipment' | 'non-equipment'; name?: string; cost?: string; status?: string; propertyCode?: string; serviceType?: string }>) ?? []);
  const [clearanceUntagRows, setClearanceUntagRows] = useState<Array<{ amount: string; equipment: string; supplier: string }>>((dd.clearanceUntagRows as Array<{ amount: string; equipment: string; supplier: string }>) ?? [{ amount: '', equipment: '', supplier: '' }]);
  const [completionReportRows, setCompletionReportRows] = useState<Array<{ type: string }>>((dd.completionReportRows as Array<{ type: string }>) ?? []);
  const [annualPISRows, setAnnualPISRows] = useState<Array<{ year: string }>>((dd.annualPISRows as Array<{ year: string }>) ?? []);
  const [savingDropdown, setSavingDropdown] = useState(false);

  const saveDropdownData = async (partialData: Record<string, unknown>) => {
    setSavingDropdown(true);
    try {
      const merged = { ...(initialDropdownData ?? {}), ...partialData };
      const res = await fetch(`/api/setup-projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropdownData: merged }),
      });
      if (!res.ok) throw new Error('Failed to save');
      onDropdownDataSaved?.(merged);
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSavingDropdown(false);
    }
  };

  const getDocsForItem = (tid: string) => documents.filter(d => d.templateItemId === tid);
  const getDocForItem = (tid: string) => documents.find(d => d.templateItemId === tid);

  const calculateProgress = () => {
    let totalItems = 0, uploadedItems = 0;
    docs.forEach(doc => {
      if (doc.type === 'section' || doc.type === 'note') return;
      if (doc.type === 'dropdown') {
        if (doc.label === 'Annual PIS') {
          annualPISRows.forEach((_, i) => { totalItems++; if (getDocForItem(`${phase}-${doc.id}-${i}`)) uploadedItems++; });
        } else if (doc.label === 'Completion Report' || doc.label === 'Graduation Report') {
          completionReportRows.forEach((row, i) => { totalItems++; if (getDocForItem(`${phase}-${doc.id}-${row.type}-${i}`)) uploadedItems++; });
        } else if (doc.label === 'Memorandum of Agreement') {
          totalItems++; if (getDocForItem(`${phase}-${doc.id}-default`)) uploadedItems++;
          for (let i = 0; i < moaSupplementalCount; i++) { totalItems++; if (getDocForItem(`${phase}-${doc.id}-supplemental-${i}`)) uploadedItems++; }
        } else if (doc.label === 'Type of Business' && doc.subItems) {
          const bt = dropdownSelections[doc.id];
          if (bt) {
            const items = bt === 'Sole Proprietorship' ? doc.subItems.filter(s => s.id === 301) : doc.subItems.filter(s => s.id !== 301);
            items.forEach(s => { totalItems++; if (getDocForItem(`${phase}-${s.id}`)) uploadedItems++; });
          }
        } else if (doc.options) {
          doc.options.forEach((_, i) => { totalItems++; if (getDocForItem(`${phase}-${doc.id}-${i}`)) uploadedItems++; });
        }
      } else {
        totalItems++; if (getDocForItem(`${phase}-${doc.id}`)) uploadedItems++;
      }
    });
    return { totalItems, uploadedItems, percent: totalItems > 0 ? Math.round((uploadedItems / totalItems) * 100) : 0 };
  };

  useEffect(() => {
    if (onProgressUpdate) {
      const { percent, uploadedItems, totalItems } = calculateProgress();
      onProgressUpdate(percent, uploadedItems, totalItems);
    }
  }, [documents, annualPISRows, completionReportRows, moaSupplementalCount, dropdownSelections]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/setup-projects/${projectId}/documents`);
      if (!res.ok) return;
      const all: ProjectDocument[] = await res.json();
      setDocuments(all.filter(d => d.phase === phase));
    } catch { /* silent */ }
  }, [projectId, phase]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const toggleDropdown = (key: string) => setExpandedDropdowns(prev => ({ ...prev, [key]: !prev[key] }));

  const handleUploadClick = (tid: string) => { targetItemIdRef.current = tid; fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const tid = targetItemIdRef.current;
    if (!fileList || fileList.length === 0 || !tid) return;
    const files = Array.from(fileList);
    e.target.value = '';
    setUploadingItemId(tid);
    try {
      let last: { fileName: string; fileType: string; fileSize: string; date: string } | null = null;
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file); fd.append('phase', phase); fd.append('templateItemId', tid);
        const res = await fetch(`/api/setup-projects/${projectId}/documents`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const sz = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
        last = { fileName: file.name, fileType: file.type.split('/').pop()?.toUpperCase() || 'FILE', fileSize: sz, date: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) };
      }
      await fetchDocuments();
      if (last) setUploadSuccess({ ...last, uploadedBy: 'User' });
    } catch { alert('Failed to upload file. Please try again.'); }
    finally { setUploadingItemId(null); targetItemIdRef.current = null; }
  };

  const handleDownload = async (doc: ProjectDocument) => {
    try {
      const res = await fetch(`/api/setup-projects/${projectId}/documents/${doc.id}/download`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = doc.fileName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch { alert('Failed to download file. Please try again.'); }
  };

  const handlePrint = (doc: ProjectDocument) => {
    const w = window.open(`/api/setup-projects/${projectId}/documents/${doc.id}/download`, '_blank');
    if (w) w.addEventListener('load', () => w.print());
  };

  const handleDeleteAll = async (tid: string) => {
    const ds = getDocsForItem(tid);
    if (!ds.length) return;
    if (!confirm(ds.length === 1 ? `Delete "${ds[0].fileName}"?` : `Delete all ${ds.length} files?`)) return;
    try { await Promise.all(ds.map(d => fetch(`/api/setup-projects/${projectId}/documents/${d.id}`, { method: 'DELETE' }))); await fetchDocuments(); }
    catch { alert('Failed to delete files.'); }
  };

  const handleDeleteSingle = async (docId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    try { await fetch(`/api/setup-projects/${projectId}/documents/${docId}`, { method: 'DELETE' }); await fetchDocuments(); }
    catch { alert('Failed to delete file.'); }
  };

  const renderFileChips = (tid: string) => {
    const all = getDocsForItem(tid);
    if (!all.length) return null;
    const visible = all.slice(0, 3);
    const extColor = (ext: string) => ext === 'PDF' ? '#e53935' : ext === 'DOCX' || ext === 'DOC' ? '#1565c0' : ext === 'XLSX' || ext === 'XLS' ? '#2e7d32' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#f57c00' : '#607d8b';
    return (
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '4px', alignItems: 'center' }}>
        {visible.map(d => {
          const ext = d.fileName.split('.').pop()?.toUpperCase() || 'FILE';
          return (
            <button key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: '5px', padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#e8ecf1')} onMouseLeave={e => (e.currentTarget.style.background = '#f5f7fa')}
              onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); setPreviewDoc(d); }} title={d.fileName}>
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#fff', padding: '1px 3px', borderRadius: '2px', backgroundColor: extColor(ext) }}>{ext}</span>
              <span style={{ fontSize: '10px', color: '#333', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</span>
            </button>
          );
        })}
        {all.length > 3 && (
          <button onClick={() => setFileListModal(tid)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: '#555', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#ccc')} onMouseLeave={e => (e.currentTarget.style.background = '#e0e0e0')}>
            +{all.length - 3}
          </button>
        )}
      </div>
    );
  };

  // ── KEY HELPER: renders a sub-item row properly aligned to the 5 table columns ──
  const renderAlignedRow = (label: string, tid: string, extraAction?: React.ReactNode) => {
    const allDocs = getDocsForItem(tid);
    const latest = allDocs[0];
    const isUploading = uploadingItemId === tid;
    const hasFile = allDocs.length > 0;
    return (
      <tr key={tid} className="bg-[#f9f9f9]">
        {/* col 1: empty number */}
        <td className="py-2 px-3 border-b border-[#eee]" />
        {/* col 2: label (indented) */}
        <td className="py-2 px-3 border-b border-[#eee] text-xs text-[#333] pl-8">{label}</td>
        {/* col 3: file chips — aligns under "File" header */}
        <td className="py-2 px-3 border-b border-[#eee] align-middle">
          {renderFileChips(tid) ?? <span className="text-[#bbb] italic text-xs">No file uploaded</span>}
        </td>
        {/* col 4: date — aligns under "Date Uploaded" header */}
        <td className="py-2 px-3 border-b border-[#eee] text-xs text-[#999]">
          {hasFile ? new Date(latest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
        </td>
        {/* col 5: actions — aligns under "Action" header */}
        <td className="py-2 px-3 border-b border-[#eee] align-middle">
          <ActionButtons
            templateItemId={tid} isUploading={isUploading} hasFile={hasFile}
            onUpload={() => handleUploadClick(tid)}
            onDelete={() => hasFile && handleDeleteAll(tid)}
            extra={extraAction}
          />
        </td>
      </tr>
    );
  };

  const addInterventionItem = () => setInterventionInputs(prev => [...prev, { type: abstractQuotationType.toLowerCase() as 'equipment' | 'non-equipment' }]);
  const updateInterventionItem = (i: number, field: string, value: string) => setInterventionInputs(prev => { const u = [...prev]; u[i] = { ...u[i], [field]: value }; return u; });
  const removeInterventionItem = (i: number) => setInterventionInputs(prev => prev.filter((_, idx) => idx !== i));

  let itemCounter = 0;

  return (
    <>
    <div className="bg-white rounded-xl mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <h2 className="text-base font-bold text-primary pt-5 px-7 m-0 mb-3">{title}</h2>
      <div className="flex items-start gap-2 bg-[#e1f5fe] border border-[#b3e5fc] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#0277bd] leading-[1.4]">
        <Icon icon="mdi:information-outline" width={16} height={16} className="min-w-4 mt-px" />
        <span>To ensure that the document you uploaded is viewable in our system, click the View button below and check the document you uploaded. If it is not viewable, re-upload the document</span>
      </div>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
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
              // ── Section header ──
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
                                    onClick={() => saveDropdownData(
                                      { interventionItems: interventionInputs }
                                    )}
                                    disabled={savingDropdown}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors ml-auto disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                  >
                                    {savingDropdown ? 'Saving...' : 'Save All Items'}
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
                                onChange={(e) => setDropdownSelections(p => ({...p, [doc.id]: e.target.value}))}
                                className="border border-[#ddd] rounded px-3 py-2 text-xs flex-1"
                              >
                                <option value="">Select business type...</option>
                                {doc.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => saveDropdownData({businessType: dropdownSelections})}
                                disabled={!dropdownSelections[doc.id] || savingDropdown}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                {savingDropdown ? 'Saving...' : 'Save'}
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
                                onClick={() => saveDropdownData(
                                  { abstractQuotationType }
                                )}
                                disabled={!abstractQuotationType || savingDropdown}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                {savingDropdown ? 'Saving...' : 'Save'}
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
                                onClick={() => saveDropdownData(
                                  { clearanceUntagRows }
                                )}
                                disabled={savingDropdown}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors ml-auto disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingDropdown ? 'Saving...' : 'Save All'}
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
                                  onClick={() => saveDropdownData(
                                    { completionReportRows }
                                  )}
                                  disabled={savingDropdown}
                                  className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                >
                                  {savingDropdown ? 'Saving...' : 'Save All'}
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
                                onClick={() => saveDropdownData(
                                  { annualPISRows }
                                )}
                                disabled={savingDropdown}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingDropdown ? 'Saving...' : 'Save All'}
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
                                onClick={() => saveDropdownData(
                                  { graduationReportRows: completionReportRows }
                                )}
                                disabled={savingDropdown}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingDropdown ? 'Saving...' : 'Save All'}
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

              // ── Regular item row ──
              itemCounter++;
              const tid = `${phase}-${doc.id}`;
              const allDocs = getDocsForItem(tid);
              const latest = allDocs[0];
              const isUploading = uploadingItemId === tid;
              const hasFile = allDocs.length > 0;
              const extColor = (ext: string) => ext==='PDF'?'#e53935':ext==='DOCX'||ext==='DOC'?'#1565c0':ext==='XLSX'||ext==='XLS'?'#2e7d32':ext==='PNG'||ext==='JPG'||ext==='JPEG'?'#f57c00':'#607d8b';

              return (
                <tr key={`${title}-${doc.id}-${idx}`}>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">{doc.label}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    {hasFile ? (
                      <div style={{display:'flex',flexDirection:'row',flexWrap:'nowrap',gap:'4px',alignItems:'center'}}>
                        {allDocs.slice(0,3).map(d=>{
                          const ext=d.fileName.split('.').pop()?.toUpperCase()||'FILE';
                          return <button key={d.id} style={{display:'inline-flex',alignItems:'center',gap:'4px',background:'#f5f7fa',border:'1px solid #e0e0e0',borderRadius:'5px',padding:'2px 6px',cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.background='#e8ecf1')} onMouseLeave={e=>(e.currentTarget.style.background='#f5f7fa')} onClick={()=>{setZoomLevel(100);setImgPan({x:0,y:0});setPreviewDoc(d);}} title={d.fileName}>
                            <span style={{fontSize:'7px',fontWeight:700,color:'#fff',padding:'1px 3px',borderRadius:'2px',backgroundColor:extColor(ext)}}>{ext}</span>
                            <span style={{fontSize:'10px',color:'#333',maxWidth:'70px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.fileName}</span>
                          </button>;
                        })}
                        {allDocs.length>3&&<button onClick={()=>setFileListModal(tid)} style={{display:'inline-flex',alignItems:'center',justifyContent:'center',background:'#e0e0e0',border:'none',borderRadius:'5px',padding:'2px 8px',cursor:'pointer',fontSize:'10px',fontWeight:700,color:'#555',flexShrink:0}} onMouseEnter={e=>(e.currentTarget.style.background='#ccc')} onMouseLeave={e=>(e.currentTarget.style.background='#e0e0e0')}>+{allDocs.length-3}</button>}
                      </div>
                    ) : <span className="text-[#bbb] italic text-xs">No file uploaded</span>}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                    {hasFile?new Date(latest.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'—'}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    <div className="flex gap-1.5">
                      <button className="w-7 h-7 border-none rounded-md flex items-center justify-center cursor-pointer text-white bg-[#f5a623] hover:opacity-80 disabled:opacity-50" title="Upload" onClick={()=>handleUploadClick(tid)} disabled={isUploading}>
                        {isUploading?<Icon icon="mdi:loading" width={14} height={14} className="animate-spin"/>:<Icon icon="mdi:upload" width={14} height={14}/>}
                      </button>
                      <button className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile?'bg-[#c62828] cursor-pointer hover:opacity-80':'bg-[#ccc] cursor-not-allowed'}`} title="Delete" onClick={()=>hasFile&&handleDeleteAll(tid)} disabled={!hasFile}>
                        <Icon icon="mdi:delete-outline" width={14} height={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="py-5"/>
    </div>

    {/* File List Modal */}
    {fileListModal&&(()=>{
      const mDocs=getDocsForItem(fileListModal);
      const ec=(ext:string)=>ext==='PDF'?'#e53935':ext==='DOCX'||ext==='DOC'?'#1565c0':ext==='XLSX'||ext==='XLS'?'#2e7d32':ext==='PNG'||ext==='JPG'||ext==='JPEG'?'#f57c00':'#607d8b';
      return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]" onClick={()=>setFileListModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-[420px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden" onClick={e=>e.stopPropagation()}>
            <div style={{background:'#F59E0B',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{color:'#fff',fontSize:'14px',fontWeight:600}}>Uploaded Files ({mDocs.length})</span>
              <button onClick={()=>setFileListModal(null)} style={{background:'none',border:'none',color:'#fff',fontSize:'18px',cursor:'pointer',padding:0}}>×</button>
            </div>
            <div style={{padding:'12px 16px',maxHeight:'360px',overflowY:'auto'}}>
              {mDocs.length===0?<p style={{textAlign:'center',color:'#999',fontSize:'13px',padding:'20px 0'}}>No files uploaded</p>:(
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {mDocs.map(d=>{const ext=d.fileName.split('.').pop()?.toUpperCase()||'FILE';return(
                    <div key={d.id} style={{display:'flex',alignItems:'center',gap:'10px',background:'#f9fafb',border:'1px solid #eee',borderRadius:'8px',padding:'10px 12px'}}>
                      <div style={{flexShrink:0,width:'36px',height:'42px',borderRadius:'4px',backgroundColor:ec(ext),display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <span style={{color:'#fff',fontSize:'10px',fontWeight:700}}>{ext}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <button onClick={()=>{setFileListModal(null);setPreviewDoc(d);}} style={{background:'none',border:'none',cursor:'pointer',padding:0,fontSize:'13px',fontWeight:500,color:'#333',maxWidth:'100%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block',textAlign:'left'}} onMouseEnter={e=>(e.currentTarget.style.color='#00AEEF')} onMouseLeave={e=>(e.currentTarget.style.color='#333')}>{d.fileName}</button>
                        <span style={{fontSize:'11px',color:'#999'}}>{new Date(d.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</span>
                      </div>
                      <button onClick={()=>handleDeleteSingle(d.id,d.fileName)} style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',width:'28px',height:'28px',borderRadius:'6px',background:'#fee2e2',border:'none',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='#e53935')} onMouseLeave={e=>(e.currentTarget.style.background='#fee2e2')}>
                        <Icon icon="mdi:delete-outline" width={16} height={16} color="#e53935"/>
                      </button>
                    </div>
                  );})}
                </div>
              )}
            </div>
            <div style={{padding:'12px 16px',borderTop:'1px solid #eee',textAlign:'right'}}>
              <button onClick={()=>setFileListModal(null)} style={{background:'#fff',color:'#333',border:'1px solid #d0d0d0',borderRadius:'6px',padding:'8px 24px',fontSize:'13px',fontWeight:600,cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='#f5f5f5')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>Close</button>
            </div>
          </div>
        </div>
      );
    })()}

    {/* Upload Success Modal */}
    {uploadSuccess&&(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={()=>setUploadSuccess(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[440px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e=>e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4"><Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32"/></div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-5">File Upload Successfully!</h3>
          <div className="flex items-center gap-3 bg-[#f5f7fa] rounded-lg px-4 py-3 mb-5 text-left">
            <div className="flex-shrink-0 w-10 h-12 bg-[#e53935] rounded flex items-center justify-center"><span className="text-white text-[10px] font-bold uppercase">{uploadSuccess.fileName.split('.').pop()||'FILE'}</span></div>
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-[#333] m-0 truncate">{uploadSuccess.fileName}</p><p className="text-[11px] text-[#888] m-0 mt-0.5">{uploadSuccess.fileSize}</p></div>
          </div>
          <div className="text-left space-y-2 mb-6 pl-1">
            {[['File Name',uploadSuccess.fileName],['File Type',uploadSuccess.fileType],['File Size',uploadSuccess.fileSize],['Uploaded By',uploadSuccess.uploadedBy],['Date',uploadSuccess.date]].map(([l,v])=>(
              <div key={l} className="flex justify-between text-[13px]"><span className="text-[#888]">{l}:</span><span className="text-[#333] font-medium truncate max-w-[220px]">{v}</span></div>
            ))}
          </div>
          <button className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer hover:bg-[#1b5e20]" onClick={()=>setUploadSuccess(null)}>Okay</button>
        </div>
      </div>
    )}

    {/* Preview Modal */}
    {previewDoc&&(
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100]" onClick={()=>setPreviewDoc(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[750px] max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.3)] overflow-hidden" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between py-3 px-5 border-b border-[#eee] bg-[#f9f9f9]">
            <div className="flex items-center gap-2 min-w-0"><Icon icon="mdi:file-document-outline" width={20} height={20} className="text-primary shrink-0"/><span className="text-[13px] font-semibold text-[#333] truncate">{previewDoc.fileName}</span></div>
            <button className="bg-transparent border-none cursor-pointer text-[#999] p-1 rounded-full hover:bg-[#e0e0e0] hover:text-[#333]" onClick={()=>setPreviewDoc(null)}><Icon icon="mdi:close" width={20} height={20}/></button>
          </div>
          {/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(previewDoc.fileName)?(
            <div className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh] flex items-center justify-center" style={{cursor:isDragging?'grabbing':'grab'}}
              onWheel={e=>{e.preventDefault();setZoomLevel(z=>Math.min(300,Math.max(25,z+(e.deltaY<0?10:-10))));}}
              onMouseDown={e=>{e.preventDefault();setIsDragging(true);dragStart.current={x:e.clientX,y:e.clientY,panX:imgPan.x,panY:imgPan.y};}}
              onMouseMove={e=>{if(!isDragging)return;setImgPan({x:dragStart.current.panX+(e.clientX-dragStart.current.x),y:dragStart.current.panY+(e.clientY-dragStart.current.y)});}}
              onMouseUp={()=>setIsDragging(false)} onMouseLeave={()=>setIsDragging(false)}>
              <img src={`/api/setup-projects/${projectId}/documents/${previewDoc.id}/download`} alt={previewDoc.fileName} draggable={false} style={{transform:`scale(${zoomLevel/100}) translate(${imgPan.x}px,${imgPan.y}px)`,transformOrigin:'center center',transition:isDragging?'none':'transform 0.1s ease',maxWidth:'100%',userSelect:'none'}}/>
            </div>
          ):(
            <div className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh]">
              <iframe src={`/api/setup-projects/${projectId}/documents/${previewDoc.id}/download`} className="w-full h-full min-h-[400px] border-none" title={`Preview: ${previewDoc.fileName}`}/>
            </div>
          )}
          <div className="flex items-center justify-between py-3.5 px-5 border-t border-[#eee] bg-[#f9f9f9]">
            {/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(previewDoc.fileName)?(
              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <button onClick={()=>setZoomLevel(z=>Math.max(25,z-25))} disabled={zoomLevel<=25} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'30px',height:'30px',borderRadius:'6px',border:'1px solid #d0d0d0',background:zoomLevel<=25?'#f0f0f0':'#fff',cursor:zoomLevel<=25?'not-allowed':'pointer',color:zoomLevel<=25?'#bbb':'#333'}}><Icon icon="mdi:minus" width={16} height={16}/></button>
                <span style={{fontSize:'12px',fontWeight:600,color:'#555',minWidth:'40px',textAlign:'center'}}>{zoomLevel}%</span>
                <button onClick={()=>setZoomLevel(z=>Math.min(300,z+25))} disabled={zoomLevel>=300} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'30px',height:'30px',borderRadius:'6px',border:'1px solid #d0d0d0',background:zoomLevel>=300?'#f0f0f0':'#fff',cursor:zoomLevel>=300?'not-allowed':'pointer',color:zoomLevel>=300?'#bbb':'#333'}}><Icon icon="mdi:plus" width={16} height={16}/></button>
                <button onClick={()=>{setZoomLevel(100);setImgPan({x:0,y:0});}} style={{fontSize:'11px',color:'#00AEEF',background:'none',border:'none',cursor:'pointer',fontWeight:600,marginLeft:'4px'}}>Reset</button>
              </div>
            ):<div/>}
            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <button className="flex items-center gap-1.5 py-2 px-5 bg-[#00AEEF] text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90" onClick={()=>handleDownload(previewDoc)}><Icon icon="mdi:download" width={16} height={16}/>Download</button>
              <button className="flex items-center gap-1.5 py-2 px-5 bg-[#F59E0B] text-white border-none rounded-lg text-[13px] font-semibold cursor-pointer hover:opacity-90" onClick={()=>handlePrint(previewDoc)}><Icon icon="mdi:printer" width={16} height={16}/>Print</button>
              <button className="flex items-center gap-1.5 py-2 px-5 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[13px] font-semibold cursor-pointer hover:bg-[#f5f5f5]" onClick={()=>setPreviewDoc(null)}>Close</button>
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
  const [initiationFiles, setInitiationFiles] = useState({ uploaded: 0, total: 0 });
  const [implementationProgress, setImplementationProgress] = useState(0);
  const [implementationFiles, setImplementationFiles] = useState({ uploaded: 0, total: 0 });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const overallProgress = Math.round((initiationProgress + implementationProgress) / 2);

  useEffect(() => {
    fetch(`/api/setup-projects/${id}`)
      .then(res=>{if(!res.ok)throw new Error('Not found');return res.json();})
      .then(data=>setProject(data)).catch(()=>setError(true)).finally(()=>setLoading(false));
  }, [id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) setShowStatusDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project || newStatus === project.status) { setShowStatusDropdown(false); return; }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/setup-projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
      if (!res.ok) throw new Error('Failed');
      setProject(await res.json());
    } catch (err) { console.error(err); }
    finally { setUpdatingStatus(false); setShowStatusDropdown(false); }
  };

  if (loading) return <DashboardLayout activePath="/setup"><main className="flex-1 py-6 px-10 bg-[#f4f6f8]"><p className="text-[#999] text-sm">Loading project...</p></main></DashboardLayout>;
  if (error || !project) return <DashboardLayout activePath="/setup"><main className="flex-1 py-6 px-10 bg-[#f4f6f8]"><p>Project not found.</p><Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline hover:text-accent"><Icon icon="mdi:arrow-left" width={18} height={18}/>Back</Link></main></DashboardLayout>;

  const datePublished = new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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
        <Link href="/setup" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
          <Icon icon="mdi:arrow-left" width={18} height={18}/><span>Back</span>
        </Link>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-[120px] h-auto"><img src="/setup-4.0-logo.png" alt="SETUP" className="w-[120px] h-auto"/></div>
            </div>
            <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer hover:bg-accent-hover">
              <Icon icon="mdi:pencil-outline" width={16} height={16}/>Edit Mode
            </button>
          </div>
          <div className="flex gap-5 items-start">
            <div className="w-[100px] h-[100px] min-w-[100px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {project.companyLogoUrl ? <img src={project.companyLogoUrl} alt="logo" className="w-full h-full object-cover"/> : <Icon icon="mdi:store" width={48} height={48} color="#999"/>}
            </div>
            <div className="flex-1 flex gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[13px] mb-1">
                  <span className="text-[#555] font-medium">{project.firm||'—'}</span>
                  <span className="text-[#ccc]">|</span>
                  <span className="text-[#555]">{project.firmSize||'—'}</span>
                </div>
                <h2 className="text-[18px] font-bold text-[#146184] m-0 mb-1 leading-[1.3]">{project.title}</h2>
                <p className="text-[14px] text-[#555] m-0 mb-2">{project.typeOfFirm||''}</p>
                <div className="relative inline-block mb-3" ref={statusDropdownRef}>
                  <button className="text-[11px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer flex items-center gap-1 hover:opacity-80" style={{backgroundColor:currentStatus.bg,color:currentStatus.text}} onClick={()=>setShowStatusDropdown(v=>!v)} disabled={updatingStatus}>
                    {updatingStatus?'Updating...':currentStatus.label}<Icon icon="mdi:chevron-down" width={14} height={14}/>
                  </button>
                  {showStatusDropdown&&(
                    <div className="absolute left-0 top-full mt-1 w-[160px] bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 py-1">
                      {Object.entries(statusConfig).map(([k,cfg])=>(
                        <button key={k} className={`w-full flex items-center gap-2 py-2 px-3 text-[12px] text-left border-none bg-transparent cursor-pointer hover:bg-[#f5f5f5] ${project.status===k?'font-semibold':''}`} onClick={()=>handleStatusUpdate(k)}>
                          <span className="w-2 h-2 rounded-full" style={{backgroundColor:cfg.bar}}/>
                          {cfg.label}
                          {project.status===k&&<Icon icon="mdi:check" width={14} height={14} className="ml-auto" style={{color:cfg.bar}}/>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="[&_p]:my-1 [&_p]:text-[13px] [&_p]:text-[#555] [&_strong]:text-[#222] [&_strong]:font-semibold">
                <p><strong>Cooperator&apos;s Name:</strong> {project.corporatorName||'—'}</p>
                <p><strong>Address:</strong> {project.address||'—'}</p>
                <p><strong>Priority Sector:</strong> {project.prioritySector||'—'}</p>
                <p><strong>Assignee:</strong> {project.assignee||'—'}</p>
                <p><strong>Date Published:</strong> {datePublished}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Project Initiation', progress: initiationProgress, files: initiationFiles },
              { label: 'Project Implementation', progress: implementationProgress, files: implementationFiles },
              { label: 'Overall Project Progress', progress: overallProgress, files: { uploaded: initiationFiles.uploaded + implementationFiles.uploaded, total: initiationFiles.total + implementationFiles.total } },
            ].map(({ label, progress, files }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[13px] font-semibold text-[#333] m-0">{label}</h3>
                  <span className="text-[13px] font-semibold text-[#333]">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: currentStatus.bar }}/>
                </div>
                <span className="text-[11px] text-[#888] mt-1 block">{files.uploaded}/{files.total} files uploaded</span>
              </div>
            ))}
          </div>
        </div>

        <DocumentTable title="Project Initiation" docs={initiationDocs} projectId={id} phase="INITIATION"
          onProgressUpdate={(p,u,t)=>{setInitiationProgress(p);setInitiationFiles({uploaded:u,total:t});}}
          initialDropdownData={project?.dropdownData}
          onDropdownDataSaved={data=>setProject(prev=>prev?{...prev,dropdownData:data}:prev)}
        />
        <DocumentTable title="Project Implementation" docs={implementationDocs} projectId={id} phase="IMPLEMENTATION"
          onProgressUpdate={(p,u,t)=>{setImplementationProgress(p);setImplementationFiles({uploaded:u,total:t});}}
          initialDropdownData={project?.dropdownData}
          onDropdownDataSaved={data=>setProject(prev=>prev?{...prev,dropdownData:data}:prev)}
        />
      </main>
    </DashboardLayout>
  );
}
