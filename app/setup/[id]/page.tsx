'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../../components/DashboardLayout';

// Helper to get userId for activity logging
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored)?.id || null;
  } catch {
    return null;
  }
}

// Helper to create headers with userId
function getAuthHeaders(): HeadersInit {
  const userId = getUserId();
  return userId ? { 'x-user-id': userId } : {};
}

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
  assigneeProfileUrl: string | null;
  year: string | null;
  companyLogoUrl: string | null;
  dropdownData: Record<string, unknown> | null;
  createdAt: string;
}

interface EditRequest {
  userId: string;
  userName: string;
  userProfileUrl: string | null;
  requestedAt: string;
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
  { 
    id: 3, 
    label: 'Internal Evaluation', 
    type: 'dropdown',
    options: ['Date', 'PPT Presentation', 'Compliance Report']
  },
  { 
    id: 3, 
    label: 'External Evaluation', 
    type: 'dropdown',
    options: ['Date', 'PPT Presentation', 'Compliance Report']
  },
  { id: 17, label: 'Hazard Hunter PH Assessment', type: 'item' },
  { id: 18, label: 'GAD Assessment', type: 'item' },
  { id: 0, label: 'List of Intervention', type: 'dropdown' },
  { id: 999, label: 'Others', type: 'dropdown', options: [] },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: 'Approval Letter', type: 'item' },
  { id: 2, label: 'Memorandum of Agreement', type: 'dropdown', options: ['Main MOA', 'Supplemental MOA'] },
  { 
    id: 3, 
    label: 'Fund Release Date', 
    type: 'dropdown',
    options: ['DV', 'ORS']
  },
  { id: 18, label: 'Approved Amount for Release', type: 'dropdown' },
  { id: 27, label: 'Untagging Amount & Documentary Requirements', type: 'dropdown' },
  { id: 21, label: 'Clearance to Untag', type: 'dropdown' },
  { id: 4, label: 'Official Receipt of Technology Assistance', type: 'item' },
  { id: 9, label: 'Amendments to the MOA', type: 'dropdown', options: ['Change in Project Duration - Annex C', 'Extension of Project Duration - Annex C', 'Change in LIB or LIB-realignment - Annex B', 'Refund Restructuring - Annex D'] },
  { id: 8, label: 'Others', type: 'dropdown', options: ['Withdrawal Request', 'Withdrawal Approval', 'Photo(s) During Implementation'] },
];

const managementDocs: DocRow[] = [
  { id: 100, label: 'Management Reports', type: 'dropdown', options: [] }, // Single dropdown for all management reports
];

const monitoringDocs: DocRow[] = [
  { id: 15, label: 'Pre-Project Information Sheet (PIS)',type: 'dropdown', options: ['Withdrawal Request', 'Approval']},
  { id: 25, label: 'Annual PIS', type: 'dropdown', options: ['2024', '2025', '2026', '2027', '2028'] },
  { id: 26, label: 'Quarterly Project Status Reports', type: 'dropdown', options: ['Q1', 'Q2', 'Q3', 'Q4'] }, // Single dropdown for all monitoring reports
  { id: 998, label: 'Others', type: 'dropdown', options: [] },
];

const refundDocs: DocRow[] = [
  { id: 300, label: 'Refund Documents', type: 'dropdown', options: [
    'Letter in acknowledgement of PDCs',
    'Receipt of PDC form',
    'Photocopy of Official Receipt (ORs)',
    'Letter of Endorsement of ORs',
    'Notice of Dishonor'
  ] },
];

const communicationsDocs: DocRow[] = [
  { id: 400, label: 'Communications', type: 'dropdown', options: [] }, // Single dropdown for all communications
];

// ── Shared upload/delete button pair ───────────────────────────────────────
function ActionButtons({
  templateItemId,
  isUploading,
  hasFile,
  onUpload,
  onDelete,
  extra,
  isEditMode = true,
}: {
  templateItemId: string;
  isUploading: boolean;
  hasFile: boolean;
  onUpload: () => void;
  onDelete: () => void;
  extra?: React.ReactNode;
  isEditMode?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isEditMode ? "Upload" : "View mode - editing disabled"}
        onClick={onUpload}
        disabled={!isEditMode || isUploading}
      >
        {isUploading
          ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
          : <Icon icon="mdi:upload" width={14} height={14} />}
      </button>
      <button
        className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
        title={isEditMode ? "Delete" : "View mode - editing disabled"}
        onClick={onDelete}
        disabled={!hasFile || !isEditMode}
      >
        <Icon icon="mdi:delete-outline" width={14} height={14} />
      </button>
      {extra}
    </div>
  );
}

