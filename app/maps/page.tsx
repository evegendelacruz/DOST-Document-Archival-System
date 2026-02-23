'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import 'leaflet/dist/leaflet.css';
import boundaryData from './misamis-oriental-boundary.json';
import cdoBoundaryData from './cdo-boundary.json';
import DashboardLayout from '../components/DashboardLayout';

const programFilters = [
  { id: 'setup', label: 'SETUP', color: '#00838f', icon: 'mdi:cog-outline', logo: '/setup-logo.png' },
  { id: 'cest', label: 'CEST', color: '#2e7d32', icon: 'mdi:leaf', logo: '/cest-sidebar-logo.png' },
  { id: 'sscp', label: 'SSCP', color: '#979797', icon: 'mdi:star-four-points-outline', logo: null },
  { id: 'lgia', label: 'LGIA', color: '#F1B82C', icon: 'mdi:flower-outline', logo: null },
];

const misamisOrientalBoundary = boundaryData[0] as [number, number][];
const cdoBoundary = cdoBoundaryData[0] as [number, number][];

type SetupProjectPin = {
  id: string;
  title: string;
  firm: string | null;
  address: string | null;
  coordinates: string | null;
  companyLogoUrl: string | null;
};

type CestProjectPin = {
  id: string;
  projectTitle: string;
  location: string | null;
  coordinates: string | null;
  companyLogoUrl: string | null;
  programFunding: string | null;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};



const mor1Municipalities = ['balingasag', 'balingoan', 'binuangan', 'kinoguitan', 'lagonglong', 'magsaysay', 'medina', 'salay', 'sugbongcogon', 'talisayan'];
const mor2Municipalities = ['claveria', 'jasaan', 'villanueva', 'tagoloan', 'opol', 'el salvador', 'laguindingan', 'gitagum', 'libertad', 'alubijid', 'initao', 'naawan', 'manticao', 'lugait'];
const cdo1Barangays = ['bonbon', 'bayabas', 'bayanga', 'besigan', 'bulua', 'camaman-an', 'carmen', 'consolacion', 'dansolihon', 'f.s. catanico', 'iponan', 'kauswagan', 'lapasan', 'macabalan', 'mambuaya', 'nazareth', 'pagalungan', 'patag', 'puntod', 'san simon', 'taglimao', 'tignapoloan', 'tuburan', 'tumpagon'];
const cdo2Barangays = ['agusan', 'balulang', 'bugo', 'canitoan', 'cugman', 'gusa', 'macasandig', 'pagatpat', 'puerto', 'tablon', 'tagpangi'];

const getDistrictFromAddress = (address: string | null): 1 | 2 | 3 | 4 | 0 => {
  if (!address) return 0;
  const lower = address.toLowerCase();
  if (lower.includes('cagayan de oro')) {
    if (cdo1Barangays.some(b => lower.includes(b))) return 3;
    if (cdo2Barangays.some(b => lower.includes(b))) return 4;
    return 3;
  }
  if (mor1Municipalities.some(m => lower.includes(m))) return 1;
  if (mor2Municipalities.some(m => lower.includes(m))) return 2;
  return 0;
};

const districtMap: Record<string, number[]> = {
  mor1: [1],
  mor2: [2],
  cdo1: [3],
  cdo2: [4],
  all: [1, 2, 3, 4, 0],
};

const filterSetupByDistrict = (projects: SetupProjectPin[], district: string) => {
  if (district === 'all') return projects;
  const allowed = districtMap[district] || [];
  return projects.filter(p => {
    const pd = getDistrictFromAddress(p.address);
    return allowed.includes(pd);
  });
};

const filterCestByDistrict = (projects: CestProjectPin[], district: string) => {
  if (district === 'all') return projects;
  const allowed = districtMap[district] || [];
  return projects.filter(p => {
    const pd = getDistrictFromAddress(p.location);
    return allowed.includes(pd);
  });
};

