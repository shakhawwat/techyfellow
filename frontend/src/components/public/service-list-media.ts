import type { ListMedia } from './expandable-media-list';
// Existing, visually inspected banner assets. These illustrate topics, not delivered work.
export const serviceListMedia: Readonly<Record<string, ListMedia>> = {
  robotics: { src: '/banner/b1.jpg', alt: 'Illustrative connected robotics hardware and wiring', illustrative: true },
  'iot-embedded': { src: '/banner/iot_banner.jpg', alt: 'Illustrative microcontrollers, sensors and prototyping components', illustrative: true },
  'ai-vision': { src: '/banner/aibanner3.jpg', alt: 'Illustrative AI processor graphic with circuit traces', illustrative: true },
  automation: { src: '/banner/esp32Bannetr.jpg', alt: 'Illustrative embedded development board in front of firmware code', illustrative: true, position: '55% 50%' },
  prototyping: { src: '/banner/reserach.jpg', alt: 'Illustrative electronics work on a circuit board at a workbench', illustrative: true, position: '55% 50%' },
  capstone: { src: '/banner/academy.jpg', alt: 'Illustrative learner writing technical study notes', illustrative: true },
  research: { src: '/banner/reserach.jpg', alt: 'Illustrative electronics work at a research workbench', illustrative: true, position: '55% 50%' },
  startup: { src: '/banner/consulting.jpg', alt: 'Illustrative technical discussion at a laptop', illustrative: true, position: '60% 50%' },
};
