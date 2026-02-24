'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

interface CestProject {
  id: string;
  code: string;
  projectTitle: string;
  location: string | null;
  beneficiaries: string | null;
  programFunding: string | null;
  status: string | null;
  approvedAmount: number | null;
  releasedAmount: number | null;
  projectDuration: string | null;
  staffAssigned: string | null;
  year: string | null;
  dateOfApproval: string | null;
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
};

const initiationDocs: DocRow[] = [
  { id: 1, label: 'Letter of Intent' },
  { id: 2, label: 'Special Order' },
  { id: 3, label: 'Endorsement of Project' },
  { id: 4, label: 'Board Resolution' },
  { id: 5, label: 'MOA Form' },
  { id: 6, label: 'Site Visit' },
  { id: 7, label: 'Beneficiary Profile' },
  { id: 8, label: 'Form E' },
  { id: 9, label: 'Form 4' },
  { id: 10, label: 'Form 6' },
  { id: 11, label: 'Special Question Sheet' },
  { id: 12, label: 'Review and Evaluation Report' },
  { id: 13, label: 'List of Intervention' },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: 'MOA/MOU' },
  { id: 2, label: 'Approval Letter' },
  { id: 3, label: 'MOAFR to LGU Chairperson' },
];

const monitoringDocs: DocRow[] = [
  { id: 1, label: 'Quarterly Process Report' },
  { id: 2, label: 'List of Personnel Involved' },
  { id: 3, label: 'List of Equipment Purchased' },
  { id: 4, label: 'Report of Disaster Encountered' },
  { id: 5, label: 'Terminal Audited Financial Report' },
  { id: 6, label: 'Recommendation to the LCE' },
];

