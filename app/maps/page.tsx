'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import 'leaflet/dist/leaflet.css';
import boundaryData from './misamis-oriental-boundary.json';
import cdoBoundaryData from './cdo-boundary.json';
import DashboardLayout from '../components/DashboardLayout';

const programFilters = [
  { id: 'setup', label: 'SETUP', color: '#00838f', icon: 'mdi:cog-outline', logo: '/setup-logo.png' },
  { id: 'cest', label: 'CEST', color: '#2e7d32', icon: 'mdi:leaf', logo: '/cest-logo.png' },
  { id: 'sscp', label: 'SSCP', color: '#979797', icon: 'mdi:star-four-points-outline', logo: null },
  { id: 'lgia', label: 'LGIA', color: '#F1B82C', icon: 'mdi:flower-outline', logo: null },
];

const misamisOrientalBoundary = boundaryData[0] as [number, number][];
const cdoBoundary = cdoBoundaryData[0] as [number, number][];

type Pin = { lat: number; lng: number; label: string; district: 1 | 2 | 3 | 4 };

type SetupProjectPin = {
  id: string;
  title: string;
  firm: string | null;
  address: string | null;
  coordinates: string | null;
  companyLogoUrl: string | null;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const cestPins: Pin[] = [
  { lat: 8.5039, lng: 124.6162, label: 'CDO - Bulua', district: 3 },
  { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 3 },
  { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 3 },
  { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 4 },
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.4580, lng: 124.6780, label: 'CDO - Cugman', district: 4 },
  { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2 },
  { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Centro', district: 2 },
  { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2 },
  { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2 },
  { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2 },
  { lat: 8.4336, lng: 124.2910, label: 'Naawan', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Centro', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2 },
];

const sscpPins: Pin[] = [
  { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 3 },
  { lat: 8.4992, lng: 124.6391, label: 'CDO - Kauswagan', district: 3 },
  { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 3 },
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 4 },
  { lat: 8.4530, lng: 124.6590, label: 'CDO - Balulang', district: 4 },
  { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2 },
  { lat: 8.5749, lng: 124.4439, label: 'Laguindingan - Poblacion', district: 2 },
  { lat: 8.5950, lng: 124.4078, label: 'Gitagum - Poblacion', district: 2 },
  { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2 },
  { lat: 8.3432, lng: 124.2598, label: 'Lugait - Poblacion', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.9194, lng: 124.7846, label: 'Binuangan - Poblacion', district: 1 },
  { lat: 8.9561, lng: 124.7879, label: 'Sugbongcogon - Poblacion', district: 1 },
  { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1 },
];

const lgiaPins: Pin[] = [
  { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 3 },
  { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 3 },
  { lat: 8.4964, lng: 124.6051, label: 'CDO - Iponan', district: 3 },
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.5120, lng: 124.6830, label: 'CDO - Bugo', district: 4 },
  { lat: 8.4870, lng: 124.6700, label: 'CDO - Pagatpat', district: 4 },
  { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Poblacion', district: 2 },
  { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2 },
  { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2 },
  { lat: 8.4033, lng: 124.2888, label: 'Manticao - Poblacion', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Poblacion', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2 },
  { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1 },
];

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

const filterByDistrict = (pins: Pin[], district: string) => {
  if (district === 'all') return pins;
  const allowed = districtMap[district] || [];
  return pins.filter(p => allowed.includes(p.district));
};

const filterSetupByDistrict = (projects: SetupProjectPin[], district: string) => {
  if (district === 'all') return projects;
  const allowed = districtMap[district] || [];
  return projects.filter(p => {
    const pd = getDistrictFromAddress(p.address);
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
function MapComponent({ activePrograms, activeDistrict, setupProjects, flyToCoords }: {
  activePrograms: string[];
  activeDistrict: string;
  setupProjects: SetupProjectPin[];
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
        <image href="/cest-logo.png" x="8" y="5" width="24" height="24" clip-path="url(#cest-clip)" preserveAspectRatio="xMidYMid meet"/>
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
      {showCest && filterByDistrict(cestPins, activeDistrict).map((pin, idx) => (
        <Marker key={`cest-${idx}`} position={[pin.lat, pin.lng]} icon={cestIcon}>
          <Popup><a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none' }}>{pin.label}</a></Popup>
        </Marker>
      ))}
      {showSscp && filterByDistrict(sscpPins, activeDistrict).map((pin, idx) => (
        <Marker key={`sscp-${idx}`} position={[pin.lat, pin.lng]} icon={sscpIcon}>
          <Popup><a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#707070', fontWeight: 600, textDecoration: 'none' }}>{pin.label}</a></Popup>
        </Marker>
      ))}
      {showLgia && filterByDistrict(lgiaPins, activeDistrict).map((pin, idx) => (
        <Marker key={`lgia-${idx}`} position={[pin.lat, pin.lng]} icon={lgiaIcon}>
          <Popup><a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>{pin.label}</a></Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

// ── SETUP Side Panel (Google Maps style) ────────────────────────────────────
function SetupSidePanel({
  projects,
  activeDistrict,
  open,
  onToggle,
}: {
  projects: SetupProjectPin[];
  activeDistrict: string;
  open: boolean;
  onToggle: () => void;
}) {
  const filtered = filterSetupByDistrict(projects, activeDistrict);

  const districtLabel: Record<string, string> = {
    all: 'All Districts',
    mor1: 'MOR – District 1',
    mor2: 'MOR – District 2',
    cdo1: 'CDO – District 1',
    cdo2: 'CDO – District 2',
  };

  return (
    <div
      className="absolute top-0 right-0 h-full z-[1000] pointer-events-auto flex"
      style={{
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        willChange: 'transform',
      }}
    >
      {/* Collapse/expand tab sticking out to the left */}
      <button
        onClick={onToggle}
        className="absolute -left-[28px] top-1/2 -translate-y-1/2 w-[28px] h-[64px] bg-white border border-[#e0e0e0] rounded-l-[10px] shadow-[-3px_0_8px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        style={{ borderRight: 'none' }}
        title={open ? 'Collapse panel' : 'Expand panel'}
      >
        <Icon
          icon={open ? 'mdi:chevron-right' : 'mdi:chevron-left'}
          width={18}
          height={18}
          className="text-[#666]"
        />
      </button>

      {/* Panel body */}
      <div className="w-[320px] h-full bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-[#00838f] flex-shrink-0">
          <img src="/setup-logo.png" alt="SETUP" className="w-7 h-7 object-contain rounded-full bg-white/20 p-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-[14px] font-sans leading-tight">SETUP Projects</p>
            <p className="text-white/75 text-[11px] font-sans mt-0.5 flex items-center gap-1">
              <Icon icon="mdi:map-marker-radius-outline" width={11} height={11} />
              {districtLabel[activeDistrict] ?? 'All Districts'}
            </p>
          </div>
          <span className="bg-white/20 text-white text-[12px] font-bold px-2.5 py-1 rounded-full font-sans flex-shrink-0">
            {filtered.length}
          </span>
        </div>

        {/* Subtitle bar */}
        <div className="px-4 py-2.5 bg-[#f8fffe] border-b border-[#e8f5f5] flex-shrink-0">
          <p className="text-[11px] text-[#777] font-sans">
            Showing <span className="font-semibold text-[#00838f]">{filtered.length}</span> project{filtered.length !== 1 ? 's' : ''} on map
          </p>
        </div>

        {/* Project list */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-6 text-center">
              <Icon icon="mdi:map-marker-off-outline" width={40} height={40} className="text-[#ccc] mb-3" />
              <p className="text-[13px] text-[#999] font-sans">No SETUP projects in this district.</p>
            </div>
          ) : (
            filtered.map((project) => (
              <a
                key={project.id}
                href={`/setup/${project.id}`}
                className="flex items-start gap-3 px-4 py-3.5 border-b border-[#f0f0f0] hover:bg-[#f0fafb] transition-colors group"
                style={{ textDecoration: 'none' }}
              >
                {/* Company logo or fallback icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full border border-[#e0e0e0] overflow-hidden bg-[#f0fafb] flex items-center justify-center mt-0.5 shadow-sm">
                  {project.companyLogoUrl ? (
                    <img
                      src={project.companyLogoUrl}
                      alt={project.firm || project.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon icon="mdi:store-outline" width={20} height={20} className="text-[#00838f]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#00838f] leading-snug font-sans line-clamp-2 transition-colors">
                    {project.title}
                  </p>
                  {project.firm && (
                    <p className="text-[11.5px] text-[#555] mt-1 font-sans truncate flex items-center gap-1">
                      <Icon icon="mdi:office-building-outline" width={11} height={11} className="flex-shrink-0 text-[#999]" />
                      {project.firm}
                    </p>
                  )}
                  {project.address && (
                    <p className="text-[11px] text-[#888] mt-0.5 font-sans flex items-start gap-1 leading-snug">
                      <Icon icon="mdi:map-marker-outline" width={11} height={11} className="flex-shrink-0 mt-0.5 text-[#00838f]" />
                      <span className="line-clamp-2">{project.address}</span>
                    </p>
                  )}
                </div>
                <Icon icon="mdi:chevron-right" width={16} height={16} className="text-[#ccc] group-hover:text-[#00838f] flex-shrink-0 mt-1 transition-colors" />
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#f8fffe] border-t border-[#e8f5f5] flex-shrink-0">
          <p className="text-[10.5px] text-[#aaa] font-sans text-center">DOST Region X · SETUP Program</p>
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
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  useEffect(() => {
    fetch('/api/setup-projects')
      .then(res => res.json())
      .then((data: SetupProjectPin[]) => setSetupProjects(data.filter(p => p.coordinates)))
      .catch(() => {});
  }, []);

  const toggleProgram = (id: string) => {
    setActivePrograms(prev => {
      const isActive = prev.includes(id);
      const next = isActive ? prev.filter(p => p !== id) : [...prev, id];
      if (id === 'setup') setSidePanelOpen(!isActive);
      return next;
    });
  };

  const handleAddressSelect = (lat: number, lng: number) => {
    setFlyToCoords({ lat, lng, key: Date.now() });
  };

  const showSetup = activePrograms.includes('setup');

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

        {/* SETUP Side Panel - Google Maps style */}
        {showSetup && (
          <SetupSidePanel
            projects={setupProjects}
            activeDistrict={activeDistrict}
            open={sidePanelOpen}
            onToggle={() => setSidePanelOpen(prev => !prev)}
          />
        )}
      </main>
    </DashboardLayout>
  );
}