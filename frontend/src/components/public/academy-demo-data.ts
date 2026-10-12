import { academyAdditionalDemos } from './academy-additional-demo-data';
export type AcademyDemo = {
  id: string; category?: string; audience?: string; title: string; level: 'Beginner' | 'Intermediate' | 'Expert'; description: string;
  objectives: string[]; prerequisites: string[]; modules: { title: string; topics: string[] }[];
  project: string; hardware: string[]; software: string[]; duration: 'To be confirmed'; schedule: 'To be confirmed';
  image?: { src: string; alt: string }; icon: 'robot' | 'chip' | 'vision' | 'research';
};
export const academyDemoNotice = 'Illustrative course previews — not scheduled programs or open enrollment.';
const moduleTopics = (title: string, ...topics: string[]) => ({ title, topics });
export const academyDemos: readonly AcademyDemo[] = [
  {
    id:'academy-demo-robotics-iot', title:'Robotics & IoT Foundations', level:'Beginner', icon:'robot',
    image:{src:'/banner/iot_banner.jpg',alt:'Illustrative electronic components, sensors and a microcontroller board'},
    description:'Explore safe low-voltage circuits, sensor readings and connected robot prototypes through a proposed introductory pathway.',
    objectives:['Explain how a microcontroller reads sensors and controls simple outputs.','Plan a small connected prototype and document its limitations.'],
    prerequisites:['Basic computer use; no prior robotics experience is assumed.','An interest in electronics and willingness to follow low-voltage hardware safety guidance.'],
    modules:[moduleTopics('Circuit and board foundations','Identify inputs, outputs and low-voltage power requirements.','Practice safe connections and basic program structure.'),moduleTopics('Sensors and observations','Read digital and analog inputs.','Inspect noisy measurements and sampling choices.'),moduleTopics('Simple motion control','Explore motor drivers and bounded movement commands.','Discuss power budgeting and safe stopping behavior.'),moduleTopics('Connected data','Explore local device messages and sensor logging.','Handle missing data and connectivity failures.'),moduleTopics('Prototype and documentation','Combine sensing, an output and a data log.','Record test conditions and unresolved limitations.')],
    project:'Proposed example: a low-voltage sensor-driven prototype that logs readings and triggers a bounded movement or indicator.',
    hardware:['A compatible microcontroller board, breadboard and leads.','Basic sensors and optional motor driver with a low-voltage motor; supervised testing space.'],software:['A compatible board development environment and serial monitor.','A code editor and simple local data-logging tools.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  {
    id:'academy-demo-esp32', title:'Embedded Systems with ESP32', level:'Intermediate', icon:'chip',
    image:{src:'/banner/esp32Bannetr.jpg',alt:'Illustrative Wi-Fi microcontroller development board beside programming code'},
    description:'Explore structured ESP32 firmware, device interfaces and connectivity with repeatable debugging and integration practices.',
    objectives:['Organize firmware into clear interface, configuration and device-behavior layers.','Diagnose communication and connectivity failures using reproducible observations.'],
    prerequisites:['Basic C/C++ or equivalent programming experience.','Familiarity with simple circuits, voltage compatibility and microcontroller inputs/outputs.'],
    modules:[moduleTopics('GPIO and device configuration','Configure inputs, outputs and pin assignments.','Review board-specific voltage and power constraints.'),moduleTopics('Peripheral communication','Explore UART, I²C and SPI with compatible devices.','Check message formats and interface failures.'),moduleTopics('Firmware architecture','Separate hardware drivers from application logic.','Plan state transitions and configuration handling.'),moduleTopics('Networking and resilience','Prototype local wireless messaging.','Handle disconnects, retries and bounded data buffers.'),moduleTopics('Debugging and integration','Use logs and interface checks to diagnose faults.','Document a small sensor-to-network workflow.')],
    project:'Proposed example: an ESP32 sensor node with structured firmware, local wireless reporting and a documented recovery plan.',
    hardware:['An ESP32 development board and compatible USB cable.','Voltage-compatible sensors, a breadboard and connection leads.'],software:['An ESP32-compatible toolchain and code editor.','A serial monitor and local network inspection tools.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  {
    id:'academy-demo-ros2', title:'ROS2 & Autonomous Robotics', level:'Intermediate', icon:'robot',
    description:'Explore ROS2 communication, simulation and bounded navigation workflows before considering any physical autonomous system.',
    objectives:['Explain how nodes exchange sensor and control messages.','Integrate a simulated robot workflow and examine navigation failure cases.'],
    prerequisites:['Basic Python or C++ programming and command-line familiarity.','Introductory robotics concepts, coordinate frames and safe testing practices.'],
    modules:[moduleTopics('ROS2 workspace and nodes','Organize a workspace and node responsibilities.','Inspect lifecycle and launch configuration concepts.'),moduleTopics('Communication interfaces','Explore topics, services and actions.','Trace message timing and interface contracts.'),moduleTopics('Robot models and frames','Represent a robot and its coordinate frames.','Inspect sensor transformations in simulation.'),moduleTopics('Simulation and navigation','Set bounded goals in a simulated environment.','Review obstacles, localization assumptions and fallback behavior.'),moduleTopics('Integration and evaluation','Connect nodes into a scoped workflow.','Log navigation errors and document simulator limitations.')],
    project:'Proposed example: a simulated robot that exchanges sensor messages and navigates a small environment with explicit stop conditions.',
    hardware:['A development computer suitable for robot simulation.','Physical robot hardware is optional and would require separate supervision and safety planning.'],software:['A compatible ROS2 environment and robot simulator.','Python or C++ tools and version control.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  {
    id:'academy-demo-applied-ai-vision', title:'Applied AI & Computer Vision', level:'Intermediate', icon:'vision',
    image:{src:'/banner/aibanner3.jpg',alt:'Illustrative AI processor silhouette and circuit diagram'},
    description:'Explore an image-to-model workflow with data permissions, reproducible baselines and transparent evaluation of errors.',
    objectives:['Prepare and inspect a permitted image dataset without leaking test information.','Compare a baseline and inference workflow using meaningful quality and resource measures.'],
    prerequisites:['Basic Python programming and numerical-array familiarity.','Introductory statistics and an understanding of training/validation/test splits.'],
    modules:[moduleTopics('Data permissions and preparation','Select shareable or licensed examples.','Review labeling, image quality and dataset splits.'),moduleTopics('Image processing foundations','Explore preprocessing and simple visual features.','Inspect how transformations affect the task.'),moduleTopics('Models and inference','Run a baseline and a permitted pretrained model.','Record configuration and inference constraints.'),moduleTopics('Evaluation and uncertainty','Measure task-appropriate performance and error patterns.','Discuss calibration, bias and limitations.'),moduleTopics('Applied prototype','Connect image input to a documented inference workflow.','Report observations without claiming deployment readiness.')],
    project:'Proposed example: a local image-inspection prototype with a baseline comparison, error analysis and clearly stated limitations.',
    hardware:['A development computer; optional GPU access if the selected model requires it.','A camera is optional when using permitted recorded images.'],software:['Python, numerical and image-processing tools.','An appropriate model-inference runtime and version-control tools.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  {
    id:'academy-demo-scientific-computing', title:'Research Engineering & Scientific Computing', level:'Expert', icon:'research',
    image:{src:'/banner/b2.jpg',alt:'Illustrative computational intelligence diagram with a circuit-pattern head'},
    description:'Explore reproducible numerical experiments, computational workflows and careful interpretation of scientific observations.',
    objectives:['Design a reproducible computational experiment with documented assumptions.','Investigate numerical sensitivity and communicate uncertainty without overstating findings.'],
    prerequisites:['Comfortable Python programming and numerical computing experience.','Working knowledge of linear algebra, statistics and version control.'],
    modules:[moduleTopics('Research software structure','Separate experiment configuration, computation and reporting.','Record environments, data provenance and reproducibility choices.'),moduleTopics('Numerical methods','Explore approximation and numerical stability.','Review error sources and sensitivity to inputs.'),moduleTopics('Simulation and computation','Implement a bounded computational model.','Compare simple and more complex approaches.'),moduleTopics('Experiment design and validation','Define baselines, checks and evaluation criteria.','Avoid leakage and unsupported causal claims.'),moduleTopics('Analysis and technical reporting','Visualize uncertainty and failure cases.','Prepare a transparent report of assumptions and limitations.')],
    project:'Proposed example: a reproducible numerical experiment comparing two modeling approaches with sensitivity checks and a technical report.',
    hardware:['A development computer with resources appropriate to a scoped numerical task.','Additional compute requirements depend on the proposed experiment and are not confirmed.'],software:['Python and suitable numerical, plotting and notebook tools.','Version control and an environment-management tool.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  {
    id:'academy-demo-cse-methodology', title:'Research Methodology for CSE', level:'Beginner', icon:'research',
    image:{src:'/banner/academy_2.jpg',alt:'Illustrative open reference book, pen and written study notes'},
    description:'Explore how to frame a computing research question, review evidence and plan an ethical, reproducible evaluation.',
    objectives:['Turn a broad computing interest into a bounded research question.','Prepare a proposal with methods, evaluation criteria and transparent limitations.'],
    prerequisites:['Basic familiarity with computing concepts and technical reading.','Ability to take notes and distinguish supplied evidence from assumptions.'],
    modules:[moduleTopics('Questions and scope','Clarify a problem, research question and feasible boundaries.','Distinguish a proposal from a claim of completed work.'),moduleTopics('Literature and evidence','Search permitted sources and organize references.','Compare methods and identify unsupported conclusions.'),moduleTopics('Method selection','Choose qualitative, quantitative or computational approaches suited to the question.','Explain assumptions, resources and constraints.'),moduleTopics('Ethics and evaluation planning','Review data permissions, consent and institution rules.','Define baselines, validation criteria and possible failure cases.'),moduleTopics('Proposal and reproducibility','Prepare a clear proposed workflow and documentation plan.','Retain responsibility for student-authored assessed work.')],
    project:'Proposed example: a student-owned CSE research proposal with an evidence review, methodology and evaluation plan; no completed findings are claimed.',
    hardware:['A computer with access to permitted reference material.','No specialized laboratory hardware is assumed.'],software:['A document editor and reference-management tools.','Optional version control or notebook tools for a computational proposal.'],duration:'To be confirmed',schedule:'To be confirmed',
  },
  ...academyAdditionalDemos,
];
