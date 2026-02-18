
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom} from 'jotai';
import {ActiveSectorAtom} from './atoms';
import {SECTORS} from './consts';

export function SectorSelector() {
  const [activeSector, setActiveSector] = useAtom(ActiveSectorAtom);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {SECTORS.map((sector) => (
        <button
          key={sector.id}
          onClick={() => setActiveSector(sector.id)}
          className={`flex flex-col items-center justify-center min-w-[70px] p-2 rounded-xl border-2 transition-all ${
            activeSector === sector.id
              ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-md'
              : 'bg-[var(--bg-color)] border-[var(--border-color)] hover:border-[var(--accent-color)] hover:bg-[var(--bg-color-secondary)]'
          }`}
        >
          <span className="text-xl mb-1">{sector.icon}</span>
          <span className="text-[9px] font-black uppercase">{sector.label}</span>
        </button>
      ))}
    </div>
  );
}
