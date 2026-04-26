'use client';

import { addCollection } from '@iconify/react';
import mdi from '@iconify-json/mdi/icons.json';
import bi from '@iconify-json/bi/icons.json';
import gameIcons from '@iconify-json/game-icons/icons.json';
import letsIcons from '@iconify-json/lets-icons/icons.json';

// Register all icon sets locally so they never fetch from the CDN.
// This runs once when the module is first imported.
addCollection(mdi as Parameters<typeof addCollection>[0]);
addCollection(bi as Parameters<typeof addCollection>[0]);
addCollection(gameIcons as Parameters<typeof addCollection>[0]);
addCollection(letsIcons as Parameters<typeof addCollection>[0]);

export default function IconifySetup() {
  return null;
}
