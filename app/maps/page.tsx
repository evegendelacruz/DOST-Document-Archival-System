'use client';

import { useState, useEffect } from 'react';
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

// Real Misamis Oriental boundary from OpenStreetMap data
const misamisOrientalBoundary = boundaryData[0] as [number, number][];
const cdoBoundary = cdoBoundaryData[0] as [number, number][];

// Pin type with district tag
// MOR1 (east): Balingasag, Balingoan, Binuangan, Kinoguitan, Lagonglong, Magsaysay, Medina, Salay, Sugbongcogon, Talisayan
// MOR2 (west/coastal): Claveria, Jasaan, Villanueva, Tagoloan, Opol, El Salvador, Laguindingan, Gitagum, Libertad, Alubijid, Initao, Naawan, Manticao, Lugait
// CDO1 (western barangays): Puntod, Macabalan, Lapasan, Carmen, Consolacion, Nazareth, Camaman-an, Patag, Bulua, Iponan, Kauswagan, Bonbon, Bayabas, Bayanga, Mambuaya, Dansolihon, Pagalungan, San Simon, Taglimao, Tuburan, Tumpagon, Tignapoloan, Besigan, F.S. Catanico
// CDO2 (eastern barangays): Gusa, Cugman, Macasandig, Balulang, Canitoan, Pagatpat, Puerto, Bugo, Agusan, Tablon, Tagpangi
// district: 1=MOR1, 2=MOR2, 3=CDO1, 4=CDO2
type Pin = { lat: number; lng: number; label: string; district: 1 | 2 | 3 | 4 };

// SETUP projects fetched from DB (with coordinates)
type SetupProjectPin = {
  id: string;
  title: string;
  firm: string | null;
  address: string | null;
  coordinates: string | null;
};

// CEST program pins - real coordinates
// CDO District 1 (west): Bulua, Carmen, Consolacion, Nazareth, Camaman-an, Patag, Iponan, Kauswagan, Bonbon, Bayabas, Bayanga, Mambuaya, Dansolihon, Pagalungan, San Simon, Taglimao, Tuburan, Tumpagon, Tignapoloan, Besigan, F.S. Catanico, Puntod, Macabalan, Lapasan
// CDO District 2 (east): Gusa, Cugman, Macasandig, Balulang, Canitoan, Pagatpat, Puerto, Bugo, Agusan, Tablon, Tagpangi
const cestPins: Pin[] = [
  // CDO District 1 (west)
  { lat: 8.5039, lng: 124.6162, label: 'CDO - Bulua', district: 3 },
  { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 3 },
  { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 3 },
  // CDO District 2 (east)
  { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 4 },
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.4580, lng: 124.6780, label: 'CDO - Cugman', district: 4 },
  // MOR2
  { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2 },
  { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Centro', district: 2 },
  { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2 },
  { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2 },
  { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2 },
  { lat: 8.4336, lng: 124.2910, label: 'Naawan', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Centro', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  // MOR1
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2 },
];

// SSCP program pins - real coordinates
const sscpPins: Pin[] = [
  // CDO District 1 (west)
  { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 3 },
  { lat: 8.4992, lng: 124.6391, label: 'CDO - Kauswagan', district: 3 },
  { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 3 },
  // CDO District 2 (east)
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 4 },
  { lat: 8.4530, lng: 124.6590, label: 'CDO - Balulang', district: 4 },
  // MOR2
  { lat: 8.5214, lng: 124.5731, label: 'Opol - Poblacion', district: 2 },
  { lat: 8.5749, lng: 124.4439, label: 'Laguindingan - Poblacion', district: 2 },
  { lat: 8.5950, lng: 124.4078, label: 'Gitagum - Poblacion', district: 2 },
  { lat: 8.4971, lng: 124.3045, label: 'Initao - Poblacion', district: 2 },
  { lat: 8.3432, lng: 124.2598, label: 'Lugait - Poblacion', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  // MOR1
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.9194, lng: 124.7846, label: 'Binuangan - Poblacion', district: 1 },
  { lat: 8.9561, lng: 124.7879, label: 'Sugbongcogon - Poblacion', district: 1 },
  { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1 },
];