function DocumentTable({
  title,
  docs,
  projectId,
  phase,
  onProgressUpdate,
  initialDropdownData,
  isEditMode = true,
  isAssigneeEditMode = false,
  isAssigneeUploadMode = false,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: 'INITIATION' | 'IMPLEMENTATION' | 'MANAGEMENT' | 'MONITORING' | 'REFUND' | 'COMMUNICATIONS';
  onProgressUpdate?: (progress: number, uploaded: number, total: number) => void;
  initialDropdownData?: Record<string, unknown> | null;
  isEditMode?: boolean;
  isAssigneeEditMode?: boolean;
  isAssigneeUploadMode?: boolean;
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
  const [moaType, setMoaType] = useState<string>('');
  const [fundReleaseType, setFundReleaseType] = useState<string>('');
  const [authorityTagType, setAuthorityTagType] = useState<string>('');
  const [clearanceUntagType, setClearanceUntagType] = useState<string>('');
  const [completionReportType, setCompletionReportType] = useState<string>('');
  const [annualPISYear, setAnnualPISYear] = useState<string>('');
  const [qprQuarter, setQPRQuarter] = useState<string>('');
  const [graduationReportType, setGraduationReportType] = useState<string>('');
  const [approvedAmount, setApprovedAmount] = useState<string>('');
  const [approvedAmountDate, setApprovedAmountDate] = useState<string>('');
  const [untaggingAmount, setUntaggingAmount] = useState<string>('');
  const [moaSupplementalCount, setMoaSupplementalCount] = useState<number>(0);
  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string>>({});
  const [abstractQuotationType, setAbstractQuotationType] = useState<string>('');
  const [abstractQuotationRows, setAbstractQuotationRows] = useState<Array<{
    type: string;
    name: string;
  }>>([]);
  const [abstractQuotationTypeOptions, setAbstractQuotationTypeOptions] = useState<string[]>(['Equipment', 'Non-equipment']);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [interventionStatusOptions, setInterventionStatusOptions] = useState<string[]>(['Procured', 'Pulled Out']);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState<string>('');
  const [othersOptions, setOthersOptions] = useState<string[]>(['Withdrawal Request', 'Withdrawal Approval', 'Photo(s) During Implementation']);
  const [showAddOthersModal, setShowAddOthersModal] = useState(false);
  const [newOthersName, setNewOthersName] = useState<string>('');
  const [othersDropdownOpen, setOthersDropdownOpen] = useState(false);
  const othersDropdownRef = useRef<HTMLDivElement>(null);
  const [showRemoveOthersModal, setShowRemoveOthersModal] = useState(false);
  const [othersOptionToRemove, setOthersOptionToRemove] = useState<string>('');

  // Initiation Others options
  const [initiationOthersOptions, setInitiationOthersOptions] = useState<string[]>(['Media Documentation']);
  const [showAddInitiationOthersModal, setShowAddInitiationOthersModal] = useState(false);
  const [newInitiationOthersName, setNewInitiationOthersName] = useState<string>('');
  const [initiationOthersDropdownOpen, setInitiationOthersDropdownOpen] = useState(false);
  const initiationOthersDropdownRef = useRef<HTMLDivElement>(null);
  const [showRemoveInitiationOthersModal, setShowRemoveInitiationOthersModal] = useState(false);
  const [initiationOthersOptionToRemove, setInitiationOthersOptionToRemove] = useState<string>('');

  // Monitoring Others options
  const [monitoringOthersOptions, setMonitoringOthersOptions] = useState<string[]>(['Media Documentation']);
  const [showAddMonitoringOthersModal, setShowAddMonitoringOthersModal] = useState(false);
  const [newMonitoringOthersName, setNewMonitoringOthersName] = useState<string>('');
  const [monitoringOthersDropdownOpen, setMonitoringOthersDropdownOpen] = useState(false);
  const monitoringOthersDropdownRef = useRef<HTMLDivElement>(null);
  const [showRemoveMonitoringOthersModal, setShowRemoveMonitoringOthersModal] = useState(false);
  const [monitoringOthersOptionToRemove, setMonitoringOthersOptionToRemove] = useState<string>('');

  // Refund Documents dropdown
  const [refundDropdownOpen, setRefundDropdownOpen] = useState(false);
  const refundDropdownRef = useRef<HTMLDivElement>(null);
  const refundDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [refundDropdownPos, setRefundDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [refundDocumentsOptions, setRefundDocumentsOptions] = useState<string[]>([
    'Letter in acknowledgement of PDCs',
    'Receipt of PDC form',
    'Photocopy of Official Receipt (ORs)',
    'Letter of Endorsement of ORs',
    'Notice of Dishonor'
  ]);
  const [showAddRefundDocModal, setShowAddRefundDocModal] = useState(false);
  const [newRefundDocName, setNewRefundDocName] = useState<string>('');
  const [showRemoveRefundDocModal, setShowRemoveRefundDocModal] = useState(false);
  const [refundDocOptionToRemove, setRefundDocOptionToRemove] = useState<string>('');
  const [refundDocumentRows, setRefundDocumentRows] = useState<Array<{
    id: string;
    type: string;
    date: string;
  }>>([]);
  const [removeRefundDocConfirmModal, setRemoveRefundDocConfirmModal] = useState<{
    show: boolean;
    refundDocId: string;
    refundDocName: string;
  } | null>(null);

  // Communications - Single dropdown system
  const [communicationTypes, setCommunicationTypes] = useState<string[]>(['Incoming', 'Outgoing']);
  const [communicationRows, setCommunicationRows] = useState<Array<{
    id: string;
    type: string;
    date: string;
  }>>([]);
  const [communicationDropdownOpen, setCommunicationDropdownOpen] = useState(false);
  const communicationDropdownRef = useRef<HTMLDivElement>(null);
  const [removeCommunicationConfirmModal, setRemoveCommunicationConfirmModal] = useState<{
    show: boolean;
    communicationId: string;
    communicationName: string;
  } | null>(null);
  const [showAddCommunicationTypeModal, setShowAddCommunicationTypeModal] = useState(false);
  const [newCommunicationType, setNewCommunicationType] = useState<string>('');
  const communicationDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [communicationDropdownPos, setCommunicationDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // Management Reports - Single dropdown system
  const [managementReportTypes, setManagementReportTypes] = useState<string[]>([
    'Liquidation Report & Attachments',
    'Completion Report & Attachments',
    'Graduation Report & Attachments',
    'Termination Report & Attachments',
    'Demand Letters & Attachments',
    'Media Documentation'
  ]);
  const [managementReportRows, setManagementReportRows] = useState<Array<{
    id: string;
    type: string;
    date: string;
  }>>([]);
  const [showAddManagementReportTypeModal, setShowAddManagementReportTypeModal] = useState(false);
  const [newManagementReportType, setNewManagementReportType] = useState<string>('');
  const [managementReportDropdownOpen, setManagementReportDropdownOpen] = useState(false);
  const managementReportDropdownRef = useRef<HTMLDivElement>(null);
  const [removeReportConfirmModal, setRemoveReportConfirmModal] = useState<{
    show: boolean;
    reportId: string;
    reportName: string;
  } | null>(null);
  const [saveReportsConfirmModal, setSaveReportsConfirmModal] = useState(false);
  const [interventionInputs, setInterventionInputs] = useState<Array<{
    type: 'equipment' | 'non-equipment';
    name?: string;
    cost?: string;
    status?: string;
    propertyCode?: string;
    serviceType?: string;
    specification?: string;
  }>>([]);
  const [clearanceUntagRows, setClearanceUntagRows] = useState<Array<{
    amount: string;
    supplier: string;
    date: string;
  }>>([]);
  const [clearanceUntaggingRows, setClearanceUntaggingRows] = useState<Array<{
    label: string;
    amount: string;
    date: string;
  }>>([{ label: '1st Untagging', amount: '', date: '' }]);
  const [pdeRows, setPdeRows] = useState<Array<{
    months: string;
    date: string;
  }>>([{ months: '', date: '' }]);
  const [libRows, setLibRows] = useState<Array<{
    date: string;
  }>>([{ date: '' }]);
  const [annexCSelection, setAnnexCSelection] = useState<string>('');
  const [untaggingAmountRows, setUntaggingAmountRows] = useState<Array<{
    amount: string;
    date: string;
  }>>([{ amount: '', date: '' }]);
  const [completionReportRows, setCompletionReportRows] = useState<Array<{
    type: string;
  }>>([]);
  const [annualPISRows, setAnnualPISRows] = useState<Array<{
    year: string;
  }>>([]);
  const [fundReleaseDateRows, setFundReleaseDateRows] = useState<Array<{
    releaseDate: string;
  }>>([{ releaseDate: '' }]);
  const [qprRows, setQprRows] = useState<Array<{
    quarter: string;
    year: string;
  }>>([]);
  const [internalEvalRows, setInternalEvalRows] = useState<Array<{
    date: string;
  }>>([{ date: '' }]);
  const [externalEvalRows, setExternalEvalRows] = useState<Array<{
    date: string;
  }>>([{ date: '' }]);

  // Custom rows per section
  const [customRows, setCustomRows] = useState<Array<{
    id: string;
    sectionLabel: string;
    name: string;
    rowType: 'item' | 'dropdown' | 'textinput';
    dropdownOptions?: string[];
    textValue?: string;
  }>>([]);
  const [showAddRowModal, setShowAddRowModal] = useState<{
    show: boolean;
    sectionLabel: string;
  } | null>(null);
  const [newRowName, setNewRowName] = useState('');
  const [newRowType, setNewRowType] = useState<'item' | 'dropdown' | 'textinput'>('item');
  const [newRowDropdownOptions, setNewRowDropdownOptions] = useState('');

  // State for editing/renaming custom rows
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowName, setEditingRowName] = useState('');
  const [showEditRowModal, setShowEditRowModal] = useState<{
    show: boolean;
    rowId: string;
    currentName: string;
    rowType: 'item' | 'dropdown' | 'textinput';
    dropdownOptions?: string[];
  } | null>(null);
  const [editRowName, setEditRowName] = useState('');
  const [editRowOptions, setEditRowOptions] = useState('');
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [acceptedLiquidationDate, setAcceptedLiquidationDate] = useState<string>('');
  const [fileDragOverRowId, setFileDragOverRowId] = useState<string | null>(null);

  // Track current dropdown data for merging across saves
  const [currentDropdownData, setCurrentDropdownData] = useState<Record<string, unknown>>({});

  // Confirmation modal states
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean;
    fileName: string;
    docId?: string;
    templateItemId?: string;
    isMultiple?: boolean;
    count?: number;
  } | null>(null);
  const [deleteSuccessModal, setDeleteSuccessModal] = useState<{
    show: boolean;
    fileName: string;
    count?: number;
  } | null>(null);
  const [saveSuccessModal, setSaveSuccessModal] = useState<{
    show: boolean;
    message: string;
  } | null>(null);
  const [savingData, setSavingData] = useState(false);
  const [removeCustomRowConfirmModal, setRemoveCustomRowConfirmModal] = useState<{
    show: boolean;
    rowId: string;
    rowName: string;
  } | null>(null);

  // Initialize states from saved dropdownData
  useEffect(() => {
    if (initialDropdownData) {
      const data = initialDropdownData as Record<string, unknown>;
      setCurrentDropdownData(data);

      // Restore dropdown selections
      if (data.dropdownSelections) {
        setDropdownSelections(data.dropdownSelections as Record<string, string>);
      }
      if (data[`selection_3`]) {
        setDropdownSelections(prev => ({ ...prev, 3: data[`selection_3`] as string }));
      }

      // Restore abstract quotation type
      if (data.abstractQuotationType) {
        setAbstractQuotationType(data.abstractQuotationType as string);
      }

      // Restore abstract quotation rows
      if (data.abstractQuotationRows) {
        setAbstractQuotationRows(data.abstractQuotationRows as Array<{ type: string; name: string }>);
      }

      // Restore custom abstract quotation type options
      if (data.abstractQuotationTypeOptions) {
        setAbstractQuotationTypeOptions(data.abstractQuotationTypeOptions as string[]);
      }

      // Restore custom intervention status options
      if (data.interventionStatusOptions) {
        setInterventionStatusOptions(data.interventionStatusOptions as string[]);
      }

      // Restore custom others options
      if (data.othersOptions) {
        setOthersOptions(data.othersOptions as string[]);
      }

      // Restore initiation others options
      if (data.initiationOthersOptions) {
        setInitiationOthersOptions(data.initiationOthersOptions as string[]);
      }

      // Restore monitoring others options
      if (data.monitoringOthersOptions) {
        setMonitoringOthersOptions(data.monitoringOthersOptions as string[]);
      }

      // Restore refund documents options
      if (data.refundDocumentsOptions) {
        setRefundDocumentsOptions(data.refundDocumentsOptions as string[]);
      }
      if (data.refundDocumentRows) {
        setRefundDocumentRows(data.refundDocumentRows as Array<{ id: string; type: string; date: string }>);
      }

      // Restore management report types and rows
      if (data.managementReportTypes) {
        setManagementReportTypes(data.managementReportTypes as string[]);
      }
      if (data.managementReportRows) {
        setManagementReportRows(data.managementReportRows as Array<{ id: string; type: string; date: string }>);
      }

      // Restore communication types and rows
      if (data.communicationTypes) {
        setCommunicationTypes(data.communicationTypes as string[]);
      }
      if (data.communicationRows) {
        setCommunicationRows(data.communicationRows as Array<{ id: string; type: string; date: string }>);
      }

      // Restore intervention items
      if (data.interventionItems) {
        setInterventionInputs(data.interventionItems as Array<{
          type: 'equipment' | 'non-equipment';
          name?: string;
          cost?: string;
          status?: string;
          propertyCode?: string;
          serviceType?: string;
        }>);
      }

      // Restore clearance untag rows
      if (data.clearanceUntagRows) {
        setClearanceUntagRows(data.clearanceUntagRows as Array<{
          amount: string;
          supplier: string;
          date: string;
        }>);
      }

      // Restore clearance untagging rows (1st Untagging, 2nd Untagging, etc.)
      if (data.clearanceUntaggingRows) {
        setClearanceUntaggingRows(data.clearanceUntaggingRows as Array<{
          label: string;
          amount: string;
          date: string;
        }>);
      }

      // Restore PDE rows (Project Duration Extension)
      if (data.pdeRows) {
        setPdeRows(data.pdeRows as Array<{ months: string; date: string }>);
      }

      // Restore LIB rows (Line-Item Budget)
      if (data.libRows) {
        setLibRows(data.libRows as Array<{ date: string }>);
      }

      // Restore Annex C selection
      if (data.annexCSelection) {
        setAnnexCSelection(data.annexCSelection as string);
      }

      // Restore untagging amount rows
      if (data.untaggingAmountRows) {
        setUntaggingAmountRows(data.untaggingAmountRows as Array<{ amount: string; date: string }>);
      }

      // Restore completion report rows
      if (data.completionReportRows) {
        setCompletionReportRows(data.completionReportRows as Array<{ type: string }>);
      }

      // Restore annual PIS rows
      if (data.annualPISRows) {
        setAnnualPISRows(data.annualPISRows as Array<{ year: string }>);
      }

      // Restore MOA supplemental count
      if (data.moaSupplementalCount !== undefined) {
        setMoaSupplementalCount(data.moaSupplementalCount as number);
      }

      // Restore fund release date rows
      if (data.fundReleaseDateRows) {
        setFundReleaseDateRows(data.fundReleaseDateRows as Array<{ releaseDate: string }>);
      }

      // Restore QPR rows
      if (data.qprRows) {
        setQprRows(data.qprRows as Array<{ quarter: string; year: string }>);
      }

      // Restore approved amount for release
      if (data.approvedAmountForRelease) {
        setApprovedAmount(data.approvedAmountForRelease as string);
      }

      // Restore approved amount date
      if (data.approvedAmountDate) {
        setApprovedAmountDate(data.approvedAmountDate as string);
      }

      // Restore accepted liquidation date
      if (data.acceptedLiquidationDate) {
        setAcceptedLiquidationDate(data.acceptedLiquidationDate as string);
      }

      // Restore internal evaluation rows
      if (data.internalEvalRows) {
        setInternalEvalRows(data.internalEvalRows as Array<{ date: string }>);
      }

      // Restore external evaluation rows
      if (data.externalEvalRows) {
        setExternalEvalRows(data.externalEvalRows as Array<{ date: string }>);
      }

      // Restore custom rows
      if (data.customRows) {
        setCustomRows(data.customRows as Array<{
          id: string;
          sectionLabel: string;
          name: string;
          rowType: 'item' | 'dropdown' | 'textinput';
          dropdownOptions?: string[];
          textValue?: string;
        }>);
      }
    }
  }, [initialDropdownData]);

  useEffect(() => {
    if (onProgressUpdate) {
      const { percent, uploadedItems, totalItems } = calculateProgress();
      onProgressUpdate(percent, uploadedItems, totalItems);
    }
  }, [documents, annualPISRows, completionReportRows, moaSupplementalCount, dropdownSelections, fundReleaseDateRows, qprRows]);

  const getDocsForItem = (templateItemId: string): ProjectDocument[] => {
    return documents.filter(d => d.templateItemId === templateItemId);
  };

  const getDocForItem = (templateItemId: string): ProjectDocument | undefined => {
    return documents.find(d => d.templateItemId === templateItemId);
  };

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

  // Close Others dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (othersDropdownRef.current && !othersDropdownRef.current.contains(event.target as Node)) {
        setOthersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Initiation Others dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (initiationOthersDropdownRef.current && !initiationOthersDropdownRef.current.contains(event.target as Node)) {
        setInitiationOthersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Monitoring Others dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monitoringOthersDropdownRef.current && !monitoringOthersDropdownRef.current.contains(event.target as Node)) {
        setMonitoringOthersDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Refund Documents dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (refundDropdownRef.current && !refundDropdownRef.current.contains(event.target as Node)) {
        setRefundDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Management Report dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (managementReportDropdownRef.current && !managementReportDropdownRef.current.contains(event.target as Node)) {
        setManagementReportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close Communication dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (communicationDropdownRef.current && !communicationDropdownRef.current.contains(event.target as Node)) {
        setCommunicationDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (key: string) => setExpandedDropdowns(prev => ({ ...prev, [key]: !prev[key] }));

  const handleUploadClick = (templateItemId: string) => {
    if (!isEditMode) return;
    targetItemIdRef.current = templateItemId;
    fileInputRef.current?.click();
  };

  // Handle file drop for drag and drop upload
  const handleFileDrop = async (e: React.DragEvent<HTMLTableRowElement>, templateItemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFileDragOverRowId(null);

    if (!isEditMode) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploadingItemId(templateItemId);
    try {
      let last: { fileName: string; fileType: string; fileSize: string; date: string } | null = null;
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('phase', phase);
        fd.append('templateItemId', templateItemId);
        const res = await fetch(`/api/setup-projects/${projectId}/documents`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Upload failed');
        const sz = file.size >= 1048576 ? `${(file.size / 1048576).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
        last = { fileName: file.name, fileType: file.type.split('/').pop()?.toUpperCase() || 'FILE', fileSize: sz, date: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) };
      }
      await fetchDocuments();
      if (last) setUploadSuccess({ ...last, uploadedBy: 'User' });
    } catch { alert('Failed to upload file. Please try again.'); }
    finally { setUploadingItemId(null); }
  };

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
    try {
      await fetch(`/api/setup-projects/${projectId}/documents/${docId}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch {
      alert('Failed to delete file.');
    }
  };

  // Save dropdown data to API (merges with existing data)
  const saveDropdownData = async (data: Record<string, unknown>, successMessage: string) => {
    setSavingData(true);
    try {
      // Merge with current tracked data
      const mergedData = { ...currentDropdownData, ...data };

      const res = await fetch(`/api/setup-projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ dropdownData: mergedData }),
      });
      if (!res.ok) throw new Error('Save failed');

      // Update local tracking state
      setCurrentDropdownData(mergedData);
      setSaveSuccessModal({ show: true, message: successMessage });
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSavingData(false);
    }
  };

  const handleSaveDropdownSelection = async (docId: number) => {
    const value = dropdownSelections[docId];
    if (!value) {
      alert('Please select an option first.');
      return;
    }
    await saveDropdownData(
      { [`selection_${docId}`]: value, dropdownSelections },
      `Selection "${value}" saved successfully!`
    );
  };

  // ── KEY HELPER: renders a sub-item row properly aligned to the 5 table columns ──
  const renderFileChips = (tid: string) => {
    const allDocs = getDocsForItem(tid);
    if (allDocs.length === 0) return null;
    const visibleDocs = allDocs.slice(0, 3);
    const hasMore = allDocs.length > 3;
    return (
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
        {visibleDocs.map((d) => {
          const ext = d.fileName.split('.').pop()?.toUpperCase() || 'FILE';
          const extColor = ext === 'PDF' ? '#e53935' : ext === 'DOCX' || ext === 'DOC' ? '#1565c0' : ext === 'XLSX' || ext === 'XLS' ? '#2e7d32' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#f57c00' : '#607d8b';
          return (
            <div key={d.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: '5px', padding: '2px 4px 2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <button
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); setPreviewDoc(d); }}
                title={`View ${d.fileName}`}
              >
                <span style={{ flexShrink: 0, fontSize: '7px', fontWeight: 700, color: '#fff', padding: '1px 3px', borderRadius: '2px', backgroundColor: extColor }}>{ext}</span>
                <span style={{ fontSize: '10px', color: '#333', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</span>
              </button>
              {isEditMode && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSingle(d.id, d.fileName); }}
                  title={`Delete ${d.fileName}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: '#e0e0e0', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#c62828')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                >
                  <Icon icon="mdi:close" width={10} height={10} style={{ color: '#666' }} />
                </button>
              )}
            </div>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setFileListModal(tid)}
            title={`Show all ${allDocs.length} files`}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: '#555', flexShrink: 0, whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#ccc')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}
          >
            +{allDocs.length - 3}
          </button>
        )}
      </div>
    );
  };

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
            isEditMode={isEditMode}
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
    <div className="bg-white rounded-xl mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-visible">
      <h2 className="text-base font-bold text-primary pt-5 px-7 m-0 mb-3">{title}</h2>

      {/* View Mode Banner - Only for non-assignees (assignees always have Upload/Edit Mode) */}
      {!isEditMode && !isAssigneeUploadMode && !isAssigneeEditMode && (
        <div className="flex items-start gap-2 bg-[#fff3e0] border border-[#ffcc80] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#e65100] leading-[1.4]">
          <Icon icon="mdi:eye-outline" width={16} height={16} className="min-w-4 mt-px" />
          <span><strong>View Mode:</strong> You are currently in view mode. Editing, uploading, and deleting are disabled. Click &quot;Edit Mode&quot; button to enable editing.</span>
        </div>
      )}

      {/* Upload Mode Banner for Assignee */}
      {isAssigneeUploadMode && (
        <div className="flex items-start gap-2 bg-[#fff8e1] border border-[#ffecb3] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#f57f17] leading-[1.4]">
          <Icon icon="mdi:upload" width={16} height={16} className="min-w-4 mt-px" />
          <span><strong>Upload Mode:</strong> You can upload, download, and delete files. To add new rows or configure dropdowns, switch to &quot;Edit Mode&quot;.</span>
        </div>
      )}

      {/* Edit Mode Banner for Assignee */}
      {isAssigneeEditMode && (
        <div className="flex items-start gap-2 bg-[#e8f5e9] border border-[#a5d6a7] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#2e7d32] leading-[1.4]">
          <Icon icon="mdi:pencil-plus-outline" width={16} height={16} className="min-w-4 mt-px" />
          <span><strong>Edit Mode:</strong> You can add new rows, configure dropdowns, rename fields, and manage file uploads. Use the &quot;Add New Row&quot; button below the table to add custom fields.</span>
        </div>
      )}

      {/* Edit Mode Banner for Non-Assignees */}
      {isEditMode && !isAssigneeUploadMode && !isAssigneeEditMode && (
        <div className="flex items-start gap-2 bg-[#e8f5e9] border border-[#a5d6a7] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#2e7d32] leading-[1.4]">
          <Icon icon="mdi:pencil-outline" width={16} height={16} className="min-w-4 mt-px" />
          <span><strong>Edit Mode:</strong> You can upload, download, and delete files. Click &quot;View Mode&quot; button to disable editing.</span>
        </div>
      )}

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
              <th className="min-w-[240px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                {title === 'Project Implementation' ? 'Implementation Records (F1)' : title === 'Project Management' ? 'Management Report (F2)' : title === 'Project Monitoring' ? 'Monitoring Reports (F3)' : title === 'Project Refund' ? 'Refund Records (F4)' : title === 'Communications' ? 'Communcation Records (F5)' :'Documentary Requirements'}
              </th>
              <th className="w-40 py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">File</th>
              <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">Date Uploaded</th>
              <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody>
            {docs.flatMap((doc, idx) => {
              const elements: React.ReactNode[] = [];
              const nextDoc = docs[idx + 1];
              const isLastBeforeSection = nextDoc?.type === 'section';
              const isLastDoc = idx === docs.length - 1;

              // Determine current section label
              let currentSectionLabel = title;
              for (let i = idx; i >= 0; i--) {
                if (docs[i].type === 'section') {
                  currentSectionLabel = docs[i].label;
                  break;
                }
              }

              // Helper to render custom rows and add button for a section
              const renderSectionCustomRows = (sectionLabel: string, renderCallId: string) => {
                const sectionElements: React.ReactNode[] = [];
                const sectionCustomRows = customRows.filter(r => r.sectionLabel === sectionLabel);
                let customRowCounter = itemCounter;

                sectionCustomRows.forEach((customRow) => {
                  customRowCounter++;
                  const tid = `${phase}-custom-${customRow.id}`;
                  const rowDocs = getDocsForItem(tid);
                  const latestDoc = rowDocs[0];
                  const isRowUploading = uploadingItemId === tid;
                  const hasFile = rowDocs.length > 0;

                  if (customRow.rowType === 'item') {
                    const isFileDragOver = fileDragOverRowId === tid;
                    sectionElements.push(
                      <tr
                        key={`custom-${customRow.id}-${renderCallId}`}
                        draggable={isAssigneeEditMode && !fileDragOverRowId}
                        onDragStart={(e) => {
                          if (!isAssigneeEditMode || e.dataTransfer.files.length > 0) return;
                          setDraggedRowId(customRow.id);
                        }}
                        onDragEnd={() => { setDraggedRowId(null); setDragOverRowId(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          // Check if dragging files (for file upload) or dragging rows (for reordering)
                          if (e.dataTransfer.types.includes('Files')) {
                            if (isEditMode) setFileDragOverRowId(tid);
                          } else if (isAssigneeEditMode) {
                            setDragOverRowId(customRow.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (e.dataTransfer.types.includes('Files')) {
                            setFileDragOverRowId(null);
                          }
                        }}
                        onDrop={(e) => {
                          // Handle file drop
                          if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
                            handleFileDrop(e, tid);
                            return;
                          }
                          // Handle row reorder drop
                          if (!isAssigneeEditMode) return;
                          e.preventDefault();
                          if (draggedRowId && draggedRowId !== customRow.id) {
                            const draggedIdx = customRows.findIndex(r => r.id === draggedRowId);
                            const targetIdx = customRows.findIndex(r => r.id === customRow.id);
                            if (draggedIdx !== -1 && targetIdx !== -1) {
                              const newRows = [...customRows];
                              const [removed] = newRows.splice(draggedIdx, 1);
                              newRows.splice(targetIdx, 0, removed);
                              setCustomRows(newRows);
                            }
                          }
                          setDraggedRowId(null);
                          setDragOverRowId(null);
                        }}
                        className={`transition-all duration-150 ${draggedRowId === customRow.id ? 'opacity-50' : ''} ${dragOverRowId === customRow.id && draggedRowId !== customRow.id ? 'bg-[#e3f2fd]' : ''} ${isFileDragOver ? 'bg-[#e8f5e9] ring-2 ring-[#2e7d32] ring-inset' : ''}`}
                      >
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">
                          <div className="flex items-center gap-1">
                            {isAssigneeEditMode && <Icon icon="mdi:drag" width={16} height={16} className="cursor-grab text-[#999] hover:text-[#666]" />}
                            {customRowCounter}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:file-document-outline" width={14} height={14} className="text-[#1976d2]" />
                              {customRow.name}
                            </span>
                            {isAssigneeEditMode && (
                              <>
                                <button
                                  onClick={() => setShowEditRowModal({ show: true, rowId: customRow.id, currentName: customRow.name, rowType: customRow.rowType, dropdownOptions: customRow.dropdownOptions })}
                                  className="text-[#1976d2] hover:underline text-[10px]"
                                  title="Edit row name"
                                >
                                  (edit)
                                </button>
                                <button onClick={() => { if (confirm(`Delete "${customRow.name}" row?`)) setCustomRows(prev => prev.filter(r => r.id !== customRow.id)); }} className="text-[#c62828] hover:underline text-[10px]">(remove)</button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                          {isFileDragOver ? (
                            <span className="text-[11px] text-[#2e7d32] font-semibold flex items-center gap-1">
                              <Icon icon="mdi:file-upload-outline" width={14} height={14} />
                              Drop file here to upload
                            </span>
                          ) : hasFile ? (
                            renderFileChips(tid) ?? <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                          ) : (
                            <span className="text-[#bbb] italic text-xs flex items-center gap-1">
                              <Icon icon="mdi:upload" width={12} height={12} />
                              {isEditMode ? 'Drag & drop or click upload' : 'No file uploaded'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                          {hasFile ? new Date(latestDoc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                          <div className="flex gap-1.5">
                            <button className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`} title={isEditMode ? "Upload" : "View mode - editing disabled"} onClick={() => handleUploadClick(tid)} disabled={isRowUploading || !isEditMode}>
                              {isRowUploading ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" /> : <Icon icon="mdi:upload" width={14} height={14} />}
                            </button>
                            <button className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`} title={isEditMode ? "Delete" : "View mode - editing disabled"} onClick={() => hasFile && isEditMode && handleDeleteAll(tid)} disabled={!hasFile || !isEditMode}>
                              <Icon icon="mdi:delete-outline" width={14} height={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  } else if (customRow.rowType === 'textinput') {
                    sectionElements.push(
                      <tr
                        key={`custom-${customRow.id}-${renderCallId}`}
                        draggable={isAssigneeEditMode}
                        onDragStart={() => isAssigneeEditMode && setDraggedRowId(customRow.id)}
                        onDragEnd={() => { setDraggedRowId(null); setDragOverRowId(null); }}
                        onDragOver={(e) => { if (isAssigneeEditMode) { e.preventDefault(); setDragOverRowId(customRow.id); } }}
                        onDrop={(e) => {
                          if (!isAssigneeEditMode) return;
                          e.preventDefault();
                          if (draggedRowId && draggedRowId !== customRow.id) {
                            const draggedIdx = customRows.findIndex(r => r.id === draggedRowId);
                            const targetIdx = customRows.findIndex(r => r.id === customRow.id);
                            if (draggedIdx !== -1 && targetIdx !== -1) {
                              const newRows = [...customRows];
                              const [removed] = newRows.splice(draggedIdx, 1);
                              newRows.splice(targetIdx, 0, removed);
                              setCustomRows(newRows);
                            }
                          }
                          setDraggedRowId(null);
                          setDragOverRowId(null);
                        }}
                        className={`${draggedRowId === customRow.id ? 'opacity-50' : ''} ${dragOverRowId === customRow.id && draggedRowId !== customRow.id ? 'bg-[#e3f2fd]' : ''}`}
                      >
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">
                          <div className="flex items-center gap-1">
                            {isAssigneeEditMode && <Icon icon="mdi:drag" width={16} height={16} className="cursor-grab text-[#999] hover:text-[#666]" />}
                            {customRowCounter}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:form-textbox" width={14} height={14} className="text-[#1976d2]" />
                              {customRow.name}
                            </span>
                            {isAssigneeEditMode && (
                              <>
                                <button
                                  onClick={() => {
                                    setShowEditRowModal({ show: true, rowId: customRow.id, currentName: customRow.name, rowType: customRow.rowType });
                                    setEditRowName(customRow.name);
                                  }}
                                  className="text-[#1976d2] hover:underline text-[10px]"
                                  title="Edit row name"
                                >
                                  (edit)
                                </button>
                                <button onClick={() => { if (confirm(`Delete "${customRow.name}" row?`)) setCustomRows(prev => prev.filter(r => r.id !== customRow.id)); }} className="text-[#c62828] hover:underline text-[10px]">(remove)</button>
                              </>
                            )}
                          </div>
                        </td>
                        <td colSpan={3} className="py-2.5 px-3 border-b border-[#eee] align-middle">
                          <input type="text" value={customRow.textValue || ''} onChange={(e) => setCustomRows(prev => prev.map(r => r.id === customRow.id ? { ...r, textValue: e.target.value } : r))} placeholder="Enter text..." className={`border border-[#ddd] rounded px-3 py-1.5 text-xs w-full max-w-[300px] ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} disabled={!isEditMode} />
                        </td>
                      </tr>
                    );
                  } else if (customRow.rowType === 'dropdown') {
                    const options = customRow.dropdownOptions || [];
                    const selectedOption = customRow.textValue;
                    const selectedOptionTid = selectedOption ? `${phase}-custom-${customRow.id}-opt-${selectedOption.replace(/\s+/g, '-').toLowerCase()}` : null;
                    const selectedOptionDocs = selectedOptionTid ? getDocsForItem(selectedOptionTid) : [];
                    const selectedOptionHasFile = selectedOptionDocs.length > 0;
                    const selectedOptionLatestDoc = selectedOptionDocs[0];
                    const isSelectedOptionUploading = selectedOptionTid ? uploadingItemId === selectedOptionTid : false;
                    const isDropdownFileDragOver = selectedOptionTid && fileDragOverRowId === selectedOptionTid;

                    sectionElements.push(
                      <tr
                        key={`custom-${customRow.id}-${renderCallId}`}
                        draggable={isAssigneeEditMode && !fileDragOverRowId}
                        onDragStart={() => isAssigneeEditMode && setDraggedRowId(customRow.id)}
                        onDragEnd={() => { setDraggedRowId(null); setDragOverRowId(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.types.includes('Files') && isEditMode && selectedOptionTid) {
                            setFileDragOverRowId(selectedOptionTid);
                          } else if (isAssigneeEditMode) {
                            setDragOverRowId(customRow.id);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (e.dataTransfer.types.includes('Files')) {
                            setFileDragOverRowId(null);
                          }
                        }}
                        onDrop={(e) => {
                          if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0 && selectedOptionTid) {
                            handleFileDrop(e, selectedOptionTid);
                            return;
                          }
                          if (!isAssigneeEditMode) return;
                          e.preventDefault();
                          if (draggedRowId && draggedRowId !== customRow.id) {
                            const draggedIdx = customRows.findIndex(r => r.id === draggedRowId);
                            const targetIdx = customRows.findIndex(r => r.id === customRow.id);
                            if (draggedIdx !== -1 && targetIdx !== -1) {
                              const newRows = [...customRows];
                              const [removed] = newRows.splice(draggedIdx, 1);
                              newRows.splice(targetIdx, 0, removed);
                              setCustomRows(newRows);
                            }
                          }
                          setDraggedRowId(null);
                          setDragOverRowId(null);
                        }}
                        className={`transition-all duration-150 ${draggedRowId === customRow.id ? 'opacity-50' : ''} ${dragOverRowId === customRow.id && draggedRowId !== customRow.id ? 'bg-[#e3f2fd]' : ''} ${isDropdownFileDragOver ? 'bg-[#e8f5e9] ring-2 ring-[#2e7d32] ring-inset' : ''}`}
                      >
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">
                          <div className="flex items-center gap-1">
                            {isAssigneeEditMode && <Icon icon="mdi:drag" width={16} height={16} className="cursor-grab text-[#999] hover:text-[#666]" />}
                            {customRowCounter}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Icon icon="mdi:form-dropdown" width={14} height={14} className="text-[#1976d2]" />
                              {customRow.name}
                            </span>
                            {isAssigneeEditMode && (
                              <>
                                <button
                                  onClick={() => {
                                    setShowEditRowModal({ show: true, rowId: customRow.id, currentName: customRow.name, rowType: customRow.rowType, dropdownOptions: customRow.dropdownOptions });
                                    setEditRowName(customRow.name);
                                    setEditRowOptions(customRow.dropdownOptions?.join(', ') || '');
                                  }}
                                  className="text-[#1976d2] hover:underline text-[10px]"
                                  title="Edit dropdown name and options"
                                >
                                  (edit)
                                </button>
                                <button onClick={() => { if (confirm(`Delete "${customRow.name}" row?`)) setCustomRows(prev => prev.filter(r => r.id !== customRow.id)); }} className="text-[#c62828] hover:underline text-[10px]">(remove)</button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                          <div className="flex items-center gap-3">
                            <select
                              value={customRow.textValue || ''}
                              onChange={(e) => setCustomRows(prev => prev.map(r => r.id === customRow.id ? { ...r, textValue: e.target.value } : r))}
                              className={`border border-[#ddd] rounded px-3 py-1.5 text-xs min-w-[150px] ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              disabled={!isEditMode}
                            >
                              <option value="">Select option...</option>
                              {options.map((opt, optIdx) => <option key={`${opt}-${optIdx}`} value={opt}>{opt}</option>)}
                            </select>
                            {selectedOption && (
                              <div className="flex items-center gap-2">
                                {isDropdownFileDragOver ? (
                                  <span className="text-[11px] text-[#2e7d32] font-semibold flex items-center gap-1">
                                    <Icon icon="mdi:file-upload-outline" width={14} height={14} />
                                    Drop file here
                                  </span>
                                ) : selectedOptionHasFile ? (
                                  renderFileChips(selectedOptionTid!)
                                ) : (
                                  <span className="text-[#bbb] italic text-[10px] flex items-center gap-1">
                                    <Icon icon="mdi:upload" width={10} height={10} />
                                    Upload for "{selectedOption}"
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                          {selectedOptionHasFile ? new Date(selectedOptionLatestDoc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : selectedOption ? '—' : ''}
                        </td>
                        <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                          {selectedOption && selectedOptionTid && (
                            <div className="flex gap-1.5">
                              <button
                                className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                title={isEditMode ? `Upload for "${selectedOption}"` : "View mode - editing disabled"}
                                onClick={() => handleUploadClick(selectedOptionTid)}
                                disabled={isSelectedOptionUploading || !isEditMode}
                              >
                                {isSelectedOptionUploading ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" /> : <Icon icon="mdi:upload" width={14} height={14} />}
                              </button>
                              <button
                                className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${selectedOptionHasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                onClick={() => selectedOptionHasFile && isEditMode && handleDeleteAll(selectedOptionTid)}
                                disabled={!selectedOptionHasFile || !isEditMode}
                              >
                                <Icon icon="mdi:delete-outline" width={14} height={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );

                    // If dropdown has a selected value, show sub-rows for each option with file uploads
                    if (isAssigneeEditMode && options.length > 0) {
                      options.forEach((opt, optIdx) => {
                        const optTid = `${phase}-custom-${customRow.id}-opt-${opt.replace(/\s+/g, '-').toLowerCase()}`;
                        const optDocs = getDocsForItem(optTid);
                        const optHasFile = optDocs.length > 0;
                        const optLatestDoc = optDocs[0];
                        const isOptUploading = uploadingItemId === optTid;
                        const isOptFileDragOver = fileDragOverRowId === optTid;

                        sectionElements.push(
                          <tr
                            key={`custom-${customRow.id}-opt-${optIdx}-${renderCallId}`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.types.includes('Files') && isEditMode) {
                                setFileDragOverRowId(optTid);
                              }
                            }}
                            onDragLeave={() => setFileDragOverRowId(null)}
                            onDrop={(e) => {
                              if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
                                handleFileDrop(e, optTid);
                              }
                            }}
                            className={`bg-[#fafafa] transition-all duration-150 ${isOptFileDragOver ? 'bg-[#e8f5e9] ring-2 ring-[#2e7d32] ring-inset' : ''}`}
                          >
                            <td className="py-2 px-3 border-b border-[#eee]" />
                            <td className="py-2 px-3 border-b border-[#eee] text-xs text-[#666] pl-8">
                              <span className="flex items-center gap-1">
                                <Icon icon="mdi:subdirectory-arrow-right" width={12} height={12} className="text-[#999]" />
                                {opt}
                              </span>
                            </td>
                            <td className="py-2 px-3 border-b border-[#eee]">
                              {isOptFileDragOver ? (
                                <span className="text-[10px] text-[#2e7d32] font-semibold flex items-center gap-1">
                                  <Icon icon="mdi:file-upload-outline" width={12} height={12} />
                                  Drop here
                                </span>
                              ) : optHasFile ? (
                                renderFileChips(optTid)
                              ) : (
                                <span className="text-[#bbb] italic text-[10px]">No file</span>
                              )}
                            </td>
                            <td className="py-2 px-3 border-b border-[#eee] text-[#999] text-xs">
                              {optHasFile ? new Date(optLatestDoc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                            </td>
                            <td className="py-2 px-3 border-b border-[#eee]">
                              <div className="flex gap-1.5">
                                <button
                                  className={`w-6 h-6 border-none rounded flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50`}
                                  title={`Upload for "${opt}"`}
                                  onClick={() => handleUploadClick(optTid)}
                                  disabled={isOptUploading || !isEditMode}
                                >
                                  {isOptUploading ? <Icon icon="mdi:loading" width={12} height={12} className="animate-spin" /> : <Icon icon="mdi:upload" width={12} height={12} />}
                                </button>
                                <button
                                  className={`w-6 h-6 border-none rounded flex items-center justify-center text-white ${optHasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                  title="Delete"
                                  onClick={() => optHasFile && isEditMode && handleDeleteAll(optTid)}
                                  disabled={!optHasFile || !isEditMode}
                                >
                                  <Icon icon="mdi:delete-outline" width={12} height={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    }
                  }
                });

                // Add New Row button and Save button - Only visible in Assignee Edit Mode
                if (isAssigneeEditMode) {
                  sectionElements.push(
                    <tr key={`add-row-btn-${sectionLabel}-${renderCallId}`}>
                      <td colSpan={5} className="py-2 px-3 border-b border-[#eee] bg-[#fafafa]">
                        <div className="flex items-center gap-4">
                          <button onClick={() => setShowAddRowModal({ show: true, sectionLabel })} className="flex items-center gap-1.5 text-xs text-[#1976d2] hover:underline">
                            <Icon icon="mdi:plus-circle-outline" width={16} height={16} />
                            <span>Add New Row</span>
                          </button>
                          {sectionCustomRows.length > 0 && (
                            <button
                              onClick={async () => {
                                setSavingData(true);
                                try {
                                  const mergedData = { ...currentDropdownData, customRows };
                                  setCurrentDropdownData(mergedData);
                                  await fetch(`/api/setup-projects/${projectId}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ dropdownData: mergedData }),
                                  });
                                  setSaveSuccessModal({ show: true, message: 'Custom rows saved successfully!' });
                                } catch (error) {
                                  console.error('Error saving custom rows:', error);
                                  alert('Failed to save custom rows');
                                } finally {
                                  setSavingData(false);
                                }
                              }}
                              disabled={savingData}
                              className="flex items-center gap-1.5 text-xs bg-[#2e7d32] text-white px-3 py-1.5 rounded font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                            >
                              <Icon icon="mdi:content-save" width={14} height={14} />
                              <span>{savingData ? 'Saving...' : 'Save'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return sectionElements;
              };

              // ── Section header ──
              if (doc.type === 'section') {
                elements.push(
                  <tr key={`section-${idx}`}>
                    <td colSpan={5} className="py-2.5 px-3 bg-[#f0f0f0] border-b border-[#ddd] text-[13px] text-primary">
                      <strong>{doc.label}</strong>
                    </td>
                  </tr>
                );
                return elements;
              }

              if (doc.type === 'dropdown') {
                const key = `dropdown-${idx}`;
                const isExpanded = expandedDropdowns[key];

                // Approved Amount for Release dropdown with text input
                if (doc.label === 'Approved Amount for Release') {
                  const hasSavedValue = !!approvedAmount;

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                            {hasSavedValue && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                ₱{Number(approvedAmount).toLocaleString()}
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 flex-1">
                                <label className="text-xs font-semibold text-[#555] shrink-0">Amount:</label>
                                <div className="relative flex-1">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666] text-xs font-semibold">₱</span>
                                  <input
                                    type="text"
                                    value={approvedAmount}
                                    onChange={(e) => {
                                      // Allow only numbers and decimal
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      setApprovedAmount(value);
                                    }}
                                    placeholder="Enter amount"
                                    disabled={!isEditMode}
                                    className={`w-full border border-[#ddd] rounded px-3 py-2 pl-7 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <label className="text-xs font-semibold text-[#555]">Date:</label>
                                <input
                                  type="date"
                                  value={approvedAmountDate}
                                  onChange={(e) => setApprovedAmountDate(e.target.value)}
                                  disabled={!isEditMode}
                                  className={`border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                              </div>
                              <button
                                onClick={() => saveDropdownData(
                                  { approvedAmountForRelease: approvedAmount, approvedAmountDate: approvedAmountDate },
                                  `Approved amount "₱${Number(approvedAmount).toLocaleString()}" saved successfully!`
                                )}
                                disabled={savingData || !isEditMode || !approvedAmount}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                              >
                                {savingData ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                            {hasSavedValue && (
                              <div className="mt-2 text-[11px] text-[#2e7d32] flex items-center gap-1">
                                <Icon icon="mdi:check-circle" width={14} height={14} />
                                <span>Saved: ₱{Number(approvedAmount).toLocaleString()}{approvedAmountDate && ` (${new Date(approvedAmountDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Special handling for List of Intervention
                if (doc.label === 'List of Intervention') {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#ffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                            {abstractQuotationRows.length > 0 && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                {abstractQuotationRows.length} item(s)
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              {abstractQuotationRows.length === 0 ? (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No items added yet. Please add items in &quot;Abstract of Quotation&quot; first.
                                </p>
                              ) : (
                                <>
                                  {abstractQuotationRows.map((row, rowIdx) => {
                                    const itemType = row.type || 'Not set';
                                    const itemName = row.name || 'No name';
                                    const interventionData = interventionInputs[rowIdx] || {};

                                    return (
                                      <div key={rowIdx} className="bg-white border border-[#ddd] rounded p-3">
                                        <div className="flex items-center gap-3 mb-3">
                                          <span className="text-xs font-semibold text-[#2e7d32] min-w-[60px]">
                                            {itemType} #{rowIdx + 1}
                                          </span>
                                          <input
                                            type="text"
                                            value={itemName}
                                            disabled
                                            className="border border-[#ddd] rounded px-3 py-2 text-xs flex-1 bg-gray-100 cursor-not-allowed"
                                            title="Name from Abstract of Quotation"
                                          />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Cost</label>
                                            <input
                                              type="text"
                                              value={interventionData.cost || ''}
                                              onChange={(e) => {
                                                const updated = [...interventionInputs];
                                                if (!updated[rowIdx]) {
                                                  updated[rowIdx] = { type: row.type?.toLowerCase() as 'equipment' | 'non-equipment' };
                                                }
                                                updated[rowIdx].cost = e.target.value;
                                                setInterventionInputs(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter cost..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Status</label>
                                            <select
                                              value={interventionData.status || ''}
                                              onChange={(e) => {
                                                if (e.target.value === '__add_new__') {
                                                  setShowAddStatusModal(true);
                                                } else {
                                                  const updated = [...interventionInputs];
                                                  if (!updated[rowIdx]) {
                                                    updated[rowIdx] = { type: row.type?.toLowerCase() as 'equipment' | 'non-equipment' };
                                                  }
                                                  updated[rowIdx].status = e.target.value;
                                                  setInterventionInputs(updated);
                                                }
                                              }}
                                              disabled={!isEditMode}
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            >
                                              <option value="">Select...</option>
                                              {interventionStatusOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                              ))}
                                              <option value="__add_new__" className="text-primary font-bold">+ Add new option</option>
                                            </select>
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Equipment Property Code</label>
                                            <input
                                              type="text"
                                              value={interventionData.propertyCode || ''}
                                              onChange={(e) => {
                                                const updated = [...interventionInputs];
                                                if (!updated[rowIdx]) {
                                                  updated[rowIdx] = { type: row.type?.toLowerCase() as 'equipment' | 'non-equipment' };
                                                }
                                                updated[rowIdx].propertyCode = e.target.value;
                                                setInterventionInputs(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter property code..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                          </div>
                                        </div>
                                        <div className="mt-3">
                                          <label className="block text-xs text-[#555] mb-1">
                                            {row.type === 'Equipment' ? 'Equipment' : row.type === 'Non-equipment' ? 'Non-Equipment' : 'Equipment/Non-Equipment'} Specification
                                          </label>
                                          <textarea
                                            value={interventionData.specification || ''}
                                            onChange={(e) => {
                                              const updated = [...interventionInputs];
                                              if (!updated[rowIdx]) {
                                                updated[rowIdx] = { type: row.type?.toLowerCase() as 'equipment' | 'non-equipment' };
                                              }
                                              updated[rowIdx].specification = e.target.value;
                                              setInterventionInputs(updated);
                                            }}
                                            disabled={!isEditMode}
                                            placeholder={`Enter ${row.type?.toLowerCase() || 'equipment/non-equipment'} specification...`}
                                            rows={3}
                                            className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs resize-none ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <div className="flex justify-end pt-2">
                                    <button
                                      onClick={() => saveDropdownData(
                                        { interventionItems: interventionInputs },
                                        `${abstractQuotationRows.length} intervention item(s) saved successfully!`
                                      )}
                                      disabled={savingData || !isEditMode}
                                      className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                    >
                                      {savingData ? 'Saving...' : 'Save All'}
                                    </button>
                                  </div>
                                </>
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
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
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
                                onChange={(e) => {
                                  setDropdownSelections(prev => ({ ...prev, [doc.id]: e.target.value }));
                                }}
                                className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={!isEditMode}
                              >
                                <option value="">Select business type...</option>
                                {doc.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveDropdownSelection(doc.id)}
                                disabled={!dropdownSelections[doc.id] || savingData || !isEditMode}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                {savingData ? 'Saving...' : 'Save'}
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
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                            onClick={() => handleUploadClick(templateItemId)}
                                            disabled={isUploading || !isEditMode}
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
                                              hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                            onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile || !isEditMode}
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
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                            onClick={() => handleUploadClick(templateItemId)}
                                            disabled={isUploading || !isEditMode}
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
                                              hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                            onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile || !isEditMode}
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
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                                <span className="text-xs font-semibold text-[#555]">Abstract of Quotation Items</span>
                                <button
                                  onClick={() => {
                                    if (!isEditMode) return;
                                    setAbstractQuotationRows([...abstractQuotationRows, { type: '', name: '' }]);
                                  }}
                                  disabled={!isEditMode}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]' : 'bg-[#ccc] text-white cursor-not-allowed'}`}
                                >
                                  + Add Item
                                </button>
                              </div>

                              {abstractQuotationRows.length === 0 && (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No items added yet. Click the button above to add one.
                                </p>
                              )}

                              {abstractQuotationRows.map((row, rowIdx) => {
                                const templateItemId = `${phase}-${doc.id}-row-${rowIdx}-${row.type || 'pending'}`;
                                const uploadedDoc = getDocForItem(templateItemId);
                                const isUploading = uploadingItemId === templateItemId;
                                const hasFile = !!uploadedDoc;

                                return (
                                  <div key={rowIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                    <span className="text-xs font-semibold text-[#333] min-w-[60px]">
                                      Item #{rowIdx + 1}
                                    </span>
                                    <select
                                      value={row.type}
                                      onChange={(e) => {
                                        if (e.target.value === '__add_new__') {
                                          setShowAddTypeModal(true);
                                        } else {
                                          const updated = [...abstractQuotationRows];
                                          updated[rowIdx].type = e.target.value;
                                          setAbstractQuotationRows(updated);
                                        }
                                      }}
                                      disabled={!isEditMode}
                                      className={`border border-[#ddd] rounded px-3 py-2 text-xs min-w-[140px] ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                      <option value="">Select type...</option>
                                      {abstractQuotationTypeOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                      <option value="__add_new__" className="text-primary font-bold">+ Add new option</option>
                                    </select>
                                    <input
                                      type="text"
                                      value={row.name}
                                      onChange={(e) => {
                                        const updated = [...abstractQuotationRows];
                                        updated[rowIdx].name = e.target.value;
                                        setAbstractQuotationRows(updated);
                                      }}
                                      placeholder={row.type ? `Enter ${row.type.toLowerCase()} name...` : "Enter name..."}
                                      disabled={!isEditMode}
                                      className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 min-w-[150px] ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                    {hasFile && (
                                      <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                                    )}
                                    <div className="flex gap-1.5 ml-auto">
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode && row.type ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={!row.type ? "Select type first" : isEditMode ? "Upload" : "View mode - editing disabled"}
                                        onClick={() => handleUploadClick(templateItemId)}
                                        disabled={isUploading || !row.type || !isEditMode}
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
                                          hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                        }`}
                                        title={isEditMode ? "Delete file" : "View mode - editing disabled"}
                                        onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                        disabled={!hasFile || !isEditMode}
                                      >
                                        <Icon icon="mdi:delete-outline" width={14} height={14} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (!isEditMode) return;
                                          if (confirm(`Remove Item #${rowIdx + 1}?`)) {
                                            setAbstractQuotationRows(abstractQuotationRows.filter((_, i) => i !== rowIdx));
                                          }
                                        }}
                                        disabled={!isEditMode}
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#757575] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                        title={isEditMode ? "Remove row" : "View mode - editing disabled"}
                                      >
                                        <Icon icon="mdi:minus" width={14} height={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {abstractQuotationRows.length > 0 && (
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => saveDropdownData(
                                      { abstractQuotationRows },
                                      `${abstractQuotationRows.length} item(s) saved successfully!`
                                    )}
                                    disabled={savingData || !isEditMode}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                  >
                                    {savingData ? 'Saving...' : 'Save All'}
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
                // Memorandum of Agreement dropdown handler
                if (doc.label === 'Memorandum of Agreement' && doc.options) {
                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button 
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
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
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                            onClick={() => handleUploadClick(templateItemId)}
                                            disabled={isUploading || !isEditMode}
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
                                              hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                            }`}
                                            title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                            onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile || !isEditMode}
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
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (!isEditMode) return;
                                        const newCount = moaSupplementalCount + 1;
                                        setMoaSupplementalCount(newCount);
                                        saveDropdownData(
                                          { moaSupplementalCount: newCount },
                                          `Supplemental MOA slot added!`
                                        );
                                      }}
                                      disabled={!isEditMode}
                                      className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]' : 'bg-[#ccc] text-white cursor-not-allowed'}`}
                                    >
                                      + Add Supplemental MOA
                                    </button>
                                  </div>
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
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                              title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                              onClick={() => handleUploadClick(templateItemId)}
                                              disabled={isUploading || !isEditMode}
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
                                                hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                              }`}
                                              title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                              onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                              disabled={!hasFile || !isEditMode}
                                            >
                                              <Icon icon="mdi:delete-outline" width={14} height={14} />
                                            </button>
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#757575] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                              title={isEditMode ? "Remove Slot" : "View mode - editing disabled"}
                                              disabled={!isEditMode}
                                              onClick={() => {
                                                if (!isEditMode) return;
                                                if (confirm(`Remove Supplemental MOA #${idx + 1} slot?`)) {
                                                  const newCount = Math.max(0, moaSupplementalCount - 1);
                                                  setMoaSupplementalCount(newCount);
                                                  saveDropdownData(
                                                    { moaSupplementalCount: newCount },
                                                    `Supplemental MOA slot removed!`
                                                  );
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
                // Calculate total months extension from PDE rows
                const totalPdeMonths = pdeRows.reduce((sum, row) => {
                  const months = parseInt(row.months) || 0;
                  return sum + months;
                }, 0);

                // Helper function to add months to a date
                const addMonthsToDate = (dateStr: string, months: number): string => {
                  if (!dateStr || months === 0) return '';
                  const date = new Date(dateStr);
                  date.setMonth(date.getMonth() + months);
                  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                };

                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#555]">Fund Release Records</span>
                              <button
                                onClick={() => {
                                  setFundReleaseDateRows([...fundReleaseDateRows, { releaseDate: '' }]);
                                }}
                                disabled={!isEditMode}
                                className="bg-[#2e7d32] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#1b5e20] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                + Add Another Release Date
                              </button>
                            </div>

                            {fundReleaseDateRows.map((row, rowIdx) => {
                              const dvTemplateItemId = `${phase}-${doc.id}-${rowIdx}-DV`;
                              const orsTemplateItemId = `${phase}-${doc.id}-${rowIdx}-ORS`;
                              const dvDoc = getDocForItem(dvTemplateItemId);
                              const orsDoc = getDocForItem(orsTemplateItemId);
                              const isUploadingDV = uploadingItemId === dvTemplateItemId;
                              const isUploadingORS = uploadingItemId === orsTemplateItemId;
                              const hasDVFile = !!dvDoc;
                              const hasORSFile = !!orsDoc;

                              return (
                                <div key={rowIdx} className="bg-white border border-[#ddd] rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-[#333]">
                                      Fund Release #{rowIdx + 1}
                                    </span>
                                    {fundReleaseDateRows.length > 1 && (
                                      <button
                                        onClick={() => {
                                          if (confirm(`Remove Fund Release #${rowIdx + 1}?`)) {
                                            setFundReleaseDateRows(fundReleaseDateRows.filter((_, i) => i !== rowIdx));
                                          }
                                        }}
                                        disabled={!isEditMode}
                                        className={`w-6 h-6 border-none rounded flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#c62828] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                        title="Remove this release"
                                      >
                                        <Icon icon="mdi:close" width={14} height={14} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 mb-3">
                                    <label className="text-xs text-[#555] font-semibold min-w-[100px]">Release Date:</label>
                                    <input
                                      type="date"
                                      value={row.releaseDate}
                                      onChange={(e) => {
                                        const updated = [...fundReleaseDateRows];
                                        updated[rowIdx].releaseDate = e.target.value;
                                        setFundReleaseDateRows(updated);
                                      }}
                                      disabled={!isEditMode}
                                      className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    />
                                    <button
                                      onClick={() => saveDropdownData(
                                        { fundReleaseDateRows },
                                        `Release Date ${row.releaseDate ? `"${row.releaseDate}"` : `#${rowIdx + 1}`} saved successfully!`
                                      )}
                                      disabled={savingData || !isEditMode}
                                      className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                    >
                                      {savingData ? 'Saving...' : 'Save'}
                                    </button>
                                  </div>

                                  {/* Extended Deadline Display (based on PDE months) */}
                                  {row.releaseDate && totalPdeMonths > 0 && (
                                    <div className="mb-3 p-3 bg-[#e3f2fd] border border-[#90caf9] rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Icon icon="mdi:calendar-clock" width={16} height={16} className="text-[#1565c0]" />
                                        <span className="text-xs font-semibold text-[#1565c0]">Project Duration Extension Applied</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-4 text-xs">
                                        <div>
                                          <span className="text-[#666]">Original Deadline:</span>
                                          <div className="font-semibold text-[#333]">
                                            {new Date(row.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-[#666]">Total Extension:</span>
                                          <div className="font-semibold text-[#f57c00]">
                                            +{totalPdeMonths} month{totalPdeMonths > 1 ? 's' : ''}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-[#666]">Extended Deadline:</span>
                                          <div className="font-semibold text-[#2e7d32]">
                                            {addMonthsToDate(row.releaseDate, totalPdeMonths)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    {/* DV Upload */}
                                    <div className="flex items-center gap-3 bg-[#f9f9f9] border border-[#eee] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333] font-semibold">DV (Disbursement Voucher)</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={isEditMode ? "Upload DV" : "View mode - editing disabled"}
                                          onClick={() => handleUploadClick(dvTemplateItemId)}
                                          disabled={isUploadingDV || !isEditMode}
                                        >
                                          {isUploadingDV ? (
                                            <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                          ) : (
                                            <Icon icon="mdi:upload" width={14} height={14} />
                                          )}
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasDVFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="View"
                                          onClick={() => hasDVFile && setPreviewDoc(dvDoc)}
                                          disabled={!hasDVFile}
                                        >
                                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasDVFile ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="Delete"
                                          onClick={() => hasDVFile && handleDeleteAll(dvTemplateItemId)}
                                          disabled={!hasDVFile}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                      </div>
                                      {hasDVFile && (
                                        <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                                      )}
                                    </div>

                                    {/* ORS Upload */}
                                    <div className="flex items-center gap-3 bg-[#f9f9f9] border border-[#eee] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333] font-semibold">ORS (Obligation Request and Status)</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={isEditMode ? "Upload ORS" : "View mode - editing disabled"}
                                          onClick={() => handleUploadClick(orsTemplateItemId)}
                                          disabled={isUploadingORS || !isEditMode}
                                        >
                                          {isUploadingORS ? (
                                            <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                          ) : (
                                            <Icon icon="mdi:upload" width={14} height={14} />
                                          )}
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasORSFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="View"
                                          onClick={() => hasORSFile && setPreviewDoc(orsDoc)}
                                          disabled={!hasORSFile}
                                        >
                                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasORSFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                          onClick={() => hasORSFile && isEditMode && handleDeleteAll(orsTemplateItemId)}
                                          disabled={!hasORSFile || !isEditMode}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                      </div>
                                      {hasORSFile && (
                                        <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {fundReleaseDateRows.length > 0 && (
                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => saveDropdownData(
                                    { fundReleaseDateRows },
                                    `${fundReleaseDateRows.length} fund release date(s) saved successfully!`
                                  )}
                                  disabled={savingData || !isEditMode}
                                  className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                >
                                  {savingData ? 'Saving...' : 'Save All Release Dates'}
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
              // Authority to Tag dropdown handler
              if (doc.label === 'Authority to Tag' && doc.options) {
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button 
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
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
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(templateItemId)}
                                      disabled={isUploading || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile || !isEditMode}
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

              // Untagging Amount & Documentary Requirements dropdown handler
              if (doc.label === 'Untagging Amount & Documentary Requirements' && doc.type === 'dropdown') {
                // Helper function to get ordinal suffix
                const getOrdinal = (n: number) => {
                  const s = ['th', 'st', 'nd', 'rd'];
                  const v = n % 100;
                  return n + (s[(v - 20) % 10] || s[v] || s[0]);
                };

                // Get Approved Amount for Release
                const approvedAmountValue = parseFloat(approvedAmount?.replace(/,/g, '') || '0') || 0;

                // Calculate total deductions from clearanceUntaggingRows
                const totalUntaggingDeductions = clearanceUntaggingRows.reduce((sum, row) => {
                  const amount = parseFloat(row.amount?.replace(/,/g, '') || '0') || 0;
                  return sum + amount;
                }, 0);

                // Calculate remaining balance
                const remainingBalance = approvedAmountValue - totalUntaggingDeductions;

                // Add new untagging row
                const addUntaggingRow = () => {
                  const newIndex = clearanceUntaggingRows.length + 1;
                  setClearanceUntaggingRows([
                    ...clearanceUntaggingRows,
                    { label: `${getOrdinal(newIndex)} Untagging`, amount: '', date: '' }
                  ]);
                };

                // Delete untagging row
                const deleteUntaggingRow = (idx: number) => {
                  const updated = clearanceUntaggingRows.filter((_, i) => i !== idx);
                  // Re-label remaining rows
                  const relabeled = updated.map((row, i) => ({
                    ...row,
                    label: `${getOrdinal(i + 1)} Untagging`
                  }));
                  setClearanceUntaggingRows(relabeled.length > 0 ? relabeled : [{ label: '1st Untagging', amount: '', date: '' }]);
                };

                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                          {totalUntaggingDeductions > 0 && (
                            <span className="ml-2 text-[10px] bg-[#00AEEF] text-white px-2 py-0.5 rounded-full">
                              ₱{totalUntaggingDeductions.toLocaleString()}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-3">
                            {/* Approved Amount for Release Summary */}
                            <div className={`border rounded-lg p-3 ${approvedAmountValue > 0 ? 'bg-[#e3f2fd] border-[#90caf9]' : 'bg-[#fff3e0] border-[#ffb74d]'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon icon={approvedAmountValue > 0 ? "mdi:cash-multiple" : "mdi:alert-circle-outline"} width={16} height={16} className={approvedAmountValue > 0 ? "text-[#1565c0]" : "text-[#e65100]"} />
                                  <span className={`text-xs font-semibold ${approvedAmountValue > 0 ? 'text-[#1565c0]' : 'text-[#e65100]'}`}>Approved Amount for Release:</span>
                                </div>
                                {approvedAmountValue > 0 ? (
                                  <span className="text-sm font-bold text-[#1565c0]">
                                    ₱{approvedAmountValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-xs text-[#e65100] italic">Not set - please set in Approved Amount for Release</span>
                                )}
                              </div>
                              {clearanceUntaggingRows.some(r => r.amount) && (
                                <div className="mt-2 pt-2 border-t border-[#90caf9]">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[#1565c0]">SETUP iFund:</span>
                                    <span className="font-semibold text-[#1565c0]">
                                      ₱{totalUntaggingDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs mt-1">
                                    <span className="text-[#1565c0] font-semibold">Remaining Balance:</span>
                                    <span className={`font-bold ${remainingBalance >= 0 ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>
                                      ₱{remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Untagging Clearance & Documentary Requirements */}
                            <div className="bg-white border border-[#ddd] rounded p-3">
                              <div className="text-xs font-semibold text-[#555] mb-3">Untagging Clearance & Documentary Requirements</div>

                              {/* Table Header */}
                              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,2fr)_100px] gap-2 mb-2 px-2">
                                <span className="text-xs font-semibold text-[#555]">Untagging</span>
                                <span className="text-xs font-semibold text-[#555]">Amount</span>
                                <span className="text-xs font-semibold text-[#555]">Date</span>
                                <span className="text-xs font-semibold text-[#555]">File</span>
                                <span className="text-xs font-semibold text-[#555]">Actions</span>
                              </div>

                              <div className="space-y-2">
                                {clearanceUntaggingRows.map((row, idx) => {
                                  // Calculate running total up to this row
                                  const runningDeduction = clearanceUntaggingRows.slice(0, idx + 1).reduce((sum, r) => {
                                    const amount = parseFloat(r.amount?.replace(/,/g, '') || '0') || 0;
                                    return sum + amount;
                                  }, 0);
                                  const runningBalance = approvedAmountValue - runningDeduction;

                                  const templateItemId = `${phase}-${doc.id}-untagging-${idx}`;
                                  const uploadedDoc = getDocForItem(templateItemId);
                                  const isUploadingItem = uploadingItemId === templateItemId;
                                  const hasFile = !!uploadedDoc;

                                  return (
                                    <div key={idx} className="border border-[#eee] rounded p-2 bg-[#fafafa]">
                                      <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(200px,2fr)_100px] gap-2 items-center">
                                        {/* Untagging Label */}
                                        <span className="text-xs font-semibold text-[#2e7d32]">{row.label}</span>

                                        {/* Amount */}
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#666] text-xs">₱</span>
                                          <input
                                            type="text"
                                            value={row.amount}
                                            onChange={(e) => {
                                              const value = e.target.value.replace(/[^0-9.,]/g, '');
                                              const updated = [...clearanceUntaggingRows];
                                              updated[idx].amount = value;
                                              setClearanceUntaggingRows(updated);
                                            }}
                                            placeholder="0.00"
                                            disabled={!isEditMode}
                                            className={`w-full border border-[#ddd] rounded px-2 py-1.5 pl-5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                          />
                                        </div>

                                        {/* Date */}
                                        <input
                                          type="date"
                                          value={row.date}
                                          onChange={(e) => {
                                            const updated = [...clearanceUntaggingRows];
                                            updated[idx].date = e.target.value;
                                            setClearanceUntaggingRows(updated);
                                          }}
                                          disabled={!isEditMode}
                                          className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />

                                        {/* File */}
                                        <div className="flex-1 min-w-0">
                                          {renderFileChips(templateItemId) ?? <span className="text-[#bbb] italic text-xs">No file</span>}
                                        </div>

                                        {/* Actions: Upload, View, Delete */}
                                        <div className="flex gap-1">
                                          {/* Upload */}
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                            title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                            onClick={() => handleUploadClick(templateItemId)}
                                            disabled={!isEditMode || isUploadingItem}
                                          >
                                            {isUploadingItem
                                              ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                              : <Icon icon="mdi:upload" width={14} height={14} />}
                                          </button>

                                          {/* View */}
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                            title="View"
                                            onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                            disabled={!hasFile}
                                          >
                                            <Icon icon="mdi:eye" width={14} height={14} />
                                          </button>

                                          {/* Delete File */}
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                            title="Delete file"
                                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                            disabled={!hasFile || !isEditMode}
                                          >
                                            <Icon icon="mdi:delete" width={14} height={14} />
                                          </button>

                                          {/* Delete Row */}
                                          <button
                                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode && clearanceUntaggingRows.length > 1 ? 'bg-[#757575] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                            title="Delete row"
                                            onClick={() => deleteUntaggingRow(idx)}
                                            disabled={!isEditMode || clearanceUntaggingRows.length <= 1}
                                          >
                                            <Icon icon="mdi:close" width={14} height={14} />
                                          </button>
                                        </div>
                                      </div>
                                      {/* Running balance indicator */}
                                      {row.amount && (
                                        <div className="mt-1 pt-1 border-t border-[#eee] flex justify-end">
                                          <span className={`text-[10px] ${runningBalance >= 0 ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>
                                            Balance after this: ₱{runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add Row Button */}
                              {isEditMode && (
                                <button
                                  onClick={addUntaggingRow}
                                  className="mt-3 flex items-center gap-1.5 text-xs text-[#1976d2] font-semibold hover:text-[#1565c0] transition-colors"
                                >
                                  <Icon icon="mdi:plus-circle" width={16} height={16} />
                                  <span>Add Row</span>
                                </button>
                              )}
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end">
                              <button
                                onClick={() => saveDropdownData(
                                  { clearanceUntaggingRows },
                                  `${clearanceUntaggingRows.length} untagging row(s) saved successfully!`
                                )}
                                disabled={savingData || !isEditMode}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingData ? 'Saving...' : 'Save All'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }

              // Clearance to Untag dropdown handler (original)
              if (doc.label === 'Clearance to Untag' && doc.type === 'dropdown') {
                // Helper function to get ordinal suffix
                const getOrdinal = (n: number) => {
                  const s = ['th', 'st', 'nd', 'rd'];
                  const v = n % 100;
                  return n + (s[(v - 20) % 10] || s[v] || s[0]);
                };

                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                          {abstractQuotationRows.length > 0 && (
                            <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                              {abstractQuotationRows.length} item(s)
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-3">
                            {/* Info banner */}
                            <div className="flex items-start gap-2 bg-[#e3f2fd] border border-[#90caf9] rounded-lg py-2.5 px-4 text-xs text-[#1565c0] leading-[1.4]">
                              <Icon icon="mdi:information-outline" width={16} height={16} className="min-w-4 mt-px" />
                              <span>This section displays clearance details based on items from &quot;List of Intervention&quot;. Amounts entered here are for reference only.</span>
                            </div>

                            {/* Clearance Details */}
                            <div className="bg-white border border-[#ddd] rounded p-3">
                              <div className="text-xs font-semibold text-[#555] mb-3">Clearance Details</div>

                              {abstractQuotationRows.length === 0 ? (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No items added yet. Please add items in &quot;Abstract of Quotation&quot; first.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {abstractQuotationRows.map((aqRow, idx) => {
                                    const clearanceData = clearanceUntagRows[idx] || { amount: '', supplier: '', date: '' };
                                    const typeLabel = aqRow.type || 'Type';
                                    const itemName = aqRow.name || 'No name';
                                    const templateItemId = `${phase}-${doc.id}-clearance-${idx}`;
                                    const uploadedDoc = getDocForItem(templateItemId);
                                    const isUploadingItem = uploadingItemId === templateItemId;
                                    const hasFile = !!uploadedDoc;

                                    return (
                                      <div key={idx} className="border border-[#eee] rounded p-3 bg-[#fafafa]">
                                        <div className="flex items-center gap-2 mb-3">
                                          <span className="text-xs font-semibold text-[#2e7d32]">{getOrdinal(idx + 1)} Untagging &amp; Amount</span>
                                        </div>

                                        {/* Item Name (read-only from List of Intervention) */}
                                        <div className="mb-3">
                                          <label className="block text-xs text-[#555] mb-1">{typeLabel} Name</label>
                                          <input
                                            type="text"
                                            value={itemName}
                                            disabled
                                            className="w-full border border-[#ddd] rounded px-2 py-1.5 text-xs bg-gray-100 cursor-not-allowed"
                                            title="Fetched from List of Intervention"
                                          />
                                        </div>

                                        {/* Amount, Supplier, Date inputs */}
                                        <div className="grid grid-cols-3 gap-3 mb-3">
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Amount</label>
                                            <div className="relative">
                                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#666] text-xs">₱</span>
                                              <input
                                                type="text"
                                                value={clearanceData.amount}
                                                onChange={(e) => {
                                                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                                                  const updated = [...clearanceUntagRows];
                                                  if (!updated[idx]) {
                                                    updated[idx] = { amount: '', supplier: '', date: '' };
                                                  }
                                                  updated[idx].amount = value;
                                                  setClearanceUntagRows(updated);
                                                }}
                                                placeholder="0.00"
                                                disabled={!isEditMode}
                                                className={`w-full border border-[#ddd] rounded px-2 py-1.5 pl-5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                              />
                                            </div>
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Supplier</label>
                                            <input
                                              type="text"
                                              value={clearanceData.supplier}
                                              onChange={(e) => {
                                                const updated = [...clearanceUntagRows];
                                                if (!updated[idx]) {
                                                  updated[idx] = { amount: '', supplier: '', date: '' };
                                                }
                                                updated[idx].supplier = e.target.value;
                                                setClearanceUntagRows(updated);
                                              }}
                                              placeholder="Enter supplier"
                                              disabled={!isEditMode}
                                              className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Date</label>
                                            <input
                                              type="date"
                                              value={clearanceData.date}
                                              onChange={(e) => {
                                                const updated = [...clearanceUntagRows];
                                                if (!updated[idx]) {
                                                  updated[idx] = { amount: '', supplier: '', date: '' };
                                                }
                                                updated[idx].date = e.target.value;
                                                setClearanceUntagRows(updated);
                                              }}
                                              disabled={!isEditMode}
                                              className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                            />
                                          </div>
                                        </div>

                                        {/* File upload section */}
                                        <div className="flex items-center gap-3 pt-2 border-t border-[#eee]">
                                          <span className="text-xs text-[#555]">File:</span>
                                          <div className="flex-1">
                                            {renderFileChips(templateItemId) ?? <span className="text-[#bbb] italic text-xs">No file uploaded</span>}
                                          </div>
                                          <div className="flex gap-1">
                                            {/* Upload */}
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                              title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                              onClick={() => handleUploadClick(templateItemId)}
                                              disabled={!isEditMode || isUploadingItem}
                                            >
                                              {isUploadingItem
                                                ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                                : <Icon icon="mdi:upload" width={14} height={14} />}
                                            </button>

                                            {/* View */}
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                              title="View"
                                              onClick={() => hasFile && setPreviewDoc(uploadedDoc)}
                                              disabled={!hasFile}
                                            >
                                              <Icon icon="mdi:eye" width={14} height={14} />
                                            </button>

                                            {/* Delete File */}
                                            <button
                                              className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                              title="Delete file"
                                              onClick={() => hasFile && handleDeleteAll(templateItemId)}
                                              disabled={!hasFile || !isEditMode}
                                            >
                                              <Icon icon="mdi:delete" width={14} height={14} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {abstractQuotationRows.length > 0 && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => saveDropdownData(
                                    { clearanceUntagRows },
                                    `${abstractQuotationRows.length} clearance row(s) saved successfully!`
                                  )}
                                  disabled={savingData || !isEditMode}
                                  className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                >
                                  {savingData ? 'Saving...' : 'Save All'}
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

              // Completion Report dropdown handler (select-based)
              if (doc.label === 'Completion Report' && doc.options) {
                const selectedOption = dropdownSelections[doc.id] || '';
                const templateItemId = selectedOption ? `${phase}-${doc.id}-${selectedOption}` : '';
                const uploadedDoc = selectedOption ? getDocForItem(templateItemId) : null;
                const isUploadingItem = uploadingItemId === templateItemId;
                const hasFile = !!uploadedDoc;

                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                              <select
                                value={selectedOption}
                                onChange={(e) => {
                                  setDropdownSelections(prev => ({ ...prev, [doc.id]: e.target.value }));
                                }}
                                className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                disabled={!isEditMode}
                              >
                                <option value="">Select option...</option>
                                {doc.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleSaveDropdownSelection(doc.id)}
                                disabled={!selectedOption || savingData || !isEditMode}
                                className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                              >
                                {savingData ? 'Saving...' : 'Save'}
                              </button>
                            </div>

                            {selectedOption && (
                              <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                <span className="flex-1 text-xs text-[#333] font-medium">{selectedOption}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                    onClick={() => handleUploadClick(templateItemId)}
                                    disabled={isUploadingItem || !isEditMode}
                                  >
                                    {isUploadingItem ? (
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
                                      hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                    onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                    disabled={!hasFile || !isEditMode}
                                  >
                                    <Icon icon="mdi:delete-outline" width={14} height={14} />
                                  </button>
                                </div>
                                {hasFile && (
                                  <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                )}
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
                        className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
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
                                if (!isEditMode) return;
                                setAnnualPISRows([...annualPISRows, { year: '' }]);
                              }}
                              disabled={!isEditMode}
                              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]' : 'bg-[#ccc] text-white cursor-not-allowed'}`}
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
                                  disabled={!isEditMode}
                                  className={`border border-[#ddd] rounded px-2 py-1.5 text-xs w-32 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                    title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                    onClick={() => handleUploadClick(templateItemId)}
                                    disabled={isUploading || !isEditMode}
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
                                      hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                    }`}
                                    title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                    onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                    disabled={!hasFile || !isEditMode}
                                  >
                                    <Icon icon="mdi:delete-outline" width={14} height={14} />
                                  </button>
                                  <button
                                    className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#757575] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                    title={isEditMode ? "Remove Row" : "View mode - editing disabled"}
                                    disabled={!isEditMode}
                                    onClick={() => {
                                      if (!isEditMode) return;
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
                                  { annualPISRows },
                                  `${annualPISRows.length} Annual PIS report(s) saved successfully!`
                                )}
                                disabled={savingData || !isEditMode}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingData ? 'Saving...' : 'Save All'}
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
            if (doc.label === 'Quarterly Project Status Reports' && doc.options) {
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button
                        className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                            <span className="text-xs font-semibold text-[#555]">Quarterly Progress Reports</span>
                            <button
                              onClick={() => {
                                if (!isEditMode) return;
                                setQprRows([...qprRows, { quarter: '', year: '' }]);
                              }}
                              disabled={!isEditMode}
                              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]' : 'bg-[#ccc] text-white cursor-not-allowed'}`}
                            >
                              + Add Quarterly Report
                            </button>
                          </div>

                          {qprRows.length === 0 && (
                            <p className="text-xs text-[#999] italic text-center py-4">
                              No quarterly reports added yet. Click the button above to add one.
                            </p>
                          )}

                          {qprRows.map((row, rowIdx) => {
                            const templateItemId = `${phase}-${doc.id}-${rowIdx}-${row.quarter || 'pending'}-${row.year || 'noyear'}`;
                            const uploadedDoc = getDocForItem(templateItemId);
                            const isUploading = uploadingItemId === templateItemId;
                            const hasFile = !!uploadedDoc;

                            return (
                              <div key={rowIdx} className="bg-white border border-[#ddd] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-semibold text-[#333]">
                                    QPR #{rowIdx + 1} {row.quarter && row.year ? `- ${row.quarter} ${row.year}` : ''}
                                  </span>
                                  <button
                                    onClick={() => {
                                      if (!isEditMode) return;
                                      if (confirm(`Remove QPR #${rowIdx + 1}?`)) {
                                        setQprRows(qprRows.filter((_, i) => i !== rowIdx));
                                      }
                                    }}
                                    disabled={!isEditMode}
                                    className={`w-6 h-6 border-none rounded flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#c62828] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                    title={isEditMode ? "Remove this QPR" : "View mode - editing disabled"}
                                  >
                                    <Icon icon="mdi:close" width={14} height={14} />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="block text-xs text-[#555] font-semibold mb-1">Quarter</label>
                                    <select
                                      value={row.quarter}
                                      onChange={(e) => {
                                        const updated = [...qprRows];
                                        updated[rowIdx].quarter = e.target.value;
                                        setQprRows(updated);
                                      }}
                                      disabled={!isEditMode}
                                      className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                      <option value="">Select quarter...</option>
                                      {(doc.options ?? []).map(q => (
                                        <option key={q} value={q}>{q} - Quarter {q.replace('Q', '')}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-[#555] font-semibold mb-1">Year</label>
                                    <select
                                      value={row.year}
                                      onChange={(e) => {
                                        const updated = [...qprRows];
                                        updated[rowIdx].year = e.target.value;
                                        setQprRows(updated);
                                      }}
                                      disabled={!isEditMode}
                                      className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                      <option value="">Select year...</option>
                                      {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() + 5 - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 bg-[#f9f9f9] border border-[#eee] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333] font-semibold">
                                    {row.quarter ? `${row.quarter} Report` : 'Quarterly Report'} {row.year ? `(${row.year})` : ''}
                                  </span>
                                  <div className="flex gap-1.5">
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(templateItemId)}
                                      disabled={isUploading || !row.quarter || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile || !isEditMode}
                                    >
                                      <Icon icon="mdi:delete-outline" width={14} height={14} />
                                    </button>
                                  </div>
                                  {hasFile && (
                                    <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                  )}
                                </div>
                                {!row.quarter && (
                                  <p className="text-[10px] text-[#f57c00] mt-1">Please select a quarter before uploading</p>
                                )}
                              </div>
                            );
                          })}

                          {qprRows.length > 0 && (
                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => saveDropdownData(
                                  { qprRows },
                                  `${qprRows.length} quarterly report(s) saved successfully!`
                                )}
                                disabled={savingData || !isEditMode}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingData ? 'Saving...' : 'Save All'}
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

            // Graduation Report dropdown handler
            if (doc.label === 'Graduation Report' && doc.options) {
              return (
                <React.Fragment key={key}>
                  <tr>
                    <td colSpan={5} className="p-0 border-b border-[#eee]">
                      <button 
                        className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]" 
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
                                    if (!isEditMode) return;
                                    setCompletionReportRows([...completionReportRows, { type: option }]);
                                  }}
                                  disabled={!isEditMode}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]' : 'bg-[#ccc] text-white cursor-not-allowed'}`}
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
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                          onClick={() => handleUploadClick(templateItemId)}
                                          disabled={isUploading || !isEditMode}
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
                                            hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                          onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                          disabled={!hasFile || !isEditMode}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#757575] hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                          title={isEditMode ? "Remove Row" : "View mode - editing disabled"}
                                          disabled={!isEditMode}
                                          onClick={() => {
                                            if (!isEditMode) return;
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
                                  { graduationReportRows: completionReportRows },
                                  `${completionReportRows.length} graduation report(s) saved successfully!`
                                )}
                                disabled={savingData || !isEditMode}
                                className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                              >
                                {savingData ? 'Saving...' : 'Save All'}
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

                // Custom handler for Amendments to the MOA
                if (doc.label === 'Amendments to the MOA' && doc.options) {
                  const selectedOption = dropdownSelections[doc.id] || '';
                  const templateItemId = selectedOption ? `${phase}-${doc.id}-${selectedOption}` : '';
                  const uploadedDoc = selectedOption ? getDocForItem(templateItemId) : null;
                  const isUploading = uploadingItemId === templateItemId;
                  const hasFile = !!uploadedDoc;

                  // Helper function to get ordinal suffix
                  const getOrdinal = (n: number) => {
                    const s = ['th', 'st', 'nd', 'rd'];
                    const v = n % 100;
                    return n + (s[(v - 20) % 10] || s[v] || s[0]);
                  };

                  // Add PDE row
                  const addPdeRow = () => {
                    setPdeRows([...pdeRows, { months: '', date: '' }]);
                  };

                  // Delete PDE row
                  const deletePdeRow = (idx: number) => {
                    if (pdeRows.length > 1) {
                      setPdeRows(pdeRows.filter((_, i) => i !== idx));
                    }
                  };

                  // Add LIB row
                  const addLibRow = () => {
                    setLibRows([...libRows, { date: '' }]);
                  };

                  // Delete LIB row
                  const deleteLibRow = (idx: number) => {
                    if (libRows.length > 1) {
                      setLibRows(libRows.filter((_, i) => i !== idx));
                    }
                  };

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                                <select
                                  value={selectedOption}
                                  onChange={(e) => {
                                    setDropdownSelections(prev => ({ ...prev, [doc.id]: e.target.value }));
                                  }}
                                  className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={!isEditMode}
                                >
                                  <option value="">Select option...</option>
                                  {doc.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSaveDropdownSelection(doc.id)}
                                  disabled={!selectedOption || savingData || !isEditMode}
                                  className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                                >
                                  {savingData ? 'Saving...' : 'Save'}
                                </button>
                              </div>

                              {/* Show file upload for selected option (except Change in Project Duration - Annex C) */}
                              {selectedOption && selectedOption !== 'Change in Project Duration - Annex C' && (
                                <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333] font-medium">{selectedOption}</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(templateItemId)}
                                      disabled={isUploading || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile || !isEditMode}
                                    >
                                      <Icon icon="mdi:delete-outline" width={14} height={14} />
                                    </button>
                                  </div>
                                  {hasFile && (
                                    <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                  )}
                                </div>
                              )}

                              {/* Special handling for Change in Project Duration - Annex C */}
                              {selectedOption === 'Change in Project Duration - Annex C' && (
                                <div className="space-y-4">
                                  {/* Nested dropdown to select PDE or LIB */}
                                  <div className="flex items-center gap-3">
                                    <select
                                      value={annexCSelection}
                                      onChange={(e) => setAnnexCSelection(e.target.value)}
                                      className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                      disabled={!isEditMode}
                                    >
                                      <option value="">Select type...</option>
                                      <option value="PDE">Project Duration Extension</option>
                                      <option value="LIB">Line-Item Budget (LIB) Realignment Restructuring</option>
                                    </select>
                                  </div>

                                  {/* Project Duration Extension (PDE) Section */}
                                  {annexCSelection === 'PDE' && (
                                    <div className="bg-white border border-[#ddd] rounded p-3">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-semibold text-[#555]">Project Duration Extension</div>
                                        {isEditMode && (
                                          <button
                                            onClick={addPdeRow}
                                            className="flex items-center gap-1 text-xs text-[#1976d2] font-semibold hover:text-[#1565c0] transition-colors"
                                          >
                                            <Icon icon="mdi:plus-circle" width={16} height={16} />
                                            <span>Add Row</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* PDE Table Header */}
                                      <div className="grid grid-cols-[minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(150px,1.5fr)_minmax(200px,2fr)_100px] gap-2 mb-2 px-2">
                                        <span className="text-xs font-semibold text-[#555]">PDE</span>
                                        <span className="text-xs font-semibold text-[#555]">No. of Months Extension</span>
                                        <span className="text-xs font-semibold text-[#555]">Date</span>
                                        <span className="text-xs font-semibold text-[#555]">File</span>
                                        <span className="text-xs font-semibold text-[#555]">Actions</span>
                                      </div>

                                      <div className="space-y-2">
                                        {pdeRows.map((row, idx) => {
                                          const pdeTemplateItemId = `${phase}-${doc.id}-pde-${idx}`;
                                          const pdeUploadedDoc = getDocForItem(pdeTemplateItemId);
                                          const isPdeUploading = uploadingItemId === pdeTemplateItemId;
                                          const hasPdeFile = !!pdeUploadedDoc;

                                          return (
                                            <div key={idx} className="grid grid-cols-[minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(150px,1.5fr)_minmax(200px,2fr)_100px] gap-2 items-center border border-[#eee] rounded p-2 bg-[#fafafa]">
                                              {/* PDE Label */}
                                              <span className="text-xs font-semibold text-[#2e7d32]">{getOrdinal(idx + 1)} PDE</span>

                                              {/* No. of Months Extension */}
                                              <input
                                                type="text"
                                                value={row.months}
                                                onChange={(e) => {
                                                  const updated = [...pdeRows];
                                                  updated[idx].months = e.target.value;
                                                  setPdeRows(updated);
                                                }}
                                                placeholder="Enter months"
                                                disabled={!isEditMode}
                                                className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                              />

                                              {/* Date */}
                                              <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => {
                                                  const updated = [...pdeRows];
                                                  updated[idx].date = e.target.value;
                                                  setPdeRows(updated);
                                                }}
                                                disabled={!isEditMode}
                                                className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                              />

                                              {/* File */}
                                              <div className="flex-1 min-w-0">
                                                {renderFileChips(pdeTemplateItemId) ?? <span className="text-[#bbb] italic text-xs">No file</span>}
                                              </div>

                                              {/* Actions */}
                                              <div className="flex gap-1.5">
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                  title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                                  onClick={() => handleUploadClick(pdeTemplateItemId)}
                                                  disabled={!isEditMode || isPdeUploading}
                                                >
                                                  {isPdeUploading
                                                    ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                                    : <Icon icon="mdi:upload" width={14} height={14} />}
                                                </button>
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasPdeFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title="Delete file"
                                                  onClick={() => hasPdeFile && handleDeleteAll(pdeTemplateItemId)}
                                                  disabled={!hasPdeFile || !isEditMode}
                                                >
                                                  <Icon icon="mdi:delete" width={14} height={14} />
                                                </button>
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode && pdeRows.length > 1 ? 'bg-[#757575] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title="Delete row"
                                                  onClick={() => deletePdeRow(idx)}
                                                  disabled={!isEditMode || pdeRows.length <= 1}
                                                >
                                                  <Icon icon="mdi:close" width={14} height={14} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Save Button for PDE */}
                                      <div className="flex justify-end mt-3">
                                        <button
                                          onClick={() => saveDropdownData(
                                            { pdeRows, annexCSelection },
                                            'Project Duration Extension data saved successfully!'
                                          )}
                                          disabled={savingData || !isEditMode}
                                          className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                        >
                                          {savingData ? 'Saving...' : 'Save All'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Line-Item Budget (LIB) Realignment Restructuring Section */}
                                  {annexCSelection === 'LIB' && (
                                    <div className="bg-white border border-[#ddd] rounded p-3">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="text-xs font-semibold text-[#555]">Line-Item Budget (LIB) Realignment Restructuring</div>
                                        {isEditMode && (
                                          <button
                                            onClick={addLibRow}
                                            className="flex items-center gap-1 text-xs text-[#1976d2] font-semibold hover:text-[#1565c0] transition-colors"
                                          >
                                            <Icon icon="mdi:plus-circle" width={16} height={16} />
                                            <span>Add Row</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* LIB Table Header */}
                                      <div className="grid grid-cols-[minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(200px,2fr)_100px] gap-2 mb-2 px-2">
                                        <span className="text-xs font-semibold text-[#555]">LIB</span>
                                        <span className="text-xs font-semibold text-[#555]">Date</span>
                                        <span className="text-xs font-semibold text-[#555]">File</span>
                                        <span className="text-xs font-semibold text-[#555]">Actions</span>
                                      </div>

                                      <div className="space-y-2">
                                        {libRows.map((row, idx) => {
                                          const libTemplateItemId = `${phase}-${doc.id}-lib-${idx}`;
                                          const libUploadedDoc = getDocForItem(libTemplateItemId);
                                          const isLibUploading = uploadingItemId === libTemplateItemId;
                                          const hasLibFile = !!libUploadedDoc;

                                          return (
                                            <div key={idx} className="grid grid-cols-[minmax(100px,1fr)_minmax(150px,1.5fr)_minmax(200px,2fr)_100px] gap-2 items-center border border-[#eee] rounded p-2 bg-[#fafafa]">
                                              {/* LIB Label */}
                                              <span className="text-xs font-semibold text-[#2e7d32]">{getOrdinal(idx + 1)} LIB</span>

                                              {/* Date */}
                                              <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => {
                                                  const updated = [...libRows];
                                                  updated[idx].date = e.target.value;
                                                  setLibRows(updated);
                                                }}
                                                disabled={!isEditMode}
                                                className={`w-full border border-[#ddd] rounded px-2 py-1.5 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                              />

                                              {/* File */}
                                              <div className="flex-1 min-w-0">
                                                {renderFileChips(libTemplateItemId) ?? <span className="text-[#bbb] italic text-xs">No file</span>}
                                              </div>

                                              {/* Actions */}
                                              <div className="flex gap-1.5">
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                  title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                                  onClick={() => handleUploadClick(libTemplateItemId)}
                                                  disabled={!isEditMode || isLibUploading}
                                                >
                                                  {isLibUploading
                                                    ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                                    : <Icon icon="mdi:upload" width={14} height={14} />}
                                                </button>
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${hasLibFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title="Delete file"
                                                  onClick={() => hasLibFile && handleDeleteAll(libTemplateItemId)}
                                                  disabled={!hasLibFile || !isEditMode}
                                                >
                                                  <Icon icon="mdi:delete" width={14} height={14} />
                                                </button>
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center text-white ${isEditMode && libRows.length > 1 ? 'bg-[#757575] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title="Delete row"
                                                  onClick={() => deleteLibRow(idx)}
                                                  disabled={!isEditMode || libRows.length <= 1}
                                                >
                                                  <Icon icon="mdi:close" width={14} height={14} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Save Button for LIB */}
                                      <div className="flex justify-end mt-3">
                                        <button
                                          onClick={() => saveDropdownData(
                                            { libRows, annexCSelection },
                                            'Line-Item Budget data saved successfully!'
                                          )}
                                          disabled={savingData || !isEditMode}
                                          className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                        >
                                          {savingData ? 'Saving...' : 'Save All'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Custom handler for Refund Documents dropdown
                if (doc.label === 'Refund Documents' && doc.type === 'dropdown') {
                  const defaultRefundOptions = ['Letter in acknowledgement of PDCs', 'Receipt of PDC form'];
                  const isCustomRefundOption = (type: string) => !defaultRefundOptions.includes(type);

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                            {refundDocumentRows.length > 0 && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                {refundDocumentRows.length} document(s)
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              {/* Dropdown to add new refund document */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-[#555]">Select Refund Document Type</span>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                  {/* Custom dropdown */}
                                  <div className="flex-1 relative">
                                    <button
                                      ref={refundDropdownButtonRef}
                                      type="button"
                                      onClick={() => {
                                        if (!isEditMode) return;
                                        if (!refundDropdownOpen) {
                                          const rect = refundDropdownButtonRef.current?.getBoundingClientRect();
                                          if (rect) {
                                            setRefundDropdownPos({
                                              top: rect.top,
                                              left: rect.left,
                                              width: rect.width,
                                            });
                                          }
                                        }
                                        setRefundDropdownOpen(!refundDropdownOpen);
                                      }}
                                      className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#aaa]'}`}
                                      disabled={!isEditMode}
                                    >
                                      <span className="text-[#999]">Select a refund document type...</span>
                                      <Icon icon={refundDropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} height={16} className="text-[#666]" />
                                    </button>

                                    {/* Dropdown menu */}
                                    {refundDropdownOpen && typeof window !== 'undefined' && createPortal(
                                      <div
                                        ref={refundDropdownRef}
                                        style={{
                                          position: 'fixed',
                                          top: refundDropdownPos.top,
                                          left: refundDropdownPos.left,
                                          width: refundDropdownPos.width,
                                          transform: 'translateY(calc(-100% - 4px))',
                                          zIndex: 99999,
                                        }}
                                        className="bg-white border border-[#ddd] rounded shadow-lg max-h-[300px] overflow-y-auto"
                                      >
                                        {/* Refund document type options */}
                                        {refundDocumentsOptions.map(type => (
                                          <div
                                            key={type}
                                            className="group px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-[#f5f5f5] text-[#333]"
                                            onClick={() => {
                                              // Add new row with this refund document type
                                              const newRow = {
                                                id: `refund-${Date.now()}-${Math.random()}`,
                                                type: type,
                                                date: ''
                                              };
                                              setRefundDocumentRows(prev => [...prev, newRow]);
                                              setRefundDropdownOpen(false);
                                            }}
                                          >
                                            <span>{type}</span>
                                            {/* X button - only for custom types, visible on hover */}
                                            {isCustomRefundOption(type) && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Remove "${type}" from available options?`)) {
                                                    const newTypes = refundDocumentsOptions.filter(t => t !== type);
                                                    setRefundDocumentsOptions(newTypes);
                                                    saveDropdownData(
                                                      { refundDocumentsOptions: newTypes },
                                                      `Refund document type "${type}" removed successfully!`
                                                    );
                                                  }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#c62828] hover:bg-[#ffebee] rounded transition-opacity"
                                                title={`Remove "${type}"`}
                                              >
                                                <Icon icon="mdi:close" width={14} height={14} />
                                              </button>
                                            )}
                                          </div>
                                        ))}

                                        {/* Add new option */}
                                        <div
                                          className="px-3 py-2 text-xs text-[#1976d2] font-semibold hover:bg-[#e3f2fd] cursor-pointer border-t border-[#eee]"
                                          onClick={() => {
                                            setShowAddRefundDocModal(true);
                                            setRefundDropdownOpen(false);
                                          }}
                                        >
                                          + Add new option
                                        </div>
                                      </div>,
                                      document.body
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* List of added refund documents - Grouped by Type */}
                              {refundDocumentRows.length === 0 && (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No refund documents added yet. Select a refund document type from the dropdown above.
                                </p>
                              )}

                              {/* Group refund documents by type */}
                              {(() => {
                                const groupedRefunds = refundDocumentRows.reduce((acc, row) => {
                                  if (!acc[row.type]) acc[row.type] = [];
                                  acc[row.type].push(row);
                                  return acc;
                                }, {} as Record<string, typeof refundDocumentRows>);

                                return Object.entries(groupedRefunds).map(([refundType, rows]) => (
                                  <div key={refundType} className="mb-4">
                                    {/* Refund Document Type Header with Add Button */}
                                    <div className="flex items-center justify-between mb-3 bg-[#f0f0f0] px-4 py-2 rounded-t-lg border border-[#ddd]">
                                      <span className="text-xs font-bold text-[#333]">{refundType}</span>
                                      {isEditMode && (
                                        <button
                                          onClick={() => {
                                            const newRow = {
                                              id: `refund-${Date.now()}-${Math.random()}`,
                                              type: refundType,
                                              date: ''
                                            };
                                            setRefundDocumentRows(prev => [...prev, newRow]);
                                          }}
                                          className="flex items-center gap-1 text-xs text-[#1976d2] hover:underline font-semibold"
                                        >
                                          <Icon icon="mdi:plus-circle" width={14} height={14} />
                                          Add New Row
                                        </button>
                                      )}
                                    </div>

                                    {/* Refund Documents of this type */}
                                    <div className="space-y-2 border-l border-r border-b border-[#ddd] rounded-b-lg p-3 bg-white">
                                      {rows.map((row, index) => {
                                        const templateItemId = `${phase}-${doc.id}-${row.id}`;
                                        const uploadedDoc = getDocForItem(templateItemId);
                                        const isUploading = uploadingItemId === templateItemId;
                                        const hasFile = !!uploadedDoc;

                                        return (
                                          <div key={row.id} className="bg-[#fafafa] border border-[#e0e0e0] rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-3 flex-1">
                                                <span className="text-xs font-semibold text-[#555] min-w-[180px]">
                                                  {row.type} #{index + 1}
                                                </span>
                                                {/* Date Selector */}
                                                <div className="flex items-center gap-2">
                                                  <label className="text-xs text-[#555]">Date:</label>
                                                  <input
                                                    type="date"
                                                    value={row.date || ''}
                                                    onChange={(e) => {
                                                      const updatedRows = refundDocumentRows.map(r =>
                                                        r.id === row.id ? { ...r, date: e.target.value } : r
                                                      );
                                                      setRefundDocumentRows(updatedRows);
                                                    }}
                                                    className={`border border-[#ddd] rounded px-2 py-1 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    disabled={!isEditMode}
                                                  />
                                                </div>
                                              </div>
                                              {isEditMode && (
                                                <button
                                                  onClick={() => {
                                                    setRemoveRefundDocConfirmModal({
                                                      show: true,
                                                      refundDocId: row.id,
                                                      refundDocName: `${row.type} #${index + 1}`
                                                    });
                                                  }}
                                                  className="text-[#c62828] text-xs hover:underline"
                                                >
                                                  Remove
                                                </button>
                                              )}
                                            </div>

                                            {/* File upload section */}
                                            <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                              <span className="flex-1 text-xs text-[#333] font-medium">
                                                {row.type}
                                              </span>
                                              <div className="flex gap-1.5">
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                                  onClick={() => handleUploadClick(templateItemId)}
                                                  disabled={isUploading || !isEditMode}
                                                >
                                                  {isUploading ? (
                                                    <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                                  ) : (
                                                    <Icon icon="mdi:upload" width={14} height={14} />
                                                  )}
                                                </button>

                                                {hasFile && (
                                                  <>
                                                    <button
                                                      className="w-7 h-7 bg-[#1976d2] border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-80 text-white"
                                                      title="View Document"
                                                      onClick={() => setPreviewDoc(uploadedDoc)}
                                                    >
                                                      <Icon icon="mdi:eye" width={14} height={14} />
                                                    </button>
                                                    <button
                                                      className="w-7 h-7 bg-[#388e3c] border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-80 text-white"
                                                      title="Download Document"
                                                      onClick={() => handleDownload(uploadedDoc)}
                                                    >
                                                      <Icon icon="mdi:download" width={14} height={14} />
                                                    </button>
                                                    <button
                                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                      title={isEditMode ? "Delete Document" : "View mode - editing disabled"}
                                                      onClick={() => isEditMode && handleDeleteAll(templateItemId)}
                                                      disabled={!isEditMode}
                                                    >
                                                      <Icon icon="mdi:delete" width={14} height={14} />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ));
                              })()}

                              {/* Save Button */}
                              {refundDocumentRows.length > 0 && (
                                <div className="flex justify-end pt-4 border-t border-[#ddd]">
                                  <button
                                    onClick={() => saveDropdownData(
                                      { refundDocumentsOptions, refundDocumentRows },
                                      'Refund document data saved successfully!'
                                    )}
                                    disabled={savingData || !isEditMode}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                  >
                                    {savingData ? 'Saving...' : 'Save All'}
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

                // Communications - Single dropdown with Add New
                if (doc.label === 'Communications' && doc.type === 'dropdown') {
                  const defaultCommunicationTypes = ['Incoming', 'Outgoing'];
                  const isCustomCommunicationType = (type: string) => !defaultCommunicationTypes.includes(type);

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                            {communicationRows.length > 0 && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                {communicationRows.length} communication(s)
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              {/* Dropdown to add new communication */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-[#555]">Select Communication Type</span>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                  {/* Custom dropdown */}
                                  <div className="flex-1 relative">
                                    <button
                                      ref={communicationDropdownButtonRef}
                                      type="button"
                                      onClick={() => {
                                        if (!isEditMode) return;
                                        if (!communicationDropdownOpen) {
                                          const rect = communicationDropdownButtonRef.current?.getBoundingClientRect();
                                          if (rect) {
                                            setCommunicationDropdownPos({
                                              top: rect.top,
                                              left: rect.left,
                                              width: rect.width,
                                            });
                                          }
                                        }
                                        setCommunicationDropdownOpen(!communicationDropdownOpen);
                                      }}
                                      className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#aaa]'}`}
                                      disabled={!isEditMode}
                                    >
                                      <span className="text-[#999]">Select a communication type...</span>
                                      <Icon icon={communicationDropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} height={16} className="text-[#666]" />
                                    </button>

                                    {/* Dropdown menu */}
                                    {communicationDropdownOpen && typeof window !== 'undefined' && createPortal(
                                      <div
                                        ref={communicationDropdownRef}
                                        style={{
                                          position: 'fixed',
                                          top: communicationDropdownPos.top,
                                          left: communicationDropdownPos.left,
                                          width: communicationDropdownPos.width,
                                          transform: 'translateY(calc(-100% - 4px))',
                                          zIndex: 99999,
                                        }}
                                        className="bg-white border border-[#ddd] rounded shadow-lg max-h-[300px] overflow-y-auto"
                                      >
                                        {/* Communication type options */}
                                        {communicationTypes.map(type => (
                                          <div
                                            key={type}
                                            className="group px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-[#f5f5f5] text-[#333]"
                                            onClick={() => {
                                              // Add new row with this communication type
                                              const newRow = {
                                                id: `communication-${Date.now()}-${Math.random()}`,
                                                type: type,
                                                date: ''
                                              };
                                              setCommunicationRows(prev => [...prev, newRow]);
                                              setCommunicationDropdownOpen(false);
                                            }}
                                          >
                                            <span>{type}</span>
                                            {/* X button - only for custom types, visible on hover */}
                                            {isCustomCommunicationType(type) && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Remove "${type}" from available options?`)) {
                                                    const newTypes = communicationTypes.filter(t => t !== type);
                                                    setCommunicationTypes(newTypes);
                                                    saveDropdownData(
                                                      { communicationTypes: newTypes },
                                                      `Communication type "${type}" removed successfully!`
                                                    );
                                                  }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#c62828] hover:bg-[#ffebee] rounded transition-opacity"
                                                title={`Remove "${type}"`}
                                              >
                                                <Icon icon="mdi:close" width={14} height={14} />
                                              </button>
                                            )}
                                          </div>
                                        ))}

                                        {/* Add new option */}
                                        <div
                                          className="px-3 py-2 text-xs text-[#1976d2] font-semibold hover:bg-[#e3f2fd] cursor-pointer border-t border-[#eee]"
                                          onClick={() => {
                                            setShowAddCommunicationTypeModal(true);
                                            setCommunicationDropdownOpen(false);
                                          }}
                                        >
                                          + Add new option
                                        </div>
                                      </div>,
                                      document.body
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* List of added communications - Grouped by Type */}
                              {communicationRows.length === 0 && (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No communications added yet. Select a communication type from the dropdown above.
                                </p>
                              )}

                              {/* Group communications by type */}
                              {(() => {
                                const groupedComms = communicationRows.reduce((acc, row) => {
                                  if (!acc[row.type]) acc[row.type] = [];
                                  acc[row.type].push(row);
                                  return acc;
                                }, {} as Record<string, typeof communicationRows>);

                                return Object.entries(groupedComms).map(([commType, rows]) => (
                                  <div key={commType} className="mb-4">
                                    {/* Communication Type Header with Add Button */}
                                    <div className="flex items-center justify-between mb-3 bg-[#f0f0f0] px-4 py-2 rounded-t-lg border border-[#ddd]">
                                      <span className="text-xs font-bold text-[#333]">{commType}</span>
                                      {isEditMode && (
                                        <button
                                          onClick={() => {
                                            const newRow = {
                                              id: `communication-${Date.now()}-${Math.random()}`,
                                              type: commType,
                                              date: ''
                                            };
                                            setCommunicationRows(prev => [...prev, newRow]);
                                          }}
                                          className="flex items-center gap-1 text-xs text-[#1976d2] hover:underline font-semibold"
                                        >
                                          <Icon icon="mdi:plus-circle" width={14} height={14} />
                                          Add New Row
                                        </button>
                                      )}
                                    </div>

                                    {/* Communications of this type */}
                                    <div className="space-y-2 border-l border-r border-b border-[#ddd] rounded-b-lg p-3 bg-white">
                                      {rows.map((row, index) => {
                                        const templateItemId = `${phase}-${doc.id}-${row.id}`;
                                        const uploadedDoc = getDocForItem(templateItemId);
                                        const isUploading = uploadingItemId === templateItemId;
                                        const hasFile = !!uploadedDoc;

                                        return (
                                          <div key={row.id} className="bg-[#fafafa] border border-[#e0e0e0] rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-3 flex-1">
                                                <span className="text-xs font-semibold text-[#555] min-w-[180px]">
                                                  {row.type} #{index + 1}
                                                </span>
                                                {/* Date Selector */}
                                                <div className="flex items-center gap-2">
                                                  <label className="text-xs text-[#555]">Date:</label>
                                                  <input
                                                    type="date"
                                                    value={row.date || ''}
                                                    onChange={(e) => {
                                                      const updatedRows = communicationRows.map(r =>
                                                        r.id === row.id ? { ...r, date: e.target.value } : r
                                                      );
                                                      setCommunicationRows(updatedRows);
                                                    }}
                                                    className={`border border-[#ddd] rounded px-2 py-1 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    disabled={!isEditMode}
                                                  />
                                                </div>
                                              </div>
                                              {isEditMode && (
                                                <button
                                                  onClick={() => {
                                                    setRemoveCommunicationConfirmModal({
                                                      show: true,
                                                      communicationId: row.id,
                                                      communicationName: `${row.type} #${index + 1}`
                                                    });
                                                  }}
                                                  className="text-[#c62828] text-xs hover:underline"
                                                >
                                                  Remove
                                                </button>
                                              )}
                                            </div>

                                            {/* File upload section */}
                                            <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                              <span className="flex-1 text-xs text-[#333] font-medium">
                                                {row.type}
                                              </span>
                                              <div className="flex gap-1.5">
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                  title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                                  onClick={() => handleUploadClick(templateItemId)}
                                                  disabled={isUploading || !isEditMode}
                                                >
                                                  {isUploading ? (
                                                    <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                                  ) : (
                                                    <Icon icon="mdi:upload" width={14} height={14} />
                                                  )}
                                                </button>

                                                {hasFile && (
                                                  <>
                                                    <button
                                                      className="w-7 h-7 bg-[#1976d2] border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-80 text-white"
                                                      title="View Document"
                                                      onClick={() => setPreviewDoc(uploadedDoc)}
                                                    >
                                                      <Icon icon="mdi:eye" width={14} height={14} />
                                                    </button>
                                                    <button
                                                      className="w-7 h-7 bg-[#388e3c] border-none rounded-md flex items-center justify-center cursor-pointer transition-opacity duration-200 hover:opacity-80 text-white"
                                                      title="Download Document"
                                                      onClick={() => handleDownload(uploadedDoc)}
                                                    >
                                                      <Icon icon="mdi:download" width={14} height={14} />
                                                    </button>
                                                    <button
                                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                                      title={isEditMode ? "Delete Document" : "View mode - editing disabled"}
                                                      onClick={() => isEditMode && handleDeleteAll(templateItemId)}
                                                      disabled={!isEditMode}
                                                    >
                                                      <Icon icon="mdi:delete" width={14} height={14} />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ));
                              })()}

                              {/* Save Button */}
                              {communicationRows.length > 0 && (
                                <div className="flex justify-end pt-4 border-t border-[#ddd]">
                                  <button
                                    onClick={() => saveDropdownData(
                                      { communicationTypes, communicationRows },
                                      'Communication data saved successfully!'
                                    )}
                                    disabled={savingData || !isEditMode}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                  >
                                    {savingData ? 'Saving...' : 'Save All'}
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

                // Custom handler for Others dropdown with customizable options
                if (doc.label === 'Others' && doc.type === 'dropdown') {
                  const selectedOption = dropdownSelections[doc.id] || '';
                  const templateItemId = selectedOption ? `${phase}-${doc.id}-${selectedOption}` : '';
                  const uploadedDoc = selectedOption ? getDocForItem(templateItemId) : null;
                  const isUploading = uploadingItemId === templateItemId;
                  const hasFile = !!uploadedDoc;

                  // Determine which phase we're in and use appropriate state
                  const isInitiationPhase = phase === 'INITIATION';
                  const isMonitoringPhase = phase === 'MONITORING';
                  const currentOthersOptions = isInitiationPhase ? initiationOthersOptions : isMonitoringPhase ? monitoringOthersOptions : othersOptions;
                  const setCurrentOthersOptions = isInitiationPhase ? setInitiationOthersOptions : isMonitoringPhase ? setMonitoringOthersOptions : setOthersOptions;
                  const currentOthersDropdownOpen = isInitiationPhase ? initiationOthersDropdownOpen : isMonitoringPhase ? monitoringOthersDropdownOpen : othersDropdownOpen;
                  const setCurrentOthersDropdownOpen = isInitiationPhase ? setInitiationOthersDropdownOpen : isMonitoringPhase ? setMonitoringOthersDropdownOpen : setOthersDropdownOpen;
                  const currentOthersDropdownRef = isInitiationPhase ? initiationOthersDropdownRef : isMonitoringPhase ? monitoringOthersDropdownRef : othersDropdownRef;
                  const setCurrentShowAddOthersModal = isInitiationPhase ? setShowAddInitiationOthersModal : isMonitoringPhase ? setShowAddMonitoringOthersModal : setShowAddOthersModal;
                  const setCurrentOthersOptionToRemove = isInitiationPhase ? setInitiationOthersOptionToRemove : isMonitoringPhase ? setMonitoringOthersOptionToRemove : setOthersOptionToRemove;
                  const setCurrentShowRemoveOthersModal = isInitiationPhase ? setShowRemoveInitiationOthersModal : isMonitoringPhase ? setShowRemoveMonitoringOthersModal : setShowRemoveOthersModal;

                  // Default options that cannot be removed
                  const defaultOthersOptions = isInitiationPhase
                    ? ['Media Documentation']
                    : isMonitoringPhase
                    ? ['Media Documentation']
                    : ['Withdrawal Request', 'Withdrawal Approval', 'Photo(s) During Implementation'];

                  // Check if an option is custom (not default)
                  const isCustomOption = (opt: string) => !defaultOthersOptions.includes(opt);

                  // Remove option handler - shows confirmation modal
                  const removeOthersOption = (optToRemove: string) => {
                    setCurrentOthersOptionToRemove(optToRemove);
                    setCurrentShowRemoveOthersModal(true);
                    setCurrentOthersDropdownOpen(false);
                  };

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                                {/* Custom dropdown with X button on hover for custom options */}
                                <div className="flex-1 relative" ref={currentOthersDropdownRef}>
                                  <button
                                    type="button"
                                    onClick={() => isEditMode && setCurrentOthersDropdownOpen(!currentOthersDropdownOpen)}
                                    className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#aaa]'}`}
                                    disabled={!isEditMode}
                                  >
                                    <span className={selectedOption ? 'text-[#333]' : 'text-[#999]'}>
                                      {selectedOption || 'Select option...'}
                                    </span>
                                    <Icon icon={currentOthersDropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} height={16} className="text-[#666]" />
                                  </button>

                                  {/* Dropdown menu */}
                                  {currentOthersDropdownOpen && (
                                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-[#ddd] rounded shadow-lg z-[9999] max-h-[200px] overflow-y-auto">
                                      {/* Empty option */}
                                      <div
                                        className="px-3 py-2 text-xs text-[#999] hover:bg-[#f5f5f5] cursor-pointer"
                                        onClick={() => {
                                          setDropdownSelections(prev => ({ ...prev, [doc.id]: '' }));
                                          setCurrentOthersDropdownOpen(false);
                                        }}
                                      >
                                        Select option...
                                      </div>

                                      {/* Options */}
                                      {currentOthersOptions.map(opt => (
                                        <div
                                          key={opt}
                                          className={`group px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-[#f5f5f5] ${selectedOption === opt ? 'bg-[#fffff] text-[#2e7d32] font-semibold' : 'text-[#333]'}`}
                                          onClick={() => {
                                            setDropdownSelections(prev => ({ ...prev, [doc.id]: opt }));
                                            setCurrentOthersDropdownOpen(false);
                                          }}
                                        >
                                          <span>{opt}</span>
                                          {/* X button - only for custom options, visible on hover */}
                                          {isCustomOption(opt) && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeOthersOption(opt);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#c62828] hover:bg-[#ffebee] rounded transition-opacity"
                                              title={`Remove "${opt}"`}
                                            >
                                              <Icon icon="mdi:close" width={14} height={14} />
                                            </button>
                                          )}
                                        </div>
                                      ))}

                                      {/* Add new option */}
                                      <div
                                        className="px-3 py-2 text-xs text-[#1976d2] font-semibold hover:bg-[#e3f2fd] cursor-pointer border-t border-[#eee]"
                                        onClick={() => {
                                          setCurrentShowAddOthersModal(true);
                                          setCurrentOthersDropdownOpen(false);
                                        }}
                                      >
                                        + Add new option
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleSaveDropdownSelection(doc.id)}
                                  disabled={!selectedOption || savingData || !isEditMode}
                                  className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                                >
                                  {savingData ? 'Saving...' : 'Save'}
                                </button>
                              </div>

                              {selectedOption && (
                                <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333] font-medium">{selectedOption}</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(templateItemId)}
                                      disabled={isUploading || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile || !isEditMode}
                                    >
                                      <Icon icon="mdi:delete-outline" width={14} height={14} />
                                    </button>
                                  </div>
                                  {hasFile && (
                                    <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Management Reports - Single dropdown with Add New
                if (doc.label === 'Management Reports' && doc.type === 'dropdown') {
                  const defaultReportTypes = [
                    'Liquidation Report',
                    'Completion Report',
                    'Terminal or Graduation Report',
                    'Termination Report',
                    'Demand Letters',
                    'Media Documentation'
                  ];

                  const isCustomReportType = (type: string) => !defaultReportTypes.includes(type);

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => toggleDropdown(key)}
                          >
                            <Icon icon={isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                            <span>{doc.label}</span>
                            {managementReportRows.length > 0 && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                {managementReportRows.length} report(s)
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              {/* Dropdown to add new report */}
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-semibold text-[#555]">Select Report Type</span>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                  {/* Custom dropdown */}
                                  <div className="flex-1 relative" ref={managementReportDropdownRef}>
                                    <button
                                      type="button"
                                      onClick={() => isEditMode && setManagementReportDropdownOpen(!managementReportDropdownOpen)}
                                      className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-[#aaa]'}`}
                                      disabled={!isEditMode}
                                    >
                                      <span className="text-[#999]">Select a report type...</span>
                                      <Icon icon={managementReportDropdownOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} width={16} height={16} className="text-[#666]" />
                                    </button>

                                    {/* Dropdown menu */}
                                    {managementReportDropdownOpen && (
                                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ddd] rounded shadow-lg z-[9999] max-h-[300px] overflow-y-auto">
                                        {/* Report type options */}
                                        {managementReportTypes.map(type => (
                                          <div
                                            key={type}
                                            className="group px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-[#f5f5f5] text-[#333]"
                                            onClick={() => {
                                              // Add new row with this report type
                                              const newRow = {
                                                id: `management-${Date.now()}-${Math.random()}`,
                                                type: type,
                                                date: ''
                                              };
                                              setManagementReportRows(prev => [...prev, newRow]);
                                              setManagementReportDropdownOpen(false);
                                            }}
                                          >
                                            <span>{type}</span>
                                            {/* X button - only for custom types, visible on hover */}
                                            {isCustomReportType(type) && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Remove "${type}" from available options?`)) {
                                                    const newTypes = managementReportTypes.filter(t => t !== type);
                                                    setManagementReportTypes(newTypes);
                                                    saveDropdownData(
                                                      { managementReportTypes: newTypes },
                                                      `Report type "${type}" removed successfully!`
                                                    );
                                                  }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#c62828] hover:bg-[#ffebee] rounded transition-opacity"
                                                title={`Remove "${type}"`}
                                              >
                                                <Icon icon="mdi:close" width={14} height={14} />
                                              </button>
                                            )}
                                          </div>
                                        ))}

                                        {/* Add new report type */}
                                        <div
                                          className="px-3 py-2 text-xs text-[#1976d2] font-semibold hover:bg-[#e3f2fd] cursor-pointer border-t border-[#eee]"
                                          onClick={() => {
                                            setShowAddManagementReportTypeModal(true);
                                            setManagementReportDropdownOpen(false);
                                          }}
                                        >
                                          + Add new report type
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* List of added reports - Grouped by Type */}
                              {managementReportRows.length === 0 && (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No reports added yet. Select a report type from the dropdown above.
                                </p>
                              )}

                              {/* Group reports by type */}
                              {(() => {
                                const groupedReports = managementReportRows.reduce((acc, row) => {
                                  if (!acc[row.type]) acc[row.type] = [];
                                  acc[row.type].push(row);
                                  return acc;
                                }, {} as Record<string, typeof managementReportRows>);

                                return Object.entries(groupedReports).map(([reportType, rows]) => (
                                  <div key={reportType} className="mb-4">
                                    {/* Report Type Header with Add Button */}
                                    <div className="flex items-center justify-between mb-3 bg-[#f0f0f0] px-4 py-2 rounded-t-lg border border-[#ddd]">
                                      <span className="text-xs font-bold text-[#333]">{reportType}</span>
                                      {isEditMode && (
                                        <button
                                          onClick={() => {
                                            const newRow = {
                                              id: `management-${Date.now()}-${Math.random()}`,
                                              type: reportType,
                                              date: ''
                                            };
                                            setManagementReportRows(prev => [...prev, newRow]);
                                          }}
                                          className="flex items-center gap-1 text-xs text-[#1976d2] hover:underline font-semibold"
                                        >
                                          <Icon icon="mdi:plus-circle" width={14} height={14} />
                                          Add New Report
                                        </button>
                                      )}
                                    </div>

                                    {/* Reports of this type */}
                                    <div className="space-y-2 border-l border-r border-b border-[#ddd] rounded-b-lg p-3 bg-white">
                                      {rows.map((row, index) => {
                                        const templateItemId = `${phase}-${doc.id}-${row.id}`;
                                        const uploadedDoc = getDocForItem(templateItemId);
                                        const isUploading = uploadingItemId === templateItemId;
                                        const hasFile = !!uploadedDoc;

                                        return (
                                          <div key={row.id} className="bg-[#fafafa] border border-[#e0e0e0] rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-3 flex-1">
                                                <span className="text-xs font-semibold text-[#555] min-w-[180px]">
                                                  {row.type} #{index + 1}
                                                </span>
                                                {/* Date Selector */}
                                                <div className="flex items-center gap-2">
                                                  <label className="text-xs text-[#555]">Date:</label>
                                                  <input
                                                    type="date"
                                                    value={row.date || ''}
                                                    onChange={(e) => {
                                                      const updatedRows = managementReportRows.map(r =>
                                                        r.id === row.id ? { ...r, date: e.target.value } : r
                                                      );
                                                      setManagementReportRows(updatedRows);
                                                    }}
                                                    className={`border border-[#ddd] rounded px-2 py-1 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    disabled={!isEditMode}
                                                  />
                                                </div>
                                              </div>
                                              {isEditMode && (
                                                <button
                                                  onClick={() => {
                                                    setRemoveReportConfirmModal({
                                                      show: true,
                                                      reportId: row.id,
                                                      reportName: `${row.type} #${index + 1}`
                                                    });
                                                  }}
                                                  className="text-[#c62828] text-xs hover:underline"
                                                >
                                                  Remove
                                                </button>
                                              )}
                                            </div>

                                            {/* File upload section */}
                                            <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                              <span className="flex-1 text-xs text-[#333]">
                                                {row.type} {row.date && `(${new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`}
                                              </span>
                                              <div className="flex gap-1.5">
                                                <button
                                                  className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                  title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                                  onClick={() => handleUploadClick(templateItemId)}
                                                  disabled={isUploading || !isEditMode}
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
                                                    hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                                  }`}
                                                  title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                                  onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                                  disabled={!hasFile || !isEditMode}
                                                >
                                                  <Icon icon="mdi:delete-outline" width={14} height={14} />
                                                </button>
                                              </div>
                                              {hasFile && (
                                                <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ));
                              })()}

                              {/* Save button */}
                              {managementReportRows.length > 0 && (
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => setSaveReportsConfirmModal(true)}
                                    disabled={savingData || !isEditMode}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
                                  >
                                    {savingData ? 'Saving...' : 'Save All'}
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

                // Generic select-based dropdown for Pre-Project Information Sheet (PIS)
                const selectBasedDropdowns = [
                  'Pre-Project Information Sheet (PIS)'
                ];

                if (selectBasedDropdowns.includes(doc.label) && doc.options) {
                  const selectedOption = dropdownSelections[doc.id] || '';
                  const templateItemId = selectedOption ? `${phase}-${doc.id}-${selectedOption}` : '';
                  const uploadedDoc = selectedOption ? getDocForItem(templateItemId) : null;
                  const isUploading = uploadingItemId === templateItemId;
                  const hasFile = !!uploadedDoc;

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                                <select
                                  value={selectedOption}
                                  onChange={(e) => {
                                    setDropdownSelections(prev => ({ ...prev, [doc.id]: e.target.value }));
                                  }}
                                  className={`border border-[#ddd] rounded px-3 py-2 text-xs flex-1 ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  disabled={!isEditMode}
                                >
                                  <option value="">Select option...</option>
                                  {doc.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleSaveDropdownSelection(doc.id)}
                                  disabled={!selectedOption || savingData || !isEditMode}
                                  className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors"
                                >
                                  {savingData ? 'Saving...' : 'Save'}
                                </button>
                              </div>

                              {selectedOption && (
                                <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333] font-medium">{selectedOption}</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(templateItemId)}
                                      disabled={isUploading || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(templateItemId)}
                                      disabled={!hasFile || !isEditMode}
                                    >
                                      <Icon icon="mdi:delete-outline" width={14} height={14} />
                                    </button>
                                  </div>
                                  {hasFile && (
                                    <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Internal Evaluation and External Evaluation dropdown handler
                if (doc.label === 'Internal Evaluation' || doc.label === 'External Evaluation') {
                  const isInternal = doc.label === 'Internal Evaluation';
                  const evalRows = isInternal ? internalEvalRows : externalEvalRows;
                  const setEvalRows = isInternal ? setInternalEvalRows : setExternalEvalRows;

                  return (
                    <React.Fragment key={key}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
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
                            <div className="space-y-4">
                              {evalRows.map((row, rowIdx) => {
                                const pptTid = `${phase}-${doc.id}-ppt-${rowIdx}`;
                                const complianceTid = `${phase}-${doc.id}-compliance-${rowIdx}`;
                                const pptDoc = getDocForItem(pptTid);
                                const complianceDoc = getDocForItem(complianceTid);
                                const hasPptFile = !!pptDoc;
                                const hasComplianceFile = !!complianceDoc;
                                const isPptUploading = uploadingItemId === pptTid;
                                const isComplianceUploading = uploadingItemId === complianceTid;

                                return (
                                  <div key={rowIdx} className="bg-white border border-[#ddd] rounded p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-[#333]">Evaluation {rowIdx + 1}</span>
                                      {evalRows.length > 1 && isEditMode && (
                                        <button
                                          onClick={() => {
                                            const newRows = evalRows.filter((_, i) => i !== rowIdx);
                                            setEvalRows(newRows);
                                          }}
                                          className="text-[#c62828] text-xs hover:underline"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>

                                    {/* Date input */}
                                    <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333]">Date</span>
                                      <input
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => {
                                          const newRows = [...evalRows];
                                          newRows[rowIdx] = { ...newRows[rowIdx], date: e.target.value };
                                          setEvalRows(newRows);
                                        }}
                                        className={`border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={!isEditMode}
                                      />
                                    </div>

                                    {/* PPT Presentation row */}
                                    <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333]">PPT Presentation</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                          onClick={() => handleUploadClick(pptTid)}
                                          disabled={isPptUploading || !isEditMode}
                                        >
                                          {isPptUploading ? (
                                            <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                          ) : (
                                            <Icon icon="mdi:upload" width={14} height={14} />
                                          )}
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasPptFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="View"
                                          onClick={() => hasPptFile && setPreviewDoc(pptDoc)}
                                          disabled={!hasPptFile}
                                        >
                                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasPptFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                          onClick={() => hasPptFile && isEditMode && handleDeleteAll(pptTid)}
                                          disabled={!hasPptFile || !isEditMode}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                      </div>
                                      {hasPptFile && (
                                        <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                      )}
                                    </div>

                                    {/* Compliance Report row */}
                                    <div className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                      <span className="flex-1 text-xs text-[#333]">Compliance Report</span>
                                      <div className="flex gap-1.5">
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                          title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                          onClick={() => handleUploadClick(complianceTid)}
                                          disabled={isComplianceUploading || !isEditMode}
                                        >
                                          {isComplianceUploading ? (
                                            <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                                          ) : (
                                            <Icon icon="mdi:upload" width={14} height={14} />
                                          )}
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasComplianceFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title="View"
                                          onClick={() => hasComplianceFile && setPreviewDoc(complianceDoc)}
                                          disabled={!hasComplianceFile}
                                        >
                                          <Icon icon="mdi:eye-outline" width={14} height={14} />
                                        </button>
                                        <button
                                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                                            hasComplianceFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                          }`}
                                          title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                          onClick={() => hasComplianceFile && isEditMode && handleDeleteAll(complianceTid)}
                                          disabled={!hasComplianceFile || !isEditMode}
                                        >
                                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                                        </button>
                                      </div>
                                      {hasComplianceFile && (
                                        <span className="text-[10px] text-[#2e7d32] bg-[#fffff] px-2 py-0.5 rounded">Uploaded</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="flex gap-3">
                                {isEditMode && (
                                  <button
                                    onClick={() => {
                                      setEvalRows([...evalRows, { date: '' }]);
                                    }}
                                    className="text-xs text-[#2e7d32] hover:underline flex items-center gap-1"
                                  >
                                    <Icon icon="mdi:plus" width={14} height={14} />
                                    Add Evaluation Row
                                  </button>
                                )}
                                <button
                                  onClick={async () => {
                                    setSavingData(true);
                                    try {
                                      const evalKey = isInternal ? 'internalEvalRows' : 'externalEvalRows';
                                      const mergedData = {
                                        ...currentDropdownData,
                                        [evalKey]: evalRows,
                                      };
                                      setCurrentDropdownData(mergedData);

                                      const response = await fetch(`/api/setup-projects/${projectId}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ dropdownData: mergedData }),
                                      });

                                      if (!response.ok) throw new Error('Failed to save');

                                      setSaveSuccessModal({ show: true, message: `${doc.label} saved successfully!` });
                                    } catch (error) {
                                      console.error('Error saving evaluation data:', error);
                                      alert('Failed to save evaluation data');
                                    } finally {
                                      setSavingData(false);
                                    }
                                  }}
                                  disabled={savingData || !isEditMode}
                                  className="bg-[#2e7d32] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed transition-colors ml-auto"
                                >
                                  {savingData ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }

                // Default dropdown (with options)
                return (
                  <React.Fragment key={key}>
                    <tr>
                      <td colSpan={5} className="p-0 border-b border-[#eee]">
                        <button
                          className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                          onClick={() => toggleDropdown(key)}
                        >
                          <Icon icon={expandedDropdowns[key] ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                          <span>{doc.label}</span>
                        </button>
                      </td>
                    </tr>
                    {expandedDropdowns[key] && doc.options && (
                      <tr>
                        <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                          <div className="space-y-2">
                            {doc.options.map((option, optIdx) => {
                              const tid = `${phase}-${doc.id}-${optIdx}`;
                              const uploadedDoc = getDocForItem(tid);
                              const hasFile = !!uploadedDoc;
                              const isUploading = uploadingItemId === tid;

                              return (
                                <div key={optIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                  <span className="flex-1 text-xs text-[#333]">{option}</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                      onClick={() => handleUploadClick(tid)}
                                      disabled={isUploading || !isEditMode}
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
                                        hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                                      }`}
                                      title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                      onClick={() => hasFile && isEditMode && handleDeleteAll(tid)}
                                      disabled={!hasFile || !isEditMode}
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

              // ── Accepted Liquidation with date ──
              if (doc.label === 'Accepted Liquidation') {
                itemCounter++;
                const tid = `${phase}-${doc.id}`;
                const allDocs = getDocsForItem(tid);
                const latest = allDocs[0];
                const isUploading = uploadingItemId === tid;
                const hasFile = allDocs.length > 0;

                elements.push(
                  <tr key={`${title}-${doc.id}-${idx}`}>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                      <div className="flex items-center gap-3">
                        <span>{doc.label}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-[#666]">Date:</label>
                          <input
                            type="date"
                            value={acceptedLiquidationDate}
                            onChange={(e) => setAcceptedLiquidationDate(e.target.value)}
                            className={`border border-[#ddd] rounded px-2 py-1 text-xs ${!isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={!isEditMode}
                          />
                          <button
                            onClick={async () => {
                              setSavingData(true);
                              try {
                                const mergedData = { ...currentDropdownData, acceptedLiquidationDate };
                                setCurrentDropdownData(mergedData);
                                await fetch(`/api/setup-projects/${projectId}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ dropdownData: mergedData }),
                                });
                                setSaveSuccessModal({ show: true, message: 'Date saved successfully!' });
                              } catch (error) {
                                console.error('Error saving date:', error);
                              } finally {
                                setSavingData(false);
                              }
                            }}
                            disabled={savingData || !isEditMode}
                            className="bg-[#2e7d32] text-white px-2 py-1 rounded text-[10px] font-semibold hover:bg-[#1b5e20] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                          >
                            {savingData ? '...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      {hasFile ? (
                        <span className="text-[10px] text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded">Uploaded</span>
                      ) : (
                        <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                      {hasFile ? new Date(latest.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      <div className="flex gap-1.5">
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isEditMode ? "Upload" : "View mode - editing disabled"}
                          onClick={() => handleUploadClick(tid)}
                          disabled={isUploading || !isEditMode}
                        >
                          {isUploading ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" /> : <Icon icon="mdi:upload" width={14} height={14} />}
                        </button>
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                          title={isEditMode ? "Delete" : "View mode - editing disabled"}
                          onClick={() => hasFile && isEditMode && handleDeleteAll(tid)}
                          disabled={!hasFile || !isEditMode}
                        >
                          <Icon icon="mdi:delete-outline" width={14} height={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );

                // Check if this is the last item before a section or the last doc
                if (isLastBeforeSection || isLastDoc) {
                  elements.push(...renderSectionCustomRows(currentSectionLabel, `end-${idx}`));
                }

                return elements;
              }

              // ── Regular item row ──
              itemCounter++;
              const tid = `${phase}-${doc.id}`;
              const allDocs = getDocsForItem(tid);
              const latest = allDocs[0];
              const isUploading = uploadingItemId === tid;
              const hasFile = allDocs.length > 0;

              elements.push(
                <tr key={`${title}-${doc.id}-${idx}`}>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{itemCounter}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">{doc.label}</td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    {hasFile ? (() => {
                      const visibleDocs = allDocs.slice(0, 3);
                      const hasMore = allDocs.length > 3;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {visibleDocs.map((d) => {
                            const ext = d.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                            const extColor = ext === 'PDF' ? '#e53935' : ext === 'DOCX' || ext === 'DOC' ? '#1565c0' : ext === 'XLSX' || ext === 'XLS' ? '#2e7d32' : ext === 'PNG' || ext === 'JPG' || ext === 'JPEG' ? '#f57c00' : '#607d8b';
                            return (
                              <div
                                key={d.id}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f7fa', border: '1px solid #e0e0e0', borderRadius: '5px', padding: '2px 4px 2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}
                              >
                                <button
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); setPreviewDoc(d); }}
                                  title={`View ${d.fileName}`}
                                >
                                  <span style={{ flexShrink: 0, fontSize: '7px', fontWeight: 700, color: '#fff', padding: '1px 3px', borderRadius: '2px', backgroundColor: extColor }}>{ext}</span>
                                  <span style={{ fontSize: '10px', color: '#333', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.fileName}</span>
                                </button>
                                {isEditMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteSingle(d.id, d.fileName); }}
                                    title={`Delete ${d.fileName}`}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '14px', height: '14px', borderRadius: '50%', background: '#e0e0e0', border: 'none', cursor: 'pointer', padding: 0, marginLeft: '2px', transition: 'background 0.15s' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#c62828')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                                  >
                                    <Icon icon="mdi:close" width={10} height={10} style={{ color: '#666' }} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {hasMore && (
                            <button
                              onClick={() => setFileListModal(tid)}
                              title={`Show all ${allDocs.length} files`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e0e0e0', border: 'none', borderRadius: '5px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 700, color: '#555', flexShrink: 0, whiteSpace: 'nowrap' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#ccc')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#e0e0e0')}
                            >
                              +{allDocs.length - 3}
                            </button>
                          )}
                        </div>
                      );
                    })() : (
                      <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                    {hasFile?new Date(latest.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'—'}
                  </td>
                  <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                    <div className="flex gap-1.5">
                      <button
                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                          isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title={isEditMode ? "Upload" : "View mode - editing disabled"}
                        onClick={() => handleUploadClick(tid)}
                        disabled={isUploading || !isEditMode}
                      >
                        {isUploading ? (
                          <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                        ) : (
                          <Icon icon="mdi:upload" width={14} height={14} />
                        )}
                      </button>
                      <button
                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                          hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'
                        }`}
                        title={isEditMode ? "Delete" : "View mode - editing disabled"}
                        onClick={() => hasFile && isEditMode && handleDeleteAll(tid)}
                        disabled={!hasFile || !isEditMode}
                      >
                        <Icon icon="mdi:delete-outline" width={14} height={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );

              // If this is the last item before a section or the last doc, add custom rows for current section
              if (isLastBeforeSection || isLastDoc) {
                elements.push(...renderSectionCustomRows(currentSectionLabel, `end-${idx}`));
              }

              return elements;
            })}

            {/* Render custom rows added via external "Add New Row" button with sectionLabel matching title */}
            {(() => {
              const titleCustomRows = customRows.filter(r => r.sectionLabel === title);
              let counter = docs.length;
              return titleCustomRows.map((customRow) => {
                counter++;
                const tid = `${phase}-custom-${customRow.id}`;
                const rowDocs = getDocsForItem(tid);
                const latestDoc = rowDocs[0];
                const isRowUploading = uploadingItemId === tid;
                const hasFile = rowDocs.length > 0;
                const isFileDragOver = fileDragOverRowId === tid;
                const dropdownKey = `custom-dropdown-${customRow.id}`;

                if (customRow.rowType === 'item') {
                  return (
                    <tr
                      key={`title-custom-${customRow.id}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.types.includes('Files') && isEditMode) {
                          setFileDragOverRowId(tid);
                        }
                      }}
                      onDragLeave={() => setFileDragOverRowId(null)}
                      onDrop={(e) => {
                        if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
                          handleFileDrop(e, tid);
                        }
                      }}
                      className={`transition-all duration-150 ${isFileDragOver ? 'bg-[#e8f5e9]' : ''}`}
                    >
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">{counter}</td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                        <div className="flex items-center gap-2">
                          {customRow.name}
                          {isAssigneeEditMode && (
                            <>
                              <button
                                onClick={() => setShowEditRowModal({ show: true, rowId: customRow.id, currentName: customRow.name, rowType: customRow.rowType, dropdownOptions: customRow.dropdownOptions })}
                                className="text-[#1976d2] hover:underline text-[10px]"
                              >
                                (edit)
                              </button>
                              <button onClick={() => setRemoveCustomRowConfirmModal({ show: true, rowId: customRow.id, rowName: customRow.name })} className="text-[#c62828] hover:underline text-[10px]">(remove)</button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                        {hasFile ? renderFileChips(tid) : <span className="text-[#bbb] italic text-xs">No file uploaded</span>}
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                        {hasFile ? new Date(latestDoc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                        <div className="flex gap-1.5">
                          <button className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`} title={isEditMode ? "Upload" : "View mode - editing disabled"} onClick={() => handleUploadClick(tid)} disabled={isRowUploading || !isEditMode}>
                            {isRowUploading ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" /> : <Icon icon="mdi:upload" width={14} height={14} />}
                          </button>
                          <button className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${hasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`} title={isEditMode ? "Delete" : "View mode - editing disabled"} onClick={() => hasFile && isEditMode && handleDeleteAll(tid)} disabled={!hasFile || !isEditMode}>
                            <Icon icon="mdi:delete-outline" width={14} height={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                } else if (customRow.rowType === 'dropdown') {
                  const options = customRow.dropdownOptions || [];

                  return (
                    <React.Fragment key={`title-custom-${customRow.id}`}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <div className="flex items-center">
                            <button
                              className="flex items-center gap-1.5 bg-[#fffff] border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer flex-1 transition-colors duration-200 hover:bg-[#c8e6c9]"
                              onClick={() => toggleDropdown(dropdownKey)}
                            >
                              <Icon icon={expandedDropdowns[dropdownKey] ? 'mdi:chevron-down' : 'mdi:chevron-right'} width={18} height={18} />
                              <span>{customRow.name}</span>
                            </button>
                            {isAssigneeEditMode && (
                              <div className="flex items-center gap-2 pr-3">
                                <button
                                  onClick={() => {
                                    setShowEditRowModal({ show: true, rowId: customRow.id, currentName: customRow.name, rowType: customRow.rowType, dropdownOptions: customRow.dropdownOptions });
                                    setEditRowName(customRow.name);
                                    setEditRowOptions(customRow.dropdownOptions?.join(', ') || '');
                                  }}
                                  className="text-[#1976d2] hover:underline text-[10px]"
                                >
                                  (edit)
                                </button>
                                <button onClick={() => setRemoveCustomRowConfirmModal({ show: true, rowId: customRow.id, rowName: customRow.name })} className="text-[#c62828] hover:underline text-[10px]">(remove)</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedDropdowns[dropdownKey] && options.length > 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-2">
                              {options.map((option, optIdx) => {
                                const optTid = `${phase}-custom-${customRow.id}-opt-${option.replace(/\s+/g, '-').toLowerCase()}`;
                                const optDocs = getDocsForItem(optTid);
                                const optHasFile = optDocs.length > 0;
                                const isOptUploading = uploadingItemId === optTid;

                                return (
                                  <div key={optIdx} className="flex items-center gap-3 bg-white border border-[#ddd] rounded p-3">
                                    <span className="flex-1 text-xs text-[#333]">{option}</span>
                                    {optHasFile && renderFileChips(optTid)}
                                    <div className="flex gap-1.5">
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? 'bg-[#f5a623] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={isEditMode ? "Upload" : "View mode - editing disabled"}
                                        onClick={() => handleUploadClick(optTid)}
                                        disabled={isOptUploading || !isEditMode}
                                      >
                                        {isOptUploading ? <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" /> : <Icon icon="mdi:upload" width={14} height={14} />}
                                      </button>
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${optHasFile ? 'bg-[#2e7d32] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                        title="View"
                                        onClick={() => optHasFile && optDocs[0] && setPreviewDoc(optDocs[0])}
                                        disabled={!optHasFile}
                                      >
                                        <Icon icon="mdi:eye-outline" width={14} height={14} />
                                      </button>
                                      <button
                                        className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${optHasFile && isEditMode ? 'bg-[#c62828] cursor-pointer hover:opacity-80' : 'bg-[#ccc] cursor-not-allowed'}`}
                                        title={isEditMode ? "Delete" : "View mode - editing disabled"}
                                        onClick={() => optHasFile && isEditMode && handleDeleteAll(optTid)}
                                        disabled={!optHasFile || !isEditMode}
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
                      {expandedDropdowns[dropdownKey] && options.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <p className="text-xs text-[#999] italic text-center">No options configured. {isAssigneeEditMode && 'Click (edit) to add options.'}</p>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }
                return null;
              });
            })()}

          </tbody>
        </table>

        {/* Add New Row Button - Only visible in Assignee Edit Mode */}
        {isAssigneeEditMode && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAddRowModal({ show: true, sectionLabel: title })}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#e8f5e9] text-[#2e7d32] border-2 border-dashed border-[#2e7d32] rounded-lg text-sm font-semibold hover:bg-[#c8e6c9] transition-colors"
            >
              <Icon icon="mdi:plus-circle-outline" width={20} height={20} />
              Add New Row
            </button>
          </div>
        )}
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
          <div className="w-14 h-14 rounded-full bg-[#fffff] flex items-center justify-center mx-auto mb-4"><Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32"/></div>
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

    {/* Save Success Modal */}
    {saveSuccessModal?.show && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setSaveSuccessModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#fffff] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Saved Successfully!</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">{saveSuccessModal.message}</p>
          <button
            className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1b5e20]"
            onClick={() => setSaveSuccessModal(null)}
          >
            Okay
          </button>
        </div>
      </div>
    )}

    {/* Add New Type Modal */}
    {showAddTypeModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Type Option</h3>
          <input
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            placeholder="Enter type name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddTypeModal(false); setNewTypeName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newTypeName.trim() && !abstractQuotationTypeOptions.includes(newTypeName.trim())) {
                  const updated = [...abstractQuotationTypeOptions, newTypeName.trim()];
                  setAbstractQuotationTypeOptions(updated);
                  saveDropdownData(
                    { abstractQuotationTypeOptions: updated },
                    `Type "${newTypeName.trim()}" added successfully!`
                  );
                } else if (abstractQuotationTypeOptions.includes(newTypeName.trim())) {
                  alert('This type already exists!');
                  return;
                }
                setShowAddTypeModal(false);
                setNewTypeName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Status Modal */}
    {showAddStatusModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Status Option</h3>
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            placeholder="Enter status name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddStatusModal(false); setNewStatusName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newStatusName.trim() && !interventionStatusOptions.includes(newStatusName.trim())) {
                  const updated = [...interventionStatusOptions, newStatusName.trim()];
                  setInterventionStatusOptions(updated);
                  saveDropdownData(
                    { interventionStatusOptions: updated },
                    `Status "${newStatusName.trim()}" added successfully!`
                  );
                } else if (interventionStatusOptions.includes(newStatusName.trim())) {
                  alert('This status already exists!');
                  return;
                }
                setShowAddStatusModal(false);
                setNewStatusName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Others Option Modal */}
    {showAddOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Option</h3>
          <input
            type="text"
            value={newOthersName}
            onChange={(e) => setNewOthersName(e.target.value)}
            placeholder="Enter option name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddOthersModal(false); setNewOthersName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newOthersName.trim() && !othersOptions.includes(newOthersName.trim())) {
                  const updated = [...othersOptions, newOthersName.trim()];
                  setOthersOptions(updated);
                  saveDropdownData(
                    { othersOptions: updated },
                    `Option "${newOthersName.trim()}" added successfully!`
                  );
                } else if (othersOptions.includes(newOthersName.trim())) {
                  alert('This option already exists!');
                  return;
                }
                setShowAddOthersModal(false);
                setNewOthersName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Initiation Others Option Modal */}
    {showAddInitiationOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Option</h3>
          <input
            type="text"
            value={newInitiationOthersName}
            onChange={(e) => setNewInitiationOthersName(e.target.value)}
            placeholder="Enter option name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddInitiationOthersModal(false); setNewInitiationOthersName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newInitiationOthersName.trim() && !initiationOthersOptions.includes(newInitiationOthersName.trim())) {
                  const updated = [...initiationOthersOptions, newInitiationOthersName.trim()];
                  setInitiationOthersOptions(updated);
                  saveDropdownData(
                    { initiationOthersOptions: updated },
                    `Option "${newInitiationOthersName.trim()}" added successfully!`
                  );
                } else if (initiationOthersOptions.includes(newInitiationOthersName.trim())) {
                  alert('This option already exists!');
                  return;
                }
                setShowAddInitiationOthersModal(false);
                setNewInitiationOthersName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Monitoring Others Option Modal */}
    {showAddMonitoringOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Option</h3>
          <input
            type="text"
            value={newMonitoringOthersName}
            onChange={(e) => setNewMonitoringOthersName(e.target.value)}
            placeholder="Enter option name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddMonitoringOthersModal(false); setNewMonitoringOthersName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newMonitoringOthersName.trim() && !monitoringOthersOptions.includes(newMonitoringOthersName.trim())) {
                  const updated = [...monitoringOthersOptions, newMonitoringOthersName.trim()];
                  setMonitoringOthersOptions(updated);
                  saveDropdownData(
                    { monitoringOthersOptions: updated },
                    `Option "${newMonitoringOthersName.trim()}" added successfully!`
                  );
                } else if (monitoringOthersOptions.includes(newMonitoringOthersName.trim())) {
                  alert('This option already exists!');
                  return;
                }
                setShowAddMonitoringOthersModal(false);
                setNewMonitoringOthersName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Communication Type Modal */}
    {showAddCommunicationTypeModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Communication Type</h3>
          <input
            type="text"
            value={newCommunicationType}
            onChange={(e) => setNewCommunicationType(e.target.value)}
            placeholder="Enter communication type name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddCommunicationTypeModal(false); setNewCommunicationType(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const trimmedType = newCommunicationType.trim();
                if (!trimmedType) {
                  alert('Please enter a valid communication type name!');
                  return;
                }

                if (communicationTypes.includes(trimmedType)) {
                  alert('This communication type already exists!');
                  return;
                }

                const updated = [...communicationTypes, trimmedType];
                setCommunicationTypes(updated);
                saveDropdownData(
                  { communicationTypes: updated },
                  `Communication type "${trimmedType}" added successfully!`
                );

                setShowAddCommunicationTypeModal(false);
                setNewCommunicationType('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Refund Document Option Modal */}
    {showAddRefundDocModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Option</h3>
          <input
            type="text"
            value={newRefundDocName}
            onChange={(e) => setNewRefundDocName(e.target.value)}
            placeholder="Enter option name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddRefundDocModal(false); setNewRefundDocName(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (newRefundDocName.trim() && !refundDocumentsOptions.includes(newRefundDocName.trim())) {
                  const updated = [...refundDocumentsOptions, newRefundDocName.trim()];
                  setRefundDocumentsOptions(updated);
                  saveDropdownData(
                    { refundDocumentsOptions: updated },
                    `Option "${newRefundDocName.trim()}" added successfully!`
                  );
                } else if (refundDocumentsOptions.includes(newRefundDocName.trim())) {
                  alert('This option already exists!');
                  return;
                }
                setShowAddRefundDocModal(false);
                setNewRefundDocName('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Management Report Type Modal */}
    {showAddManagementReportTypeModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <h3 className="text-base font-bold text-primary mb-3">Add New Report Type</h3>
          <input
            type="text"
            value={newManagementReportType}
            onChange={(e) => setNewManagementReportType(e.target.value)}
            placeholder="Enter report type name"
            className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAddManagementReportTypeModal(false); setNewManagementReportType(''); }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const trimmedType = newManagementReportType.trim();
                if (!trimmedType) {
                  alert('Please enter a valid report type name!');
                  return;
                }

                if (managementReportTypes.includes(trimmedType)) {
                  alert('This report type already exists!');
                  return;
                }

                const updated = [...managementReportTypes, trimmedType];
                setManagementReportTypes(updated);
                saveDropdownData(
                  { managementReportTypes: updated },
                  `Report type "${trimmedType}" added successfully!`
                );

                setShowAddManagementReportTypeModal(false);
                setNewManagementReportType('');
              }}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:opacity-90"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Report Confirmation Modal */}
    {removeReportConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setRemoveReportConfirmModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:alert-circle-outline" width={36} height={36} color="#c62828" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Remove Report?</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">
            Are you sure you want to remove <strong className="text-[#333]">{removeReportConfirmModal.reportName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRemoveReportConfirmModal(null)}
              className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setManagementReportRows(prev => prev.filter(r => r.id !== removeReportConfirmModal.reportId));
                setRemoveReportConfirmModal(null);
              }}
              className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Communication Confirmation Modal */}
    {removeCommunicationConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setRemoveCommunicationConfirmModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:alert-circle-outline" width={36} height={36} color="#c62828" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Remove Communication?</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">
            Are you sure you want to remove <strong className="text-[#333]">{removeCommunicationConfirmModal.communicationName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRemoveCommunicationConfirmModal(null)}
              className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setCommunicationRows(prev => prev.filter(r => r.id !== removeCommunicationConfirmModal.communicationId));
                setRemoveCommunicationConfirmModal(null);
              }}
              className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Refund Document Confirmation Modal */}
    {removeRefundDocConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setRemoveRefundDocConfirmModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:alert-circle-outline" width={36} height={36} color="#c62828" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Remove Refund Document?</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">
            Are you sure you want to remove <strong className="text-[#333]">{removeRefundDocConfirmModal.refundDocName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRemoveRefundDocConfirmModal(null)}
              className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setRefundDocumentRows(prev => prev.filter(r => r.id !== removeRefundDocConfirmModal.refundDocId));
                setRemoveRefundDocConfirmModal(null);
              }}
              className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Custom Row Confirmation Modal */}
    {removeCustomRowConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setRemoveCustomRowConfirmModal(null)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:alert-circle-outline" width={36} height={36} color="#c62828" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Remove Custom Row?</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">
            Are you sure you want to remove <strong className="text-[#333]">{removeCustomRowConfirmModal.rowName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setRemoveCustomRowConfirmModal(null)}
              className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = customRows.filter(r => r.id !== removeCustomRowConfirmModal.rowId);
                setCustomRows(updated);
                saveDropdownData({ customRows: updated }, `Row "${removeCustomRowConfirmModal.rowName}" deleted.`);
                setRemoveCustomRowConfirmModal(null);
              }}
              className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Save Reports Confirmation Modal */}
    {saveReportsConfirmModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setSaveReportsConfirmModal(false)}>
        <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={e => e.stopPropagation()}>
          <div className="w-14 h-14 rounded-full bg-[#e3f2fd] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:content-save-outline" width={36} height={36} color="#1976d2" />
          </div>
          <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Save Management Reports?</h3>
          <p className="text-[14px] text-[#666] m-0 mb-6">
            You are about to save <strong className="text-[#333]">{managementReportRows.length} management report(s)</strong>. Do you want to continue?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setSaveReportsConfirmModal(false)}
              className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                saveDropdownData(
                  { managementReportRows },
                  `${managementReportRows.length} management report(s) saved successfully!`
                );
                setSaveReportsConfirmModal(false);
              }}
              className="py-2.5 px-8 bg-[#1976d2] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1565c0]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Others Option Confirmation Modal */}
    {showRemoveOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[320px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ffebee] flex items-center justify-center">
              <Icon icon="mdi:alert-outline" width={24} height={24} className="text-[#c62828]" />
            </div>
            <h3 className="text-base font-bold text-[#333]">Remove Option</h3>
          </div>
          <p className="text-sm text-[#666] mb-5">
            Are you sure you want to remove <span className="font-semibold text-[#333]">"{othersOptionToRemove}"</span> from the options?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRemoveOthersModal(false);
                setOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = othersOptions.filter(opt => opt !== othersOptionToRemove);
                setOthersOptions(updated);
                // Clear selection if the removed option was selected
                setDropdownSelections(prev => {
                  const newSelections = { ...prev };
                  Object.keys(newSelections).forEach(key => {
                    if (newSelections[key] === othersOptionToRemove) {
                      newSelections[key] = '';
                    }
                  });
                  return newSelections;
                });
                saveDropdownData(
                  { othersOptions: updated },
                  `Option "${othersOptionToRemove}" removed successfully!`
                );
                setShowRemoveOthersModal(false);
                setOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-[#c62828] text-white rounded text-sm font-medium hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Initiation Others Option Confirmation Modal */}
    {showRemoveInitiationOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[320px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ffebee] flex items-center justify-center">
              <Icon icon="mdi:alert-outline" width={24} height={24} className="text-[#c62828]" />
            </div>
            <h3 className="text-base font-bold text-[#333]">Remove Option</h3>
          </div>
          <p className="text-sm text-[#666] mb-5">
            Are you sure you want to remove <span className="font-semibold text-[#333]">"{initiationOthersOptionToRemove}"</span> from the options?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRemoveInitiationOthersModal(false);
                setInitiationOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = initiationOthersOptions.filter(opt => opt !== initiationOthersOptionToRemove);
                setInitiationOthersOptions(updated);
                // Clear selection if the removed option was selected
                setDropdownSelections(prev => {
                  const newSelections = { ...prev };
                  Object.keys(newSelections).forEach(key => {
                    if (newSelections[key] === initiationOthersOptionToRemove) {
                      newSelections[key] = '';
                    }
                  });
                  return newSelections;
                });
                saveDropdownData(
                  { initiationOthersOptions: updated },
                  `Option "${initiationOthersOptionToRemove}" removed successfully!`
                );
                setShowRemoveInitiationOthersModal(false);
                setInitiationOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-[#c62828] text-white rounded text-sm font-medium hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Monitoring Others Option Confirmation Modal */}
    {showRemoveMonitoringOthersModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[320px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ffebee] flex items-center justify-center">
              <Icon icon="mdi:alert-outline" width={24} height={24} className="text-[#c62828]" />
            </div>
            <h3 className="text-base font-bold text-[#333]">Remove Option</h3>
          </div>
          <p className="text-sm text-[#666] mb-5">
            Are you sure you want to remove <span className="font-semibold text-[#333]">"{monitoringOthersOptionToRemove}"</span> from the options?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRemoveMonitoringOthersModal(false);
                setMonitoringOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = monitoringOthersOptions.filter(opt => opt !== monitoringOthersOptionToRemove);
                setMonitoringOthersOptions(updated);
                // Clear selection if the removed option was selected
                setDropdownSelections(prev => {
                  const newSelections = { ...prev };
                  Object.keys(newSelections).forEach(key => {
                    if (newSelections[key] === monitoringOthersOptionToRemove) {
                      newSelections[key] = '';
                    }
                  });
                  return newSelections;
                });
                saveDropdownData(
                  { monitoringOthersOptions: updated },
                  `Option "${monitoringOthersOptionToRemove}" removed successfully!`
                );
                setShowRemoveMonitoringOthersModal(false);
                setMonitoringOthersOptionToRemove('');
              }}
              className="px-4 py-2 bg-[#c62828] text-white rounded text-sm font-medium hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Remove Refund Document Option Confirmation Modal */}
    {showRemoveRefundDocModal && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[320px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ffebee] flex items-center justify-center">
              <Icon icon="mdi:alert-outline" width={24} height={24} className="text-[#c62828]" />
            </div>
            <h3 className="text-base font-bold text-[#333]">Remove Option</h3>
          </div>
          <p className="text-sm text-[#666] mb-5">
            Are you sure you want to remove <span className="font-semibold text-[#333]">"{refundDocOptionToRemove}"</span> from the options?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRemoveRefundDocModal(false);
                setRefundDocOptionToRemove('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const updated = refundDocumentsOptions.filter(opt => opt !== refundDocOptionToRemove);
                setRefundDocumentsOptions(updated);
                // Clear selection if the removed option was selected
                setDropdownSelections(prev => {
                  const newSelections = { ...prev };
                  Object.keys(newSelections).forEach(key => {
                    if (newSelections[key] === refundDocOptionToRemove) {
                      newSelections[key] = '';
                    }
                  });
                  return newSelections;
                });
                saveDropdownData(
                  { refundDocumentsOptions: updated },
                  `Option "${refundDocOptionToRemove}" removed successfully!`
                );
                setShowRemoveRefundDocModal(false);
                setRefundDocOptionToRemove('');
              }}
              className="px-4 py-2 bg-[#c62828] text-white rounded text-sm font-medium hover:bg-[#b71c1c]"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Add New Row Modal */}
    {showAddRowModal?.show && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[480px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#2e7d32] to-[#388e3c] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Icon icon="mdi:plus-circle" width={24} height={24} color="white" />
              </div>
              <div>
                <h3 className="text-white text-base font-bold m-0">Add New Row</h3>
                <p className="text-white/80 text-xs m-0">to {showAddRowModal.sectionLabel}</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            {/* Row Name */}
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">
                <Icon icon="mdi:form-textbox" width={14} height={14} className="inline mr-1" />
                Row Name
              </label>
              <input
                type="text"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                placeholder="e.g., Additional Document, Custom Field"
                className="w-full px-3 py-2.5 border border-[#d0d0d0] rounded-lg text-sm focus:outline-none focus:border-[#2e7d32] focus:ring-1 focus:ring-[#2e7d32]/20"
                autoFocus
              />
            </div>

            {/* Row Type Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-2">
                <Icon icon="mdi:format-list-bulleted-type" width={14} height={14} className="inline mr-1" />
                Row Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewRowType('item')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                    newRowType === 'item'
                      ? 'border-[#2e7d32] bg-[#e8f5e9]'
                      : 'border-[#e0e0e0] hover:border-[#999]'
                  }`}
                >
                  <Icon icon="mdi:file-upload-outline" width={32} height={32} className={newRowType === 'item' ? 'text-[#2e7d32]' : 'text-[#666]'} />
                  <span className={`text-sm font-semibold ${newRowType === 'item' ? 'text-[#2e7d32]' : 'text-[#666]'}`}>File Upload</span>
                  <span className="text-[10px] text-[#888] text-center">Upload single or multiple files with drag & drop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRowType('dropdown')}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                    newRowType === 'dropdown'
                      ? 'border-[#2e7d32] bg-[#e8f5e9]'
                      : 'border-[#e0e0e0] hover:border-[#999]'
                  }`}
                >
                  <Icon icon="mdi:form-dropdown" width={32} height={32} className={newRowType === 'dropdown' ? 'text-[#2e7d32]' : 'text-[#666]'} />
                  <span className={`text-sm font-semibold ${newRowType === 'dropdown' ? 'text-[#2e7d32]' : 'text-[#666]'}`}>Dropdown</span>
                  <span className="text-[10px] text-[#888] text-center">Selection options with file upload per option</span>
                </button>
              </div>
            </div>

            {/* Dropdown Options - Only shown when dropdown is selected */}
            {newRowType === 'dropdown' && (
              <div className="bg-[#f5f5f5] rounded-lg p-4 border border-[#e0e0e0]">
                <label className="block text-xs font-semibold text-[#555] mb-2">
                  <Icon icon="mdi:playlist-plus" width={14} height={14} className="inline mr-1" />
                  Dropdown Options
                </label>
                <p className="text-[10px] text-[#888] mb-2">Enter options separated by commas. Each option can have its own file upload.</p>
                <textarea
                  value={newRowDropdownOptions}
                  onChange={(e) => setNewRowDropdownOptions(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 border border-[#d0d0d0] rounded-lg text-sm focus:outline-none focus:border-[#2e7d32] resize-none"
                  rows={2}
                />
                {newRowDropdownOptions && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {newRowDropdownOptions.split(',').map((opt, i) => opt.trim() && (
                      <span key={i} className="text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                        {opt.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* File Upload Preview - Only shown when file upload is selected */}
            {newRowType === 'item' && (
              <div className="bg-[#fff8e1] rounded-lg p-4 border border-[#ffecb3]">
                <div className="flex items-center gap-2 text-[#f57f17]">
                  <Icon icon="mdi:information-outline" width={16} height={16} />
                  <span className="text-xs font-semibold">File Upload Features</span>
                </div>
                <ul className="mt-2 text-[11px] text-[#666] space-y-1 pl-5">
                  <li className="list-disc">Drag and drop files directly onto the row</li>
                  <li className="list-disc">Upload multiple files at once</li>
                  <li className="list-disc">Preview files before downloading</li>
                  <li className="list-disc">Supports PDF, DOCX, images, and more</li>
                </ul>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 px-5 py-4 bg-[#f9f9f9] border-t border-[#eee]">
            <button
              type="button"
              onClick={() => {
                setShowAddRowModal(null);
                setNewRowName('');
                setNewRowType('item');
                setNewRowDropdownOptions('');
              }}
              className="px-5 py-2 bg-white text-[#666] border border-[#d0d0d0] rounded-lg text-sm font-medium hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!newRowName.trim()) {
                  alert('Please enter a row name');
                  return;
                }

                const newRow = {
                  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  sectionLabel: showAddRowModal.sectionLabel,
                  name: newRowName.trim(),
                  rowType: newRowType,
                  dropdownOptions: newRowType === 'dropdown' ? newRowDropdownOptions.split(',').map(o => o.trim()).filter(o => o) : undefined,
                  textValue: '',
                };

                const updatedCustomRows = [...customRows, newRow];
                setCustomRows(updatedCustomRows);

                // Save to database
                try {
                  const mergedData = {
                    ...currentDropdownData,
                    customRows: updatedCustomRows,
                  };
                  setCurrentDropdownData(mergedData);

                  await fetch(`/api/setup-projects/${projectId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dropdownData: mergedData }),
                  });

                  setSaveSuccessModal({ show: true, message: `Row "${newRowName.trim()}" added successfully!` });
                } catch (error) {
                  console.error('Error saving custom row:', error);
                }

                setShowAddRowModal(null);
                setNewRowName('');
                setNewRowType('item');
                setNewRowDropdownOptions('');
              }}
              className="px-5 py-2 bg-[#2e7d32] text-white rounded-lg text-sm font-semibold hover:bg-[#1b5e20] flex items-center gap-2"
            >
              <Icon icon="mdi:plus" width={16} height={16} />
              Add Row
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit Row Modal */}
    {showEditRowModal?.show && (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1200]">
        <div className="bg-white rounded-lg w-full max-w-[450px] shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#1976d2] to-[#2196f3] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Icon icon="mdi:pencil" width={24} height={24} color="white" />
              </div>
              <div>
                <h3 className="text-white text-base font-bold m-0">Edit Row</h3>
                <p className="text-white/80 text-xs m-0">Rename or modify options</p>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            {/* Row Name */}
            <div>
              <label className="block text-xs font-semibold text-[#555] mb-1.5">
                <Icon icon="mdi:form-textbox" width={14} height={14} className="inline mr-1" />
                Row Name
              </label>
              <input
                type="text"
                value={editRowName || showEditRowModal.currentName}
                onChange={(e) => setEditRowName(e.target.value)}
                placeholder="Enter row name"
                className="w-full px-3 py-2.5 border border-[#d0d0d0] rounded-lg text-sm focus:outline-none focus:border-[#1976d2] focus:ring-1 focus:ring-[#1976d2]/20"
              />
            </div>

            {/* Dropdown Options - Only for dropdown type */}
            {showEditRowModal.rowType === 'dropdown' && (
              <div className="bg-[#f5f5f5] rounded-lg p-4 border border-[#e0e0e0]">
                <label className="block text-xs font-semibold text-[#555] mb-2">
                  <Icon icon="mdi:playlist-edit" width={14} height={14} className="inline mr-1" />
                  Dropdown Options
                </label>
                <p className="text-[10px] text-[#888] mb-2">Edit options separated by commas.</p>
                <textarea
                  value={editRowOptions || showEditRowModal.dropdownOptions?.join(', ') || ''}
                  onChange={(e) => setEditRowOptions(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 border border-[#d0d0d0] rounded-lg text-sm focus:outline-none focus:border-[#1976d2] resize-none"
                  rows={2}
                />
                {(editRowOptions || showEditRowModal.dropdownOptions?.join(', ')) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(editRowOptions || showEditRowModal.dropdownOptions?.join(', ') || '').split(',').map((opt, i) => opt.trim() && (
                      <span key={i} className="text-[10px] bg-[#1976d2] text-white px-2 py-0.5 rounded-full">
                        {opt.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info for file upload type */}
            {showEditRowModal.rowType === 'item' && (
              <div className="bg-[#e3f2fd] rounded-lg p-4 border border-[#bbdefb]">
                <div className="flex items-center gap-2 text-[#1565c0]">
                  <Icon icon="mdi:information-outline" width={16} height={16} />
                  <span className="text-xs font-semibold">File Upload Row</span>
                </div>
                <p className="mt-1 text-[11px] text-[#666]">
                  This row allows file uploads. Uploaded files will be preserved when you rename the row.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-2 px-5 py-4 bg-[#f9f9f9] border-t border-[#eee]">
            <button
              type="button"
              onClick={() => {
                setShowEditRowModal(null);
                setEditRowName('');
                setEditRowOptions('');
              }}
              className="px-5 py-2 bg-white text-[#666] border border-[#d0d0d0] rounded-lg text-sm font-medium hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                const newName = editRowName.trim() || showEditRowModal.currentName;
                const newOptions = showEditRowModal.rowType === 'dropdown'
                  ? (editRowOptions || showEditRowModal.dropdownOptions?.join(', ') || '').split(',').map(o => o.trim()).filter(o => o)
                  : undefined;

                const updatedCustomRows = customRows.map(r =>
                  r.id === showEditRowModal.rowId
                    ? { ...r, name: newName, dropdownOptions: newOptions }
                    : r
                );
                setCustomRows(updatedCustomRows);

                // Save to database
                try {
                  const mergedData = {
                    ...currentDropdownData,
                    customRows: updatedCustomRows,
                  };
                  setCurrentDropdownData(mergedData);

                  await fetch(`/api/setup-projects/${projectId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dropdownData: mergedData }),
                  });

                  setSaveSuccessModal({ show: true, message: `Row updated successfully!` });
                } catch (error) {
                  console.error('Error updating custom row:', error);
                }

                setShowEditRowModal(null);
                setEditRowName('');
                setEditRowOptions('');
              }}
              className="px-5 py-2 bg-[#1976d2] text-white rounded-lg text-sm font-semibold hover:bg-[#1565c0] flex items-center gap-2"
            >
              <Icon icon="mdi:check" width={16} height={16} />
              Save Changes
            </button>
          </div>
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

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
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
  const [managementProgress, setManagementProgress] = useState(0);
  const [managementFiles, setManagementFiles] = useState({ uploaded: 0, total: 0 });
  const [monitoringProgress, setMonitoringProgress] = useState(0);
  const [monitoringFiles, setMonitoringFiles] = useState({ uploaded: 0, total: 0 });
  const [refundProgress, setRefundProgress] = useState(0);
  const [refundFiles, setRefundFiles] = useState({ uploaded: 0, total: 0 });
  const [communicationsProgress, setCommunicationsProgress] = useState(0);
  const [communicationsFiles, setCommunicationsFiles] = useState({ uploaded: 0, total: 0 });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showExecutiveSummaryPreview, setShowExecutiveSummaryPreview] = useState(false);

  // Executive Summary editable fields
  const [execSummaryData, setExecSummaryData] = useState({
    requestedAmount: '',
    ownersEquity: '',
    totalProjectCost: '',
    dostTechnology: '',
    incomePresent: '',
    incomeAdditional: '',
    jobsCreatedPresent: '',
    jobsCreatedAdditional: '',
    productivityPresent: '',
    productivityIncrease: '',
    marketPresent: '',
    marketAdditional: '',
    listOfProducts: '',
    withFdaLto: '',
    withCprs: '',
    businessPlan: '',
    plans: '',
    preparedByName: '',
    preparedByPosition: 'Project Technical Assistant III, PSTO MOR',
    reviewedByName: 'Ruel Vincent C. Banal',
    reviewedByPosition: 'Officer-In-Charge, PSTO MOR',
  });

  const updateExecSummaryField = (field: string, value: string) => {
    setExecSummaryData(prev => ({ ...prev, [field]: value }));
  };

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const overallProgress = Math.round((initiationProgress + implementationProgress + managementProgress + monitoringProgress + refundProgress + communicationsProgress) / 6);

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [modeTransitioning, setModeTransitioning] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<'edit' | 'view' | 'upload' | null>(null);
  const [modeKey, setModeKey] = useState(0); // Key to force re-render of DocumentTable
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editRequestPending, setEditRequestPending] = useState(false);
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequestSent, setEditRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Assignee-specific modes: 'upload' allows file uploads, 'edit' allows adding new rows
  const [assigneeMode, setAssigneeMode] = useState<'upload' | 'edit'>('upload');

  // Edit Request Permission Modal states (for assignee/owner)
  const [editPermissionModal, setEditPermissionModal] = useState(false);
  const [pendingEditRequests, setPendingEditRequests] = useState<EditRequest[]>([]);
  const [approvedEditorsList, setApprovedEditorsList] = useState<EditRequest[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Function to fetch pending edit requests and approved editors
  const fetchEditRequestsAndEditors = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      // Always fetch fresh project data to get latest pendingEditRequests
      const freshProjectRes = await fetch(`/api/setup-projects/${id}`);
      const freshProject = await freshProjectRes.json();

      const dropdownData = freshProject.dropdownData as Record<string, unknown> | null;
      const pendingRequestIds = (dropdownData?.pendingEditRequests as string[]) || [];
      const approvedEditorIds = (dropdownData?.approvedEditors as string[]) || [];

      // If no pending requests and no approved editors, clear both states
      if (pendingRequestIds.length === 0 && approvedEditorIds.length === 0) {
        setPendingEditRequests([]);
        setApprovedEditorsList([]);
        setLoadingPermissions(false);
        return;
      }

      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();

      // Map pending requests
      const requests: EditRequest[] = pendingRequestIds.map((userId: string) => {
        const user = users.find((u: { id: string; fullName: string; profileImageUrl?: string }) => u.id === userId);
        return {
          userId,
          userName: user?.fullName || 'Unknown User',
          userProfileUrl: user?.profileImageUrl || null,
          requestedAt: 'Pending',
        };
      });
      setPendingEditRequests(requests);

      // Map approved editors
      const editors: EditRequest[] = approvedEditorIds.map((userId: string) => {
        const user = users.find((u: { id: string; fullName: string; profileImageUrl?: string }) => u.id === userId);
        return {
          userId,
          userName: user?.fullName || 'Unknown User',
          userProfileUrl: user?.profileImageUrl || null,
          requestedAt: 'Approved',
        };
      });
      setApprovedEditorsList(editors);
    } catch (err) {
      console.error('Failed to fetch edit requests and editors:', err);
    } finally {
      setLoadingPermissions(false);
    }
  }, [id]);

  // Get current user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }, []);

  // Auto-enable Upload Mode for assignees (assignees never see View Mode)
  useEffect(() => {
    if (currentUser && project && !loading) {
      const userIsAssignee = project.assignee === currentUser.fullName;
      if (userIsAssignee && !isEditMode) {
        setIsEditMode(true);
        setAssigneeMode('upload');
      }
    }
  }, [currentUser, project, loading]);

  // Listen for openEditRequestModal custom event
  useEffect(() => {
    const handleOpenEditRequestModal = (e: CustomEvent) => {
      if (e.detail.projectId === id) {
        setEditPermissionModal(true);
        fetchEditRequestsAndEditors();
      }
    };

    window.addEventListener('openEditRequestModal', handleOpenEditRequestModal as EventListener);
    return () => window.removeEventListener('openEditRequestModal', handleOpenEditRequestModal as EventListener);
  }, [id, fetchEditRequestsAndEditors]);

  // Check sessionStorage for pending edit request modal on page load
  useEffect(() => {
    const pendingProjectId = sessionStorage.getItem('pendingEditRequestModal');
    if (pendingProjectId === id && !loading) {
      sessionStorage.removeItem('pendingEditRequestModal');
      sessionStorage.removeItem('pendingEditRequestUserId');
      setEditPermissionModal(true);
      fetchEditRequestsAndEditors();
    }
  }, [id, loading, fetchEditRequestsAndEditors]);

  // Fetch pending edit requests and approved editors when project data changes
  useEffect(() => {
    if (!project) return;
    fetchEditRequestsAndEditors();
  }, [project, fetchEditRequestsAndEditors]);

  useEffect(() => {
    fetch(`/api/setup-projects/${id}`)
      .then(res=>{if(!res.ok)throw new Error('Not found');return res.json();})
      .then(data=>setProject(data)).catch(()=>setError(true)).finally(()=>setLoading(false));
  }, [id]);

  // Initialize Executive Summary prepared by name from assignee
  useEffect(() => {
    if (project?.assignee && !execSummaryData.preparedByName) {
      setExecSummaryData(prev => ({ ...prev, preparedByName: project.assignee || '' }));
    }
  }, [project?.assignee, execSummaryData.preparedByName]);

  // Check if current user is the owner (assignee) or admin
  const isOwnerOrAdmin = (): boolean => {
    if (!currentUser || !project) return false;

    // Check if user is the assignee (compare by name since assignee is stored as name)
    const isAssignee = project.assignee === currentUser.fullName;

    // Check if user is admin
    const isAdmin = currentUser.role === 'ADMIN';

    return isAssignee || isAdmin;
  };

  // Check if current user is specifically the assignee (not admin)
  const isAssignee = (): boolean => {
    if (!currentUser || !project) return false;
    return project.assignee === currentUser.fullName;
  };

  // Check if assignee edit mode is active (allows adding new rows)
  const isAssigneeEditModeActive = (): boolean => {
    return isAssignee() && isEditMode && assigneeMode === 'edit';
  };

  // Check if assignee upload mode is active (can upload but not add rows)
  const isAssigneeUploadModeActive = (): boolean => {
    return isAssignee() && isEditMode && assigneeMode === 'upload';
  };

  // Check if current user is authorized to edit (includes granted permissions)
  const isAuthorizedToEdit = (): boolean => {
    if (!currentUser || !project) return false;

    // Owner or admin can always edit
    if (isOwnerOrAdmin()) return true;

    // Check if user has been granted edit access (stored in dropdownData)
    const dropdownData = project.dropdownData as Record<string, unknown> | null;
    const approvedEditors = (dropdownData?.approvedEditors as string[]) || [];
    const hasEditAccess = approvedEditors.includes(currentUser.id);

    return hasEditAccess;
  };

  // Generate and download Executive Summary as DOCX
  const downloadExecutiveSummary = async (project: Project, data: typeof execSummaryData) => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, ImageRun, WidthType, BorderStyle, AlignmentType, VerticalAlign, UnderlineType, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType, TextWrappingSide } = await import('docx');

    // Fetch the logo image
    const logoResponse = await fetch('/setup-4.0-logo.png');
    const logoBlob = await logoResponse.blob();
    const logoArrayBuffer = await logoBlob.arrayBuffer();
    const logoBuffer = new Uint8Array(logoArrayBuffer);

    // Border style for main table
    const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
    const noBorder = { style: BorderStyle.NONE };
    const bottomBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };

    // Helper to create header cell for metric rows (Present, Additional Y1, Increase Y1)
    const createMetricHeaderCell = (label: string) => {
      return new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: label,
                bold: true,
                size: 20,
                font: "Calibri"
              })
            ]
          })
        ]
      });
    };

    // Helper to create value cell for metric rows
    const createMetricValueCell = (value: string) => {
      return new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 50, bottom: 50, left: 100, right: 100 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: value || "",
                size: 20,
                font: "Calibri"
              })
            ]
          })
        ]
      });
    };

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,     // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header with floating logo and centered title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              // Floating logo positioned at left
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 120, height: 40 },
                type: "png",
                floating: {
                  horizontalPosition: {
                    relative: HorizontalPositionRelativeFrom.PAGE,
                    offset: 500000, // 0.5 inch from left edge (in EMUs: 914400 per inch)
                  },
                  verticalPosition: {
                    relative: VerticalPositionRelativeFrom.PARAGRAPH,
                    offset: 0,
                  },
                  wrap: {
                    type: TextWrappingType.NONE,
                  },
                },
              }),
              // Centered title text
              new TextRun({
                text: "EXECUTIVE SUMMARY",
                bold: true,
                size: 50,
                font: "Calibri",
              }),
            ],
          }),
          new Paragraph({ text: "", spacing: { after: 200 } }),

          // Main Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: tableBorder,
              bottom: tableBorder,
              left: tableBorder,
              right: tableBorder,
              insideHorizontal: tableBorder,
              insideVertical: tableBorder,
            },
            rows: [
              // Project Title
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "Project Title:", bold: true, size: 20, font: "Calibri" })] })],
                  }),
                  new TableCell({
                    width: { size: 65, type: WidthType.PERCENTAGE },
                    columnSpan: 2,
                    children: [new Paragraph({ children: [new TextRun({ text: project.title || "", size: 20, font: "Calibri" })] })],
                  }),
                ],
              }),
              // Proponent
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Proponent:", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: project.corporatorName || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // Requested Amount
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Requested Amount:", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.requestedAmount || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // Owner's Equity
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Owner's Equity:", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.ownersEquity || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // Total Project Cost
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Project Cost:", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.totalProjectCost || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // 1. DOST technology
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "1. DOST technology to be adopted and the mode of techno transfer.", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.dostTechnology || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // 2. Income - Header row (Present / Additional Y1)
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 35, type: WidthType.PERCENTAGE },
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: "2. Income", bold: true, size: 20, font: "Calibri" })] })],
                  }),
                  createMetricHeaderCell("Present"),
                  createMetricHeaderCell("Additional (Y1)"),
                ],
              }),
              // 2. Income - Value row
              new TableRow({
                children: [
                  createMetricValueCell(data.incomePresent),
                  createMetricValueCell(data.incomeAdditional),
                ],
              }),
              // 3. Jobs Created - Header row
              new TableRow({
                children: [
                  new TableCell({
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: "3. Jobs Created", bold: true, size: 20, font: "Calibri" })] })],
                  }),
                  createMetricHeaderCell("Present"),
                  createMetricHeaderCell("Additional (Y1)"),
                ],
              }),
              // 3. Jobs Created - Value row
              new TableRow({
                children: [
                  createMetricValueCell(data.jobsCreatedPresent),
                  createMetricValueCell(data.jobsCreatedAdditional),
                ],
              }),
              // 4. Productivity - Header row
              new TableRow({
                children: [
                  new TableCell({
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: "4. Productivity", bold: true, size: 20, font: "Calibri" })] })],
                  }),
                  createMetricHeaderCell("Present"),
                  createMetricHeaderCell("Increase (Y1)"),
                ],
              }),
              // 4. Productivity - Value row
              new TableRow({
                children: [
                  createMetricValueCell(data.productivityPresent),
                  createMetricValueCell(data.productivityIncrease),
                ],
              }),
              // 5. Market - Header row
              new TableRow({
                children: [
                  new TableCell({
                    rowSpan: 2,
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({ children: [new TextRun({ text: "5. Market", bold: true, size: 20, font: "Calibri" })] })],
                  }),
                  createMetricHeaderCell("Present"),
                  createMetricHeaderCell("Additional (Y1)"),
                ],
              }),
              // 5. Market - Value row
              new TableRow({
                children: [
                  createMetricValueCell(data.marketPresent),
                  createMetricValueCell(data.marketAdditional),
                ],
              }),
              // 6. List of Products
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "6. List of Products", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.listOfProducts || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // 7. With FDA-LTO?
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "7. With FDA-LTO?", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.withFdaLto || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // 8. With CPRs?
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "8. With CPRs?", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.withCprs || "", size: 20, font: "Calibri" })] })] }),
                ],
              }),
              // 9. Business plan paragraph
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "9. A short paragraph on the business plan answering the question, How will the enterprise earn income?", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.businessPlan || "", size: 20, font: "Calibri" })] }), new Paragraph(""), new Paragraph(""), new Paragraph("")] }),
                ],
              }),
              // 10. Plans
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "10. Plans", bold: true, size: 20, font: "Calibri" })] })] }),
                  new TableCell({ columnSpan: 2, children: [new Paragraph({ children: [new TextRun({ text: data.plans || "", size: 20, font: "Calibri" })] }), new Paragraph(""), new Paragraph(""), new Paragraph(""), new Paragraph("")] }),
                ],
              }),
            ],
          }),

          // Footer section
          new Paragraph({ text: "", spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: noBorder,
              bottom: noBorder,
              left: noBorder,
              right: noBorder,
              insideHorizontal: noBorder,
              insideVertical: noBorder,
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Prepared by:", font: "Calibri", size: 20 })] }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.preparedByName || "", underline: { type: UnderlineType.SINGLE }, font: "Calibri", size: 20 })
                        ]
                      }),
                      new Paragraph({ children: [new TextRun({ text: data.preparedByPosition || "", font: "Calibri", size: 20 })] }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Reviewed by", font: "Calibri", size: 20 })] }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.reviewedByName || "", underline: { type: UnderlineType.SINGLE }, font: "Calibri", size: 20 })
                        ]
                      }),
                      new Paragraph({ children: [new TextRun({ text: data.reviewedByPosition || "", font: "Calibri", size: 20 })] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Executive_Summary_${project.title?.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if user has a pending edit request
  const hasPendingRequest = (): boolean => {
    if (!currentUser || !project) return false;
    const dropdownData = project.dropdownData as Record<string, unknown> | null;
    const pendingRequests = (dropdownData?.pendingEditRequests as string[]) || [];
    return pendingRequests.includes(currentUser.id);
  };

  // Handle Edit Mode toggle
  const handleEditModeToggle = async () => {
    // For assignees: toggle between Upload Mode <-> Edit Mode only (no View Mode)
    if (isAssignee()) {
      if (assigneeMode === 'upload') {
        // Upload Mode -> Edit Mode
        setTransitioningTo('edit');
        setModeTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setAssigneeMode('edit');
        setModeKey(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 200));
        setModeTransitioning(false);
        setTransitioningTo(null);
      } else {
        // Edit Mode -> Upload Mode
        setTransitioningTo('upload');
        setModeTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setAssigneeMode('upload');
        setModeKey(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 200));
        setModeTransitioning(false);
        setTransitioningTo(null);
      }
      return;
    }

    // For non-assignees: original logic
    if (isEditMode) {
      // Switching to View Mode - always allowed
      setTransitioningTo('view');
      setModeTransitioning(true);
      // Small delay to show loader and ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsEditMode(false);
      setModeKey(prev => prev + 1); // Force re-render of DocumentTable
      await new Promise(resolve => setTimeout(resolve, 200));
      setModeTransitioning(false);
      setTransitioningTo(null);
    } else {
      // Trying to switch to Edit Mode
      if (isAuthorizedToEdit()) {
        setTransitioningTo('edit');
        setModeTransitioning(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsEditMode(true);
        setModeKey(prev => prev + 1); // Force re-render of DocumentTable
        await new Promise(resolve => setTimeout(resolve, 200));
        setModeTransitioning(false);
        setTransitioningTo(null);
      } else {
        // Show request modal
        setEditRequestModal(true);
      }
    }
  };

  // Send edit request to assignee
  const sendEditRequest = async () => {
    if (!currentUser || !project) return;

    setSendingRequest(true);
    try {
      // Get assignee's user ID by their name
      const usersRes = await fetch('/api/users');
      const users = await usersRes.json();
      const assigneeUser = users.find((u: { fullName: string }) => u.fullName === project.assignee);

      if (!assigneeUser) {
        alert('Could not find the project assignee. Please contact an administrator.');
        setEditRequestModal(false);
        setSendingRequest(false);
        return;
      }

      // Send notification to assignee
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assigneeUser.id,
          type: 'edit_request',
          title: 'Edit Access Request',
          message: `${currentUser.fullName} is requesting edit access to project "${project.title}"`,
          eventId: project.id,
          bookedByUserId: currentUser.id,
          bookedByName: currentUser.fullName,
          bookedByProfileUrl: currentUser.profileImageUrl || null,
        }),
      });

      // Add user to pending requests in dropdownData
      const dropdownData = (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests = (dropdownData.pendingEditRequests as string[]) || [];
      if (!pendingRequests.includes(currentUser.id)) {
        pendingRequests.push(currentUser.id);
      }

      await fetch(`/api/setup-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: { ...dropdownData, pendingEditRequests: pendingRequests },
        }),
      });

      setEditRequestSent(true);
      setEditRequestModal(false);

      // Refresh project data
      const refreshRes = await fetch(`/api/setup-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error('Failed to send edit request:', err);
      alert('Failed to send edit request. Please try again.');
    } finally {
      setSendingRequest(false);
    }
  };

  // Accept edit request
  const acceptEditRequest = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData = (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests = (dropdownData.pendingEditRequests as string[]) || [];
      const approvedEditors = (dropdownData.approvedEditors as string[]) || [];

      // Remove from pending and add to approved
      const updatedPending = pendingRequests.filter(id => id !== userId);
      const updatedApproved = approvedEditors.includes(userId) ? approvedEditors : [...approvedEditors, userId];

      await fetch(`/api/setup-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: { ...dropdownData, pendingEditRequests: updatedPending, approvedEditors: updatedApproved },
        }),
      });

      // Send notification to the requester with owner's profile
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          type: 'edit_request',
          title: 'Edit Access Approved',
          message: `Your edit access request for project "${project.title}" has been approved by ${currentUser?.fullName || 'the owner'}!`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/setup-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error('Failed to accept edit request:', err);
      alert('Failed to accept edit request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Decline edit request
  const declineEditRequest = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData = (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests = (dropdownData.pendingEditRequests as string[]) || [];

      // Remove from pending
      const updatedPending = pendingRequests.filter(id => id !== userId);

      await fetch(`/api/setup-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: { ...dropdownData, pendingEditRequests: updatedPending },
        }),
      });

      // Send notification to the requester with owner's profile
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          type: 'edit_request',
          title: 'Edit Access Declined',
          message: `Your edit access request for project "${project.title}" has been declined by ${currentUser?.fullName || 'the owner'}.`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/setup-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error('Failed to decline edit request:', err);
      alert('Failed to decline edit request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Remove approved editor
  const removeApprovedEditor = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData = (project.dropdownData as Record<string, unknown>) || {};
      const approvedEditors = (dropdownData.approvedEditors as string[]) || [];

      // Remove from approved editors
      const updatedApproved = approvedEditors.filter(id => id !== userId);

      await fetch(`/api/setup-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: { ...dropdownData, approvedEditors: updatedApproved },
        }),
      });

      // Send notification to the user with owner's profile
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          type: 'edit_request',
          title: 'Edit Access Revoked',
          message: `Your edit access for project "${project.title}" has been revoked by ${currentUser?.fullName || 'the owner'}.`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      // Refresh project data
      const refreshRes = await fetch(`/api/setup-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error('Failed to remove approved editor:', err);
      alert('Failed to remove editor. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

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
            <div className="flex items-center gap-2">
              {/* Permission Button - Show only for owner (assignee) or admin, not for users with granted edit access */}
              {isOwnerOrAdmin() && (
                <button
                  onClick={() => {
                    setEditPermissionModal(true);
                    fetchEditRequestsAndEditors();
                  }}
                  className="relative flex items-center justify-center w-10 h-10 border-none rounded-full bg-[#f5f5f5] text-[#666] cursor-pointer transition-all duration-200 hover:bg-[#e0e0e0] hover:text-[#333]"
                  title="Edit Permissions"
                >
                  <Icon icon="mdi:account-key" width={20} height={20} />
                  {pendingEditRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f57c00] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {pendingEditRequests.length > 9 ? '9+' : pendingEditRequests.length}
                    </span>
                  )}
                </button>
              )}

              {/* Edit Mode Button */}
              {isAssignee() ? (
                // Assignee-specific mode buttons
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEditModeToggle}
                    disabled={modeTransitioning}
                    className={`flex items-center gap-1.5 border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed ${
                      isEditMode && assigneeMode === 'upload'
                        ? 'bg-[#f5a623] text-white hover:bg-[#e09000]'
                        : isEditMode && assigneeMode === 'edit'
                        ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]'
                        : 'bg-gray-400 text-white hover:bg-gray-500'
                    }`}
                  >
                    {modeTransitioning ? (
                      <>
                        <Icon icon="mdi:loading" width={16} height={16} className="animate-spin" />
                        Switching...
                      </>
                    ) : (
                      <>
                        <Icon
                          icon={
                            isEditMode && assigneeMode === 'edit'
                              ? 'mdi:pencil-plus-outline'
                              : isEditMode && assigneeMode === 'upload'
                              ? 'mdi:upload'
                              : 'mdi:eye-outline'
                          }
                          width={16}
                          height={16}
                        />
                        {isEditMode && assigneeMode === 'edit'
                          ? 'Edit Mode'
                          : isEditMode && assigneeMode === 'upload'
                          ? 'Upload Mode'
                          : 'View Mode'}
                      </>
                    )}
                  </button>
                  <span className="text-[10px] text-[#666] bg-[#f0f0f0] px-2 py-1 rounded">
                  {assigneeMode === 'upload' ? 'Click for Edit Mode' : 'Click for Upload Mode'}
                </span>
                </div>
              ) : (
                // Non-assignee mode button (original)
                <button
                  onClick={handleEditModeToggle}
                  disabled={modeTransitioning}
                  className={`flex items-center gap-1.5 border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed ${
                    isEditMode
                      ? 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]'
                      : 'bg-accent text-white hover:bg-accent-hover'
                  }`}
                >
                  {modeTransitioning ? (
                    <>
                      <Icon icon="mdi:loading" width={16} height={16} className="animate-spin" />
                      Switching...
                    </>
                  ) : (
                    <>
                      <Icon icon={isEditMode ? 'mdi:eye-outline' : 'mdi:pencil-outline'} width={16} height={16} />
                      {isEditMode ? 'View Mode' : 'Edit Mode'}
                      {hasPendingRequest() && !isAuthorizedToEdit() && (
                        <span className="ml-1 text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">Pending</span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-5 items-start">
            <div className="w-[100px] h-[100px] min-w-[100px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-2 ring-[#183166] ring-offset-2">
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
                <p className="flex items-center gap-2"><strong>Assignee:</strong> {project.assignee ? (
                  <span className="inline-flex items-center gap-1.5">
                    {project.assigneeProfileUrl ? (
                      <img src={project.assigneeProfileUrl} alt={project.assignee} className="w-5 h-5 rounded-full object-cover border border-[#d0d0d0]" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-[#e3f2fd] flex items-center justify-center">
                        <Icon icon="mdi:account" width={12} height={12} color="#146184" />
                      </span>
                    )}
                    {project.assignee}
                  </span>
                ) : '—'}</p>
                <p><strong>Date Published:</strong> {datePublished}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-[#e3f2fd] to-[#bbdefb] rounded-xl py-5 px-7 mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-l-4 border-[#1976d2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                <Icon icon="mdi:file-document-edit-outline" width={24} height={24} color="#1976d2" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#146184] m-0 mb-1">Executive Summary</h3>
                <p className="text-[12px] text-[#555] m-0">Auto-generated document with project details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExecutiveSummaryPreview(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1976d2] border-2 border-[#1976d2] rounded-lg text-[13px] font-semibold hover:bg-[#1976d2] hover:text-white transition-all shadow-sm"
              >
                <Icon icon="mdi:eye-outline" width={18} height={18} />
                Preview
              </button>
              <button
                onClick={async () => {
                  if (!project) return;
                  await downloadExecutiveSummary(project, execSummaryData);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1976d2] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1565c0] transition-all shadow-md"
              >
                <Icon icon="mdi:download" width={18} height={18} />
                Download DOCX
              </button>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[
              { label: 'Project Initiation', progress: initiationProgress, files: initiationFiles },
              { label: 'Project Implementation', progress: implementationProgress, files: implementationFiles },
              { label: 'Project Management', progress: managementProgress, files: managementFiles },
              { label: 'Project Monitoring', progress: monitoringProgress, files: monitoringFiles },
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
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Project Refund', progress: refundProgress, files: refundFiles },
              { label: 'Communications', progress: communicationsProgress, files: communicationsFiles },
              { label: 'Overall Project Progress', progress: overallProgress, files: { uploaded: initiationFiles.uploaded + implementationFiles.uploaded + managementFiles.uploaded + monitoringFiles.uploaded + refundFiles.uploaded + communicationsFiles.uploaded, total: initiationFiles.total + implementationFiles.total + managementFiles.total + monitoringFiles.total + refundFiles.total + communicationsFiles.total } },
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

        {/* Mode Transitioning Overlay */}
        {modeTransitioning && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1100]">
            <div className="bg-white rounded-xl py-6 px-8 shadow-lg flex flex-col items-center gap-3">
              <Icon icon="mdi:loading" width={40} height={40} className="animate-spin text-[#1976d2]" />
              <span className="text-sm font-semibold text-[#333]">
                {transitioningTo === 'view' ? 'Switching to View Mode...' :
                 transitioningTo === 'upload' ? 'Switching to Upload Mode...' :
                 'Switching to Edit Mode...'}
              </span>
              <span className="text-xs text-[#666]">Please wait while the page updates</span>
            </div>
          </div>
        )}

        {/* Project Initiation */}
          <DocumentTable
            key={`initiation-${modeKey}`}
            title="Project Initiation"
            docs={initiationDocs}
            projectId={id}
            phase="INITIATION"
            onProgressUpdate={(p, u, t) => { setInitiationProgress(p); setInitiationFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

          {/* Project Implementation */}
          <DocumentTable
            key={`implementation-${modeKey}`}
            title="Project Implementation"
            docs={implementationDocs}
            projectId={id}
            phase="IMPLEMENTATION"
            onProgressUpdate={(p, u, t) => { setImplementationProgress(p); setImplementationFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

          {/* Project Management */}
          <DocumentTable
            key={`management-${modeKey}`}
            title="Project Management"
            docs={managementDocs}
            projectId={id}
            phase="MANAGEMENT"
            onProgressUpdate={(p, u, t) => { setManagementProgress(p); setManagementFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

          {/* Project Monitoring */}
          <DocumentTable
            key={`monitoring-${modeKey}`}
            title="Project Monitoring"
            docs={monitoringDocs}
            projectId={id}
            phase="MONITORING"
            onProgressUpdate={(p, u, t) => { setMonitoringProgress(p); setMonitoringFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

          {/* Project Refund */}
          <DocumentTable
            key={`refund-${modeKey}`}
            title="Project Refund"
            docs={refundDocs}
            projectId={id}
            phase="REFUND"
            onProgressUpdate={(p, u, t) => { setRefundProgress(p); setRefundFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

          {/* Communications */}
          <DocumentTable
            key={`communications-${modeKey}`}
            title="Communications"
            docs={communicationsDocs}
            projectId={id}
            phase="COMMUNICATIONS"
            onProgressUpdate={(p, u, t) => { setCommunicationsProgress(p); setCommunicationsFiles({ uploaded: u, total: t }); }}
            initialDropdownData={project.dropdownData}
            isEditMode={isEditMode}
            isAssigneeEditMode={isAssigneeEditModeActive()}
            isAssigneeUploadMode={isAssigneeUploadModeActive()}
          />

        {/* Edit Request Modal */}
        {editRequestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setEditRequestModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-[440px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#fff3e0] flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:lock-outline" width={36} height={36} color="#f57c00" />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Edit Access Required</h3>
              <p className="text-[14px] text-[#666] m-0 mb-2">
                You don&apos;t have permission to edit this project.
              </p>
              <p className="text-[13px] text-[#888] m-0 mb-6">
                Only the project assignee ({project?.assignee || 'Not assigned'}) or users with approved access can edit this project.
              </p>
              <p className="text-[13px] text-[#555] m-0 mb-6">
                Would you like to send an edit request to the assignee?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
                  onClick={() => setEditRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="py-2.5 px-8 bg-[#f57c00] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#e65100] disabled:bg-[#ccc] disabled:cursor-not-allowed"
                  onClick={sendEditRequest}
                  disabled={sendingRequest}
                >
                  {sendingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Request Sent Confirmation Modal */}
        {editRequestSent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setEditRequestSent(false)}>
            <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#fffff] flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Request Sent!</h3>
              <p className="text-[14px] text-[#666] m-0 mb-6">
                Your edit access request has been sent to {project?.assignee || 'the assignee'}. You will be notified once it&apos;s approved.
              </p>
              <button
                className="py-2.5 px-10 bg-[#2e7d32] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#1b5e20]"
                onClick={() => setEditRequestSent(false)}
              >
                Okay
              </button>
            </div>
          </div>
        )}

        {/* Edit Permission Modal - For Assignee/Admin to manage edit requests */}
        {editPermissionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setEditPermissionModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#eee] bg-[#f9f9f9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
                    <Icon icon="mdi:account-key" width={24} height={24} color="#f57c00" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#333] m-0">Edit Permissions</h3>
                    <p className="text-xs text-[#888] m-0">Manage who can edit this project</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditPermissionModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer text-[#999] hover:bg-[#eee] hover:text-[#333] transition-colors"
                >
                  <Icon icon="mdi:close" width={20} height={20} />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
                {loadingPermissions ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Icon icon="mdi:loading" width={40} height={40} className="animate-spin text-[#f57c00] mb-3" />
                    <p className="text-sm text-[#666] m-0">Loading permissions...</p>
                  </div>
                ) : (
                  <>
                {/* Pending Requests Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                    <Icon icon="mdi:clock-outline" width={16} height={16} color="#f57c00" />
                    Pending Requests
                    {pendingEditRequests.length > 0 && (
                      <span className="bg-[#f57c00] text-white text-[10px] px-2 py-0.5 rounded-full">
                        {pendingEditRequests.length}
                      </span>
                    )}
                  </h4>

                  {pendingEditRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-[#999] text-sm">
                      <Icon icon="mdi:inbox-outline" width={40} height={40} className="mb-2 opacity-50" />
                      <p className="m-0">No pending edit requests</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {pendingEditRequests.map((request) => (
                        <div
                          key={request.userId}
                          className="flex items-center gap-3 p-3 bg-[#f9f9f9] rounded-lg border border-[#eee]"
                        >
                          {/* User Avatar */}
                          {request.userProfileUrl ? (
                            <img
                              src={request.userProfileUrl}
                              alt={request.userName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#f57c00]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-[#f57c00] bg-gray-100 flex items-center justify-center">
                              <Icon icon="mdi:account" width={20} height={20} color="#999" />
                            </div>
                          )}

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#333] m-0 truncate">{request.userName}</p>
                            <p className="text-xs text-[#888] m-0">Requesting edit access</p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => acceptEditRequest(request.userId)}
                              disabled={processingRequest === request.userId}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#2e7d32] text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:bg-[#1b5e20] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingRequest === request.userId ? (
                                <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                              ) : (
                                <Icon icon="mdi:check" width={14} height={14} />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => declineEditRequest(request.userId)}
                              disabled={processingRequest === request.userId}
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#c62828] text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:bg-[#b71c1c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            >
                              <Icon icon="mdi:close" width={14} height={14} />
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Editors Section */}
                {approvedEditorsList.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#eee]">
                    <h4 className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                      <Icon icon="mdi:check-circle" width={16} height={16} color="#2e7d32" />
                      Approved Editors
                      <span className="bg-[#2e7d32] text-white text-[10px] px-2 py-0.5 rounded-full">
                        {approvedEditorsList.length}
                      </span>
                    </h4>
                    <p className="text-xs text-[#888] mb-3">
                      These users have been granted edit access to this project.
                    </p>
                    <div className="flex flex-col gap-2">
                      {approvedEditorsList.map((editor) => (
                        <div
                          key={editor.userId}
                          className="flex items-center gap-3 p-3 bg-[#fffff] rounded-lg border border-[#c8e6c9]"
                        >
                          {/* User Avatar */}
                          {editor.userProfileUrl ? (
                            <img
                              src={editor.userProfileUrl}
                              alt={editor.userName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#2e7d32]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-[#2e7d32] bg-white flex items-center justify-center">
                              <Icon icon="mdi:account" width={20} height={20} color="#2e7d32" />
                            </div>
                          )}

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#2e7d32] m-0 truncate">{editor.userName}</p>
                            <p className="text-xs text-[#66bb6a] m-0">Has edit access</p>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeApprovedEditor(editor.userId)}
                            disabled={processingRequest === editor.userId}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#c62828] border border-[#c62828] rounded-md text-xs font-semibold cursor-pointer hover:bg-[#ffebee] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                            title="Remove edit access"
                          >
                            {processingRequest === editor.userId ? (
                              <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                            ) : (
                              <Icon icon="mdi:account-remove" width={14} height={14} />
                            )}
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#eee] bg-[#f9f9f9]">
                <button
                  onClick={() => setEditPermissionModal(false)}
                  className="w-full py-2.5 bg-primary text-white border-none rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#0d4a5f] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary Preview Modal - A4 Size */}
        {showExecutiveSummaryPreview && project && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 overflow-auto" onClick={() => setShowExecutiveSummaryPreview(false)}>
            <div className="bg-gray-200 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#146184] to-[#1976d2] px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Icon icon="mdi:file-document-outline" width={24} height={24} color="white" />
                  <h3 className="text-white text-lg font-bold m-0">Executive Summary Preview (A4)</h3>
                </div>
                <button onClick={() => setShowExecutiveSummaryPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                  <Icon icon="mdi:close" width={24} height={24} color="white" />
                </button>
              </div>

              {/* A4 Paper Container */}
              <div className="overflow-auto flex-1 p-6 flex justify-center">
                <div
                  className="bg-white shadow-xl"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '15mm 20mm',
                    fontFamily: 'Calibri, Arial, sans-serif',
                    fontSize: '11pt',
                    lineHeight: '1.3',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Header - Logo floating left, Title truly centered */}
                  <div style={{ position: 'relative', marginBottom: '15px' }}>
                    {/* Logo positioned absolutely so it doesn't affect title centering */}
                    <img
                      src="/setup-4.0-logo.png"
                      alt="SETUP 4.0 Logo"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '45px',
                        width: 'auto'
                      }}
                    />
                    {/* Title centered across full width */}
                    <div style={{ width: '100%', textAlign: 'center', paddingTop: '10px', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '24pt', fontWeight: 'bold', letterSpacing: '1px' }}>EXECUTIVE SUMMARY</span>
                    </div>
                  </div>

                  {/* Main Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <tbody>
                      {/* Project Title */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', width: '35%' }}>Project Title:</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>{project.title || ''}</td>
                      </tr>
                      {/* Proponent */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Proponent:</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>{project.corporatorName || ''}</td>
                      </tr>
                      {/* Requested Amount */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Requested Amount:</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <input type="text" value={execSummaryData.requestedAmount} onChange={(e) => updateExecSummaryField('requestedAmount', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} placeholder="" />
                        </td>
                      </tr>
                      {/* Owner's Equity */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Owner&apos;s Equity:</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <input type="text" value={execSummaryData.ownersEquity} onChange={(e) => updateExecSummaryField('ownersEquity', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} placeholder="" />
                        </td>
                      </tr>
                      {/* Total Project Cost */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>Total Project Cost:</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <input type="text" value={execSummaryData.totalProjectCost} onChange={(e) => updateExecSummaryField('totalProjectCost', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 1. DOST technology */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>1. DOST technology to be adopted and the mode of techno transfer.</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <textarea value={execSummaryData.dostTechnology} onChange={(e) => updateExecSummaryField('dostTechnology', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', minHeight: '30px' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 2. Income - Header row */}
                      <tr>
                        <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle', width: '35%' }}>2. Income</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', width: '32.5%', textAlign: 'center', fontWeight: 'bold' }}>Present</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', width: '32.5%', textAlign: 'center', fontWeight: 'bold' }}>Additional (Y1)</td>
                      </tr>
                      {/* 2. Income - Value row */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.incomePresent} onChange={(e) => updateExecSummaryField('incomePresent', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.incomeAdditional} onChange={(e) => updateExecSummaryField('incomeAdditional', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 3. Jobs Created - Header row */}
                      <tr>
                        <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle' }}>3. Jobs Created</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Present</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Additional (Y1)</td>
                      </tr>
                      {/* 3. Jobs Created - Value row */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.jobsCreatedPresent} onChange={(e) => updateExecSummaryField('jobsCreatedPresent', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.jobsCreatedAdditional} onChange={(e) => updateExecSummaryField('jobsCreatedAdditional', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 4. Productivity - Header row */}
                      <tr>
                        <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle' }}>4. Productivity</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Present</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Increase (Y1)</td>
                      </tr>
                      {/* 4. Productivity - Value row */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.productivityPresent} onChange={(e) => updateExecSummaryField('productivityPresent', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.productivityIncrease} onChange={(e) => updateExecSummaryField('productivityIncrease', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 5. Market - Header row */}
                      <tr>
                        <td rowSpan={2} style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle' }}>5. Market</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Present</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>Additional (Y1)</td>
                      </tr>
                      {/* 5. Market - Value row */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.marketPresent} onChange={(e) => updateExecSummaryField('marketPresent', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>
                          <input type="text" value={execSummaryData.marketAdditional} onChange={(e) => updateExecSummaryField('marketAdditional', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 6. List of Products */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>6. List of Products</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <textarea value={execSummaryData.listOfProducts} onChange={(e) => updateExecSummaryField('listOfProducts', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', minHeight: '30px' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 7. With FDA-LTO? */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>7. With FDA-LTO?</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <input type="text" value={execSummaryData.withFdaLto} onChange={(e) => updateExecSummaryField('withFdaLto', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 8. With CPRs? */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>8. With CPRs?</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px' }} colSpan={2}>
                          <input type="text" value={execSummaryData.withCprs} onChange={(e) => updateExecSummaryField('withCprs', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 9. Business plan paragraph */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>9. A short paragraph on the business plan answering the question, How will the enterprise earn income?</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', minHeight: '80px' }} colSpan={2}>
                          <textarea value={execSummaryData.businessPlan} onChange={(e) => updateExecSummaryField('businessPlan', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', minHeight: '60px' }} placeholder="" />
                        </td>
                      </tr>
                      {/* 10. Plans */}
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'top' }}>10. Plans</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', minHeight: '100px' }} colSpan={2}>
                          <textarea value={execSummaryData.plans} onChange={(e) => updateExecSummaryField('plans', e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'none', minHeight: '80px' }} placeholder="" />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer - Prepared by / Reviewed by */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                    {/* Prepared by */}
                    <div style={{ width: '45%' }}>
                      <div style={{ marginBottom: '8px' }}>Prepared by:</div>
                      <div style={{ marginTop: '40px' }}>
                        <input
                          type="text"
                          value={execSummaryData.preparedByName}
                          onChange={(e) => updateExecSummaryField('preparedByName', e.target.value)}
                          style={{ width: '100%', borderBottom: '1px solid #000', background: 'transparent', outline: 'none', textAlign: 'left', paddingBottom: '2px' }}
                          placeholder=""
                        />
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <input
                          type="text"
                          value={execSummaryData.preparedByPosition}
                          onChange={(e) => updateExecSummaryField('preparedByPosition', e.target.value)}
                          style={{ width: '100%', background: 'transparent', outline: 'none', textAlign: 'left', fontSize: '10pt', border: 'none' }}
                          placeholder=""
                        />
                      </div>
                    </div>
                    {/* Reviewed by */}
                    <div style={{ width: '45%' }}>
                      <div style={{ marginBottom: '8px' }}>Reviewed by</div>
                      <div style={{ marginTop: '40px' }}>
                        <input
                          type="text"
                          value={execSummaryData.reviewedByName}
                          onChange={(e) => updateExecSummaryField('reviewedByName', e.target.value)}
                          style={{ width: '100%', borderBottom: '1px solid #000', background: 'transparent', outline: 'none', textAlign: 'left', paddingBottom: '2px' }}
                          placeholder=""
                        />
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        <input
                          type="text"
                          value={execSummaryData.reviewedByPosition}
                          onChange={(e) => updateExecSummaryField('reviewedByPosition', e.target.value)}
                          style={{ width: '100%', background: 'transparent', outline: 'none', textAlign: 'left', fontSize: '10pt', border: 'none' }}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                <button onClick={() => setShowExecutiveSummaryPreview(false)} className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors">
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!project) return;
                    await downloadExecutiveSummary(project, execSummaryData);
                    setShowExecutiveSummaryPreview(false);
                  }}
                  className="px-5 py-2 bg-[#1976d2] text-white rounded-lg text-sm font-semibold hover:bg-[#1565c0] transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:download" width={18} height={18} />
                  Download DOCX
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
