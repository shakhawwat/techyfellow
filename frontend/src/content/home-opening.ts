export const homeOpening = {
  hero: {
    eyebrow: 'ROBOTICS / IOT / AI / RESEARCH',
    headline: ['From research.', 'To working systems.'],
    description: 'Engineering, applied research and practical learning—connected through the things we build.',
    actions: [{ label: 'Discuss a project', href: '/build-with-us' }, { label: 'Explore our work', href: '/projects' }],
    image: { src: '/banner/b1.jpg', width: 2400, height: 1713, alt: 'Computer hardware with blue-lit cooling tubes and red cabling.' },
  },
  audience: {
    label: '01 / FIND YOUR DIRECTION',
    heading: 'Different goals. One engineering team.',
    pathways: [
      { title: 'Businesses & startups', description: 'Prototype a product or solve a technical challenge.', label: 'Build with us', href: '/build-with-us' },
      { title: 'Students & learners', description: 'Learn practical skills through guided projects.', label: 'Explore learning', href: '/academy' },
      { title: 'Researchers & supervisors', description: 'Collaborate on implementation, experiments and lab programs.', label: 'Discuss collaboration', href: '/research' },
    ],
  },
} as const;