// ── Address Search Bar ──────────────────────────────────────────────────────
function AddressSearchBar({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    // Biased toward Philippines / Misamis Oriental area
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=ph&viewbox=123.8,9.2,125.2,8.1&bounded=0`;
    fetch(url, { headers: { 'Accept-Language': 'en' } })
      .then(r => r.json())
      .then((data: NominatimResult[]) => { setResults(data); setOpen(data.length > 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (result: NominatimResult) => {
    setQuery(result.display_name);
    setOpen(false);
    setResults([]);
    onSelect(parseFloat(result.lat), parseFloat(result.lon));
  };

  const handleClear = () => { setQuery(''); setResults([]); setOpen(false); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input pill */}
      <div className="flex items-center bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] overflow-hidden">
        {loading ? (
          <svg className="ml-3 w-[18px] h-[18px] text-[#00838f] animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <Icon icon="mdi:map-marker-outline" className="ml-3 text-[#999] flex-shrink-0" width={18} height={18} />
        )}
        <input
          type="text"
          placeholder="Search address or place..."
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-[280px] py-2.5 px-2 border-none outline-none text-[13px] bg-transparent placeholder:text-[#999] font-sans text-[#333]"
        />
        {query ? (
          <button
            onClick={handleClear}
            className="flex items-center justify-center w-9 h-9 mr-1 text-[#bbb] hover:text-[#999] transition-colors cursor-pointer border-none bg-transparent"
          >
            <Icon icon="mdi:close" width={16} height={16} />
          </button>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 mr-1 bg-primary rounded-full flex-shrink-0">
            <Icon icon="mdi:magnify" width={18} height={18} className="text-white" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.18)] overflow-hidden z-[1001]">
          {results.map((result, idx) => (
            <button
              key={result.place_id}
              onMouseDown={() => handleSelect(result)}
              className={`w-full text-left px-4 py-3 text-[12.5px] font-sans text-[#333] hover:bg-[#f0fafb] transition-colors flex items-start gap-2.5 cursor-pointer border-none bg-transparent ${idx !== results.length - 1 ? 'border-b border-[#f0f0f0]' : ''}`}
            >
              <Icon icon="mdi:map-marker-outline" width={15} height={15} className="text-[#00838f] flex-shrink-0 mt-0.5" />
              <span className="leading-snug line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Map Component ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapComponent({ activePrograms, activeDistrict, setupProjects, cestProjects, flyToCoords }: {
  activePrograms: string[];
  activeDistrict: string;
  setupProjects: SetupProjectPin[];
  cestProjects: CestProjectPin[];
  flyToCoords: { lat: number; lng: number; key: number } | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [components, setComponents] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaflet, setLeaflet] = useState<any>(null);
  // Must be declared before any early return to satisfy Rules of Hooks
  const executedFlyKeyRef = useRef<number | null>(null);

  useEffect(() => {
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => {
      setComponents(rl);
      setLeaflet(L.default || L);
    });
  }, []);

  if (!components || !leaflet) {
    return <div className="w-full h-full flex items-center justify-center text-base text-[#666] bg-[#f5f5f5]">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } = components;

  function ResizeHandler() {
    const map = useMap();
    useEffect(() => {
      const container = map.getContainer();
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(container);
      return () => observer.disconnect();
    }, [map]);
    return null;
  }

  function FlyToHandler() {
    const map = useMap();
    useEffect(() => {
      if (flyToCoords && flyToCoords.key !== executedFlyKeyRef.current) {
        executedFlyKeyRef.current = flyToCoords.key;
        map.flyTo([flyToCoords.lat, flyToCoords.lng], 16, { duration: 1.5 });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flyToCoords?.key]);
    return null;
  }

  // Icon helper — adds 4px padding all around so stroke+shadow are never clipped
  // Total canvas: 48×58 (was 40×50), content offset by 4px
  const setupIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:48px;height:58px;overflow:visible;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="-4 -4 48 58" style="position:absolute;top:0;left:0;overflow:visible;">
        <defs>
          <clipPath id="setup-clip"><circle cx="20" cy="17" r="12"/></clipPath>
          <filter id="ds" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#00838f" stroke="#006064" stroke-width="1.2" filter="url(#ds)"/>
        <circle cx="20" cy="17" r="12" fill="#00838f"/>
        <image href="/setup-logo.png" x="8" y="5" width="24" height="24" clip-path="url(#setup-clip)" preserveAspectRatio="xMidYMid meet"/>
      </svg>
    </div>`,
    iconSize: [48, 58],
    iconAnchor: [24, 54],
    className: 'leaflet-pin-icon',
  });

  const cestIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:48px;height:58px;overflow:visible;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="-4 -4 48 58" style="position:absolute;top:0;left:0;overflow:visible;">
        <defs>
          <clipPath id="cest-clip"><circle cx="20" cy="17" r="12"/></clipPath>
          <filter id="ds2" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.2" filter="url(#ds2)"/>
        <circle cx="20" cy="17" r="12" fill="#2e7d32"/>
        <image href="/cest-sidebar-logo.png" x="8" y="5" width="24" height="24" clip-path="url(#cest-clip)" preserveAspectRatio="xMidYMid meet"/>
      </svg>
    </div>`,
    iconSize: [48, 58],
    iconAnchor: [24, 54],
    className: 'leaflet-pin-icon',
  });

  const sscpIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:48px;height:58px;overflow:visible;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="-4 -4 48 58" style="position:absolute;top:0;left:0;overflow:visible;">
        <defs>
          <filter id="ds3" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#979797" stroke="#707070" stroke-width="1.2" filter="url(#ds3)"/>
        <circle cx="20" cy="17" r="12" fill="white"/>
        <path d="M20 8l2.5 5.1 5.6.8-4.1 4 .9 5.6L20 21l-4.9 2.5.9-5.6-4.1-4 5.6-.8z" fill="#979797"/>
      </svg>
    </div>`,
    iconSize: [48, 58],
    iconAnchor: [24, 54],
    className: 'leaflet-pin-icon',
  });

  const lgiaIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:48px;height:58px;overflow:visible;">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="-4 -4 48 58" style="position:absolute;top:0;left:0;overflow:visible;">
        <defs>
          <filter id="ds4" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.35"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#F1B82C" stroke="#D4A017" stroke-width="1.2" filter="url(#ds4)"/>
        <circle cx="20" cy="17" r="12" fill="white"/>
        <g transform="translate(20,17)">
          <ellipse cx="0" cy="-5" rx="2.8" ry="4.5" fill="#F1B82C"/>
          <ellipse cx="4.8" cy="-1.5" rx="2.8" ry="4.5" fill="#F1B82C" transform="rotate(72)"/>
          <ellipse cx="3" cy="4" rx="2.8" ry="4.5" fill="#F1B82C" transform="rotate(144)"/>
          <ellipse cx="-3" cy="4" rx="2.8" ry="4.5" fill="#F1B82C" transform="rotate(216)"/>
          <ellipse cx="-4.8" cy="-1.5" rx="2.8" ry="4.5" fill="#F1B82C" transform="rotate(288)"/>
          <circle r="2.8" fill="#D4A017"/>
        </g>
      </svg>
    </div>`,
    iconSize: [48, 58],
    iconAnchor: [24, 54],
    className: 'leaflet-pin-icon',
  });

  const showSetup = activePrograms.includes('setup');
  const showCest  = activePrograms.includes('cest');
  const showSscp  = activePrograms.includes('sscp');
  const showLgia  = activePrograms.includes('lgia');

  // Split CEST projects by programFunding so SSCP/LGIA-funded ones appear under their own buttons
  const cestOnlyProjects = cestProjects.filter(p => p.programFunding !== 'SSCP' && p.programFunding !== 'LGIA');
  const cestAsSscp       = cestProjects.filter(p => p.programFunding === 'SSCP');
  const cestAsLgia       = cestProjects.filter(p => p.programFunding === 'LGIA');

  return (
    <MapContainer center={[8.477, 124.646]} zoom={10} style={{ width: '100%', height: '100%' }} zoomControl={false}>
      <ResizeHandler />
      <FlyToHandler />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon positions={misamisOrientalBoundary} pathOptions={{ color: '#dc2626', weight: 3, fill: false }} />
      <Polygon positions={cdoBoundary} pathOptions={{ color: '#dc2626', weight: 3, fill: false, dashArray: '8, 6' }} />

      {showSetup && filterSetupByDistrict(setupProjects, activeDistrict).map((project) => {
        const [lat, lng] = project.coordinates!.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <Marker key={`setup-${project.id}`} position={[lat, lng]} icon={setupIcon}>
            <Popup>
              <div>
                <a href={`/setup/${project.id}`} style={{ color: '#00838f', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>{project.title}</a>
                {project.firm    && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666' }}>{project.firm}</p>}
                {project.address && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{project.address}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* CEST-funded projects */}
      {showCest && filterCestByDistrict(cestOnlyProjects, activeDistrict).map((project) => {
        const [lat, lng] = project.coordinates!.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <Marker key={`cest-${project.id}`} position={[lat, lng]} icon={cestIcon}>
            <Popup>
              <div>
                <a href={`/cest/${project.id}`} style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>{project.projectTitle}</a>
                {project.location && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>{project.location}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* SSCP: only DB-registered CEST projects with programFunding = SSCP */}
      {showSscp && filterCestByDistrict(cestAsSscp, activeDistrict).map((project) => {
        const [lat, lng] = project.coordinates!.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <Marker key={`sscp-${project.id}`} position={[lat, lng]} icon={sscpIcon}>
            <Popup>
              <div>
                <a href={`/cest/${project.id}`} style={{ color: '#707070', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>{project.projectTitle}</a>
                {project.location && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>{project.location}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* LGIA: only DB-registered CEST projects with programFunding = LGIA */}
      {showLgia && filterCestByDistrict(cestAsLgia, activeDistrict).map((project) => {
        const [lat, lng] = project.coordinates!.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <Marker key={`lgia-${project.id}`} position={[lat, lng]} icon={lgiaIcon}>
            <Popup>
              <div>
                <a href={`/cest/${project.id}`} style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>{project.projectTitle}</a>
                {project.location && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>{project.location}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// ── Unified Side Panel ───────────────────────────────────────────────────────
const PANEL_CONFIG: Record<string, { color: string; label: string; icon: string; logo?: string; footerText: string; hoverBg: string; accentColor: string }> = {
  setup: { color: '#00838f', label: 'SETUP Projects', icon: 'mdi:store-outline', logo: '/setup-logo.png', footerText: 'DOST Region X · SETUP Program', hoverBg: '#f0fafb', accentColor: '#00838f' },
  cest:  { color: '#2e7d32', label: 'CEST Projects',  icon: 'mdi:leaf',          logo: '/cest-sidebar-logo.png', footerText: 'DOST Region X · CEST Program', hoverBg: '#f0fff0', accentColor: '#2e7d32' },
  sscp:  { color: '#979797', label: 'SSCP Projects',  icon: 'mdi:star-four-points-outline', footerText: 'DOST Region X · SSCP Program', hoverBg: '#f5f5f5', accentColor: '#707070' },
  lgia:  { color: '#F1B82C', label: 'LGIA Projects',  icon: 'mdi:flower-outline', footerText: 'DOST Region X · LGIA Program', hoverBg: '#fffdf0', accentColor: '#D4A017' },
};

function UnifiedSidePanel({
  activePrograms,
  activePanel,
  onPanelSwitch,
  open,
  onToggle,
  setupProjects,
  cestProjects,
  sscpProjects,
  lgiaProjects,
  activeDistrict,
}: {
  activePrograms: string[];
  activePanel: string;
  onPanelSwitch: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  setupProjects: SetupProjectPin[];
  cestProjects: CestProjectPin[];
  sscpProjects: CestProjectPin[];
  lgiaProjects: CestProjectPin[];
  activeDistrict: string;
}) {
  const districtLabel: Record<string, string> = {
    all: 'All Districts', mor1: 'MOR – District 1', mor2: 'MOR – District 2',
    cdo1: 'CDO – District 1', cdo2: 'CDO – District 2',
  };

  const panelPrograms = ['setup', 'cest', 'sscp', 'lgia'].filter(p => activePrograms.includes(p));
  const cfg = PANEL_CONFIG[activePanel] ?? PANEL_CONFIG['setup'];

  const filteredSetup = filterSetupByDistrict(setupProjects, activeDistrict);
  const filteredCest  = filterCestByDistrict(cestProjects.filter(p => p.programFunding !== 'SSCP' && p.programFunding !== 'LGIA'), activeDistrict);
  const filteredSscp  = filterCestByDistrict(sscpProjects, activeDistrict);
  const filteredLgia  = filterCestByDistrict(lgiaProjects, activeDistrict);

  const projectCount = activePanel === 'setup' ? filteredSetup.length : activePanel === 'cest' ? filteredCest.length : activePanel === 'sscp' ? filteredSscp.length : filteredLgia.length;

  return (
    <div
      className="absolute top-0 right-0 h-full z-[1000] pointer-events-auto flex"
      style={{ transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', willChange: 'transform' }}
    >
      {/* Collapse/expand tab */}
      <button
        onClick={onToggle}
        className="absolute -left-[28px] top-1/2 -translate-y-1/2 w-[28px] h-[64px] bg-white border border-[#e0e0e0] rounded-l-[10px] shadow-[-3px_0_8px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        style={{ borderRight: 'none' }}
      >
        <Icon icon={open ? 'mdi:chevron-right' : 'mdi:chevron-left'} width={18} height={18} className="text-[#666]" />
      </button>

      <div className="w-[320px] h-full bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ background: cfg.color }}>
          {cfg.logo
            ? <img src={cfg.logo} alt={activePanel} className="w-7 h-7 object-contain rounded-full bg-white/20 p-0.5 flex-shrink-0" />
            : <Icon icon={cfg.icon} width={28} height={28} className="text-white flex-shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[14px] font-sans leading-tight">{cfg.label}</p>
            <p className="text-white/75 text-[11px] font-sans mt-0.5 flex items-center gap-1">
              <Icon icon="mdi:map-marker-radius-outline" width={11} height={11} />
              {districtLabel[activeDistrict] ?? 'All Districts'}
            </p>
          </div>
          <span className="bg-white/20 text-white text-[12px] font-bold px-2.5 py-1 rounded-full font-sans flex-shrink-0">{projectCount}</span>
        </div>

        {/* Program switcher — shown only when 2+ programs are active */}
        {panelPrograms.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] border-b border-[#e0e0e0] flex-shrink-0 flex-wrap">
            {panelPrograms.map(p => {
              const c = PANEL_CONFIG[p];
              const isActive = p === activePanel;
              return (
                <button
                  key={p}
                  onClick={() => onPanelSwitch(p)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold font-sans border transition-all duration-150 cursor-pointer"
                  style={{
                    background: isActive ? c.color : 'white',
                    color: isActive ? 'white' : c.color,
                    borderColor: c.color,
                  }}
                >
                  {PANEL_CONFIG[p].logo
                    ? <img src={PANEL_CONFIG[p].logo} alt={p} className="w-3.5 h-3.5 object-contain rounded-full" />
                    : <Icon icon={c.icon} width={12} height={12} />
                  }
                  {p.toUpperCase()}
                </button>
              );
            })}
          </div>
        )}

        {/* Subtitle */}
        <div className="px-4 py-2.5 border-b border-[#ebebeb] flex-shrink-0" style={{ background: cfg.hoverBg }}>
          <p className="text-[11px] text-[#777] font-sans">
            Showing <span className="font-semibold" style={{ color: cfg.accentColor }}>{projectCount}</span> project{projectCount !== 1 ? 's' : ''} on map
          </p>
        </div>

        {/* Project list */}
        <div className="overflow-y-auto flex-1">
          {/* SETUP */}
          {activePanel === 'setup' && (
            filteredSetup.length === 0
              ? <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center"><Icon icon="mdi:map-marker-off-outline" width={40} height={40} className="text-[#ccc] mb-3" /><p className="text-[13px] text-[#999] font-sans">No SETUP projects in this district.</p></div>
              : filteredSetup.map(project => (
                <a key={project.id} href={`/setup/${project.id}`} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f0] hover:bg-[#f0fafb] transition-colors group" style={{ textDecoration: 'none' }}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e0e0e0] overflow-hidden bg-[#f0fafb] flex items-center justify-center mt-0.5 shadow-sm">
                    {project.companyLogoUrl ? <img src={project.companyLogoUrl} alt={project.firm || project.title} className="w-full h-full object-cover" /> : <Icon icon="mdi:store-outline" width={20} height={20} className="text-[#00838f]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#00838f] leading-snug font-sans line-clamp-2 transition-colors">{project.title}</p>
                    {project.firm && <p className="text-[11.5px] text-[#555] mt-1 font-sans truncate flex items-center gap-1"><Icon icon="mdi:office-building-outline" width={11} height={11} className="flex-shrink-0 text-[#999]" />{project.firm}</p>}
                    {project.address && <p className="text-[11px] text-[#888] mt-0.5 font-sans flex items-start gap-1 leading-snug"><Icon icon="mdi:map-marker-outline" width={11} height={11} className="flex-shrink-0 mt-0.5 text-[#00838f]" /><span className="line-clamp-2">{project.address}</span></p>}
                  </div>
                  <Icon icon="mdi:chevron-right" width={16} height={16} className="text-[#ccc] group-hover:text-[#00838f] flex-shrink-0 mt-1 transition-colors" />
                </a>
              ))
          )}
          {/* CEST */}
          {activePanel === 'cest' && (
            filteredCest.length === 0
              ? <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center"><Icon icon="mdi:map-marker-off-outline" width={40} height={40} className="text-[#ccc] mb-3" /><p className="text-[13px] text-[#999] font-sans">No CEST projects in this district.</p></div>
              : filteredCest.map(project => (
                <a key={project.id} href={`/cest/${project.id}`} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f0] transition-colors group" style={{ textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = '#f0fff0')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e0e0e0] overflow-hidden bg-[#f0fff0] flex items-center justify-center mt-0.5 shadow-sm">
                    {project.companyLogoUrl ? <img src={project.companyLogoUrl} alt={project.projectTitle} className="w-full h-full object-cover" /> : <Icon icon="mdi:leaf" width={20} height={20} style={{ color: '#2e7d32' }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug font-sans line-clamp-2 transition-colors group-hover:text-[#2e7d32]">{project.projectTitle}</p>
                    {project.location && <p className="text-[11px] text-[#888] mt-0.5 font-sans flex items-start gap-1 leading-snug"><Icon icon="mdi:map-marker-outline" width={11} height={11} className="flex-shrink-0 mt-0.5" style={{ color: '#2e7d32' }} /><span className="line-clamp-2">{project.location}</span></p>}
                  </div>
                  <Icon icon="mdi:chevron-right" width={16} height={16} className="text-[#ccc] flex-shrink-0 mt-1 transition-colors group-hover:text-[#2e7d32]" />
                </a>
              ))
          )}
          {/* SSCP */}
          {activePanel === 'sscp' && (
            filteredSscp.length === 0
              ? <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center"><Icon icon="mdi:map-marker-off-outline" width={40} height={40} className="text-[#ccc] mb-3" /><p className="text-[13px] text-[#999] font-sans">No SSCP projects in this district.</p></div>
              : filteredSscp.map(project => (
                <a key={project.id} href={`/cest/${project.id}`} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f0] transition-colors group" style={{ textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e0e0e0] overflow-hidden bg-[#f5f5f5] flex items-center justify-center mt-0.5 shadow-sm">
                    {project.companyLogoUrl ? <img src={project.companyLogoUrl} alt={project.projectTitle} className="w-full h-full object-cover" /> : <Icon icon="mdi:star-four-points-outline" width={20} height={20} className="text-[#979797]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug font-sans line-clamp-2 transition-colors group-hover:text-[#707070]">{project.projectTitle}</p>
                    {project.location && <p className="text-[11px] text-[#888] mt-0.5 font-sans flex items-start gap-1 leading-snug"><Icon icon="mdi:map-marker-outline" width={11} height={11} className="flex-shrink-0 mt-0.5 text-[#979797]" /><span className="line-clamp-2">{project.location}</span></p>}
                  </div>
                  <Icon icon="mdi:chevron-right" width={16} height={16} className="text-[#ccc] flex-shrink-0 mt-1 transition-colors group-hover:text-[#979797]" />
                </a>
              ))
          )}
          {/* LGIA */}
          {activePanel === 'lgia' && (
            filteredLgia.length === 0
              ? <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center"><Icon icon="mdi:map-marker-off-outline" width={40} height={40} className="text-[#ccc] mb-3" /><p className="text-[13px] text-[#999] font-sans">No LGIA projects in this district.</p></div>
              : filteredLgia.map(project => (
                <a key={project.id} href={`/cest/${project.id}`} className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f0] transition-colors group" style={{ textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = '#fffdf0')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e0e0e0] overflow-hidden bg-[#fffdf0] flex items-center justify-center mt-0.5 shadow-sm">
                    {project.companyLogoUrl ? <img src={project.companyLogoUrl} alt={project.projectTitle} className="w-full h-full object-cover" /> : <Icon icon="mdi:flower-outline" width={20} height={20} className="text-[#F1B82C]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-snug font-sans line-clamp-2 transition-colors group-hover:text-[#D4A017]">{project.projectTitle}</p>
                    {project.location && <p className="text-[11px] text-[#888] mt-0.5 font-sans flex items-start gap-1 leading-snug"><Icon icon="mdi:map-marker-outline" width={11} height={11} className="flex-shrink-0 mt-0.5 text-[#F1B82C]" /><span className="line-clamp-2">{project.location}</span></p>}
                  </div>
                  <Icon icon="mdi:chevron-right" width={16} height={16} className="text-[#ccc] flex-shrink-0 mt-1 transition-colors group-hover:text-[#D4A017]" />
                </a>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#ebebeb] flex-shrink-0" style={{ background: cfg.hoverBg }}>
          <p className="text-[10.5px] text-[#aaa] font-sans text-center">{cfg.footerText}</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function MapsPage() {
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [activePrograms, setActivePrograms] = useState<string[]>([]);
  const [setupProjects, setSetupProjects] = useState<SetupProjectPin[]>([]);
  const [cestProjects, setCestProjects] = useState<CestProjectPin[]>([]);
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string>('setup');

  useEffect(() => {
    fetch('/api/setup-projects')
      .then(res => res.json())
      .then((data: SetupProjectPin[]) => setSetupProjects(data.filter(p => p.coordinates)))
      .catch(() => {});
    fetch('/api/cest-projects')
      .then(res => res.json())
      .then((data: CestProjectPin[]) => setCestProjects(data.filter(p => p.coordinates)))
      .catch(() => {});
  }, []);

  const panelIds = ['setup', 'cest', 'sscp', 'lgia'];

  const toggleProgram = (id: string) => {
    setActivePrograms(prev => {
      const isActive = prev.includes(id);
      const next = isActive ? prev.filter(p => p !== id) : [...prev, id];
      if (panelIds.includes(id)) {
        if (!isActive) {
          // Activating: open panel and switch to this program
          setSidePanelOpen(true);
          setActivePanel(id);
        } else {
          // Deactivating: switch to another still-active panel, or close
          const remaining = next.filter(p => panelIds.includes(p));
          if (remaining.length > 0) setActivePanel(remaining[remaining.length - 1]);
          else setSidePanelOpen(false);
        }
      }
      return next;
    });
  };

  const handleAddressSelect = (lat: number, lng: number) => {
    setFlyToCoords({ lat, lng, key: Date.now() });
  };

  const showSetup = activePrograms.includes('setup');
  const showCest  = activePrograms.includes('cest');
  const showSscp  = activePrograms.includes('sscp');
  const showLgia  = activePrograms.includes('lgia');

  const sscpProjects = cestProjects.filter(p => p.programFunding === 'SSCP');
  const lgiaProjects = cestProjects.filter(p => p.programFunding === 'LGIA');

  return (
    <DashboardLayout activePath="/maps">
      <main className="flex-1 relative overflow-hidden min-h-0">
        {/* Fix Leaflet pin clipping */}
        <style>{`
          .leaflet-marker-icon.leaflet-pin-icon { overflow: visible !important; }
          .leaflet-marker-pane { overflow: visible !important; }
        `}</style>

        {/* Map */}
        <div className="absolute inset-0 w-full h-full z-0">
          <MapComponent
            activePrograms={activePrograms}
            activeDistrict={activeDistrict}
            setupProjects={setupProjects}
            cestProjects={cestProjects}
            flyToCoords={flyToCoords}
          />
        </div>

        {/* Top Center: District Tabs + Search Bar */}
        <div className="absolute top-[12px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-[1000] pointer-events-auto">
          <div className="flex bg-white rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.12)] overflow-hidden">
            {[
              { key: 'mor1', label: 'MOR1' },
              { key: 'mor2', label: 'MOR2' },
              { key: 'cdo1', label: 'District 1' },
              { key: 'cdo2', label: 'District 2' },
              { key: 'all',  label: 'All' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`py-1.5 px-4 border-none text-[11px] font-semibold cursor-pointer transition-all duration-200 font-sans leading-none ${activeDistrict === key ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
                onClick={() => setActiveDistrict(prev => (key !== 'all' && prev === key) ? 'all' : key)}
              >
                {label}
              </button>
            ))}
          </div>
          <AddressSearchBar onSelect={handleAddressSelect} />
        </div>

        {/* Program Filter Sidebar - left */}
        <div className="absolute top-[15px] left-[15px] flex flex-col gap-2 z-[1000] pointer-events-auto">
          {programFilters.map(prog => (
            <button
              key={prog.id}
              className={`program-filter-btn flex items-center gap-2 py-2.5 px-5 border-none rounded-[25px] text-white text-sm font-bold cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] font-sans shadow-[0_2px_8px_rgba(0,0,0,0.2)] opacity-0 [animation:slideInLeft_0.4s_ease-out_forwards] hover:opacity-100 hover:translate-x-[5px] hover:scale-105 hover:shadow-[0_4px_16px_rgba(0,0,0,0.35)] active:translate-x-[2px] active:scale-95 active:transition-all active:duration-100 ${activePrograms.includes(prog.id) ? 'opacity-100 translate-x-2 scale-105 shadow-[0_3px_12px_rgba(0,0,0,0.3)] [animation:slideInLeft_0.4s_ease-out_forwards,pulseGlow_2s_ease-in-out_infinite]' : ''}`}
              style={{ background: prog.color }}
              onClick={() => toggleProgram(prog.id)}
            >
              {prog.logo ? (
                <img src={prog.logo} alt={prog.label} className="w-[22px] h-[22px] object-contain rounded-full" />
              ) : (
                <Icon icon={prog.icon} width={18} height={18} />
              )}
              {prog.label}
            </button>
          ))}
        </div>

        {/* Unified Side Panel */}
        {(showSetup || showCest || showSscp || showLgia) && (
          <UnifiedSidePanel
            activePrograms={activePrograms}
            activePanel={activePanel}
            onPanelSwitch={setActivePanel}
            open={sidePanelOpen}
            onToggle={() => setSidePanelOpen(prev => !prev)}
            setupProjects={setupProjects}
            cestProjects={cestProjects}
            sscpProjects={sscpProjects}
            lgiaProjects={lgiaProjects}
            activeDistrict={activeDistrict}
          />
        )}
      </main>
    </DashboardLayout>
  );
}