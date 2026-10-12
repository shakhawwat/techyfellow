// Deterministic assignments of existing site imagery, not evidence of delivered programs.
export type InstitutionalProgramMedia = { src: string; alt: string; position: string };
export const institutionalProgramMedia: Readonly<Record<string, InstitutionalProgramMedia>> = {
  'Beginner robotics workshop': { src: '/banner/iot_banner.jpg', alt: 'Illustrative arrangement of microcontrollers, sensors and prototyping components', position: '50% 50%' },
  'STEM lab planning': { src: '/banner/iot_banner.jpg', alt: 'Illustrative electronics components for discussing a STEM lab equipment brief', position: '50% 50%' },
  'Robotics club and competition preparation': { src: '/banner/b1.jpg', alt: 'Illustrative robotics hardware and wiring for discussing supervised club activities', position: '50% 50%' },
  'IoT and embedded systems lab planning': { src: '/banner/esp32Bannetr.jpg', alt: 'Illustrative development board held in front of firmware code', position: '55% 50%' },
  'Applied AI and research implementation workshop': { src: '/banner/aibanner3.jpg', alt: 'Illustrative AI processor graphic with circuit traces', position: '50% 50%' },
  'Research prototype collaboration': { src: '/banner/reserach.jpg', alt: 'Illustrative electronics work with a circuit board at a workbench', position: '55% 50%' },
  'Connected monitoring feasibility workshop': { src: '/banner/iot_banner.jpg', alt: 'Illustrative sensors and electronics components for a monitoring feasibility discussion', position: '50% 50%' },
  'Technical team training': { src: '/banner/consulting.jpg', alt: 'Illustrative hands working at a laptop for a technical training discussion', position: '60% 50%' },
  'Automation prototype scoping': { src: '/banner/b1.jpg', alt: 'Illustrative connected robotics hardware for discussing automation interfaces', position: '50% 50%' },
};
