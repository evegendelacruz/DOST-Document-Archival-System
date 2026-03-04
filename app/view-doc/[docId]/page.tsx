'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Icon } from '@iconify/react';

interface DocInfo {
  id: string;
  fileName: string;
  mimeType: string;
  hasPin: boolean;
}

export default function ViewDocPage() {
  const { docId } = useParams<{ docId: string }>();
  const [docInfo, setDocInfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [pin, setPin] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch(`/api/view-doc/${docId}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setDocInfo(data);
        // If no PIN set, load file immediately
        if (!data.hasPin) {
          loadFile('');
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [docId]);

  const loadFile = async (pinValue: string) => {
    setVerifying(true);
    setPinError('');
    try {
      const res = await fetch(`/api/view-doc/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        setPinError(err.error || 'Invalid PIN');
        setPin(['', '', '', '', '', '']);
        setTimeout(() => pinRefs.current[0]?.focus(), 50);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    } catch {
      setPinError('Failed to load file. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handlePinInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setPinError('');

    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 filled
    const filled = newPin.filter(Boolean);
    if (filled.length === 4) {
      loadFile(newPin.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      const pinVal = pin.join('');
      if (pinVal.length === 4) loadFile(pinVal);
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    const newPin = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) newPin[i] = pasted[i];
    setPin(newPin);
    const nextFocus = Math.min(pasted.length, 3);
    pinRefs.current[nextFocus]?.focus();
    if (pasted.length === 4) {
      setTimeout(() => loadFile(pasted), 100);
    }
  };

  const isImage = docInfo && /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(docInfo.fileName);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icon icon="mdi:loading" width={40} height={40} className="animate-spin text-[#00AEEF]" />
          <p className="text-[#888] text-sm">Loading document...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 shadow-lg text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-[#fce4ec] flex items-center justify-center mx-auto mb-4">
            <Icon icon="mdi:file-remove-outline" width={36} height={36} color="#c62828" />
          </div>
          <h2 className="text-lg font-bold text-[#333] mb-2">Document Not Found</h2>
          <p className="text-[#888] text-sm">This document may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  // File is loaded — show viewer
  if (fileUrl) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#16213e] border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00AEEF]/20 flex items-center justify-center">
              <Icon icon="mdi:file-document-outline" width={18} height={18} color="#00AEEF" />
            </div>
            <span className="text-white text-sm font-semibold truncate max-w-[300px]">{docInfo?.fileName}</span>
          </div>
          <a
            href={fileUrl}
            download={docInfo?.fileName}
            className="flex items-center gap-1.5 bg-[#00AEEF] text-white text-xs font-semibold px-4 py-2 rounded-lg no-underline hover:bg-[#0095cc] transition-colors"
          >
            <Icon icon="mdi:download" width={14} height={14} />
            Download
          </a>
        </div>

        {/* Viewer */}
        <div className="flex-1 flex items-center justify-center p-4">
          {isImage ? (
            <img
              src={fileUrl}
              alt={docInfo?.fileName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <iframe
              src={fileUrl}
              className="w-full max-w-5xl rounded-lg shadow-2xl border-none"
              style={{ height: 'calc(100vh - 80px)' }}
              title={docInfo?.fileName}
            />
          )}
        </div>
      </div>
    );
  }

  // PIN entry screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-[420px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        {/* Top banner */}
        <div className="bg-gradient-to-r from-[#00AEEF] to-[#0077b6] px-8 py-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <Icon icon="mdi:lock-outline" width={32} height={32} color="white" />
          </div>
          <h1 className="text-white text-xl font-bold m-0">Secure Document</h1>
          <p className="text-white/80 text-sm m-0 mt-1">Enter PIN to view this file</p>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          {/* File info */}
          <div className="flex items-center gap-3 bg-[#f5f7fa] rounded-xl px-4 py-3 mb-6">
            <div className="w-10 h-12 rounded-lg bg-[#e53935] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold uppercase">
                {docInfo?.fileName.split('.').pop() || 'FILE'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#333] m-0 truncate">{docInfo?.fileName}</p>
              <p className="text-[11px] text-[#888] m-0 mt-0.5">Protected document</p>
            </div>
            <Icon icon="mdi:shield-check" width={20} height={20} color="#00AEEF" />
          </div>

          {/* PIN boxes */}
          <p className="text-[13px] text-[#555] text-center mb-4 font-medium">Enter your PIN</p>
          <div className="flex gap-2 justify-center mb-2" onPaste={handlePinPaste}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { pinRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinInput(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-200 bg-[#f9fafb]"
                style={{
                  borderColor: pinError ? '#e53935' : digit ? '#00AEEF' : '#e0e0e0',
                  color: '#333',
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Error */}
          {pinError && (
            <div className="flex items-center gap-1.5 justify-center mb-3">
              <Icon icon="mdi:alert-circle-outline" width={14} height={14} color="#e53935" />
              <p className="text-[12px] text-[#e53935] m-0">{pinError}</p>
            </div>
          )}

          <p className="text-[11px] text-[#aaa] text-center mb-5 mt-2">
            Enter PIN digits one by one or paste all at once
          </p>

          {/* Submit */}
          <button
            onClick={() => loadFile(pin.join(''))}
            disabled={verifying || pin.filter(Boolean).length < 4}
            className="w-full py-3 bg-gradient-to-r from-[#00AEEF] to-[#0077b6] text-white font-semibold rounded-xl border-none cursor-pointer text-[14px] transition-opacity duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          >
            {verifying ? (
              <>
                <Icon icon="mdi:loading" width={18} height={18} className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Icon icon="mdi:lock-open-outline" width={18} height={18} />
                Open Document
              </>
            )}
          </button>

          <p className="text-[11px] text-[#ccc] text-center mt-4 m-0">
            DOST Document Archival System &bull; Secure Viewer
          </p>
        </div>
      </div>
    </div>
  );
}
