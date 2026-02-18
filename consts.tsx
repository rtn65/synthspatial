
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {DetectTypes} from './Types';
import {SectorType} from './atoms';

export const colors = [
  'rgb(0, 0, 0)',
  'rgb(255, 255, 255)',
  'rgb(213, 40, 40)',
  'rgb(250, 123, 23)',
  'rgb(240, 186, 17)',
  'rgb(8, 161, 72)',
  'rgb(26, 115, 232)',
  'rgb(161, 66, 244)',
];

export const imageOptions: Promise<string[]> = Promise.all(
  [
    'origami.jpg',
    'pumpkins.jpg',
    'clock.jpg',
    'socks.jpg',
    'breakfast.jpg',
    'cat.jpg',
    'spill.jpg',
    'fruit.jpg',
    'baklava.jpg',
  ].map(async (i) =>
    URL.createObjectURL(
      await (
        await fetch(
          `https://www.gstatic.com/aistudio/starter-apps/bounding-box/${i}`,
        )
      ).blob(),
    ),
  ),
);

/**
 * Dataset options used in the DatasetPanel.
 */
export const datasetImageOptions = imageOptions;

export const lineOptions = {
  size: 8,
  thinning: 0,
  smoothing: 0,
  streamline: 0,
  simulatePressure: false,
};

export interface BackgroundPreset {
  id: string;
  label: string;
  prompt: string;
  system: string;
}

export const BG_PRESETS: BackgroundPreset[] = [
  { 
    id: 'üretim', 
    label: '🏭 Akıllı Üretim', 
    prompt: 'Görüntüdeki nesneyi ultra modern, teknolojik bir akıllı fabrikada bir robotik kol tarafından taşınırken göster. Arka planda hareketli montaj hatları.',
    system: 'You are an industrial design visualization engine. Focus on high-precision metallic surfaces, volumetric factory lighting, and photorealistic material science.'
  },
  { 
    id: 'termal', 
    label: '🌡️ Gelişmiş Termal', 
    prompt: 'Profesyonel FLIR termal kamera simülasyonu. Sıcaklık gradyanları için spektral renk paleti. Isı sızıntıları üzerinde dinamik yansımalar.',
    system: 'You are a scientific thermal imaging sensor (FLIR). Map all textures to accurate heat-signature spectral gradients (lava/ironbow). Ensure no photographic light exists, only infrared radiation data visualization.'
  },
  { 
    id: 'pcb', 
    label: '🔌 Mikro Laboratuvar', 
    prompt: 'Nesneyi devasa bir elektronik devre kartının (PCB) üzerinde, bir mikroçip gibi konumlandır. Çevrede devasa kapasitörler ve parlayan bakır yollar.',
    system: 'You are a high-end macro photography microscope. Render with extreme shallow depth of field (f/1.8), micron-level semiconductor textures, and realistic subsurface scattering on silicon components.'
  },
  { 
    id: 'uydu', 
    label: '🛰️ Jeo-Uzamsal', 
    prompt: 'Dünya yörüngesinden 10cm çözünürlüklü uydu görüntüsü stili. Arazi üzerinde multispektral analiz katmanları ve NDVI renk paleti.',
    system: 'You are a multi-spectral orbital satellite sensor. Maintain absolute nadir perspective (top-down), render orthorectified terrain, and apply geospatial analysis color overlays with high cartographic fidelity.'
  },
  { 
    id: 'güvenlik', 
    label: '🛡️ Gece Görüşü 2.0', 
    prompt: 'Military-grade gen-3 gece görüş sistemi (NVG). Fosfor yeşili tonları, dijital gürültü ve taktiksel veri arayüzü (HUD) katmanları.',
    system: 'You are a Gen-3 tactical night vision optics system. Simulate realistic sensor noise, light bloom on bright spots, phosphor grain, and digital overlay artifacts characteristic of advanced NVG systems.'
  },
  { 
    id: 'radyoloji', 
    label: '🦴 MRI/BT Kesiti', 
    prompt: 'Yüksek çözünürlüklü tıbbi görüntüleme; MRI ve BT taraması karışımı. Nesnenin içsel yapısını gösteren katmanlı kesitler.',
    system: 'You are a clinical 3D medical visualization workstation. Render translucent volumetric density structures, high-contrast radiological cross-sections, and bio-organic textures with diagnostic clarity.'
  },
];

export const SECTORS: {id: SectorType; label: string; icon: string; desc: string}[] = [
  { id: 'general', label: 'Genel', icon: '🎨', desc: 'Standart görüntü üretimi' },
  { id: 'data_dreamer', label: 'DataDreamer', icon: '💭', desc: 'LLM destekli prompt üretimi' },
  { id: 'red_team', label: 'Red Team', icon: '🚨', desc: 'Adversarial Saldırı Testleri' },
  { id: 'agriculture', label: 'Tarım', icon: '🌾', desc: 'Mahsul sağlığı ve analizi' },
  { id: 'manufacturing', label: 'Üretim', icon: '🏭', desc: 'Kalite kontrol ve hata simülasyonu' },
  { id: 'security', label: 'Güvenlik', icon: '🛡️', desc: 'Gözetim ve tehdit senaryoları' },
  { id: 'remote_sensing', label: 'Uydu', icon: '🛰️', desc: 'Jeo-uzamsal haritalama' },
];
