"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../components/DashboardLayout";

interface PartnerLGU {
  name: string;
  logoUrl: string | null;
}

interface CestProject {
  id: string;
  code: string;
  projectTitle: string;
  location: string | null;
  beneficiaries: string | null;
  programFunding: string | null;
  categories: string[] | null;
  status: string | null;
  approvedAmount: number | null;
  releasedAmount: number | null;
  projectDuration: string | null;
  staffAssigned: string | null;
  assigneeProfileUrl: string | null;
  year: string | null;
  dateOfApproval: string | null;
  dropdownData: Record<string, unknown> | null;
  partnerLGUs: PartnerLGU[] | null;
  typeOfBeneficiary: string | null;
  stakeholderCounterparts: string[] | null;
  createdAt: string;
}

interface EditRequest {
  userId: string;
  userName: string;
  userProfileUrl: string | null;
  requestedAt: string;
}

interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  profileImageUrl?: string;
}

// Helper to get userId for activity logging
function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    return JSON.parse(stored)?.id || null;
  } catch {
    return null;
  }
}

// Helper to create headers with userId
function getAuthHeaders(): HeadersInit {
  const userId = getUserId();
  return userId ? { "x-user-id": userId } : {};
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
  type?: "dropdown";
  options?: string[];
};

interface EquipmentItem {
  id: string;
  name: string;
  cost: string;
  status: "Procured" | "Pulled Out";
  propertyCode: string;
}

interface NonEquipmentItem {
  id: string;
  type: string;
  description: string;
}

interface InterventionData {
  interventionType: "Equipment" | "Non-Equipment" | "";
  equipmentItems: EquipmentItem[];
  nonEquipmentItems: NonEquipmentItem[];
  customEquipmentOptions: string[];
  customNonEquipmentOptions: string[];
}

const initiationDocs: DocRow[] = [
  { id: 1, label: "Letter of Intent" },
  { id: 2, label: "Special Order for the Designation of the Project Leader by the Head of Office" },
  { id: 3, label: "Endorsement of the Project by the Head of Office" },
  { id: 4, label: "Board Resolution" },
  { id: 5, label: "TNA Form" },
  { id: 6, label: "Beneficiary Profile" },
  { id: 7, label: "Form 3 - Full Blown Proposal" },
  { id: 8, label: "Form 4 - Line-Item Budget" },
  { id: 9, label: "Form 5 - Workplan and Risk Assessment" },
  { id: 10, label: "Abstract Quotation Sheet" },
  { id: 11, label: "Quotation for the Equipment" },
  { id: 12, label: "Review and Evaluation Report" },
  { id: 13, label: "Executive Summary (word template for input)" },
  { id: 14, label: "List of Intervention",type: "dropdown", options: ["Equipment", "Non-Equipment"] },
];

const implementationDocs: DocRow[] = [
  { id: 1, label: "Memorandum of Agreement/Understanding" },
  { id: 2, label: "Approval Letter" },
  { id: 3, label: "DV/ORS to the LGU/Stakeholder" },
  { id: 4, label: "Copy of OR/Acknowledgement Receipt" },
];

const monitoringDocs: DocRow[] = [
  { id: 1, label: "Quarterly Progress Report" },
  { id: 2, label: "List of Personnel Involved" },
  { id: 3, label: "List of Equipment Purchased" },
  { id: 4, label: "Report of Income Generated" },
  { id: 5, label: "Terminal Audited Financial Report" },
  { id: 6, label: "Communications to the Partner Institution" },
];

interface CustomRow {
  id: string;
  sectionLabel: string;
  name: string;
  rowType: 'item' | 'dropdown';
  dropdownOptions?: string[];
  textValue?: string;
}

