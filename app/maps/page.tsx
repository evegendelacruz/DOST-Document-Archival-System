'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import 'leaflet/dist/leaflet.css';
import boundaryData from './misamis-oriental-boundary.json';
import DashboardLayout from '../components/DashboardLayout';

const programFilters = [
  { id: 'setup', label: 'SETUP', color: '#00838f', icon: 'mdi:cog-outline', logo: '/setup-logo.png' },
  { id: 'cest', label: 'CEST', color: '#2e7d32', icon: 'mdi:leaf', logo: '/cest-logo.png' },
  { id: 'sscp', label: 'SSCP', color: '#979797', icon: 'mdi:star-four-points-outline', logo: null },
  { id: 'lgia', label: 'LGIA', color: '#F1B82C', icon: 'mdi:flower-outline', logo: null },
];

// Real Misamis Oriental boundary from OpenStreetMap data
const misamisOrientalBoundary = boundaryData[0] as [number, number][];

// Pin type with district tag
// District 1 (east): Balingasag, Balingoan, Binuangan, Kinoguitan, Lagonglong, Magsaysay, Medina, Salay, Sugbongcogon, Talisayan
// District 2 (west/coastal): Claveria, Jasaan, Villanueva, Tagoloan, Opol, El Salvador, Laguindingan, Gitagum, Libertad, Alubijid, Initao, Naawan, Manticao, Lugait
// CDO = Highly Urbanized City (lone district), shown in both/all
type Pin = { lat: number; lng: number; label: string; district: 1 | 2 | 0 };

// SETUP program pins
const setupPins: Pin[] = [
  { lat: 8.4756, lng: 124.6422, label: 'Cagayan de Oro City', district: 0 },
  { lat: 8.4470, lng: 124.5363, label: 'Opol', district: 2 },
  { lat: 8.5597, lng: 124.5271, label: 'El Salvador', district: 2 },
  { lat: 8.5705, lng: 124.4712, label: 'Alubijid', district: 2 },
  { lat: 8.5747, lng: 124.4409, label: 'Laguindingan', district: 2 },
  { lat: 8.5944, lng: 124.4058, label: 'Gitagum', district: 2 },
  { lat: 8.5627, lng: 124.3523, label: 'Libertad', district: 2 },
  { lat: 8.4975, lng: 124.3056, label: 'Initao', district: 2 },
  { lat: 8.4033, lng: 124.2888, label: 'Manticao', district: 2 },
  { lat: 8.3432, lng: 124.2598, label: 'Lugait', district: 2 },
  { lat: 8.5387, lng: 124.7544, label: 'Tagoloan', district: 2 },
  { lat: 8.5837, lng: 124.7699, label: 'Villanueva', district: 2 },
  { lat: 8.6504, lng: 124.7547, label: 'Jasaan', district: 2 },
  { lat: 8.7429, lng: 124.7756, label: 'Balingasag', district: 1 },
  { lat: 8.8059, lng: 124.7877, label: 'Lagonglong', district: 1 },
  { lat: 8.8589, lng: 124.7868, label: 'Salay', district: 1 },
  { lat: 8.9211, lng: 124.7850, label: 'Binuangan', district: 1 },
  { lat: 8.9563, lng: 124.7881, label: 'Sugbongcogon', district: 1 },
  { lat: 8.9840, lng: 124.7911, label: 'Kinoguitan', district: 1 },
  { lat: 8.6119, lng: 124.8934, label: 'Claveria', district: 2 },
];

// CEST program pins - real coordinates
const cestPins: Pin[] = [
  { lat: 8.4655, lng: 124.6441, label: 'CDO - Macasandig', district: 0 },
  { lat: 8.5039, lng: 124.6162, label: 'CDO - Bulua', district: 0 },
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

// SSCP program pins - real coordinates
const sscpPins: Pin[] = [
  { lat: 8.4693, lng: 124.6470, label: 'CDO - Nazareth', district: 0 },
  { lat: 8.4992, lng: 124.6391, label: 'CDO - Kauswagan', district: 0 },
  { lat: 8.4748, lng: 124.6851, label: 'CDO - Gusa', district: 0 },
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

// LGIA program pins - real coordinates
const lgiaPins: Pin[] = [
  { lat: 8.4810, lng: 124.6370, label: 'CDO - Carmen', district: 0 },
  { lat: 8.4901, lng: 124.6463, label: 'CDO - Consolacion', district: 0 },
  { lat: 8.4964, lng: 124.6051, label: 'CDO - Iponan', district: 0 },
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

// Filter pins by active district
const filterByDistrict = (pins: Pin[], district: string) => {
  if (district === 'all') return pins;
  const d = district === 'district1' ? 1 : 2;
  return pins.filter(p => p.district === d || p.district === 0);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MapComponent({ activePrograms, activeDistrict }: { activePrograms: string[]; activeDistrict: string }) {
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
    return <div className="maps-loading">Loading map...</div>;
  }

  const { MapContainer, TileLayer, Polygon, Marker, Tooltip } = components;

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
      {showSetup && filterByDistrict(setupPins, activeDistrict).map((pin, idx) => (
        <Marker key={`setup-${idx}`} position={[pin.lat, pin.lng]} icon={setupIcon}>
          <Tooltip>{pin.label}</Tooltip>
        </Marker>
      ))}
      {showCest && filterByDistrict(cestPins, activeDistrict).map((pin, idx) => (
        <Marker key={`cest-${idx}`} position={[pin.lat, pin.lng]} icon={cestIcon}>
          <Tooltip>{pin.label}</Tooltip>
        </Marker>
      ))}
      {showSscp && filterByDistrict(sscpPins, activeDistrict).map((pin, idx) => (
        <Marker key={`sscp-${idx}`} position={[pin.lat, pin.lng]} icon={sscpIcon}>
          <Tooltip>{pin.label}</Tooltip>
        </Marker>
      ))}
      {showLgia && filterByDistrict(lgiaPins, activeDistrict).map((pin, idx) => (
        <Marker key={`lgia-${idx}`} position={[pin.lat, pin.lng]} icon={lgiaIcon}>
          <Tooltip>{pin.label}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function MapsPage() {
  const [activeDistrict, setActiveDistrict] = useState('all');
  const [activePrograms, setActivePrograms] = useState<string[]>([]);

  const toggleProgram = (id: string) => {
    setActivePrograms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout activePath="/maps">
      <main className="maps-main">
        {/* Map View */}
        <div className="maps-container">
          <MapComponent activePrograms={activePrograms} activeDistrict={activeDistrict} />
        </div>

        {/* District Tabs - overlay on top of map */}
        <div className="maps-district-tabs">
          <button
            className={`district-tab ${activeDistrict === 'district1' ? 'active' : ''}`}
            onClick={() => setActiveDistrict('district1')}
          >
            District 1
          </button>
          <button
            className={`district-tab ${activeDistrict === 'district2' ? 'active' : ''}`}
            onClick={() => setActiveDistrict('district2')}
          >
            District 2
          </button>
          <button
            className={`district-tab ${activeDistrict === 'all' ? 'active' : ''}`}
            onClick={() => setActiveDistrict('all')}
          >
            All
          </button>
        </div>

        {/* Program Filter Sidebar - overlay on top of map */}
        <div className="maps-program-filters">
          {programFilters.map(prog => (
            <button
              key={prog.id}
              className={`program-filter-btn ${activePrograms.includes(prog.id) ? 'active' : ''}`}
              style={{ background: prog.color }}
              onClick={() => toggleProgram(prog.id)}
            >
              {prog.logo ? (
                <img src={prog.logo} alt={prog.label} className="program-filter-logo" />
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