// LGIA program pins - real coordinates
const lgiaPins: Pin[] = [
  // CDO District 1 (west)
  { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 3 },
  { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 3 },
  { lat: 8.4964, lng: 124.6051, label: 'CDO - Iponan', district: 3 },
  // CDO District 2 (east)
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 4 },
  { lat: 8.5120, lng: 124.6830, label: 'CDO - Bugo', district: 4 },
  { lat: 8.4870, lng: 124.6700, label: 'CDO - Pagatpat', district: 4 },
  // MOR2
  { lat: 8.5597, lng: 124.5271, label: 'El Salvador - Poblacion', district: 2 },
  { lat: 8.5705, lng: 124.4712, label: 'Alubijid - Poblacion', district: 2 },
  { lat: 8.5620, lng: 124.3530, label: 'Libertad - Poblacion', district: 2 },
  { lat: 8.4033, lng: 124.2888, label: 'Manticao - Poblacion', district: 2 },
  { lat: 8.5391, lng: 124.7534, label: 'Tagoloan - Poblacion', district: 2 },
  { lat: 8.5837, lng: 124.7699, label: 'Villanueva - Poblacion', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan - Poblacion', district: 2 },
  // MOR1
  { lat: 8.7438, lng: 124.7757, label: 'Balingasag - Poblacion', district: 1 },
  { lat: 8.8058, lng: 124.7894, label: 'Lagonglong - Poblacion', district: 1 },
  { lat: 8.8591, lng: 124.7881, label: 'Salay - Poblacion', district: 1 },
  { lat: 8.6118, lng: 124.8923, label: 'Claveria - Poblacion', district: 2 },
  { lat: 8.9831, lng: 124.7928, label: 'Kinoguitan - Poblacion', district: 1 },
];

// Municipality to district mapping
// MOR1=1, MOR2=2, CDO1=3, CDO2=4
const mor1Municipalities = ['balingasag', 'balingoan', 'binuangan', 'kinoguitan', 'lagonglong', 'magsaysay', 'medina', 'salay', 'sugbongcogon', 'talisayan'];
const mor2Municipalities = ['claveria', 'jasaan', 'villanueva', 'tagoloan', 'opol', 'el salvador', 'laguindingan', 'gitagum', 'libertad', 'alubijid', 'initao', 'naawan', 'manticao', 'lugait'];

// CDO District 1 (western barangays)
const cdo1Barangays = ['bonbon', 'bayabas', 'bayanga', 'besigan', 'bulua', 'camaman-an', 'carmen', 'consolacion', 'dansolihon', 'f.s. catanico', 'iponan', 'kauswagan', 'lapasan', 'macabalan', 'mambuaya', 'nazareth', 'pagalungan', 'patag', 'puntod', 'san simon', 'taglimao', 'tignapoloan', 'tuburan', 'tumpagon'];
// CDO District 2 (eastern barangays)
const cdo2Barangays = ['agusan', 'balulang', 'bugo', 'canitoan', 'cugman', 'gusa', 'macasandig', 'pagatpat', 'puerto', 'tablon', 'tagpangi'];