function CestDocumentTable({
  title,
  docs,
  projectId,
  phase,
  onProgressUpdate,
  isEditMode = true,
  isAssigneeEditMode = false,
  isAssigneeUploadMode = false,
  customRows = [],
  onAddRowClick,
  onEditRowClick,
  onDeleteRowClick,
}: {
  title: string;
  docs: DocRow[];
  projectId: string;
  phase: "INITIATION" | "IMPLEMENTATION" | "MONITORING";
  onProgressUpdate?: (
    progress: number,
    uploaded: number,
    total: number,
  ) => void;
  isEditMode?: boolean;
  isAssigneeEditMode?: boolean;
  isAssigneeUploadMode?: boolean;
  customRows?: CustomRow[];
  onAddRowClick?: (sectionLabel: string) => void;
  onEditRowClick?: (row: CustomRow) => void;
  onDeleteRowClick?: (row: CustomRow) => void;
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

  // Intervention state
  const defaultTypeOptions = ["Equipment", "Non-equipment"];
  const defaultStatusOptions = ["Procured", "Pulled Out"];
  const defaultNonEquipmentSubTypes = ["Laboratory Testing", "Packaging", "Labelling", "Trainings"];

  const [interventionRows, setInterventionRows] = useState<Array<{
    type: string;
    // Equipment fields
    name: string;
    cost: string;
    status: string;
    propertyCode: string;
    // Non-equipment fields
    subType: string;
    description: string;
  }>>([]);
  const [interventionTypeOptions, setInterventionTypeOptions] = useState<string[]>([...defaultTypeOptions]);
  const [interventionStatusOptions, setInterventionStatusOptions] = useState<string[]>([...defaultStatusOptions]);
  const [nonEquipmentSubTypeOptions, setNonEquipmentSubTypeOptions] = useState<string[]>([...defaultNonEquipmentSubTypes]);
  const [interventionExpanded, setInterventionExpanded] = useState(false);

  // Dropdown portal states
  const [typeDropdownOpen, setTypeDropdownOpen] = useState<number | null>(null);
  const [typeDropdownPos, setTypeDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<number | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [subTypeDropdownOpen, setSubTypeDropdownOpen] = useState<number | null>(null);
  const [subTypeDropdownPos, setSubTypeDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const subTypeDropdownRef = useRef<HTMLDivElement>(null);

  // Add new option modals
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [showAddSubTypeModal, setShowAddSubTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newSubTypeName, setNewSubTypeName] = useState("");

  // Legacy intervention data for backwards compatibility
  const [interventionData, setInterventionData] = useState<InterventionData>({
    interventionType: "",
    equipmentItems: [],
    nonEquipmentItems: [],
    customEquipmentOptions: [],
    customNonEquipmentOptions: [],
  });
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddNonEquipmentModal, setShowAddNonEquipmentModal] = useState(false);
  const [showAddCustomOptionModal, setShowAddCustomOptionModal] = useState<"equipment" | "non-equipment" | null>(null);
  const [newCustomOption, setNewCustomOption] = useState("");
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [editingNonEquipment, setEditingNonEquipment] = useState<NonEquipmentItem | null>(null);
  const [newEquipment, setNewEquipment] = useState<Omit<EquipmentItem, "id">>({
    name: "",
    cost: "",
    status: "Procured",
    propertyCode: "",
  });
  const [newNonEquipment, setNewNonEquipment] = useState<Omit<NonEquipmentItem, "id">>({
    type: "",
    description: "",
  });

  // Load intervention rows from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`intervention-rows-${projectId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.rows) setInterventionRows(data.rows);
        if (data.typeOptions) setInterventionTypeOptions(data.typeOptions);
        if (data.statusOptions) setInterventionStatusOptions(data.statusOptions);
        if (data.subTypeOptions) setNonEquipmentSubTypeOptions(data.subTypeOptions);
      } catch {
        // Invalid data, use defaults
      }
    }
  }, [projectId]);

  // Save intervention rows to localStorage on change
  useEffect(() => {
    if (interventionRows.length > 0 || interventionTypeOptions.length > defaultTypeOptions.length || interventionStatusOptions.length > defaultStatusOptions.length || nonEquipmentSubTypeOptions.length > defaultNonEquipmentSubTypes.length) {
      localStorage.setItem(`intervention-rows-${projectId}`, JSON.stringify({
        rows: interventionRows,
        typeOptions: interventionTypeOptions,
        statusOptions: interventionStatusOptions,
        subTypeOptions: nonEquipmentSubTypeOptions,
      }));
    }
  }, [interventionRows, interventionTypeOptions, interventionStatusOptions, nonEquipmentSubTypeOptions, projectId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (typeDropdownOpen !== null && !target.closest('[data-intervention-type-dropdown]')) {
        setTypeDropdownOpen(null);
      }
      if (statusDropdownOpen !== null && !target.closest('[data-intervention-status-dropdown]')) {
        setStatusDropdownOpen(null);
      }
      if (subTypeDropdownOpen !== null && !target.closest('[data-intervention-subtype-dropdown]')) {
        setSubTypeDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [typeDropdownOpen, statusDropdownOpen, subTypeDropdownOpen]);

  // Legacy: Load old intervention data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`intervention-${projectId}`);
    if (saved) {
      try {
        setInterventionData(JSON.parse(saved));
      } catch {
        // Invalid data, use defaults
      }
    }
  }, [projectId]);

  // Legacy: Save old intervention data to localStorage on change
  useEffect(() => {
    if (interventionData.interventionType || interventionData.equipmentItems.length || interventionData.nonEquipmentItems.length) {
      localStorage.setItem(`intervention-${projectId}`, JSON.stringify(interventionData));
    }
  }, [interventionData, projectId]);

  const handleAddEquipment = () => {
    if (!newEquipment.name.trim()) return;
    const item: EquipmentItem = {
      id: Date.now().toString(),
      ...newEquipment,
    };
    setInterventionData((prev) => ({
      ...prev,
      equipmentItems: [...prev.equipmentItems, item],
    }));
    setNewEquipment({ name: "", cost: "", status: "Procured", propertyCode: "" });
    setShowAddEquipmentModal(false);
  };

  const handleUpdateEquipment = () => {
    if (!editingEquipment) return;
    setInterventionData((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.map((item) =>
        item.id === editingEquipment.id ? editingEquipment : item
      ),
    }));
    setEditingEquipment(null);
  };

  const handleDeleteEquipment = (id: string) => {
    setInterventionData((prev) => ({
      ...prev,
      equipmentItems: prev.equipmentItems.filter((item) => item.id !== id),
    }));
  };

  const handleAddNonEquipment = () => {
    if (!newNonEquipment.type.trim()) return;
    const item: NonEquipmentItem = {
      id: Date.now().toString(),
      ...newNonEquipment,
    };
    setInterventionData((prev) => ({
      ...prev,
      nonEquipmentItems: [...prev.nonEquipmentItems, item],
    }));
    setNewNonEquipment({ type: "", description: "" });
    setShowAddNonEquipmentModal(false);
  };

  const handleUpdateNonEquipment = () => {
    if (!editingNonEquipment) return;
    setInterventionData((prev) => ({
      ...prev,
      nonEquipmentItems: prev.nonEquipmentItems.map((item) =>
        item.id === editingNonEquipment.id ? editingNonEquipment : item
      ),
    }));
    setEditingNonEquipment(null);
  };

  const handleDeleteNonEquipment = (id: string) => {
    setInterventionData((prev) => ({
      ...prev,
      nonEquipmentItems: prev.nonEquipmentItems.filter((item) => item.id !== id),
    }));
  };

  const handleAddCustomOption = () => {
    if (!newCustomOption.trim()) return;
    if (showAddCustomOptionModal === "equipment") {
      setInterventionData((prev) => ({
        ...prev,
        customEquipmentOptions: [...prev.customEquipmentOptions, newCustomOption.trim()],
      }));
    } else if (showAddCustomOptionModal === "non-equipment") {
      setInterventionData((prev) => ({
        ...prev,
        customNonEquipmentOptions: [...prev.customNonEquipmentOptions, newCustomOption.trim()],
      }));
    }
    setNewCustomOption("");
    setShowAddCustomOptionModal(null);
  };

  const getAllNonEquipmentOptions = () => {
    return [...defaultNonEquipmentSubTypes, ...interventionData.customNonEquipmentOptions];
  };

  const getDocsForItem = (templateItemId: string): ProjectDocument[] => {
    return documents.filter((d) => d.templateItemId === templateItemId);
  };

  const getDocForItem = (
    templateItemId: string,
  ): ProjectDocument | undefined => {
    return documents.find((d) => d.templateItemId === templateItemId);
  };

  useEffect(() => {
    if (onProgressUpdate) {
      let totalItems = docs.length;
      let uploadedItems = 0;
      docs.forEach((doc) => {
        const templateItemId = `${phase}-${doc.id}`;
        if (getDocForItem(templateItemId)) uploadedItems++;
      });
      const percent =
        totalItems > 0 ? Math.round((uploadedItems / totalItems) * 100) : 0;
      onProgressUpdate(percent, uploadedItems, totalItems);
    }
  }, [documents]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(`/api/cest-projects/${projectId}/documents`);
      if (!res.ok) return;
      const allDocs: ProjectDocument[] = await res.json();
      setDocuments(allDocs.filter((d) => d.phase === phase));
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
    e.target.value = "";

    setUploadingItemId(templateItemId);
    try {
      let lastUploaded: {
        fileName: string;
        fileType: string;
        fileSize: string;
        date: string;
      } | null = null;
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("phase", phase);
        formData.append("templateItemId", templateItemId);

        const res = await fetch(`/api/cest-projects/${projectId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        const sizeKB = (file.size / 1024).toFixed(1);
        const sizeStr =
          file.size >= 1048576
            ? `${(file.size / 1048576).toFixed(2)} MB`
            : `${sizeKB} KB`;
        lastUploaded = {
          fileName: file.name,
          fileType: file.type.split("/").pop()?.toUpperCase() || "FILE",
          fileSize: sizeStr,
          date: new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
        };
      }
      await fetchDocuments();
      if (lastUploaded) {
        setUploadSuccess({ ...lastUploaded, uploadedBy: "User" });
      }
    } catch {
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingItemId(null);
      targetItemIdRef.current = null;
    }
  };

  const handleDeleteAll = async (templateItemId: string) => {
    const docsList = getDocsForItem(templateItemId);
    if (docsList.length === 0) return;
    const msg =
      docsList.length === 1
        ? `Delete "${docsList[0].fileName}"?`
        : `Delete all ${docsList.length} files for this item?`;
    if (!confirm(msg)) return;
    try {
      await Promise.all(
        docsList.map((d) =>
          fetch(`/api/cest-projects/${projectId}/documents/${d.id}`, {
            method: "DELETE",
          }),
        ),
      );
      await fetchDocuments();
    } catch {
      alert("Failed to delete files. Please try again.");
    }
  };

  const handleDeleteSingle = async (docId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    try {
      await fetch(`/api/cest-projects/${projectId}/documents/${docId}`, {
        method: "DELETE",
      });
      await fetchDocuments();
    } catch {
      alert("Failed to delete file. Please try again.");
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl mb-8 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <h2 className="text-base font-bold text-primary pt-5 px-7 m-0 mb-3">
          {title}
        </h2>

        {/* Mode Banners */}
        {isAssigneeUploadMode && (
          <div className="flex items-start gap-2 bg-[#fff8e1] border border-[#ffcc80] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#f57c00] leading-[1.4]">
            <Icon
              icon="mdi:upload"
              width={16}
              height={16}
              className="min-w-4 mt-px"
            />
            <span>
              <strong>Upload Mode:</strong> You can upload, view, and delete documents.
              Switch to <strong>Edit Mode</strong> to add custom rows and customize the document structure.
            </span>
          </div>
        )}
        {isAssigneeEditMode && (
          <div className="flex items-start gap-2 bg-[#e8f5e9] border border-[#a5d6a7] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#2e7d32] leading-[1.4]">
            <Icon
              icon="mdi:pencil-plus-outline"
              width={16}
              height={16}
              className="min-w-4 mt-px"
            />
            <span>
              <strong>Edit Mode:</strong> You can add custom rows, edit row names, and customize the document structure.
              Use the <strong>Add New Row</strong> button below each table to add custom document rows.
            </span>
          </div>
        )}
        {!isEditMode && (
          <div className="flex items-start gap-2 bg-[#fff3e0] border border-[#ffcc80] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#e65100] leading-[1.4]">
            <Icon
              icon="mdi:eye-outline"
              width={16}
              height={16}
              className="min-w-4 mt-px"
            />
            <span>
              <strong>View Mode:</strong> You are currently in view mode.
              Editing, uploading, and deleting are disabled. Click &quot;Edit
              Mode&quot; button to enable editing.
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 bg-[#e1f5fe] border border-[#b3e5fc] rounded-lg py-2.5 px-4 mx-7 mb-4 text-xs text-[#0277bd] leading-[1.4]">
          <Icon
            icon="mdi:information-outline"
            width={16}
            height={16}
            className="min-w-4 mt-px"
          />
          <span>
            To ensure that the document you uploaded is viewable in our system,
            click the View button below and check the document you uploaded. If
            it is not viewable, re-upload the document
          </span>
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
                <th className="w-9 py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                  #
                </th>
                <th className="min-w-[240px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                  Documentary Requirements
                </th>
                <th className="w-40 py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                  File
                </th>
                <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                  Date Uploaded
                </th>
                <th className="w-[120px] py-2.5 px-3 text-left font-semibold text-xs whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, idx) => {
                const templateItemId = `${phase}-${doc.id}`;
                const allDocsForItem = getDocsForItem(templateItemId);
                const latestDoc = allDocsForItem[0];
                const isUploading = uploadingItemId === templateItemId;
                const hasFile = allDocsForItem.length > 0;

                // Special rendering for intervention dropdown row (matching setup page style)
                if (doc.type === "dropdown" && doc.label === "List of Intervention") {
                  const interventionKey = `${phase}-${doc.id}`;
                  return (
                    <React.Fragment key={`${title}-${doc.id}-${idx}`}>
                      <tr>
                        <td colSpan={5} className="p-0 border-b border-[#eee]">
                          <button
                            className="flex items-center gap-1.5 bg-white border-none py-2 px-3 text-[13px] text-[#2e7d32] font-semibold cursor-pointer w-full transition-colors duration-200 hover:bg-[#c8e6c9]"
                            onClick={() => setInterventionExpanded(!interventionExpanded)}
                          >
                            <Icon icon={interventionExpanded ? "mdi:chevron-down" : "mdi:chevron-right"} width={18} height={18} />
                            <span>{doc.label}</span>
                            {interventionRows.length > 0 && (
                              <span className="ml-2 text-[10px] bg-[#2e7d32] text-white px-2 py-0.5 rounded-full">
                                {interventionRows.length} item(s)
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                      {interventionExpanded && (
                        <tr>
                          <td colSpan={5} className="p-4 bg-[#f9f9f9] border-b border-[#eee]">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-[#555]">Intervention Items</span>
                                <button
                                  onClick={() => {
                                    if (!isEditMode) return;
                                    setInterventionRows([...interventionRows, { type: "", name: "", cost: "", status: "", propertyCode: "", subType: "", description: "" }]);
                                  }}
                                  disabled={!isEditMode}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${isEditMode ? "bg-[#2e7d32] text-white hover:bg-[#1b5e20]" : "bg-[#ccc] text-white cursor-not-allowed"}`}
                                >
                                  + Add Item
                                </button>
                              </div>

                              {interventionRows.length === 0 && (
                                <p className="text-xs text-[#999] italic text-center py-4">
                                  No items added yet. Click the button above to add one.
                                </p>
                              )}

                              {interventionRows.map((row, rowIdx) => {
                                const isCustomTypeOption = (opt: string) => !defaultTypeOptions.includes(opt);
                                const isCustomStatusOption = (opt: string) => !defaultStatusOptions.includes(opt);
                                const isCustomSubTypeOption = (opt: string) => !defaultNonEquipmentSubTypes.includes(opt);

                                return (
                                  <div key={rowIdx} className="bg-white border border-[#ddd] rounded p-3">
                                    {/* Header with Type Dropdown and Remove Button */}
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className="text-xs font-semibold text-[#2e7d32] min-w-[60px]">
                                        Item #{rowIdx + 1}
                                      </span>
                                      {/* Type Dropdown - Always visible first */}
                                      <div className="relative flex-1" data-intervention-type-dropdown>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            if (!isEditMode) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTypeDropdownPos({
                                              top: rect.bottom + 4,
                                              left: rect.left,
                                              width: rect.width
                                            });
                                            setTypeDropdownOpen(typeDropdownOpen === rowIdx ? null : rowIdx);
                                          }}
                                          disabled={!isEditMode}
                                          className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer hover:border-[#aaa]"}`}
                                        >
                                          <span className={row.type ? "text-[#333]" : "text-[#999]"}>
                                            {row.type || "Select type (Equipment / Non-equipment)..."}
                                          </span>
                                          <Icon icon="mdi:chevron-down" width={16} height={16} className="text-[#666]" />
                                        </button>
                                        {typeDropdownOpen === rowIdx && (
                                          <div
                                            ref={typeDropdownRef}
                                            data-intervention-type-dropdown
                                            className="fixed bg-white border border-[#ddd] rounded shadow-lg max-h-[200px] overflow-y-auto z-[99999]"
                                            style={{
                                              top: typeDropdownPos.top,
                                              left: typeDropdownPos.left,
                                              minWidth: typeDropdownPos.width,
                                            }}
                                          >
                                            {interventionTypeOptions.map(opt => (
                                              <div
                                                key={opt}
                                                className="group px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-[#f5f5f5] text-[#333]"
                                                onClick={() => {
                                                  const updated = [...interventionRows];
                                                  updated[rowIdx].type = opt;
                                                  // Reset type-specific fields when changing type
                                                  if (opt === "Equipment") {
                                                    updated[rowIdx].subType = "";
                                                    updated[rowIdx].description = "";
                                                  } else {
                                                    updated[rowIdx].name = "";
                                                    updated[rowIdx].cost = "";
                                                    updated[rowIdx].status = "";
                                                    updated[rowIdx].propertyCode = "";
                                                  }
                                                  setInterventionRows(updated);
                                                  setTypeDropdownOpen(null);
                                                }}
                                              >
                                                <span>{opt}</span>
                                                {isCustomTypeOption(opt) && isEditMode && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (confirm(`Remove "${opt}" from options?`)) {
                                                        setInterventionTypeOptions(interventionTypeOptions.filter(t => t !== opt));
                                                        setTypeDropdownOpen(null);
                                                      }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-[#c62828] hover:bg-[#ffebee] rounded transition-opacity"
                                                    title={`Remove "${opt}"`}
                                                  >
                                                    <Icon icon="mdi:close" width={14} height={14} />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                            <div
                                              className="px-3 py-2 text-xs text-[#1976d2] font-semibold hover:bg-[#e3f2fd] cursor-pointer border-t border-[#eee]"
                                              onClick={() => {
                                                setShowAddTypeModal(true);
                                                setTypeDropdownOpen(null);
                                              }}
                                            >
                                              <Icon icon="mdi:plus" width={14} height={14} className="inline mr-1" />
                                              Add new option
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {/* Remove Button */}
                                      <button
                                        onClick={() => {
                                          if (!isEditMode) return;
                                          if (confirm(`Remove Item #${rowIdx + 1}?`)) {
                                            setInterventionRows(interventionRows.filter((_, i) => i !== rowIdx));
                                          }
                                        }}
                                        disabled={!isEditMode}
                                        className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${isEditMode ? "bg-[#c62828] cursor-pointer hover:opacity-80" : "bg-[#ccc] cursor-not-allowed"}`}
                                        title="Remove item"
                                      >
                                        <Icon icon="mdi:close" width={14} height={14} />
                                      </button>
                                    </div>

                                    {/* Equipment Fields - Only show when type is "Equipment" */}
                                    {row.type === "Equipment" && (
                                      <div className="mt-3 pt-3 border-t border-[#eee]">
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Name of Equipment *</label>
                                            <input
                                              type="text"
                                              value={row.name}
                                              onChange={(e) => {
                                                const updated = [...interventionRows];
                                                updated[rowIdx].name = e.target.value;
                                                setInterventionRows(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter equipment name..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Cost</label>
                                            <input
                                              type="text"
                                              value={row.cost}
                                              onChange={(e) => {
                                                const updated = [...interventionRows];
                                                updated[rowIdx].cost = e.target.value;
                                                setInterventionRows(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter cost..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                            />
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          {/* Status Dropdown (Procured/Pulled Out) */}
                                          <div className="relative" data-intervention-status-dropdown>
                                            <label className="block text-xs text-[#555] mb-1">Procured/Pulled Out</label>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                if (!isEditMode) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setStatusDropdownPos({
                                                  top: rect.bottom + 4,
                                                  left: rect.left,
                                                  width: rect.width
                                                });
                                                setStatusDropdownOpen(statusDropdownOpen === rowIdx ? null : rowIdx);
                                              }}
                                              disabled={!isEditMode}
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"}`}
                                            >
                                              <span className={row.status ? "text-[#333]" : "text-[#999]"}>
                                                {row.status || "Select..."}
                                              </span>
                                              <Icon icon={statusDropdownOpen === rowIdx ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} height={16} className="text-[#666]" />
                                            </button>
                                            {statusDropdownOpen === rowIdx && (
                                              <div
                                                ref={statusDropdownRef}
                                                data-intervention-status-dropdown
                                                className="fixed bg-white border border-[#ddd] rounded shadow-lg z-[99999] max-h-[200px] overflow-y-auto"
                                                style={{
                                                  top: statusDropdownPos.top,
                                                  left: statusDropdownPos.left,
                                                  minWidth: statusDropdownPos.width,
                                                }}
                                              >
                                                {interventionStatusOptions.map(opt => (
                                                  <div
                                                    key={opt}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer text-xs group"
                                                    onClick={() => {
                                                      const updated = [...interventionRows];
                                                      updated[rowIdx].status = opt;
                                                      setInterventionRows(updated);
                                                      setStatusDropdownOpen(null);
                                                    }}
                                                  >
                                                    <span>{opt}</span>
                                                    {isCustomStatusOption(opt) && isEditMode && (
                                                      <button
                                                        type="button"
                                                        className="opacity-0 group-hover:opacity-100 text-[#c62828] hover:text-[#b71c1c] transition-opacity"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (confirm(`Remove "${opt}" from options?`)) {
                                                            setInterventionStatusOptions(interventionStatusOptions.filter(o => o !== opt));
                                                            setStatusDropdownOpen(null);
                                                          }
                                                        }}
                                                      >
                                                        <Icon icon="mdi:close" width={14} height={14} />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                                <div
                                                  className="px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer text-xs text-[#1976d2] font-semibold border-t border-[#eee]"
                                                  onClick={() => {
                                                    setShowAddStatusModal(true);
                                                    setStatusDropdownOpen(null);
                                                  }}
                                                >
                                                  + Add new option
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Equipment Property Code</label>
                                            <input
                                              type="text"
                                              value={row.propertyCode}
                                              onChange={(e) => {
                                                const updated = [...interventionRows];
                                                updated[rowIdx].propertyCode = e.target.value;
                                                setInterventionRows(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter property code..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Non-equipment Fields - Only show when type is "Non-equipment" */}
                                    {row.type === "Non-equipment" && (
                                      <div className="mt-3 pt-3 border-t border-[#eee]">
                                        <div className="grid grid-cols-2 gap-3">
                                          {/* Sub-type Dropdown */}
                                          <div className="relative" data-intervention-subtype-dropdown>
                                            <label className="block text-xs text-[#555] mb-1">Type *</label>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                if (!isEditMode) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setSubTypeDropdownPos({
                                                  top: rect.bottom + 4,
                                                  left: rect.left,
                                                  width: rect.width
                                                });
                                                setSubTypeDropdownOpen(subTypeDropdownOpen === rowIdx ? null : rowIdx);
                                              }}
                                              disabled={!isEditMode}
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs text-left flex items-center justify-between ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : "bg-white cursor-pointer"}`}
                                            >
                                              <span className={row.subType ? "text-[#333]" : "text-[#999]"}>
                                                {row.subType || "Select type..."}
                                              </span>
                                              <Icon icon={subTypeDropdownOpen === rowIdx ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} height={16} className="text-[#666]" />
                                            </button>
                                            {subTypeDropdownOpen === rowIdx && (
                                              <div
                                                ref={subTypeDropdownRef}
                                                data-intervention-subtype-dropdown
                                                className="fixed bg-white border border-[#ddd] rounded shadow-lg z-[99999] max-h-[200px] overflow-y-auto"
                                                style={{
                                                  top: subTypeDropdownPos.top,
                                                  left: subTypeDropdownPos.left,
                                                  minWidth: subTypeDropdownPos.width,
                                                }}
                                              >
                                                {nonEquipmentSubTypeOptions.map(opt => (
                                                  <div
                                                    key={opt}
                                                    className="flex items-center justify-between px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer text-xs group"
                                                    onClick={() => {
                                                      const updated = [...interventionRows];
                                                      updated[rowIdx].subType = opt;
                                                      setInterventionRows(updated);
                                                      setSubTypeDropdownOpen(null);
                                                    }}
                                                  >
                                                    <span>{opt}</span>
                                                    {isCustomSubTypeOption(opt) && isEditMode && (
                                                      <button
                                                        type="button"
                                                        className="opacity-0 group-hover:opacity-100 text-[#c62828] hover:text-[#b71c1c] transition-opacity"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (confirm(`Remove "${opt}" from options?`)) {
                                                            setNonEquipmentSubTypeOptions(nonEquipmentSubTypeOptions.filter(o => o !== opt));
                                                            setSubTypeDropdownOpen(null);
                                                          }
                                                        }}
                                                      >
                                                        <Icon icon="mdi:close" width={14} height={14} />
                                                      </button>
                                                    )}
                                                  </div>
                                                ))}
                                                <div
                                                  className="px-3 py-2 hover:bg-[#f5f5f5] cursor-pointer text-xs text-[#1976d2] font-semibold border-t border-[#eee]"
                                                  onClick={() => {
                                                    setShowAddSubTypeModal(true);
                                                    setSubTypeDropdownOpen(null);
                                                  }}
                                                >
                                                  + Add new option
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <label className="block text-xs text-[#555] mb-1">Description (Optional)</label>
                                            <input
                                              type="text"
                                              value={row.description}
                                              onChange={(e) => {
                                                const updated = [...interventionRows];
                                                updated[rowIdx].description = e.target.value;
                                                setInterventionRows(updated);
                                              }}
                                              disabled={!isEditMode}
                                              placeholder="Enter description..."
                                              className={`w-full border border-[#ddd] rounded px-3 py-2 text-xs ${!isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Prompt to select type if not selected */}
                                    {!row.type && (
                                      <div className="mt-2 text-xs text-[#999] italic">
                                        Please select a type above to see the relevant fields.
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {interventionRows.length > 0 && (
                                <div className="flex justify-end pt-2">
                                  <button
                                    onClick={() => {
                                      localStorage.setItem(`intervention-rows-${projectId}`, JSON.stringify({
                                        rows: interventionRows,
                                        typeOptions: interventionTypeOptions,
                                        statusOptions: interventionStatusOptions,
                                        subTypeOptions: nonEquipmentSubTypeOptions,
                                      }));
                                      alert(`${interventionRows.length} intervention item(s) saved successfully!`);
                                    }}
                                    disabled={!isEditMode}
                                    className="bg-[#1976d2] text-white px-4 py-2 rounded text-xs font-semibold hover:bg-[#1565c0] transition-colors disabled:bg-[#ccc] disabled:cursor-not-allowed"
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

                return (
                  <tr key={`${title}-${doc.id}-${idx}`}>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#333]">
                      {doc.label}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      {hasFile ? (
                        (() => {
                          const visibleDocs = allDocsForItem.slice(0, 3);
                          const hasMore = allDocsForItem.length > 3;
                          return (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                flexWrap: "nowrap",
                                gap: "4px",
                                alignItems: "center",
                                justifyContent: "flex-end",
                              }}
                            >
                              {visibleDocs.map((d) => {
                                const ext =
                                  d.fileName.split(".").pop()?.toUpperCase() ||
                                  "FILE";
                                const extColor =
                                  ext === "PDF"
                                    ? "#e53935"
                                    : ext === "DOCX" || ext === "DOC"
                                      ? "#1565c0"
                                      : ext === "XLSX" || ext === "XLS"
                                        ? "#2e7d32"
                                        : ext === "PNG" ||
                                            ext === "JPG" ||
                                            ext === "JPEG"
                                          ? "#f57c00"
                                          : "#607d8b";
                                return (
                                  <div
                                    key={d.id}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      background: "#f5f7fa",
                                      border: "1px solid #e0e0e0",
                                      borderRadius: "5px",
                                      padding: "2px 6px",
                                      whiteSpace: "nowrap",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <button
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        background: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: 0,
                                      }}
                                      onClick={() => {
                                        setZoomLevel(100);
                                        setImgPan({ x: 0, y: 0 });
                                        setPreviewDoc(d);
                                      }}
                                      title={d.fileName}
                                    >
                                      <span
                                        style={{
                                          flexShrink: 0,
                                          fontSize: "7px",
                                          fontWeight: 700,
                                          color: "#fff",
                                          padding: "1px 3px",
                                          borderRadius: "2px",
                                          backgroundColor: extColor,
                                        }}
                                      >
                                        {ext}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: "10px",
                                          color: "#333",
                                          maxWidth: "70px",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {d.fileName}
                                      </span>
                                    </button>
                                    {isEditMode && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSingle(d.id, d.fileName);
                                        }}
                                        title="Remove file"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          background: "transparent",
                                          border: "none",
                                          cursor: "pointer",
                                          padding: "1px",
                                          borderRadius: "50%",
                                          marginLeft: "2px",
                                          color: "#999",
                                          transition:
                                            "color 0.15s, background 0.15s",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.color =
                                            "#dc3545";
                                          e.currentTarget.style.background =
                                            "#fee";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.color = "#999";
                                          e.currentTarget.style.background =
                                            "transparent";
                                        }}
                                      >
                                        <Icon
                                          icon="mdi:close"
                                          width={12}
                                          height={12}
                                        />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                              {hasMore && (
                                <button
                                  onClick={() =>
                                    setFileListModal(templateItemId)
                                  }
                                  title={`Show all ${allDocsForItem.length} files`}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#e0e0e0",
                                    border: "none",
                                    borderRadius: "5px",
                                    padding: "2px 8px",
                                    cursor: "pointer",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                    color: "#555",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = "#ccc")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "#e0e0e0")
                                  }
                                >
                                  +{allDocsForItem.length - 3}
                                </button>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-[#bbb] italic text-xs">
                          No file uploaded
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                      {hasFile
                        ? new Date(latestDoc.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                      <div className="flex gap-1.5">
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? "bg-[#f5a623] cursor-pointer hover:opacity-80" : "bg-[#ccc] cursor-not-allowed"} disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={
                            isEditMode
                              ? "Upload"
                              : "View mode - editing disabled"
                          }
                          onClick={() => handleUploadClick(templateItemId)}
                          disabled={!isEditMode || isUploading}
                        >
                          {isUploading ? (
                            <Icon
                              icon="mdi:loading"
                              width={14}
                              height={14}
                              className="animate-spin"
                            />
                          ) : (
                            <Icon icon="mdi:upload" width={14} height={14} />
                          )}
                        </button>
                        <button
                          className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${
                            hasFile && isEditMode
                              ? "bg-[#c62828] cursor-pointer hover:opacity-80"
                              : "bg-[#ccc] cursor-not-allowed"
                          }`}
                          title={
                            isEditMode
                              ? "Delete"
                              : "View mode - editing disabled"
                          }
                          onClick={() =>
                            hasFile && handleDeleteAll(templateItemId)
                          }
                          disabled={!hasFile || !isEditMode}
                        >
                          <Icon
                            icon="mdi:delete-outline"
                            width={14}
                            height={14}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Render Custom Rows for this section */}
              {customRows
                .filter((row) => row.sectionLabel === title)
                .map((customRow, idx) => {
                  const templateItemId = `${phase}-CUSTOM-${customRow.id}`;
                  const allDocsForItem = getDocsForItem(templateItemId);
                  const latestDoc = allDocsForItem[0];
                  const isUploading = uploadingItemId === templateItemId;
                  const hasFile = allDocsForItem.length > 0;
                  const baseRowNumber = docs.length + idx + 1;

                  return (
                    <tr key={`custom-${customRow.id}`} className="bg-[#f0fff4]">
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#888] font-medium">
                        {baseRowNumber}
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                        <div className="flex items-center gap-2">
                          <span className="text-[#333]">{customRow.name}</span>
                          <span className="text-[9px] bg-[#2e7d32] text-white px-1.5 py-0.5 rounded">Custom</span>
                          {isAssigneeEditMode && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => onEditRowClick?.(customRow)}
                                className="text-[#1976d2] hover:bg-[#e3f2fd] p-1 rounded"
                                title="Edit row"
                              >
                                <Icon icon="mdi:pencil" width={14} height={14} />
                              </button>
                              <button
                                onClick={() => onDeleteRowClick?.(customRow)}
                                className="text-[#c62828] hover:bg-[#ffebee] p-1 rounded"
                                title="Delete row"
                              >
                                <Icon icon="mdi:delete" width={14} height={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                        {hasFile ? (
                          (() => {
                            const visibleDocs = allDocsForItem.slice(0, 3);
                            const hasMore = allDocsForItem.length > 3;
                            return (
                              <div className="flex flex-row flex-nowrap gap-1 items-center justify-end">
                                {visibleDocs.map((d) => {
                                  const ext = d.fileName.split(".").pop()?.toUpperCase() || "FILE";
                                  const extColor = ext === "PDF" ? "#e53935" : ext === "DOCX" || ext === "DOC" ? "#1565c0" : ext === "XLSX" || ext === "XLS" ? "#2e7d32" : ext === "PNG" || ext === "JPG" || ext === "JPEG" ? "#f57c00" : "#607d8b";
                                  return (
                                    <div key={d.id} className="inline-flex items-center gap-1 bg-[#f5f7fa] border border-[#e0e0e0] rounded-[5px] py-0.5 px-1.5 whitespace-nowrap flex-shrink-0">
                                      <button onClick={() => { setZoomLevel(100); setImgPan({ x: 0, y: 0 }); setPreviewDoc(d); }} title={d.fileName} className="inline-flex items-center gap-1 bg-transparent border-none cursor-pointer p-0">
                                        <span className="flex-shrink-0 text-[7px] font-bold text-white py-0.5 px-1 rounded-sm" style={{ backgroundColor: extColor }}>{ext}</span>
                                        <span className="text-[10px] text-[#333] max-w-[70px] overflow-hidden text-ellipsis whitespace-nowrap">{d.fileName}</span>
                                      </button>
                                      {isEditMode && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSingle(d.id, d.fileName); }} title="Remove file" className="inline-flex items-center justify-center bg-transparent border-none cursor-pointer p-0.5 rounded-full ml-0.5 text-[#999] hover:text-[#dc3545] hover:bg-[#fee]">
                                          <Icon icon="mdi:close" width={12} height={12} />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                                {hasMore && (
                                  <button onClick={() => setFileListModal(templateItemId)} title={`Show all ${allDocsForItem.length} files`} className="inline-flex items-center justify-center bg-[#e0e0e0] border-none rounded-[5px] py-0.5 px-2 cursor-pointer text-[10px] font-bold text-[#555] flex-shrink-0 whitespace-nowrap hover:bg-[#ccc]">
                                    +{allDocsForItem.length - 3}
                                  </button>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-[#bbb] italic text-xs">No file uploaded</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle text-[#999] text-xs">
                        {hasFile ? new Date(latestDoc.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="py-2.5 px-3 border-b border-[#eee] align-middle">
                        <div className="flex gap-1.5">
                          <button
                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${isEditMode ? "bg-[#f5a623] cursor-pointer hover:opacity-80" : "bg-[#ccc] cursor-not-allowed"} disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={isEditMode ? "Upload" : "View mode - editing disabled"}
                            onClick={() => handleUploadClick(templateItemId)}
                            disabled={!isEditMode || isUploading}
                          >
                            {isUploading ? (
                              <Icon icon="mdi:loading" width={14} height={14} className="animate-spin" />
                            ) : (
                              <Icon icon="mdi:upload" width={14} height={14} />
                            )}
                          </button>
                          <button
                            className={`w-7 h-7 border-none rounded-md flex items-center justify-center transition-opacity duration-200 text-white ${hasFile && isEditMode ? "bg-[#c62828] cursor-pointer hover:opacity-80" : "bg-[#ccc] cursor-not-allowed"}`}
                            title={isEditMode ? "Delete" : "View mode - editing disabled"}
                            onClick={() => hasFile && handleDeleteAll(templateItemId)}
                            disabled={!hasFile || !isEditMode}
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

          {/* Add New Row Button - Only visible in Assignee Edit Mode */}
          {isAssigneeEditMode && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => onAddRowClick?.(title)}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#e8f5e9] text-[#2e7d32] border-2 border-dashed border-[#2e7d32] rounded-lg text-sm font-semibold hover:bg-[#c8e6c9] transition-colors"
              >
                <Icon icon="mdi:plus-circle-outline" width={20} height={20} />
                Add New Row
              </button>
            </div>
          )}
        </div>
        <div className="py-5" />
      </div>

      {/* File List Modal */}
      {fileListModal &&
        (() => {
          const modalDocs = getDocsForItem(fileListModal);
          return (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1100]"
              onClick={() => setFileListModal(null)}
            >
              <div
                className="bg-white rounded-xl w-full max-w-[420px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    background: "#F59E0B",
                    padding: "14px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "14px", fontWeight: 600 }}
                  >
                    Uploaded Files ({modalDocs.length})
                  </span>
                  <button
                    onClick={() => setFileListModal(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  {modalDocs.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#999",
                        fontSize: "13px",
                        padding: "20px 0",
                      }}
                    >
                      No files uploaded
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {modalDocs.map((d) => {
                        const ext =
                          d.fileName.split(".").pop()?.toUpperCase() || "FILE";
                        const extColor =
                          ext === "PDF"
                            ? "#e53935"
                            : ext === "DOCX" || ext === "DOC"
                              ? "#1565c0"
                              : ext === "XLSX" || ext === "XLS"
                                ? "#2e7d32"
                                : ext === "PNG" ||
                                    ext === "JPG" ||
                                    ext === "JPEG"
                                  ? "#f57c00"
                                  : "#607d8b";
                        return (
                          <div
                            key={d.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              background: "#f9fafb",
                              border: "1px solid #eee",
                              borderRadius: "8px",
                              padding: "10px 12px",
                            }}
                          >
                            <div
                              style={{
                                flexShrink: 0,
                                width: "36px",
                                height: "42px",
                                borderRadius: "4px",
                                backgroundColor: extColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <span
                                style={{
                                  color: "#fff",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                }}
                              >
                                {ext}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <button
                                onClick={() => {
                                  setFileListModal(null);
                                  setPreviewDoc(d);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 0,
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  color: "#333",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                  textAlign: "left",
                                }}
                                title={d.fileName}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#00AEEF")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color = "#333")
                                }
                              >
                                {d.fileName}
                              </button>
                              <span style={{ fontSize: "11px", color: "#999" }}>
                                {new Date(d.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                            {isEditMode && (
                              <button
                                onClick={() =>
                                  handleDeleteSingle(d.id, d.fileName)
                                }
                                title="Delete file"
                                style={{
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "28px",
                                  height: "28px",
                                  borderRadius: "6px",
                                  background: "#fee2e2",
                                  border: "none",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#e53935")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = "#fee2e2")
                                }
                              >
                                <Icon
                                  icon="mdi:delete-outline"
                                  width={16}
                                  height={16}
                                  color="#e53935"
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderTop: "1px solid #eee",
                    textAlign: "right",
                  }}
                >
                  <button
                    onClick={() => setFileListModal(null)}
                    style={{
                      background: "#fff",
                      color: "#333",
                      border: "1px solid #d0d0d0",
                      borderRadius: "6px",
                      padding: "8px 24px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#fff")
                    }
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]"
          onClick={() => setUploadSuccess(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[440px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
              <Icon
                icon="mdi:check-circle"
                width={36}
                height={36}
                color="#2e7d32"
              />
            </div>
            <h3 className="text-lg font-bold text-[#333] m-0 mb-5">
              File Upload Successfully!
            </h3>
            <div className="flex items-center gap-3 bg-[#f5f7fa] rounded-lg px-4 py-3 mb-5 text-left">
              <div className="flex-shrink-0 w-10 h-12 bg-[#e53935] rounded flex items-center justify-center">
                <span className="text-white text-[10px] font-bold uppercase">
                  {uploadSuccess.fileName.split(".").pop() || "FILE"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px] font-semibold text-[#333] m-0 truncate"
                  title={uploadSuccess.fileName}
                >
                  {uploadSuccess.fileName}
                </p>
                <p className="text-[11px] text-[#888] m-0 mt-0.5">
                  {uploadSuccess.fileSize}
                </p>
              </div>
            </div>
            <div className="text-left space-y-2 mb-6 pl-1">
              <div className="flex justify-between text-[13px]">
                <span className="text-[#888]">File Name:</span>
                <span
                  className="text-[#333] font-medium truncate max-w-[220px]"
                  title={uploadSuccess.fileName}
                >
                  {uploadSuccess.fileName}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#888]">File Type:</span>
                <span className="text-[#333] font-medium">
                  {uploadSuccess.fileType}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#888]">File Size:</span>
                <span className="text-[#333] font-medium">
                  {uploadSuccess.fileSize}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#888]">Uploaded By:</span>
                <span className="text-[#333] font-medium">
                  {uploadSuccess.uploadedBy}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[#888]">Date:</span>
                <span className="text-[#333] font-medium">
                  {uploadSuccess.date}
                </span>
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
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1100]"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[750px] max-h-[90vh] flex flex-col shadow-[0_12px_40px_rgba(0,0,0,0.3)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between py-3 px-5 border-b border-[#eee] bg-[#f9f9f9]">
              <div className="flex items-center gap-2 min-w-0">
                <Icon
                  icon="mdi:file-document-outline"
                  width={20}
                  height={20}
                  className="text-primary shrink-0"
                />
                <span className="text-[13px] font-semibold text-[#333] truncate">
                  {previewDoc.fileName}
                </span>
              </div>
              <button
                className="bg-transparent border-none cursor-pointer text-[#999] p-1 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[#e0e0e0] hover:text-[#333] shrink-0"
                onClick={() => setPreviewDoc(null)}
              >
                <Icon icon="mdi:close" width={20} height={20} />
              </button>
            </div>
            {(() => {
              const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(
                previewDoc.fileName,
              );
              return isImage ? (
                <div
                  className="flex-1 overflow-hidden bg-[#e8e8e8] min-h-[400px] max-h-[65vh] flex items-center justify-center"
                  style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  onWheel={(e) => {
                    e.preventDefault();
                    setZoomLevel((z) => {
                      const delta = e.deltaY < 0 ? 10 : -10;
                      return Math.min(300, Math.max(25, z + delta));
                    });
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                    dragStart.current = {
                      x: e.clientX,
                      y: e.clientY,
                      panX: imgPan.x,
                      panY: imgPan.y,
                    };
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging) return;
                    setImgPan({
                      x:
                        dragStart.current.panX +
                        (e.clientX - dragStart.current.x),
                      y:
                        dragStart.current.panY +
                        (e.clientY - dragStart.current.y),
                    });
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                >
                  <img
                    src={`/api/cest-projects/${projectId}/documents/${previewDoc.id}/download`}
                    alt={previewDoc.fileName}
                    draggable={false}
                    style={{
                      transform: `scale(${zoomLevel / 100}) translate(${imgPan.x}px, ${imgPan.y}px)`,
                      transformOrigin: "center center",
                      transition: isDragging ? "none" : "transform 0.1s ease",
                      maxWidth: "100%",
                      userSelect: "none",
                    }}
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
              {/\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(
                previewDoc.fileName,
              ) ? (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(25, z - 25))}
                    disabled={zoomLevel <= 25}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid #d0d0d0",
                      background: zoomLevel <= 25 ? "#f0f0f0" : "#fff",
                      cursor: zoomLevel <= 25 ? "not-allowed" : "pointer",
                      color: zoomLevel <= 25 ? "#bbb" : "#333",
                    }}
                  >
                    <Icon icon="mdi:minus" width={16} height={16} />
                  </button>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#555",
                      minWidth: "40px",
                      textAlign: "center",
                    }}
                  >
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(300, z + 25))}
                    disabled={zoomLevel >= 300}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid #d0d0d0",
                      background: zoomLevel >= 300 ? "#f0f0f0" : "#fff",
                      cursor: zoomLevel >= 300 ? "not-allowed" : "pointer",
                      color: zoomLevel >= 300 ? "#bbb" : "#333",
                    }}
                  >
                    <Icon icon="mdi:plus" width={16} height={16} />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(100);
                      setImgPan({ x: 0, y: 0 });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "30px",
                      borderRadius: "6px",
                      border: "1px solid #d0d0d0",
                      background: "#fff",
                      cursor: "pointer",
                      color: "#333",
                      padding: "0 10px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1.5 py-2 px-4 bg-primary text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/cest-projects/${projectId}/documents/${previewDoc.id}/download`,
                      );
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.download = previewDoc.fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                    } catch {
                      alert("Failed to download file.");
                    }
                  }}
                >
                  <Icon icon="mdi:download" width={16} height={16} />
                  Download
                </button>
                {isEditMode && (
                  <button
                    className="flex items-center gap-1.5 py-2 px-4 bg-[#c62828] text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer transition-colors duration-200 hover:opacity-90"
                    onClick={async () => {
                      if (!confirm(`Delete "${previewDoc.fileName}"?`)) return;
                      try {
                        await fetch(
                          `/api/cest-projects/${projectId}/documents/${previewDoc.id}`,
                          { method: "DELETE" },
                        );
                        setPreviewDoc(null);
                        await fetchDocuments();
                      } catch {
                        alert("Failed to delete file.");
                      }
                    }}
                  >
                    <Icon icon="mdi:delete-outline" width={16} height={16} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddEquipmentModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[480px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Add Equipment</span>
              <button onClick={() => setShowAddEquipmentModal(false)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name of Equipment *</label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter equipment name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="text"
                  value={newEquipment.cost}
                  onChange={(e) => setNewEquipment((prev) => ({ ...prev, cost: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter cost (e.g., PHP 50,000)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newEquipment.status}
                  onChange={(e) => setNewEquipment((prev) => ({ ...prev, status: e.target.value as "Procured" | "Pulled Out" }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Procured">Procured</option>
                  <option value="Pulled Out">Pulled Out</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Property Code</label>
                <input
                  type="text"
                  value={newEquipment.propertyCode}
                  onChange={(e) => setNewEquipment((prev) => ({ ...prev, propertyCode: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter property code"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEquipment}
                  disabled={!newEquipment.name.trim()}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Equipment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setEditingEquipment(null)}>
          <div className="bg-white rounded-xl w-full max-w-[480px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Edit Equipment</span>
              <button onClick={() => setEditingEquipment(null)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name of Equipment *</label>
                <input
                  type="text"
                  value={editingEquipment.name}
                  onChange={(e) => setEditingEquipment((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cost</label>
                <input
                  type="text"
                  value={editingEquipment.cost}
                  onChange={(e) => setEditingEquipment((prev) => prev ? { ...prev, cost: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingEquipment.status}
                  onChange={(e) => setEditingEquipment((prev) => prev ? { ...prev, status: e.target.value as "Procured" | "Pulled Out" } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Procured">Procured</option>
                  <option value="Pulled Out">Pulled Out</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Equipment Property Code</label>
                <input
                  type="text"
                  value={editingEquipment.propertyCode}
                  onChange={(e) => setEditingEquipment((prev) => prev ? { ...prev, propertyCode: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingEquipment(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateEquipment}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Non-Equipment Modal */}
      {showAddNonEquipmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddNonEquipmentModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[480px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Add Non-Equipment Item</span>
              <button onClick={() => setShowAddNonEquipmentModal(false)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={newNonEquipment.type}
                  onChange={(e) => setNewNonEquipment((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {getAllNonEquipmentOptions().map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newNonEquipment.description}
                  onChange={(e) => setNewNonEquipment((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter description or details"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddNonEquipmentModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNonEquipment}
                  disabled={!newNonEquipment.type.trim()}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Non-Equipment Modal */}
      {editingNonEquipment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setEditingNonEquipment(null)}>
          <div className="bg-white rounded-xl w-full max-w-[480px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-primary py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Edit Non-Equipment Item</span>
              <button onClick={() => setEditingNonEquipment(null)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={editingNonEquipment.type}
                  onChange={(e) => setEditingNonEquipment((prev) => prev ? { ...prev, type: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  {getAllNonEquipmentOptions().map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={editingNonEquipment.description}
                  onChange={(e) => setEditingNonEquipment((prev) => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingNonEquipment(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateNonEquipment}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:opacity-90"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Option Modal */}
      {showAddCustomOptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddCustomOptionModal(null)}>
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-600 py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">
                Add Custom {showAddCustomOptionModal === "equipment" ? "Equipment" : "Non-Equipment"} Option
              </span>
              <button onClick={() => setShowAddCustomOptionModal(null)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Option Name *</label>
                <input
                  type="text"
                  value={newCustomOption}
                  onChange={(e) => setNewCustomOption(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder={showAddCustomOptionModal === "equipment" ? "e.g., Machinery" : "e.g., Consultation"}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAddCustomOptionModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomOption}
                  disabled={!newCustomOption.trim()}
                  className="px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Option
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddTypeModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#2e7d32] py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Add New Type</span>
              <button onClick={() => setShowAddTypeModal(false)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type Name *</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full border border-[#ddd] rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:border-transparent"
                  placeholder="e.g., Services, Machinery"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowAddTypeModal(false); setNewTypeName(""); }}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newTypeName.trim() && !interventionTypeOptions.includes(newTypeName.trim())) {
                      setInterventionTypeOptions([...interventionTypeOptions, newTypeName.trim()]);
                    }
                    setNewTypeName("");
                    setShowAddTypeModal(false);
                  }}
                  disabled={!newTypeName.trim()}
                  className="px-4 py-2 text-xs bg-[#2e7d32] text-white rounded hover:bg-[#1b5e20] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Type
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Status Modal */}
      {showAddStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddStatusModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1976d2] py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Add New Status</span>
              <button onClick={() => setShowAddStatusModal(false)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status Name *</label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="w-full border border-[#ddd] rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
                  placeholder="e.g., For Procurement, Delivered"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowAddStatusModal(false); setNewStatusName(""); }}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newStatusName.trim() && !interventionStatusOptions.includes(newStatusName.trim())) {
                      setInterventionStatusOptions([...interventionStatusOptions, newStatusName.trim()]);
                    }
                    setNewStatusName("");
                    setShowAddStatusModal(false);
                  }}
                  disabled={!newStatusName.trim()}
                  className="px-4 py-2 text-xs bg-[#1976d2] text-white rounded hover:bg-[#1565c0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Non-Equipment Sub-Type Modal */}
      {showAddSubTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setShowAddSubTypeModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-[400px] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#7b1fa2] py-3 px-5 flex items-center justify-between">
              <span className="text-white text-sm font-semibold">Add New Non-Equipment Type</span>
              <button onClick={() => setShowAddSubTypeModal(false)} className="text-white text-xl leading-none hover:opacity-80">&times;</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type Name *</label>
                <input
                  type="text"
                  value={newSubTypeName}
                  onChange={(e) => setNewSubTypeName(e.target.value)}
                  className="w-full border border-[#ddd] rounded px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7b1fa2] focus:border-transparent"
                  placeholder="e.g., Consultation, Technical Assistance"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowAddSubTypeModal(false); setNewSubTypeName(""); }}
                  className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newSubTypeName.trim() && !nonEquipmentSubTypeOptions.includes(newSubTypeName.trim())) {
                      setNonEquipmentSubTypeOptions([...nonEquipmentSubTypeOptions, newSubTypeName.trim()]);
                    }
                    setNewSubTypeName("");
                    setShowAddSubTypeModal(false);
                  }}
                  disabled={!newSubTypeName.trim()}
                  className="px-4 py-2 text-xs bg-[#7b1fa2] text-white rounded hover:bg-[#6a1b9a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Type
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
  const [initiationFiles, setInitiationFiles] = useState({
    uploaded: 0,
    total: 0,
  });
  const [implementationProgress, setImplementationProgress] = useState(0);
  const [implementationFiles, setImplementationFiles] = useState({
    uploaded: 0,
    total: 0,
  });
  const [monitoringProgress, setMonitoringProgress] = useState(0);
  const [monitoringFiles, setMonitoringFiles] = useState({
    uploaded: 0,
    total: 0,
  });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Edit Mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [modeTransitioning, setModeTransitioning] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState<
    "edit" | "view" | "upload" | null
  >(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editRequestModal, setEditRequestModal] = useState(false);
  const [editRequestSent, setEditRequestSent] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Assignee Mode states (for Upload Mode vs Edit Mode)
  const [assigneeMode, setAssigneeMode] = useState<'upload' | 'edit'>('upload');
  const [modeKey, setModeKey] = useState(0);

  // Custom Rows states
  const [customRows, setCustomRows] = useState<Array<{
    id: string;
    sectionLabel: string;
    name: string;
    rowType: 'item' | 'dropdown';
    dropdownOptions?: string[];
    textValue?: string;
  }>>([]);
  const [showAddRowModal, setShowAddRowModal] = useState<{
    show: boolean;
    sectionLabel: string;
  } | null>(null);
  const [newRowName, setNewRowName] = useState('');
  const [newRowType, setNewRowType] = useState<'item' | 'dropdown'>('item');
  const [newRowDropdownOptions, setNewRowDropdownOptions] = useState('');

  // State for editing/renaming custom rows
  const [showEditRowModal, setShowEditRowModal] = useState<{
    show: boolean;
    rowId: string;
    currentName: string;
    rowType: 'item' | 'dropdown';
    dropdownOptions?: string[];
  } | null>(null);
  const [editRowName, setEditRowName] = useState('');
  const [editRowOptions, setEditRowOptions] = useState('');

  // Track current dropdown data for merging across saves
  const [currentDropdownData, setCurrentDropdownData] = useState<Record<string, unknown>>({});

  // Save success modal for custom rows
  const [saveSuccessModal, setSaveSuccessModal] = useState<{
    show: boolean;
    message: string;
  } | null>(null);

  // Remove custom row confirmation modal
  const [removeCustomRowConfirmModal, setRemoveCustomRowConfirmModal] = useState<{
    show: boolean;
    rowId: string;
    rowName: string;
  } | null>(null);

  // Edit Permission Modal states (for assignee/owner)
  const [editPermissionModal, setEditPermissionModal] = useState(false);
  const [pendingEditRequests, setPendingEditRequests] = useState<EditRequest[]>(
    [],
  );
  const [approvedEditorsList, setApprovedEditorsList] = useState<EditRequest[]>(
    [],
  );
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null,
  );
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Transfer Ownership states
  const [transferOwnershipModal, setTransferOwnershipModal] = useState(false);
  const [allUsers, setAllUsers] = useState<Array<{ id: string; fullName: string; email: string; profileImageUrl?: string }>>([]);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [transferConfirmModal, setTransferConfirmModal] = useState<{
    show: boolean;
    userId: string;
    userName: string;
  } | null>(null);

  // Executive Summary states
  const [showExecutiveSummaryPreview, setShowExecutiveSummaryPreview] =
    useState(false);
  const [execSummaryData, setExecSummaryData] = useState({
    requestedAmount: "",
    ownersEquity: "",
    totalProjectCost: "",
    dostTechnology: "",
    incomePresent: "",
    incomeAdditional: "",
    jobsCreatedPresent: "",
    jobsCreatedAdditional: "",
    productivityPresent: "",
    productivityIncrease: "",
    marketPresent: "",
    marketAdditional: "",
    listOfProducts: "",
    withFdaLto: "",
    withCprs: "",
    businessPlan: "",
    plans: "",
    preparedByName: "",
    preparedByPosition: "Project Technical Assistant III, PSTO MOR",
    reviewedByName: "Ruel Vincent C. Banal",
    reviewedByPosition: "Officer-In-Charge, PSTO MOR",
  });

  const updateExecSummaryField = (field: string, value: string) => {
    setExecSummaryData((prev) => ({ ...prev, [field]: value }));
  };

  const overallProgress = Math.round(
    (initiationProgress + implementationProgress + monitoringProgress) / 3,
  );

  // Get current user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error parsing user:", e);
    }
  }, []);

  // Function to fetch pending edit requests and approved editors
  const fetchEditRequestsAndEditors = useCallback(async () => {
    setLoadingPermissions(true);
    try {
      // Always fetch fresh project data to get latest pendingEditRequests
      const freshProjectRes = await fetch(`/api/cest-projects/${id}`);
      const freshProject = await freshProjectRes.json();

      const dropdownData = freshProject.dropdownData as Record<
        string,
        unknown
      > | null;
      const pendingRequestIds =
        (dropdownData?.pendingEditRequests as string[]) || [];
      const approvedEditorIds =
        (dropdownData?.approvedEditors as string[]) || [];

      if (pendingRequestIds.length === 0 && approvedEditorIds.length === 0) {
        setPendingEditRequests([]);
        setApprovedEditorsList([]);
        setLoadingPermissions(false);
        return;
      }

      const usersRes = await fetch("/api/users");
      const users = await usersRes.json();

      const requests: EditRequest[] = pendingRequestIds.map(
        (userId: string) => {
          const user = users.find(
            (u: { id: string; fullName: string; profileImageUrl?: string }) =>
              u.id === userId,
          );
          return {
            userId,
            userName: user?.fullName || "Unknown User",
            userProfileUrl: user?.profileImageUrl || null,
            requestedAt: "Pending",
          };
        },
      );
      setPendingEditRequests(requests);

      const editors: EditRequest[] = approvedEditorIds.map((userId: string) => {
        const user = users.find(
          (u: { id: string; fullName: string; profileImageUrl?: string }) =>
            u.id === userId,
        );
        return {
          userId,
          userName: user?.fullName || "Unknown User",
          userProfileUrl: user?.profileImageUrl || null,
          requestedAt: "Approved",
        };
      });
      setApprovedEditorsList(editors);
    } catch (err) {
      console.error("Failed to fetch edit requests and editors:", err);
    } finally {
      setLoadingPermissions(false);
    }
  }, [id]);

  // Fetch pending edit requests and approved editors when project data changes
  useEffect(() => {
    if (!project) return;
    fetchEditRequestsAndEditors();
  }, [project, fetchEditRequestsAndEditors]);

  useEffect(() => {
    fetch(`/api/cest-projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setProject(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for openCestEditRequestModal custom event (from notification clicks)
  useEffect(() => {
    const handleOpenCestEditRequestModal = (
      e: CustomEvent<{ projectId: string; requesterId: string }>,
    ) => {
      if (e.detail.projectId === id) {
        setEditPermissionModal(true);
        fetchEditRequestsAndEditors();
      }
    };

    window.addEventListener(
      "openCestEditRequestModal",
      handleOpenCestEditRequestModal as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openCestEditRequestModal",
        handleOpenCestEditRequestModal as EventListener,
      );
    };
  }, [id, fetchEditRequestsAndEditors]);

  // Check sessionStorage for pending edit request modal (from notification navigation)
  useEffect(() => {
    const pendingModalProjectId = sessionStorage.getItem(
      "pendingCestEditRequestModal",
    );
    if (pendingModalProjectId && pendingModalProjectId === id && !loading) {
      sessionStorage.removeItem("pendingCestEditRequestModal");
      sessionStorage.removeItem("pendingCestEditRequestUserId");
      setEditPermissionModal(true);
      fetchEditRequestsAndEditors();
    }
  }, [id, loading, fetchEditRequestsAndEditors]);

  // Helper function: Check if current user is the project assignee
  const isAssignee = () => {
    if (!currentUser || !project) return false;
    return currentUser.fullName === project.staffAssigned;
  };

  // Check if user has edit permission (either assignee or approved editor)
  const isAuthorizedToEdit = () => {
    if (!currentUser || !project) return false;
    // Assignee always has edit permission
    if (currentUser.fullName === project.staffAssigned) return true;
    // Check if user is an approved editor
    const dropdownData = project.dropdownData as Record<string, unknown> | null;
    const approvedEditors = (dropdownData?.approvedEditors as string[]) || [];
    return approvedEditors.includes(currentUser.id);
  };

  // Check if user has already sent a pending edit request
  const hasPendingRequest = () => {
    if (!currentUser || !project) return false;
    const dropdownData = project.dropdownData as Record<string, unknown> | null;
    const pendingRequests = (dropdownData?.pendingEditRequests as string[]) || [];
    return pendingRequests.includes(currentUser.id);
  };

  // Helper function: Check if current user is assignee AND in edit mode AND using Edit Mode (not Upload Mode)
  const isAssigneeEditMode = () => {
    return isAssignee() && isEditMode && assigneeMode === 'edit';
  };

  // Helper function: Check if current user is assignee AND in edit mode AND using Upload Mode
  const isAssigneeUploadMode = () => {
    return isAssignee() && isEditMode && assigneeMode === 'upload';
  };

  // Initialize customRows from project dropdownData
  useEffect(() => {
    if (project?.dropdownData) {
      const data = project.dropdownData as Record<string, unknown>;
      setCurrentDropdownData(data);

      // Restore custom rows
      if (data.customRows) {
        setCustomRows(data.customRows as Array<{
          id: string;
          sectionLabel: string;
          name: string;
          rowType: 'item' | 'dropdown';
          dropdownOptions?: string[];
          textValue?: string;
        }>);
      }
    }
  }, [project]);

  // Auto-enable edit mode for assignees
  useEffect(() => {
    if (project && currentUser && isAssignee() && !isEditMode && !loading) {
      setIsEditMode(true);
    }
  }, [project, currentUser, loading]);

  // Save dropdown data helper function
  const saveDropdownData = async (newData: Record<string, unknown>, successMessage?: string) => {
    try {
      const mergedData = {
        ...currentDropdownData,
        ...newData,
      };
      setCurrentDropdownData(mergedData);

      await fetch(`/api/cest-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ dropdownData: mergedData }),
      });

      if (successMessage) {
        setSaveSuccessModal({ show: true, message: successMessage });
      }
    } catch (error) {
      console.error('Error saving dropdown data:', error);
    }
  };

  // Fetch all users for transfer ownership
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const users = await res.json();
      // Filter out current user (can't transfer to yourself)
      const filteredUsers = users.filter((u: { id: string }) => u.id !== currentUser?.id);
      setAllUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Handle transfer ownership
  const handleTransferOwnership = async (newOwnerId: string, newOwnerName: string) => {
    if (!project || !currentUser) return;

    setTransferring(true);
    try {
      // Update the project with new owner
      const res = await fetch(`/api/cest-projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          staffAssigned: newOwnerName,
        }),
      });

      if (!res.ok) throw new Error('Failed to transfer ownership');

      // Send notification to new owner
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newOwnerId,
          type: 'ownership_transferred',
          title: 'Project Ownership Transferred',
          message: `${currentUser.fullName} has transferred ownership of CEST project "${project.projectTitle}" to you.`,
          eventId: project.id,
        }),
      });

      // Refresh project data
      const updatedProject = await res.json();
      setProject(updatedProject);

      setTransferOwnershipModal(false);
      setTransferConfirmModal(null);
      setSelectedNewOwner(null);
      setUserSearchQuery('');
      setSaveSuccessModal({ show: true, message: `Ownership transferred to ${newOwnerName} successfully!` });

      // Redirect to projects list after a short delay since user is no longer owner
      setTimeout(() => {
        window.location.href = '/cest';
      }, 2000);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      alert('Failed to transfer ownership. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  // Handle Edit Mode Toggle
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
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsEditMode(false);
      setModeKey(prev => prev + 1);
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
        setModeKey(prev => prev + 1);
        await new Promise(resolve => setTimeout(resolve, 200));
        setModeTransitioning(false);
        setTransitioningTo(null);
      } else {
        // Show request modal
        setEditRequestModal(true);
      }
    }
  };

  // Download Executive Summary as DOCX
  const downloadExecutiveSummary = async (
    projectData: CestProject,
    data: typeof execSummaryData,
  ) => {
    const {
      Document,
      Packer,
      Paragraph,
      Table,
      TableRow,
      TableCell,
      TextRun,
      ImageRun,
      WidthType,
      BorderStyle,
      UnderlineType,
      AlignmentType,
      VerticalAlign,
      HorizontalPositionRelativeFrom,
      VerticalPositionRelativeFrom,
      TextWrappingType,
    } = await import("docx");

    // Fetch the logo image
    const logoResponse = await fetch("/cest-logo-text.png");
    const logoBlob = await logoResponse.blob();
    const logoArrayBuffer = await logoBlob.arrayBuffer();
    const logoBuffer = new Uint8Array(logoArrayBuffer);

    // Border style for main table
    const tableBorder = { style: BorderStyle.SINGLE, size: 8, color: "000000" };
    const noBorder = { style: BorderStyle.NONE };

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
                font: "Calibri",
              }),
            ],
          }),
        ],
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
                font: "Calibri",
              }),
            ],
          }),
        ],
      });
    };

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
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
                  transformation: { width: 120, height: 60 },
                  type: "png",
                  floating: {
                    horizontalPosition: {
                      relative: HorizontalPositionRelativeFrom.PAGE,
                      offset: 500000, // 0.5 inch from left edge (in EMUs: 914400 per inch)
                    },
                    verticalPosition: {
                      relative: VerticalPositionRelativeFrom.PARAGRAPH,
                      offset: -200000,
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
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Project Title:",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 65, type: WidthType.PERCENTAGE },
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: projectData.projectTitle || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Proponent
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Proponent:",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: projectData.beneficiaries || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Requested Amount
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Requested Amount:",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.requestedAmount || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Owner's Equity
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Owner's Equity:",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.ownersEquity || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // Total Project Cost
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Total Project Cost:",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.totalProjectCost || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // 1. DOST technology
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "1. DOST technology to be adopted and the mode of techno transfer.",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.dostTechnology || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // 2. Income - Header row
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 35, type: WidthType.PERCENTAGE },
                      rowSpan: 2,
                      verticalAlign: VerticalAlign.CENTER,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "2. Income",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
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
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "3. Jobs Created",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
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
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "4. Productivity",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
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
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "5. Market",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
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
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "6. List of Products",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.listOfProducts || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // 7. With FDA-LTO?
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "7. With FDA-LTO?",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.withFdaLto || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // 8. With CPRs?
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "8. With CPRs?",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.withCprs || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                // 9. Business plan paragraph
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "9. A short paragraph on the business plan answering the question, How will the enterprise earn income?",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.businessPlan || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                        new Paragraph(""),
                        new Paragraph(""),
                        new Paragraph(""),
                      ],
                    }),
                  ],
                }),
                // 10. Plans
                new TableRow({
                  children: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "10. Plans",
                              bold: true,
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      columnSpan: 2,
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.plans || "",
                              size: 20,
                              font: "Calibri",
                            }),
                          ],
                        }),
                        new Paragraph(""),
                        new Paragraph(""),
                        new Paragraph(""),
                        new Paragraph(""),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            // Footer - Prepared by / Reviewed by
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
                      borders: {
                        top: noBorder,
                        bottom: noBorder,
                        left: noBorder,
                        right: noBorder,
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Prepared by:",
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.preparedByName || "",
                              underline: { type: UnderlineType.SINGLE },
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.preparedByPosition || "",
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      borders: {
                        top: noBorder,
                        bottom: noBorder,
                        left: noBorder,
                        right: noBorder,
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: "Reviewed by",
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.reviewedByName || "",
                              underline: { type: UnderlineType.SINGLE },
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: data.reviewedByPosition || "",
                              font: "Calibri",
                              size: 20,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Executive_Summary_${projectData.projectTitle?.replace(/[^a-zA-Z0-9]/g, "_") || "CEST"}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!project || newStatus === project.status) {
      setShowStatusDropdown(false);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/cest-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setProject(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingStatus(false);
      setShowStatusDropdown(false);
    }
  };

  // Check if current user is the owner (assignee) or admin
  const isOwnerOrAdmin = (): boolean => {
    if (!currentUser || !project) return false;
    const assignee = project.staffAssigned === currentUser.fullName;
    const admin = currentUser.role === "ADMIN";
    return assignee || admin;
  };

  // Send edit request to assignee
  const sendEditRequest = async () => {
    if (!currentUser || !project) return;

    setSendingRequest(true);
    try {
      const usersRes = await fetch("/api/users");
      const users = await usersRes.json();
      const assigneeUser = users.find(
        (u: { fullName: string }) => u.fullName === project.staffAssigned,
      );

      if (!assigneeUser) {
        alert(
          "Could not find the project assignee. Please contact an administrator.",
        );
        setEditRequestModal(false);
        setSendingRequest(false);
        return;
      }

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: assigneeUser.id,
          type: "cest_edit_request",
          title: "Edit Access Request",
          message: `${currentUser.fullName} is requesting edit access to CEST project "${project.projectTitle}"`,
          eventId: project.id,
          bookedByUserId: currentUser.id,
          bookedByName: currentUser.fullName,
          bookedByProfileUrl: currentUser.profileImageUrl || null,
        }),
      });

      const dropdownData =
        (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests =
        (dropdownData.pendingEditRequests as string[]) || [];
      if (!pendingRequests.includes(currentUser.id)) {
        pendingRequests.push(currentUser.id);
      }

      await fetch(`/api/cest-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: {
            ...dropdownData,
            pendingEditRequests: pendingRequests,
          },
        }),
      });

      setEditRequestSent(true);
      setEditRequestModal(false);

      const refreshRes = await fetch(`/api/cest-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error("Failed to send edit request:", err);
      alert("Failed to send edit request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  // Accept edit request
  const acceptEditRequest = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData =
        (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests =
        (dropdownData.pendingEditRequests as string[]) || [];
      const approvedEditors = (dropdownData.approvedEditors as string[]) || [];

      const updatedPending = pendingRequests.filter(
        (reqId) => reqId !== userId,
      );
      const updatedApproved = approvedEditors.includes(userId)
        ? approvedEditors
        : [...approvedEditors, userId];

      await fetch(`/api/cest-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: {
            ...dropdownData,
            pendingEditRequests: updatedPending,
            approvedEditors: updatedApproved,
          },
        }),
      });

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          type: "cest_edit_request",
          title: "Edit Access Approved",
          message: `Your edit access request for CEST project "${project.projectTitle}" has been approved by ${currentUser?.fullName || "the owner"}!`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      const refreshRes = await fetch(`/api/cest-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error("Failed to accept edit request:", err);
      alert("Failed to accept edit request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Decline edit request
  const declineEditRequest = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData =
        (project.dropdownData as Record<string, unknown>) || {};
      const pendingRequests =
        (dropdownData.pendingEditRequests as string[]) || [];

      const updatedPending = pendingRequests.filter(
        (reqId) => reqId !== userId,
      );

      await fetch(`/api/cest-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: {
            ...dropdownData,
            pendingEditRequests: updatedPending,
          },
        }),
      });

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          type: "cest_edit_request",
          title: "Edit Access Declined",
          message: `Your edit access request for CEST project "${project.projectTitle}" has been declined by ${currentUser?.fullName || "the owner"}.`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      const refreshRes = await fetch(`/api/cest-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error("Failed to decline edit request:", err);
      alert("Failed to decline edit request. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Remove approved editor
  const removeApprovedEditor = async (userId: string) => {
    if (!project) return;

    setProcessingRequest(userId);
    try {
      const dropdownData =
        (project.dropdownData as Record<string, unknown>) || {};
      const approvedEditors = (dropdownData.approvedEditors as string[]) || [];

      const updatedApproved = approvedEditors.filter(
        (editorId) => editorId !== userId,
      );

      await fetch(`/api/cest-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          dropdownData: { ...dropdownData, approvedEditors: updatedApproved },
        }),
      });

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          type: "cest_edit_request",
          title: "Edit Access Revoked",
          message: `Your edit access for CEST project "${project.projectTitle}" has been revoked by ${currentUser?.fullName || "the owner"}.`,
          eventId: project.id,
          bookedByUserId: currentUser?.id || null,
          bookedByName: currentUser?.fullName || null,
          bookedByProfileUrl: currentUser?.profileImageUrl || null,
        }),
      });

      const refreshRes = await fetch(`/api/cest-projects/${id}`);
      const refreshedData = await refreshRes.json();
      setProject(refreshedData);
    } catch (err) {
      console.error("Failed to remove approved editor:", err);
      alert("Failed to remove editor. Please try again.");
    } finally {
      setProcessingRequest(null);
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
          <Link
            href="/cest"
            className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent"
          >
            <Icon icon="mdi:arrow-left" width={18} height={18} />
            Back
          </Link>
        </main>
      </DashboardLayout>
    );
  }

  const datePublished =
    project.dateOfApproval ||
    new Date(project.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; bar: string }
  > = {
    Approved: {
      label: "Approved",
      bg: "#e8f5e9",
      text: "#2e7d32",
      bar: "#2e7d32",
    },
    Ongoing: {
      label: "Ongoing",
      bg: "#fff8e1",
      text: "#f57f17",
      bar: "#ffa726",
    },
    Completed: {
      label: "Completed",
      bg: "#e0f2f1",
      text: "#00695c",
      bar: "#00695c",
    },
    Terminated: {
      label: "Terminated",
      bg: "#fce4ec",
      text: "#ad1457",
      bar: "#ad1457",
    },
  };
  const currentStatus = statusConfig[project.status || ""] || {
    label: project.status || "N/A",
    bg: "#f0f0f0",
    text: "#757575",
    bar: "#9e9e9e",
  };

  const totalUploaded =
    initiationFiles.uploaded +
    implementationFiles.uploaded +
    monitoringFiles.uploaded;
  const totalFiles =
    initiationFiles.total + implementationFiles.total + monitoringFiles.total;

  return (
    <DashboardLayout activePath="/cest">
      <main className="flex-1 py-6 px-10 pb-[60px] overflow-y-auto bg-[#f4f6f8]">
        {/* Back Button */}
        <Link
          href="/cest"
          className="inline-flex items-center gap-1.5 text-primary text-sm font-medium no-underline mb-4 hover:text-accent"
        >
          <Icon icon="mdi:arrow-left" width={18} height={18} />
          <span>Back</span>
        </Link>

        {/* Project Info Card */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-1.5 mt-[-10px]">
              <div className="w-[90px] h-auto">
                <img
                  src="/cest-logo-text.png"
                  alt="CEST"
                  className="w-[120px] h-auto"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Permission Button - Show only for owner (assignee) or admin */}
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
                      {pendingEditRequests.length > 9
                        ? "9+"
                        : pendingEditRequests.length}
                    </span>
                  )}
                </button>
              )}

              {/* Transfer Ownership Button - Show only for owner (assignee) */}
              {isAssignee() && (
                <button
                  onClick={() => {
                    setTransferOwnershipModal(true);
                    fetchAllUsers();
                  }}
                  className="flex items-center justify-center w-10 h-10 border-none rounded-full bg-[#fff3e0] text-[#f57c00] cursor-pointer transition-all duration-200 hover:bg-[#ffe0b2] hover:text-[#e65100]"
                  title="Transfer Ownership"
                >
                  <Icon icon="mdi:account-switch" width={20} height={20} />
                </button>
              )}

              {/* Edit Mode Button */}
              {isAssignee() ? (
                // Assignee-specific mode buttons (Upload Mode / Edit Mode toggle)
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
                // Non-assignee mode button (original logic)
                <button
                  onClick={handleEditModeToggle}
                  disabled={modeTransitioning}
                  className={`flex items-center gap-1.5 border-none rounded-[20px] py-2 px-5 text-[13px] font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed ${
                    isEditMode
                      ? "bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
                      : "bg-accent text-white hover:bg-accent-hover"
                  }`}
                >
                  {modeTransitioning ? (
                    <>
                      <Icon
                        icon="mdi:loading"
                        width={16}
                        height={16}
                        className="animate-spin"
                      />
                      Switching...
                    </>
                  ) : (
                    <>
                      <Icon
                        icon={
                          isEditMode ? "mdi:eye-outline" : "mdi:pencil-outline"
                        }
                        width={16}
                        height={16}
                      />
                      {isEditMode ? "View Mode" : "Edit Mode"}
                      {hasPendingRequest() && !isAuthorizedToEdit() && (
                        <span className="ml-1 text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Project Content */}
          <div className="flex gap-5 items-start">
            <div className="w-[100px] h-[100px] min-w-[100px] rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <Icon
                icon="mdi:office-building"
                width={48}
                height={48}
                color="#999"
              />
            </div>
            <div className="flex-1 flex gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[13px] mb-1">
                  <span className="text-[#555] font-medium">
                    {project.programFunding || "—"}
                    {project.categories && project.categories.length > 0 && (
                      <> | {project.categories.join(", ")}</>
                    )}
                  </span>
                  <span className="text-[#ccc]">|</span>
                  <span className="text-[#555]">{project.location || "—"}</span>
                </div>
                <h2 className="text-[18px] font-bold text-[#146184] m-0 mb-1 leading-[1.3]">
                  {project.projectTitle}
                </h2>
                <p className="text-[14px] text-[#555] m-0 mb-2">
                  {project.code}
                </p>
                <div
                  className="relative inline-block mb-3"
                  ref={statusDropdownRef}
                >
                  <button
                    className="text-[11px] font-semibold px-3 py-1 rounded-full border-none cursor-pointer flex items-center gap-1 transition-opacity duration-200 hover:opacity-80"
                    style={{
                      backgroundColor: currentStatus.bg,
                      color: currentStatus.text,
                    }}
                    onClick={() => setShowStatusDropdown((v) => !v)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Updating..." : currentStatus.label}
                    <Icon icon="mdi:chevron-down" width={14} height={14} />
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute left-0 top-full mt-1 w-[160px] bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] z-50 py-1">
                      {Object.entries(statusConfig).map(([key, cfg]) => (
                        <button
                          key={key}
                          className={`w-full flex items-center gap-2 py-2 px-3 text-[12px] text-left border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-[#f5f5f5] ${project.status === key ? "font-semibold" : ""}`}
                          onClick={() => handleStatusUpdate(key)}
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: cfg.bar }}
                          ></span>
                          {cfg.label}
                          {project.status === key && (
                            <Icon
                              icon="mdi:check"
                              width={14}
                              height={14}
                              className="ml-auto"
                              style={{ color: cfg.bar }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="[&_p]:my-1 [&_p]:text-[13px] [&_p]:text-[#555] [&_strong]:text-[#222] [&_strong]:font-semibold">
                <p>
                  <strong>Approved Amount:</strong>{" "}
                  {project.approvedAmount != null
                    ? `₱${project.approvedAmount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
                <p>
                  <strong>Stakeholder&apos;s Counterpart:</strong>{" "}
                  {project.stakeholderCounterparts &&
                  project.stakeholderCounterparts.length > 0
                    ? project.stakeholderCounterparts.join(", ")
                    : "—"}
                </p>
                <p>
                  <strong>CEST Entry Point:</strong>{" "}
                  {project.categories && project.categories.length > 0
                    ? project.categories.join(", ")
                    : "—"}
                </p>
                <p>
                  <strong>Beneficiary Type:</strong>{" "}
                  {project.typeOfBeneficiary || "—"}
                </p>
                <p className="flex items-center gap-2">
                  <strong>Assignee:</strong>
                  {project.staffAssigned ? (
                    <span className="inline-flex items-center gap-2">
                      {project.assigneeProfileUrl ? (
                        <img
                          src={project.assigneeProfileUrl}
                          alt={project.staffAssigned}
                          className="w-6 h-6 rounded-full object-cover border border-[#d0d0d0]"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-semibold">
                          {project.staffAssigned.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {project.staffAssigned}
                    </span>
                  ) : (
                    "—"
                  )}
                </p>
                <p>
                  <strong>Date Published:</strong> {datePublished}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] rounded-xl py-5 px-7 mb-2 shadow-[0_2px_8px_rgba(0,0,0,0.1)] border-l-4 border-[#2e7d32]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                <Icon
                  icon="mdi:file-document-edit-outline"
                  width={24}
                  height={24}
                  color="#2e7d32"
                />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#1b5e20] m-0 mb-1">
                  Executive Summary
                </h3>
                <p className="text-[12px] text-[#555] m-0">
                  Auto-generated document with project details
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExecutiveSummaryPreview(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#2e7d32] border-2 border-[#2e7d32] rounded-lg text-[13px] font-semibold hover:bg-[#2e7d32] hover:text-white transition-all shadow-sm"
              >
                <Icon icon="mdi:eye-outline" width={18} height={18} />
                Preview
              </button>
              <button
                onClick={async () => {
                  if (!project) return;
                  await downloadExecutiveSummary(project, execSummaryData);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2e7d32] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1b5e20] transition-all shadow-md"
              >
                <Icon icon="mdi:download" width={18} height={18} />
                Download DOCX
              </button>
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-white rounded-xl py-6 px-7 mb-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-4 gap-6">
            {/* Project Initiation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">
                  Project Initiation
                </h3>
                <span className="text-[13px] font-semibold text-[#333]">
                  {initiationProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${initiationProgress}%`,
                    backgroundColor: currentStatus.bar,
                  }}
                ></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">
                {initiationFiles.uploaded}/{initiationFiles.total} files
                uploaded
              </span>
            </div>

            {/* Project Implementation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">
                  Project Implementation
                </h3>
                <span className="text-[13px] font-semibold text-[#333]">
                  {implementationProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${implementationProgress}%`,
                    backgroundColor: currentStatus.bar,
                  }}
                ></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">
                {implementationFiles.uploaded}/{implementationFiles.total} files
                uploaded
              </span>
            </div>

            {/* Project Monitoring */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">
                  Project Monitoring
                </h3>
                <span className="text-[13px] font-semibold text-[#333]">
                  {monitoringProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${monitoringProgress}%`,
                    backgroundColor: currentStatus.bar,
                  }}
                ></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">
                {monitoringFiles.uploaded}/{monitoringFiles.total} files
                uploaded
              </span>
            </div>

            {/* Overall Project Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold text-[#333] m-0">
                  Overall Progress
                </h3>
                <span className="text-[13px] font-semibold text-[#333]">
                  {overallProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-[#e0e0e0] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${overallProgress}%`,
                    backgroundColor: currentStatus.bar,
                  }}
                ></div>
              </div>
              <span className="text-[11px] text-[#888] mt-1 block">
                {totalUploaded}/{totalFiles} files uploaded
              </span>
            </div>
          </div>
        </div>

        {/* Mode Transitioning Overlay */}
        {modeTransitioning && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[1100]">
            <div className="bg-white rounded-xl py-6 px-8 shadow-lg flex flex-col items-center gap-3">
              <Icon
                icon="mdi:loading"
                width={40}
                height={40}
                className="animate-spin text-[#1976d2]"
              />
              <span className="text-sm font-semibold text-[#333]">
                {transitioningTo === "view"
                  ? "Switching to View Mode..."
                  : transitioningTo === "upload"
                  ? "Switching to Upload Mode..."
                  : "Switching to Edit Mode..."}
              </span>
              <span className="text-xs text-[#666]">
                Please wait while the page updates
              </span>
            </div>
          </div>
        )}

        {/* Project Initiation */}
        <CestDocumentTable
          key={`initiation-${modeKey}`}
          title="Project Initiation"
          docs={initiationDocs}
          projectId={id}
          phase="INITIATION"
          onProgressUpdate={(p, u, t) => {
            setInitiationProgress(p);
            setInitiationFiles({ uploaded: u, total: t });
          }}
          isEditMode={isEditMode}
          isAssigneeEditMode={isAssigneeEditMode()}
          isAssigneeUploadMode={isAssigneeUploadMode()}
          customRows={customRows}
          onAddRowClick={(sectionLabel) => setShowAddRowModal({ show: true, sectionLabel })}
          onEditRowClick={(row) => setShowEditRowModal({ show: true, rowId: row.id, currentName: row.name, rowType: row.rowType, dropdownOptions: row.dropdownOptions })}
          onDeleteRowClick={(row) => setRemoveCustomRowConfirmModal({ show: true, rowId: row.id, rowName: row.name })}
        />

        {/* Project Implementation */}
        <CestDocumentTable
          key={`implementation-${modeKey}`}
          title="Project Implementation"
          docs={implementationDocs}
          projectId={id}
          phase="IMPLEMENTATION"
          onProgressUpdate={(p, u, t) => {
            setImplementationProgress(p);
            setImplementationFiles({ uploaded: u, total: t });
          }}
          isEditMode={isEditMode}
          isAssigneeEditMode={isAssigneeEditMode()}
          isAssigneeUploadMode={isAssigneeUploadMode()}
          customRows={customRows}
          onAddRowClick={(sectionLabel) => setShowAddRowModal({ show: true, sectionLabel })}
          onEditRowClick={(row) => setShowEditRowModal({ show: true, rowId: row.id, currentName: row.name, rowType: row.rowType, dropdownOptions: row.dropdownOptions })}
          onDeleteRowClick={(row) => setRemoveCustomRowConfirmModal({ show: true, rowId: row.id, rowName: row.name })}
        />

        {/* Project Monitoring */}
        <CestDocumentTable
          key={`monitoring-${modeKey}`}
          title="Project Monitoring"
          docs={monitoringDocs}
          projectId={id}
          phase="MONITORING"
          onProgressUpdate={(p, u, t) => {
            setMonitoringProgress(p);
            setMonitoringFiles({ uploaded: u, total: t });
          }}
          isEditMode={isEditMode}
          isAssigneeEditMode={isAssigneeEditMode()}
          isAssigneeUploadMode={isAssigneeUploadMode()}
          customRows={customRows}
          onAddRowClick={(sectionLabel) => setShowAddRowModal({ show: true, sectionLabel })}
          onEditRowClick={(row) => setShowEditRowModal({ show: true, rowId: row.id, currentName: row.name, rowType: row.rowType, dropdownOptions: row.dropdownOptions })}
          onDeleteRowClick={(row) => setRemoveCustomRowConfirmModal({ show: true, rowId: row.id, rowName: row.name })}
        />

        {/* Edit Request Modal */}
        {editRequestModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]"
            onClick={() => setEditRequestModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[440px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-[#fff3e0] flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="mdi:lock-outline"
                  width={36}
                  height={36}
                  color="#f57c00"
                />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">
                Edit Access Required
              </h3>
              <p className="text-[14px] text-[#666] m-0 mb-2">
                You don&apos;t have permission to edit this project.
              </p>
              <p className="text-[13px] text-[#888] m-0 mb-6">
                Only the project assignee (
                {project?.staffAssigned || "Not assigned"}) or users with
                approved access can edit this project.
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
                  {sendingRequest ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Request Sent Confirmation Modal */}
        {editRequestSent && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]"
            onClick={() => setEditRequestSent(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="mdi:check-circle"
                  width={36}
                  height={36}
                  color="#2e7d32"
                />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">
                Request Sent!
              </h3>
              <p className="text-[14px] text-[#666] m-0 mb-6">
                Your edit access request has been sent to{" "}
                {project?.staffAssigned || "the assignee"}. You will be notified
                once it&apos;s approved.
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
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]"
            onClick={() => setEditPermissionModal(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-[520px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#eee] bg-[#f9f9f9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fff3e0] flex items-center justify-center">
                    <Icon
                      icon="mdi:account-key"
                      width={24}
                      height={24}
                      color="#f57c00"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#333] m-0">
                      Edit Permissions
                    </h3>
                    <p className="text-xs text-[#888] m-0">
                      Manage who can edit this project
                    </p>
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
                    <Icon
                      icon="mdi:loading"
                      width={40}
                      height={40}
                      className="animate-spin text-[#f57c00] mb-3"
                    />
                    <p className="text-sm text-[#666] m-0">
                      Loading permissions...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Pending Requests Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-[#333] mb-3 flex items-center gap-2">
                        <Icon
                          icon="mdi:clock-outline"
                          width={16}
                          height={16}
                          color="#f57c00"
                        />
                        Pending Requests
                        {pendingEditRequests.length > 0 && (
                          <span className="bg-[#f57c00] text-white text-[10px] px-2 py-0.5 rounded-full">
                            {pendingEditRequests.length}
                          </span>
                        )}
                      </h4>

                      {pendingEditRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-[#999] text-sm">
                          <Icon
                            icon="mdi:inbox-outline"
                            width={40}
                            height={40}
                            className="mb-2 opacity-50"
                          />
                          <p className="m-0">No pending edit requests</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {pendingEditRequests.map((request) => (
                            <div
                              key={request.userId}
                              className="flex items-center gap-3 p-3 bg-[#f9f9f9] rounded-lg border border-[#eee]"
                            >
                              {request.userProfileUrl ? (
                                <img
                                  src={request.userProfileUrl}
                                  alt={request.userName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#f57c00]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-[#f57c00] bg-gray-100 flex items-center justify-center">
                                  <Icon
                                    icon="mdi:account"
                                    width={20}
                                    height={20}
                                    color="#999"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#333] m-0 truncate">
                                  {request.userName}
                                </p>
                                <p className="text-xs text-[#888] m-0">
                                  Requesting edit access
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    acceptEditRequest(request.userId)
                                  }
                                  disabled={
                                    processingRequest === request.userId
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#2e7d32] text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:bg-[#1b5e20] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                  {processingRequest === request.userId ? (
                                    <Icon
                                      icon="mdi:loading"
                                      width={14}
                                      height={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Icon
                                      icon="mdi:check"
                                      width={14}
                                      height={14}
                                    />
                                  )}
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    declineEditRequest(request.userId)
                                  }
                                  disabled={
                                    processingRequest === request.userId
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#c62828] text-white border-none rounded-md text-xs font-semibold cursor-pointer hover:bg-[#b71c1c] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                  <Icon
                                    icon="mdi:close"
                                    width={14}
                                    height={14}
                                  />
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
                          <Icon
                            icon="mdi:check-circle"
                            width={16}
                            height={16}
                            color="#2e7d32"
                          />
                          Approved Editors
                          <span className="bg-[#2e7d32] text-white text-[10px] px-2 py-0.5 rounded-full">
                            {approvedEditorsList.length}
                          </span>
                        </h4>
                        <p className="text-xs text-[#888] mb-3">
                          These users have been granted edit access to this
                          project.
                        </p>
                        <div className="flex flex-col gap-2">
                          {approvedEditorsList.map((editor) => (
                            <div
                              key={editor.userId}
                              className="flex items-center gap-3 p-3 bg-[#e8f5e9] rounded-lg border border-[#c8e6c9]"
                            >
                              {editor.userProfileUrl ? (
                                <img
                                  src={editor.userProfileUrl}
                                  alt={editor.userName}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#2e7d32]"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-[#2e7d32] bg-white flex items-center justify-center">
                                  <Icon
                                    icon="mdi:account"
                                    width={20}
                                    height={20}
                                    color="#2e7d32"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#2e7d32] m-0 truncate">
                                  {editor.userName}
                                </p>
                                <p className="text-xs text-[#66bb6a] m-0">
                                  Has edit access
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  removeApprovedEditor(editor.userId)
                                }
                                disabled={processingRequest === editor.userId}
                                className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#c62828] border border-[#c62828] rounded-md text-xs font-semibold cursor-pointer hover:bg-[#ffebee] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                title="Remove edit access"
                              >
                                {processingRequest === editor.userId ? (
                                  <Icon
                                    icon="mdi:loading"
                                    width={14}
                                    height={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Icon
                                    icon="mdi:account-remove"
                                    width={14}
                                    height={14}
                                  />
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
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 overflow-auto"
            onClick={() => setShowExecutiveSummaryPreview(false)}
          >
            <div
              className="bg-gray-200 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#1b5e20] to-[#2e7d32] px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="mdi:file-document-outline"
                    width={24}
                    height={24}
                    color="white"
                  />
                  <h3 className="text-white text-lg font-bold m-0">
                    Executive Summary Preview (A4)
                  </h3>
                </div>
                <button
                  onClick={() => setShowExecutiveSummaryPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <Icon icon="mdi:close" width={24} height={24} color="white" />
                </button>
              </div>

              {/* A4 Paper Container */}
              <div className="overflow-auto flex-1 p-6 flex justify-center">
                <div
                  className="bg-white shadow-xl"
                  style={{
                    width: "210mm",
                    minHeight: "297mm",
                    padding: "15mm 20mm",
                    fontFamily: "Calibri, Arial, sans-serif",
                    fontSize: "11pt",
                    lineHeight: "1.3",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Header - Logo floating left, Title truly centered */}
                  <div style={{ position: "relative", marginBottom: "15px" }}>
                    {/* Logo positioned absolutely so it doesn't affect title centering */}
                    <img
                      src="/cest-logo-text.png"
                      alt="CEST Logo"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: "50px",
                        width: "auto",
                        marginTop: "-10px",
                      }}
                    />
                    {/* Title centered across full width */}
                    <div
                      style={{
                        width: "100%",
                        textAlign: "center",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "24pt",
                          fontWeight: "bold",
                          letterSpacing: "1px",
                        }}
                      >
                        EXECUTIVE SUMMARY
                      </span>
                    </div>
                  </div>

                  {/* Main Table */}
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "20px",
                    }}
                  >
                    <tbody>
                      {/* Project Title */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            width: "35%",
                          }}
                        >
                          Project Title:
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          {project.projectTitle || ""}
                        </td>
                      </tr>
                      {/* Proponent */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          Proponent:
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          {project.beneficiaries || ""}
                        </td>
                      </tr>
                      {/* Requested Amount */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          Requested Amount:
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <input
                            type="text"
                            value={execSummaryData.requestedAmount}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "requestedAmount",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* Owner's Equity */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          Owner&apos;s Equity:
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <input
                            type="text"
                            value={execSummaryData.ownersEquity}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "ownersEquity",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* Total Project Cost */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          Total Project Cost:
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <input
                            type="text"
                            value={execSummaryData.totalProjectCost}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "totalProjectCost",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 1. DOST technology */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "top",
                          }}
                        >
                          1. DOST technology to be adopted and the mode of
                          techno transfer.
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <textarea
                            value={execSummaryData.dostTechnology}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "dostTechnology",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              resize: "none",
                              minHeight: "30px",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 2. Income - Header row */}
                      <tr>
                        <td
                          rowSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "middle",
                            width: "35%",
                          }}
                        >
                          2. Income
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            width: "32.5%",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Present
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            width: "32.5%",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Additional (Y1)
                        </td>
                      </tr>
                      {/* 2. Income - Value row */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.incomePresent}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "incomePresent",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.incomeAdditional}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "incomeAdditional",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 3. Jobs Created - Header row */}
                      <tr>
                        <td
                          rowSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "middle",
                          }}
                        >
                          3. Jobs Created
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Present
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Additional (Y1)
                        </td>
                      </tr>
                      {/* 3. Jobs Created - Value row */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.jobsCreatedPresent}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "jobsCreatedPresent",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.jobsCreatedAdditional}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "jobsCreatedAdditional",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 4. Productivity - Header row */}
                      <tr>
                        <td
                          rowSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "middle",
                          }}
                        >
                          4. Productivity
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Present
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Increase (Y1)
                        </td>
                      </tr>
                      {/* 4. Productivity - Value row */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.productivityPresent}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "productivityPresent",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.productivityIncrease}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "productivityIncrease",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 5. Market - Header row */}
                      <tr>
                        <td
                          rowSpan={2}
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "middle",
                          }}
                        >
                          5. Market
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Present
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          Additional (Y1)
                        </td>
                      </tr>
                      {/* 5. Market - Value row */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.marketPresent}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "marketPresent",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            textAlign: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={execSummaryData.marketAdditional}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "marketAdditional",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              textAlign: "center",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 6. List of Products */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "top",
                          }}
                        >
                          6. List of Products
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <textarea
                            value={execSummaryData.listOfProducts}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "listOfProducts",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              resize: "none",
                              minHeight: "30px",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 7. With FDA-LTO? */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          7. With FDA-LTO?
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <input
                            type="text"
                            value={execSummaryData.withFdaLto}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "withFdaLto",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 8. With CPRs? */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                          }}
                        >
                          8. With CPRs?
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                          }}
                          colSpan={2}
                        >
                          <input
                            type="text"
                            value={execSummaryData.withCprs}
                            onChange={(e) =>
                              updateExecSummaryField("withCprs", e.target.value)
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 9. Business plan paragraph */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "top",
                          }}
                        >
                          9. A short paragraph on the business plan answering
                          the question, How will the enterprise earn income?
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            minHeight: "80px",
                          }}
                          colSpan={2}
                        >
                          <textarea
                            value={execSummaryData.businessPlan}
                            onChange={(e) =>
                              updateExecSummaryField(
                                "businessPlan",
                                e.target.value,
                              )
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              resize: "none",
                              minHeight: "60px",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                      {/* 10. Plans */}
                      <tr>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            fontWeight: "bold",
                            verticalAlign: "top",
                          }}
                        >
                          10. Plans
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px 8px",
                            minHeight: "100px",
                          }}
                          colSpan={2}
                        >
                          <textarea
                            value={execSummaryData.plans}
                            onChange={(e) =>
                              updateExecSummaryField("plans", e.target.value)
                            }
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              resize: "none",
                              minHeight: "80px",
                            }}
                            placeholder=""
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer - Prepared by / Reviewed by */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "30px",
                    }}
                  >
                    {/* Prepared by */}
                    <div style={{ width: "45%" }}>
                      <div style={{ marginBottom: "8px" }}>Prepared by:</div>
                      <div style={{ marginTop: "40px" }}>
                        <input
                          type="text"
                          value={execSummaryData.preparedByName}
                          onChange={(e) =>
                            updateExecSummaryField(
                              "preparedByName",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            borderBottom: "1px solid #000",
                            background: "transparent",
                            outline: "none",
                            textAlign: "left",
                            paddingBottom: "2px",
                          }}
                          placeholder=""
                        />
                      </div>
                      <div style={{ marginTop: "2px" }}>
                        <input
                          type="text"
                          value={execSummaryData.preparedByPosition}
                          onChange={(e) =>
                            updateExecSummaryField(
                              "preparedByPosition",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            background: "transparent",
                            outline: "none",
                            textAlign: "left",
                            fontSize: "10pt",
                            border: "none",
                          }}
                          placeholder=""
                        />
                      </div>
                    </div>
                    {/* Reviewed by */}
                    <div style={{ width: "45%" }}>
                      <div style={{ marginBottom: "8px" }}>Reviewed by</div>
                      <div style={{ marginTop: "40px" }}>
                        <input
                          type="text"
                          value={execSummaryData.reviewedByName}
                          onChange={(e) =>
                            updateExecSummaryField(
                              "reviewedByName",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            borderBottom: "1px solid #000",
                            background: "transparent",
                            outline: "none",
                            textAlign: "left",
                            paddingBottom: "2px",
                          }}
                          placeholder=""
                        />
                      </div>
                      <div style={{ marginTop: "2px" }}>
                        <input
                          type="text"
                          value={execSummaryData.reviewedByPosition}
                          onChange={(e) =>
                            updateExecSummaryField(
                              "reviewedByPosition",
                              e.target.value,
                            )
                          }
                          style={{
                            width: "100%",
                            background: "transparent",
                            outline: "none",
                            textAlign: "left",
                            fontSize: "10pt",
                            border: "none",
                          }}
                          placeholder=""
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-gray-100 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowExecutiveSummaryPreview(false)}
                  className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    if (!project) return;
                    await downloadExecutiveSummary(project, execSummaryData);
                    setShowExecutiveSummaryPreview(false);
                  }}
                  className="px-5 py-2 bg-[#2e7d32] text-white rounded-lg text-sm font-semibold hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
                >
                  <Icon icon="mdi:download" width={18} height={18} />
                  Download DOCX
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
                    await saveDropdownData({ customRows: updatedCustomRows }, `Row "${newRowName.trim()}" added successfully!`);

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
                    const newName = editRowName || showEditRowModal.currentName;
                    const newOptions = showEditRowModal.rowType === 'dropdown'
                      ? (editRowOptions || showEditRowModal.dropdownOptions?.join(', ') || '').split(',').map(o => o.trim()).filter(o => o)
                      : undefined;

                    const updatedCustomRows = customRows.map(r =>
                      r.id === showEditRowModal.rowId
                        ? { ...r, name: newName, dropdownOptions: newOptions }
                        : r
                    );
                    setCustomRows(updatedCustomRows);

                    await saveDropdownData({ customRows: updatedCustomRows }, `Row "${newName}" updated successfully!`);

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

        {/* Remove Custom Row Confirmation Modal */}
        {removeCustomRowConfirmModal?.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setRemoveCustomRowConfirmModal(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#ffebee] flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:delete-alert" width={36} height={36} color="#c62828" />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Delete Row?</h3>
              <p className="text-[14px] text-[#666] m-0 mb-6">
                Are you sure you want to delete <span className="font-semibold">&quot;{removeCustomRowConfirmModal.rowName}&quot;</span>?<br/>
                <span className="text-[#999] text-[12px]">Any uploaded files for this row will also be removed.</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="py-2.5 px-8 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
                  onClick={() => setRemoveCustomRowConfirmModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="py-2.5 px-8 bg-[#c62828] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#b71c1c]"
                  onClick={async () => {
                    const updated = customRows.filter(r => r.id !== removeCustomRowConfirmModal.rowId);
                    setCustomRows(updated);
                    await saveDropdownData({ customRows: updated }, `Row "${removeCustomRowConfirmModal.rowName}" deleted.`);
                    setRemoveCustomRowConfirmModal(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Success Modal */}
        {saveSuccessModal?.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => setSaveSuccessModal(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[400px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:check-circle" width={36} height={36} color="#2e7d32" />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Success!</h3>
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

        {/* Transfer Ownership Modal */}
        {transferOwnershipModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1200]" onClick={() => { setTransferOwnershipModal(false); setUserSearchQuery(''); setSelectedNewOwner(null); }}>
            <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#f57c00] to-[#ff9800] px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon icon="mdi:account-switch" width={24} height={24} color="white" />
                  </div>
                  <div>
                    <h3 className="text-white text-base font-bold m-0">Transfer Ownership</h3>
                    <p className="text-white/80 text-xs m-0">Select a user to transfer this project to</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Warning */}
                <div className="flex items-start gap-2 bg-[#fff3e0] border border-[#ffcc80] rounded-lg py-3 px-4 mb-4 text-xs text-[#e65100]">
                  <Icon icon="mdi:alert-outline" width={16} height={16} className="min-w-4 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> Transferring ownership will remove your access to edit this project. The new owner will have full control.
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Icon icon="mdi:magnify" width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 border border-[#ddd] rounded-lg text-sm focus:outline-none focus:border-[#f57c00] focus:ring-1 focus:ring-[#f57c00]/20"
                  />
                </div>

                {/* User List */}
                <div className="max-h-[280px] overflow-y-auto border border-[#eee] rounded-lg">
                  {allUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-[#999]">
                      <Icon icon="mdi:loading" width={24} height={24} className="animate-spin mb-2" />
                      <span className="text-sm">Loading users...</span>
                    </div>
                  ) : (
                    allUsers
                      .filter(u =>
                        u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                      )
                      .map((user) => (
                        <div
                          key={user.id}
                          onClick={() => setSelectedNewOwner(user.id)}
                          className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#eee] last:border-b-0 transition-colors ${
                            selectedNewOwner === user.id
                              ? 'bg-[#fff3e0]'
                              : 'hover:bg-[#f9f9f9]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#e0e0e0] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.profileImageUrl ? (
                              <img src={user.profileImageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <Icon icon="mdi:account" width={24} height={24} color="#999" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#333] m-0 truncate">{user.fullName}</p>
                            <p className="text-xs text-[#888] m-0 truncate">{user.email}</p>
                          </div>
                          {selectedNewOwner === user.id && (
                            <Icon icon="mdi:check-circle" width={20} height={20} color="#f57c00" />
                          )}
                        </div>
                      ))
                  )}
                  {allUsers.length > 0 && allUsers.filter(u =>
                    u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-[#999]">
                      <Icon icon="mdi:account-search" width={32} height={32} className="mb-2" />
                      <span className="text-sm">No users found</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 bg-[#f9f9f9] border-t border-[#eee]">
                <button
                  onClick={() => { setTransferOwnershipModal(false); setUserSearchQuery(''); setSelectedNewOwner(null); }}
                  className="px-5 py-2 bg-white text-[#666] border border-[#d0d0d0] rounded-lg text-sm font-medium hover:bg-[#f5f5f5]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const selectedUser = allUsers.find(u => u.id === selectedNewOwner);
                    if (selectedUser) {
                      setTransferConfirmModal({
                        show: true,
                        userId: selectedUser.id,
                        userName: selectedUser.fullName,
                      });
                    }
                  }}
                  disabled={!selectedNewOwner}
                  className="px-5 py-2 bg-[#f57c00] text-white rounded-lg text-sm font-semibold hover:bg-[#e65100] disabled:bg-[#ccc] disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon icon="mdi:account-switch" width={16} height={16} />
                  Transfer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Ownership Confirmation Modal */}
        {transferConfirmModal?.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1300]" onClick={() => setTransferConfirmModal(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[420px] py-8 px-10 shadow-[0_12px_40px_rgba(0,0,0,0.25)] text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-full bg-[#fff3e0] flex items-center justify-center mx-auto mb-4">
                <Icon icon="mdi:account-switch" width={36} height={36} color="#f57c00" />
              </div>
              <h3 className="text-lg font-bold text-[#333] m-0 mb-3">Confirm Transfer</h3>
              <p className="text-[14px] text-[#666] m-0 mb-2">
                Are you sure you want to transfer ownership of this project to:
              </p>
              <p className="text-[16px] font-semibold text-[#333] m-0 mb-4">
                {transferConfirmModal.userName}
              </p>
              <p className="text-[12px] text-[#999] m-0 mb-6">
                You will lose access to edit this project and will be redirected to the projects list.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="py-2.5 px-6 bg-white text-[#333] border border-[#d0d0d0] rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]"
                  onClick={() => setTransferConfirmModal(null)}
                  disabled={transferring}
                >
                  Cancel
                </button>
                <button
                  className="py-2.5 px-6 bg-[#f57c00] text-white border-none rounded-lg text-[14px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#e65100] disabled:bg-[#ccc] disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={() => handleTransferOwnership(transferConfirmModal.userId, transferConfirmModal.userName)}
                  disabled={transferring}
                >
                  {transferring ? (
                    <>
                      <Icon icon="mdi:loading" width={16} height={16} className="animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:check" width={16} height={16} />
                      Confirm Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