function CestDocumentTable({
  title,
  docs,
  projectId,
  phase,
  onProgressUpdate,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: 'INITIATION' | 'IMPLEMENTATION' | 'MONITORING';
  onProgressUpdate?: (progress: number, uploaded: number, total: number) => void;
}) {
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

  const getDocsForItem = (templateItemId: string): ProjectDocument[] => {
    return documents.filter(d => d.templateItemId === templateItemId);
  };

  const getDocForItem = (templateItemId: string): ProjectDocument | undefined => {
    return documents.find(d => d.templateItemId === templateItemId);
  };

  useEffect(() => {
    if (onProgressUpdate) {
      let totalItems = docs.length;
      let uploadedItems = 0;
      docs.forEach(doc => {
        const templateItemId = `${phase}-${doc.id}`;
        if (getDocForItem(templateItemId)) uploadedItems++;
      });
      const percent = totalItems > 0 ? Math.round((uploadedItems / totalItems) * 100) : 0;
      onProgressUpdate(percent, uploadedItems, totalItems);
    }
  }, [documents]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/cest-projects/${projectId}/documents`);
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

        const res = await fetch(`/api/cest-projects/${projectId}/documents`, {
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
        setUploadSuccess({ ...lastUploaded, uploadedBy: 'User' });
      }
    } catch {
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingItemId(null);
      targetItemIdRef.current = null;
    }
  };

  const handleDeleteAll = async (templateItemId: string) => {
    const docsList = getDocsForItem(templateItemId);
    if (docsList.length === 0) return;
    const msg = docsList.length === 1
      ? `Delete "${docsList[0].fileName}"?`
      : `Delete all ${docsList.length} files for this item?`;
    if (!confirm(msg)) return;
    try {
      await Promise.all(docsList.map(d =>
        fetch(`/api/cest-projects/${projectId}/documents/${d.id}`, { method: 'DELETE' })
      ));
      await fetchDocuments();
    } catch {
      alert('Failed to delete files. Please try again.');
    }
  };

  const handleDeleteSingle = async (docId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    try {
      await fetch(`/api/cest-projects/${projectId}/documents/${docId}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch {
      alert('Failed to delete file. Please try again.');
    }
  };

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
              const templateItemId = `${phase}-${doc.id}`;
              const allDocsForItem = getDocsForItem(templateItemId);
              const latestDoc = allDocsForItem[0];
              const isUploading = uploadingItemId === templateItemId;
              const hasFile = allDocsForItem.length > 0;

              return (
                <tr key={`${title}-${doc.id}-${idx}`}>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{idx + 1}</td>
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
          <div className="flex items-center justify-between py-3 px-5 border-b border-[#eee] bg-[#f9f9f9]">
            <div className="flex items-center gap-2 min-w-0">
              <Icon icon="mdi:file-document-outline" width={20} height={20} className="text-primary shrink-0" />
              <span className="text-[13px] font-semibold text-[#333] truncate">{previewDoc.fileName}</span>
            </div>
            <button className="bg-transparent border-none cursor-pointer text-[#999] p-1 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#e0e0e0] hover:text-[#333] shrink-0" onClick={() => setPreviewDoc(null)}>
              <Icon icon="mdi:close" width={20} height={20} />
            </button>
          </div>
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
                  src={`/api/cest-projects/${projectId}/documents/${previewDoc.id}/download`}
                  alt={previewDoc.fileName}
                  draggable={false}
                  style={{ transform: `scale(${zoomLevel / 100}) translate(${imgPan.x}px, ${imgPan.y}px)`, transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.1s ease', maxWidth: '100%', userSelect: 'none' }}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh]">
                <iframe
                  src={`/api/cest-projects/${projectId}/documents/${previewDoc.id}/download`}
                  className="w-full h-full min-h-[400px] border-none"
                  title={`Preview: ${previewDoc.fileName}`}
                />
              </div>
            );
          })()}
          <div className="flex items-center justify-between py-3.5 px-5 border-t border-[#eee] bg-[#f9f9f9]">
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30px', borderRadius: '6px', border: '1px solid #d0d0d0', background: '#fff', cursor: 'pointer', color: '#333', padding: '0 10px', fontSize: '11px', fontWeight: 600 }}
                >
                  Reset
                </button>
              </div>
            ) : <div />}
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 py-2 px-4 bg-primary text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/cest-projects/${projectId}/documents/${previewDoc.id}/download`);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = previewDoc.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                  } catch {
                    alert('Failed to download file.');
                  }
                }}
              >
                <Icon icon="mdi:download" width={16} height={16} />
                Download
              </button>
              <button
                className="flex items-center gap-1.5 py-2 px-4 bg-[#c62828] text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                onClick={async () => {
                  if (!confirm(`Delete "${previewDoc.fileName}"?`)) return;
                  try {
                    await fetch(`/api/cest-projects/${projectId}/documents/${previewDoc.id}`, { method: 'DELETE' });
                    setPreviewDoc(null);
                    await fetchDocuments();
                  } catch {
                    alert('Failed to delete file.');
                  }
                }}
              >
                <Icon icon="mdi:delete-outline" width={16} height={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function CestProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<CestProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [initiationProgress, setInitiationProgress] = useState(0);
  const [initiationFiles, setInitiationFiles] = useState({ uploaded: 0, total: 0 });
  const [implementationProgress, setImplementationProgress] = useState(0);
  const [implementationFiles, setImplementationFiles] = useState({ uploaded: 0, total: 0 });
  const [monitoringProgress, setMonitoringProgress] = useState(0);
  const [monitoringFiles, setMonitoringFiles] = useState({ uploaded: 0, total: 0 });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const overallProgress = Math.round((initiationProgress + implementationProgress + monitoringProgress) / 3);

  useEffect(() => {
    fetch(`/api/cest-projects/${id}`)
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
      const res = await fetch(`/api/cest-projects/${id}`, {
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
      <DashboardLayout activePath="/cest">
        <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
          <p className="text-[#999] text-sm">Loading project...</p>
        </main>
      </DashboardLayout>
    );
  }

  if (error || !project) {
    return (
      <DashboardLayout activePath="/cest">
        <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
          <p>Project not found.</p>
          <Link href="/cest" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            Back
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  const datePublished = project.dateOfApproval || new Date(project.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const statusConfig: Record<string, { label: string; bg: string; text: string; bar: string }> = {
    Approved: { label: 'Approved', bg: '#e8f5e9', text: '#2e7d32', bar: '#2e7d32' },
    Ongoing: { label: 'Ongoing', bg: '#fff8e1', text: '#f57f17', bar: '#ffa726' },
    Completed: { label: 'Completed', bg: '#e0f2f1', text: '#00695c', bar: '#00695c' },
    Terminated: { label: 'Terminated', bg: '#fce4ec', text: '#ad1457', bar: '#ad1457' },
  };
  const currentStatus = statusConfig[project.status || ''] || { label: project.status || 'N/A', bg: '#f0f0f0', text: '#757575', bar: '#9e9e9e' };

  const totalUploaded = initiationFiles.uploaded + implementationFiles.uploaded + monitoringFiles.uploaded;
  const totalFiles = initiationFiles.total + implementationFiles.total + monitoringFiles.total;

  return (
    <DashboardLayout activePath="/cest">
      <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
        {/* Back Button */}
        <Link href="/cest" className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent">
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-1.5 mt-[-10px]">
              <div className="w-[90px] h-auto"><img src="/cest-logo-text.png" alt="CEST" className="w-[120px] h-auto"/></div>
            </div>
            <button className="flex items-center gap-1.5 bg-accent text-white border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap hover:bg-accent-hover">
              <Icon icon="mdi:pencil-outline" width={16} height={16} />
              Edit Mode
            </button>
          </div>

          {/* Project Content */}
          <div className="flex gap-5 items-start">
            <div className="w-[100px] h-[100px] min-w-[100px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <Icon icon="mdi:office-building" width={48} height={48} color="#999" />
            </div>
            <div className="flex-1 flex gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[13px] mb-1">
                  <span className="text-[#555] font-medium">{project.programFunding || '—'}</span>
                  <span className="text-[#ccc]">|</span>
                  <span className="text-[#555]">{project.location || '—'}</span>
                </div>
                <h2 className="text-[18px] font-bold text-[#146184] m-0 mb-1 leading-[1.3]">{project.projectTitle}</h2>
                <p className="text-[14px] text-[#555] m-0 mb-2">{project.code}</p>
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
                <p><strong>Cooperator&apos;s Name:</strong> {project.staffAssigned || '—'}</p>
                <p><strong>Beneficiary:</strong> {project.beneficiaries || '—'}</p>
                <p><strong>Partner LGU:</strong> {project.location || '—'}</p>
                <p><strong>Assignee:</strong> {project.staffAssigned || '—'}</p>
                <p><strong>Date Published:</strong> {datePublished}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 gap-6">
            {/* Project Initiation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Project Initiation</h3>
                <span className="text-[13px] font-semibold text-[#333]">{initiationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${initiationProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">{initiationFiles.uploaded}/{initiationFiles.total} files uploaded</span>
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
              <span className="text-[11px] text-[#888] mt-1 block">{implementationFiles.uploaded}/{implementationFiles.total} files uploaded</span>
            </div>

            {/* Project Monitoring */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Project Monitoring</h3>
                <span className="text-[13px] font-semibold text-[#333]">{monitoringProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${monitoringProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">{monitoringFiles.uploaded}/{monitoringFiles.total} files uploaded</span>
            </div>

            {/* Overall Project Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">Overall Progress</h3>
                <span className="text-[13px] font-semibold text-[#333]">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${overallProgress}%`, backgroundColor: currentStatus.bar }}></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">{totalUploaded}/{totalFiles} files uploaded</span>
            </div>
          </div>
        </div>

        {/* Project Initiation */}
        <CestDocumentTable
          title="Project Initiation"
          docs={initiationDocs}
          projectId={id}
          phase="INITIATION"
          onProgressUpdate={(p, u, t) => { setInitiationProgress(p); setInitiationFiles({ uploaded: u, total: t }); }}
        />

        {/* Project Implementation */}
        <CestDocumentTable
          title="Project Implementation"
          docs={implementationDocs}
          projectId={id}
          phase="IMPLEMENTATION"
          onProgressUpdate={(p, u, t) => { setImplementationProgress(p); setImplementationFiles({ uploaded: u, total: t }); }}
        />

        {/* Project Monitoring */}
        <CestDocumentTable
          title="Project Monitoring"
          docs={monitoringDocs}
          projectId={id}
          phase="MONITORING"
          onProgressUpdate={(p, u, t) => { setMonitoringProgress(p); setMonitoringFiles({ uploaded: u, total: t }); }}
        />
      </main>
    </DashboardLayout>
  );
}