const getDistrictFromAddress = (address: string | null): 1 | 2 | 3 | 4 | 0 => {
  if (!address) return 0;
  const lower = address.toLowerCase();
  // Check CDO first (barangay-level)
  if (lower.includes('cagayan de oro')) {
    if (cdo1Barangays.some(b => lower.includes(b))) return 3;
    if (cdo2Barangays.some(b => lower.includes(b))) return 4;
    return 3; // default CDO to district 1
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

// Filter pins by active district
const filterByDistrict = (pins: Pin[], district: string) => {
  if (district === 'all') return pins;
  const allowed = districtMap[district] || [];
  return pins.filter(p => allowed.includes(p.district));
};

// Filter SETUP projects by active district
const filterSetupByDistrict = (projects: SetupProjectPin[], district: string) => {
  if (district === 'all') return projects;
  const allowed = districtMap[district] || [];
  return projects.filter(p => {
    const pd = getDistrictFromAddress(p.address);
    return allowed.includes(pd);
  });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapComponent({ activePrograms, activeDistrict, setupProjects, flyToCoords }: { activePrograms: string[]; activeDistrict: string; setupProjects: SetupProjectPin[]; flyToCoords: { lat: number; lng: number; key: number } | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [components, setComponents] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      setComponents(rl);
      setLeaflet(L.default || L);
    });
  }, []);

  if (!components || !leaflet) {
    return <div className="w-full h-full flex items-center justify-center text-base text-[#666] bg-[#f5f5f5]">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } = components;

  // Invalidate map size when container resizes (e.g., sidebar expand/collapse)
  function ResizeHandler() {
    const map = useMap();
    useEffect(() => {
      const container = map.getContainer();
      const observer = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observer.observe(container);
      return () => observer.disconnect();
    }, [map]);
    return null;
  }

  // Fly to coordinates when search is triggered
  function FlyToHandler() {
    const map = useMap();
    useEffect(() => {
      if (flyToCoords) {
        map.flyTo([flyToCoords.lat, flyToCoords.lng], 16, { duration: 1.5 });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flyToCoords?.key]);
    return null;
  }

  // SETUP pin - uses uploaded SVG logo (white logo on colored background)
  const setupIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:40px;height:50px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" style="position:absolute;top:0;left:0;">
        <defs>
          <clipPath id="setup-clip"><circle cx="20" cy="17" r="12"/></clipPath>
          <filter id="ds"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#00838f" stroke="#006064" stroke-width="1.2" filter="url(#ds)"/>
        <circle cx="20" cy="17" r="12" fill="#00838f"/>
        <image href="/setup-logo.png" x="8" y="5" width="24" height="24" clip-path="url(#setup-clip)" preserveAspectRatio="xMidYMid meet"/>
      </svg>
    </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    className: '',
  });

  // CEST pin - uses uploaded SVG logo (white logo on colored background)
  const cestIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:40px;height:50px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" style="position:absolute;top:0;left:0;">
        <defs>
          <clipPath id="cest-clip"><circle cx="20" cy="17" r="12"/></clipPath>
          <filter id="ds2"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter>
        </defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#2e7d32" stroke="#1b5e20" stroke-width="1.2" filter="url(#ds2)"/>
        <circle cx="20" cy="17" r="12" fill="#2e7d32"/>
        <image href="/cest-logo.png" x="8" y="5" width="24" height="24" clip-path="url(#cest-clip)" preserveAspectRatio="xMidYMid meet"/>
      </svg>
    </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    className: '',
  });

  // SSCP pin - star icon inside
  const sscpIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:40px;height:50px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" style="position:absolute;top:0;left:0;">
        <defs><filter id="ds3"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs>
        <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#979797" stroke="#707070" stroke-width="1.2" filter="url(#ds3)"/>
        <circle cx="20" cy="17" r="12" fill="white"/>
        <path d="M20 8l2.5 5.1 5.6.8-4.1 4 .9 5.6L20 21l-4.9 2.5.9-5.6-4.1-4 5.6-.8z" fill="#979797"/>
      </svg>
    </div>`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    className: '',
  });

  // LGIA pin - flower icon inside
  const lgiaIcon = leaflet.divIcon({
    html: `<div style="position:relative;width:40px;height:50px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50" style="position:absolute;top:0;left:0;">
        <defs><filter id="ds4"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs>
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
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    className: '',
  });

  const showSetup = activePrograms.includes('setup');
  const showCest = activePrograms.includes('cest');
  const showSscp = activePrograms.includes('sscp');
  const showLgia = activePrograms.includes('lgia');

  return (
    <MapContainer
      center={[8.477, 124.646]}
      zoom={10}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
    >
      <ResizeHandler />
      <FlyToHandler />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polygon
        positions={misamisOrientalBoundary}
        pathOptions={{
          color: '#dc2626',
          weight: 3,
          fill: false,
        }}
      />
      <Polygon
        positions={cdoBoundary}
        pathOptions={{
          color: '#dc2626',
          weight: 3,
          fill: false,
          dashArray: '8, 6',
        }}
      />
      {showSetup && filterSetupByDistrict(setupProjects, activeDistrict).map((project) => {
        const [lat, lng] = project.coordinates!.split(',').map(s => parseFloat(s.trim()));
        if (isNaN(lat) || isNaN(lng)) return null;
        return (
          <Marker key={`setup-${project.id}`} position={[lat, lng]} icon={setupIcon}>
            <Popup>
              <div>
                <a href={`/setup/${project.id}`} style={{ color: '#00838f', fontWeight: 600, textDecoration: 'none', fontSize: '13px' }}>
                  {project.title}
                </a>
                {project.firm && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666' }}>{project.firm}</p>}
                {project.address && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#888' }}>{project.address}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
      {showCest && filterByDistrict(cestPins, activeDistrict).map((pin, idx) => (
        <Marker key={`cest-${idx}`} position={[pin.lat, pin.lng]} icon={cestIcon}>
          <Popup>
            <a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#2e7d32', fontWeight: 600, textDecoration: 'none' }}>
              {pin.label}
            </a>
          </Popup>
        </Marker>
      ))}
      {showSscp && filterByDistrict(sscpPins, activeDistrict).map((pin, idx) => (
        <Marker key={`sscp-${idx}`} position={[pin.lat, pin.lng]} icon={sscpIcon}>
          <Popup>
            <a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#707070', fontWeight: 600, textDecoration: 'none' }}>
              {pin.label}
            </a>
          </Popup>
        </Marker>
      ))}
      {showLgia && filterByDistrict(lgiaPins, activeDistrict).map((pin, idx) => (
        <Marker key={`lgia-${idx}`} position={[pin.lat, pin.lng]} icon={lgiaIcon}>
          <Popup>
            <a href={`/setup/${(idx % 8) + 1}`} style={{ color: '#D4A017', fontWeight: 600, textDecoration: 'none' }}>
              {pin.label}
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function MapsPage() {
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [activePrograms, setActivePrograms] = useState<string[]>([]);
  const [setupProjects, setSetupProjects] = useState<SetupProjectPin[]>([]);
  const [coordSearch, setCoordSearch] = useState('');
  const [flyToCoords, setFlyToCoords] = useState<{ lat: number; lng: number; key: number } | null>(null);
  const [coordError, setCoordError] = useState('');

  const handleCoordSearch = () => {
    setCoordError('');
    const parts = coordSearch.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      setCoordError('Enter valid coordinates (e.g. 8.477, 124.646)');
      return;
    }
    const [lat, lng] = parts;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordError('Coordinates out of range');
      return;
    }
    setFlyToCoords({ lat, lng, key: Date.now() });
  };

  useEffect(() => {
    fetch('/api/setup-projects')
      .then(res => res.json())
      .then((data: SetupProjectPin[]) => setSetupProjects(data.filter(p => p.coordinates)))
      .catch(() => {});
  }, []);

  const toggleProgram = (id: string) => {
    setActivePrograms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout activePath="/maps">
      <main className="flex-1 relative overflow-hidden min-h-0">
        {/* Map View */}
        <div className="absolute inset-0 w-full h-full z-0">
          <MapComponent activePrograms={activePrograms} activeDistrict={activeDistrict} setupProjects={setupProjects} flyToCoords={flyToCoords} />
        </div>

        {/* District Tabs - overlay on top of map */}
        <div className="absolute top-[15px] left-1/2 -translate-x-1/2 flex bg-white rounded-[25px] shadow-[0_2px_10px_rgba(0,0,0,0.15)] z-[1000] overflow-hidden pointer-events-auto">
          <button
            className={`py-2.5 px-[22px] border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 font-sans ${activeDistrict === 'mor1' ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
            onClick={() => setActiveDistrict(prev => prev === 'mor1' ? 'all' : 'mor1')}
          >
            MOR1
          </button>
          <button
            className={`py-2.5 px-[22px] border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 font-sans ${activeDistrict === 'mor2' ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
            onClick={() => setActiveDistrict(prev => prev === 'mor2' ? 'all' : 'mor2')}
          >
            MOR2
          </button>
          <button
            className={`py-2.5 px-[22px] border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 font-sans ${activeDistrict === 'cdo1' ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
            onClick={() => setActiveDistrict(prev => prev === 'cdo1' ? 'all' : 'cdo1')}
          >
            District 1
          </button>
          <button
            className={`py-2.5 px-[22px] border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 font-sans ${activeDistrict === 'cdo2' ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
            onClick={() => setActiveDistrict(prev => prev === 'cdo2' ? 'all' : 'cdo2')}
          >
            District 2
          </button>
          <button
            className={`py-2.5 px-[22px] border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 font-sans ${activeDistrict === 'all' ? 'bg-primary text-white' : 'bg-white text-[#666] hover:bg-[#f0f0f0]'}`}
            onClick={() => setActiveDistrict('all')}
          >
            All
          </button>
        </div>

        {/* Coordinate Search Bar - top right */}
        <div className="absolute top-[15px] right-[15px] z-[1000] pointer-events-auto">
          <div className="flex items-center bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] overflow-hidden">
            <Icon icon="mdi:map-marker-outline" className="ml-3 text-[#999]" width={18} height={18} />
            <input
              type="text"
              placeholder="Search coordinates (e.g. 8.477, 124.646)"
              value={coordSearch}
              onChange={(e) => { setCoordSearch(e.target.value); setCoordError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCoordSearch()}
              className="w-[280px] py-2.5 px-2 border-none outline-none text-[13px] bg-transparent placeholder:text-[#999] font-sans"
            />
            <button
              onClick={handleCoordSearch}
              className="flex items-center justify-center w-9 h-9 mr-1 bg-primary text-white border-none rounded-full cursor-pointer transition-colors duration-200 hover:bg-accent"
            >
              <Icon icon="mdi:magnify" width={18} height={18} />
            </button>
          </div>
          {coordError && (
            <div className="mt-1 bg-white text-[#dc3545] text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              {coordError}
            </div>
          )}
        </div>

        {/* Program Filter Sidebar - overlay on top of map */}
        <div className="absolute top-[70px] left-[15px] flex flex-col gap-2 z-[1000] pointer-events-auto">
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
      </main>
    </DashboardLayout>
  );
}
