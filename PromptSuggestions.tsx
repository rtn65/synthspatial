
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {useAtom, useSetAtom} from 'jotai';
import {ActiveSectorAtom, SynthesisModelAtom, EditPromptAtom} from './atoms';

const SUGGESTIONS_DB = {
  general: {
    image: [
      "Cinematic cyberpunk street at night, neon lights, rain, reflection, 8k render",
      "Studio lighting product shot of a glass perfume bottle, elegant backdrop",
      "Isometric 3D render of a cozy living room, low poly style, soft lighting",
      "Portrait of a futuristic astronaut, detailed helmet, mars background"
    ],
    video: [
      "Cinematic drone shot flying over a norwegian fjord, mist, sunrise",
      "Slow motion water droplet hitting a surface, macro capture, high speed",
      "Time-lapse of clouds moving over a mountain peak, dramatic lighting",
      "Cyberpunk city street with flying cars, looping video, neon atmosphere"
    ],
    flux: [
      "A signpost in a field reading 'SYNTH ENGINE' in bold typography, realistic",
      "Extreme macro close-up of an eye iris, highly detailed texture, 100mm lens",
      "Magazine cover layout with text 'FASHION' and a model posing, typography",
      "Photorealistic delicious burger with melting cheese, food photography, studio"
    ]
  },
  agriculture: {
    image: [
      "Close-up of corn leaf with rust fungus symptoms, macro photography",
      "Aerial drone view of a vineyard with irrigation lines, sunny day",
      "Hydroponic strawberry farm, bright LED grow lights, modern agriculture",
      "Tractor spraying fertilizer in a wheat field, sunny day, wide angle"
    ],
    video: [
      "Drone flyover of a golden wheat field ready for harvest, cinematic",
      "Time-lapse of a bean sprout growing from soil, side view",
      "Automatic irrigation system turning on in a greenhouse, slow motion",
      "Wind blowing through tall corn stalks, cinematic slow motion, golden hour"
    ]
  },
  manufacturing: {
    image: [
      "Macro shot of a steel weld with porosity defects, industrial inspection",
      "PCB board under microscope showing a cold solder joint, high detail",
      "Assembly line robot arm painting a car door, sparks flying, factory floor",
      "Industrial warehouse interior with stacked pallets and forklift, wide shot"
    ],
    video: [
      "Robotic arm picking and placing objects on a conveyor belt, smooth motion",
      "Molten metal being poured in a foundry, sparks and smoke, cinematic",
      "CNC machine milling a metal part, cooling fluid splashing, macro video",
      "Automated quality control camera scanning products on belt"
    ]
  },
  security: {
    image: [
      "CCTV grain style footage of a parking lot at night, low quality, noisy",
      "Thermal camera view of a person walking in a dark forest, heat signature",
      "Wide angle security camera view of an airport terminal, busy crowd",
      "License plate recognition camera view, cars passing by, motion blur"
    ],
    video: [
      "Security camera footage of a busy intersection with traffic, timestamp overlay",
      "Surveillance drone hovering over a perimeter fence, stable shot",
      "Bodycam footage simulation of walking down a hallway, shaky camera",
      "Infrared night vision footage of wildlife movement in backyard"
    ]
  },
  remote_sensing: {
    image: [
      "Satellite top-down view of a coastal city, high resolution, nadir view",
      "False color infrared satellite imagery of a forest fire, geospatial analysis",
      "SAR (Synthetic Aperture Radar) image of an ocean ship wake, black and white",
      "Orthorectified aerial map of a suburban neighborhood, map style"
    ],
    video: [
      "Satellite orbital view passing over the Himalayas, realistic earth curvature",
      "Time-lapse of urban sprawl expanding over 10 years, satellite view",
      "Clouds moving over the Amazon rainforest, satellite view, weather pattern",
      "Hurricane formation from space, slow rotation, high altitude"
    ]
  },
  red_team: {
    image: [
      "Stop sign with a specifically crafted adversarial patch sticker",
      "Person wearing a t-shirt with a pattern designed to confuse AI vision",
      "Camouflaged military vehicle in a dense autumn forest, hard to see",
      "Object with optical illusion texture to break edge detection algorithms"
    ],
    video: [
      "Video of a person wearing an adversarial patch walking past camera",
      "Variable lighting conditions testing object detection stability, flickering light",
      "Camera lens flare and sensor noise obscuring the subject, stress test",
      "Rapidly changing digital camouflage pattern on a screen"
    ]
  },
  data_dreamer: {
    image: [
        "A synthetic dataset generation setup for industrial tools, flat lay",
        "Variations of a coffee mug in different lighting conditions, grid view"
    ],
    video: [
        "Rotation of a 3D object for dataset generation, 360 degree turn"
    ]
  },
  external_api: {
      image: ["Photorealistic portrait using Flux.1 Pro"],
      video: ["Cinematic generation using Runway Gen-3"]
  }
};

export function PromptSuggestions() {
  const [activeSector] = useAtom(ActiveSectorAtom);
  const [model] = useAtom(SynthesisModelAtom);
  const setPrompt = useSetAtom(EditPromptAtom);

  const isVideo = model.includes('veo') || model.includes('runway');
  const isFlux = model.includes('fal') || model.includes('flux');

  let suggestions: string[] = [];
  
  // Safe access to sector data, fallback to general
  // Cast to specific shape to avoid TypeScript inference issues
  const sectorData = (SUGGESTIONS_DB[activeSector as keyof typeof SUGGESTIONS_DB] || SUGGESTIONS_DB.general) as {
    image: string[];
    video?: string[];
    flux?: string[];
  };

  if (isVideo && sectorData.video) {
    suggestions = sectorData.video;
  } else if (isFlux && sectorData.flux && activeSector === 'general') {
    // Flux specific suggestions usually relevant for general art/text
    suggestions = sectorData.flux;
  } else {
    suggestions = sectorData.image || [];
  }

  // Fallback if empty logic returns nothing
  if (suggestions.length === 0) suggestions = SUGGESTIONS_DB.general.image;

  // Take top 4
  const displaySuggestions = suggestions.slice(0, 4);

  return (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide snap-x fade-mask-r">
      {displaySuggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => setPrompt(suggestion)}
          className="snap-start shrink-0 px-3 py-2 bg-[var(--bg-color-secondary)] hover:bg-[var(--accent-color)] hover:text-white border border-[var(--border-color)] hover:border-[var(--accent-color)] rounded-xl text-[10px] font-medium transition-all max-w-[200px] text-left group flex flex-col gap-1 shadow-sm hover:shadow-md"
          title={suggestion}
        >
          <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 text-[8px] uppercase font-black tracking-wider">
            <span>✨</span>
            <span>Öneri</span>
          </div>
          <div className="truncate w-full">{suggestion}</div>
        </button>
      ))}
    </div>
  );
}
