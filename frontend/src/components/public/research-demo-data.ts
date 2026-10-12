import type { ListQuery } from '@/lib/public/pages';

export const researchDemoLabel = 'Illustrative research previews — not active projects or recruitment.';
export type ResearchDemo = { id: string; title: string; domain: string; stage: 'planned' | 'active' | 'paused' | 'completed'; teamRequirement: string; summary: string; motivation: string; objectives: string[]; methodology: string[]; evaluationPlan: string[]; resources: string[]; contributorRoles: string[] };

export const researchDemos: readonly ResearchDemo[] = [
  {
    "id": "demo-research-knowledge-enhanced-sentiment",
    "title": "Knowledge-Enhanced Sentiment Analysis",
    "domain": "Natural language processing",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: NLP prototyping, knowledge curation and evaluation review.",
    "summary": "Study whether structured background knowledge helps explain sentiment decisions.",
    "motivation": "Ambiguous wording and domain context can make sentiment classification brittle.",
    "objectives": [
      "Study whether structured background knowledge helps explain sentiment decisions.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare a text-only classifier with retrieval of small, curated concept graphs; document how knowledge is selected.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure macro-F1 and calibration on a held-out, licensed corpus; inspect negation and conflicting-context errors.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A licensed sentiment corpus, a small curated knowledge graph and a CPU workstation with optional GPU access."
    ],
    "contributorRoles": [
      "Nlp prototyping",
      "Knowledge curation and evaluation review"
    ]
  },
  {
    "id": "demo-research-multimodal-emotion",
    "title": "Multimodal Emotion Understanding",
    "domain": "Multimodal learning",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Audio feature design, consent-aware data preparation and multimodal evaluation.",
    "summary": "Explore uncertainty-aware fusion while keeping emotion labels descriptive rather than diagnostic.",
    "motivation": "Emotion cues in speech, text and visual signals may disagree, and labels depend on context.",
    "objectives": [
      "Explore uncertainty-aware fusion while keeping emotion labels descriptive rather than diagnostic.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Build separate text and audio baselines before testing gated fusion; use permitted visual features only where consent allows.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Compare per-class recall and calibration with speaker-separated splits; test missing modalities and disagreement cases.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "Consented multimodal samples, annotation guidance, audio processing tools and optional GPU compute."
    ],
    "contributorRoles": [
      "Audio feature design",
      "Consent-aware data preparation and multimodal evaluation"
    ]
  },
  {
    "id": "demo-research-edge-ai-robotics",
    "title": "Edge AI for Robotics",
    "domain": "Robotics",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: Embedded integration, robotics simulation and performance measurement.",
    "summary": "Explore the tradeoff between perception quality, latency and energy on a bounded robot task.",
    "motivation": "Robots may need timely perception when network access or onboard compute is limited.",
    "objectives": [
      "Explore the tradeoff between perception quality, latency and energy on a bounded robot task.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Benchmark a compact detector on recorded robot inputs; compare quantization and local execution in simulation before hardware trials.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Report detection metrics, tail latency, memory and energy estimates under repeatable workloads; log missed detections.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "An edge development board, permitted robot recordings, a simulator and a power measurement device."
    ],
    "contributorRoles": [
      "Embedded integration",
      "Robotics simulation and performance measurement"
    ]
  },
  {
    "id": "demo-research-human-robot-interaction",
    "title": "Human–Robot Interaction",
    "domain": "Human–robot interaction",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Interaction design, accessible interface development and study planning.",
    "summary": "Prototype understandable feedback for a bounded interaction and explore perceived clarity.",
    "motivation": "Robot feedback can be difficult to interpret when users have different expectations or access needs.",
    "objectives": [
      "Prototype understandable feedback for a bounded interaction and explore perceived clarity.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Develop a simulated task with alternative feedback designs; prepare a voluntary participant protocol before any user study.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Use task completion, misunderstanding counts and optional usability ratings; examine accessibility differences without claiming generalization.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A robot simulator, interface prototyping tools, accessible study materials and an approved consent process if participants are involved."
    ],
    "contributorRoles": [
      "Interaction design",
      "Accessible interface development and study planning"
    ]
  },
  {
    "id": "demo-research-trustworthy-edge",
    "title": "Trustworthy Edge Intelligence",
    "domain": "Trustworthy AI",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Model monitoring, embedded optimization and robustness review.",
    "summary": "Explore lightweight confidence checks and graceful fallback when inputs differ from training examples.",
    "motivation": "Edge models may face changing inputs while having limited resources for monitoring.",
    "objectives": [
      "Explore lightweight confidence checks and graceful fallback when inputs differ from training examples.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Implement uncertainty and input-shift baselines alongside a small edge model; define safe fallback behavior for a simulated task.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure calibration, shift-detection false alarms, abstention coverage and runtime overhead across controlled changes.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "An edge board or emulator, shareable benchmark inputs and profiling tools."
    ],
    "contributorRoles": [
      "Model monitoring",
      "Embedded optimization and robustness review"
    ]
  },
  {
    "id": "demo-research-bengali-toxicity",
    "title": "Bengali Toxicity Detection",
    "domain": "Bengali language technology",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: Bengali annotation design, NLP modeling and bias evaluation.",
    "summary": "Explore context-sensitive toxicity classification with transparent label definitions and an appeals-oriented error analysis.",
    "motivation": "Bengali moderation can be affected by spelling variation, code mixing and contextual language use.",
    "objectives": [
      "Explore context-sensitive toxicity classification with transparent label definitions and an appeals-oriented error analysis.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Use licensed, de-identified text; compare character and multilingual encoder baselines and document annotation disagreement.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Evaluate macro-F1 and false positives on dialect and code-mixed subsets; review errors without exposing identifying text.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A licensed Bengali corpus, annotation guidance, privacy-preserving review tools and optional GPU compute."
    ],
    "contributorRoles": [
      "Bengali annotation design",
      "Nlp modeling and bias evaluation"
    ]
  },
  {
    "id": "demo-research-explainable-medical-images",
    "title": "Explainable Medical Image Analysis",
    "domain": "Medical imaging",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Image modeling, explanation analysis and dataset governance review.",
    "summary": "Explore explanation stability and failure modes on a permitted image benchmark; no clinical tool or diagnostic claim is proposed.",
    "motivation": "Visual explanations can appear plausible even when a model relies on irrelevant image features.",
    "objectives": [
      "Explore explanation stability and failure modes on a permitted image benchmark; no clinical tool or diagnostic claim is proposed.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare a small image classifier with saliency and perturbation-based explanations using de-identified benchmark data.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Use patient-separated splits where available; test localization consistency, perturbation sensitivity and classifier uncertainty.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A permitted de-identified image dataset, image processing tools and suitable GPU compute."
    ],
    "contributorRoles": [
      "Image modeling",
      "Explanation analysis and dataset governance review"
    ]
  },
  {
    "id": "demo-research-agricultural-navigation",
    "title": "Agricultural Robot Navigation",
    "domain": "Agricultural robotics",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Navigation software, simulation scene design and safety-oriented testing.",
    "summary": "Prototype bounded row-following and obstacle avoidance in simulated agricultural scenes.",
    "motivation": "Uneven terrain and changing foliage can complicate navigation in agricultural environments.",
    "objectives": [
      "Prototype bounded row-following and obstacle avoidance in simulated agricultural scenes.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Combine vision and odometry baselines; vary row geometry and lighting in simulation before considering supervised physical trials.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure cross-track error, collision counts and completion rates; document failures across terrain and lighting variations.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A navigation simulator, permitted field imagery and optional sensors for supervised prototype trials."
    ],
    "contributorRoles": [
      "Navigation software",
      "Simulation scene design and safety-oriented testing"
    ]
  },
  {
    "id": "demo-research-iot-environment",
    "title": "IoT-Based Environmental Monitoring",
    "domain": "Internet of things",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: Sensor integration, data pipeline development and calibration analysis.",
    "summary": "Explore a reproducible monitoring pipeline that reports uncertainty and missing observations.",
    "motivation": "Low-cost environmental sensors may drift or lose connectivity, making readings difficult to compare.",
    "objectives": [
      "Explore a reproducible monitoring pipeline that reports uncertainty and missing observations.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Prototype sensor ingestion, timestamp checks and reference-based calibration; compare local buffering with intermittent transmission.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure missing-data rates, reference agreement, timing error and power use; avoid health or regulatory compliance claims.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "Environmental sensors, a microcontroller, a reference instrument and a local storage service."
    ],
    "contributorRoles": [
      "Sensor integration",
      "Data pipeline development and calibration analysis"
    ]
  },
  {
    "id": "demo-research-retrieval-research",
    "title": "Retrieval-Augmented Research Assistance",
    "domain": "Information retrieval",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Document curation, retrieval engineering and evidence verification.",
    "summary": "Explore evidence-linked responses and explicit abstention on a bounded collection of permitted documents.",
    "motivation": "Research assistance can produce unsupported statements when retrieved evidence is weak or irrelevant.",
    "objectives": [
      "Explore evidence-linked responses and explicit abstention on a bounded collection of permitted documents.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Create a licensed document index; compare keyword and embedding retrieval and require source-grounded answer generation.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Assess retrieval recall, citation support and abstention quality using a manually reviewed question set.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A permitted document collection, indexing tools, a local model or approved inference access and a review rubric."
    ],
    "contributorRoles": [
      "Document curation",
      "Retrieval engineering and evidence verification"
    ]
  },
  {
    "id": "demo-research-low-resource-language",
    "title": "Low-Resource Language Understanding",
    "domain": "Natural language processing",
    "stage": "paused",
    "teamRequirement": "Proposed contributor roles: Dataset preparation, multilingual modeling and reproducibility review.",
    "summary": "Design a reproducible comparison of small-data adaptation strategies before obtaining any additional data.",
    "motivation": "Limited labeled data can make language models unstable across tasks and writing styles.",
    "objectives": [
      "Design a reproducible comparison of small-data adaptation strategies before obtaining any additional data.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare multilingual transfer, parameter-efficient tuning and simple lexical baselines with a fixed annotation budget.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Track macro-F1, variance across seeds and performance by input length; audit leakage between training and test examples.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A licensed low-resource text corpus, clear label guidance and optional GPU compute."
    ],
    "contributorRoles": [
      "Dataset preparation",
      "Multilingual modeling and reproducibility review"
    ]
  },
  {
    "id": "demo-research-industrial-inspection",
    "title": "Vision-Based Industrial Inspection",
    "domain": "Computer vision",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: Vision modeling, capture-condition analysis and inspection evaluation.",
    "summary": "Explore anomaly detection that communicates uncertainty and supports human review.",
    "motivation": "Rare defects and changing capture conditions can challenge automated visual inspection.",
    "objectives": [
      "Explore anomaly detection that communicates uncertainty and supports human review.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare supervised and normal-only baselines on a licensed inspection benchmark; introduce controlled lighting changes.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure defect recall, false alarms and localization quality with separate capture conditions; review missed defects.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A licensed defect image dataset, image preprocessing tools and optional GPU compute."
    ],
    "contributorRoles": [
      "Vision modeling",
      "Capture-condition analysis and inspection evaluation"
    ]
  },
  {
    "id": "demo-research-federated-devices",
    "title": "Federated Learning for Connected Devices",
    "domain": "Distributed machine learning",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Distributed training, client simulation and privacy threat modeling.",
    "summary": "Explore federated training behavior under heterogeneous data and limited connectivity.",
    "motivation": "Connected devices can hold uneven local datasets while communication and energy budgets differ.",
    "objectives": [
      "Explore federated training behavior under heterogeneous data and limited connectivity.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Simulate local clients with unequal data partitions; compare centralized, local-only and federated baselines without collecting personal data.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure accuracy, communication volume and worst-client performance; simulate dropouts and assess stated privacy limitations.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A client simulator, a licensed benchmark dataset and local compute for controlled experiments."
    ],
    "contributorRoles": [
      "Distributed training",
      "Client simulation and privacy threat modeling"
    ]
  },
  {
    "id": "demo-research-multimodal-cyberbullying",
    "title": "Multimodal Cyberbullying Detection",
    "domain": "Multimodal learning",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Multimodal modeling, annotation review and fairness analysis.",
    "summary": "Explore multimodal classification while documenting uncertainty and the limits of automated moderation.",
    "motivation": "Harmful intent can depend on text-image relationships, context and annotation assumptions.",
    "objectives": [
      "Explore multimodal classification while documenting uncertainty and the limits of automated moderation.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Use licensed de-identified text-image pairs; compare unimodal baselines with cross-modal fusion and context ablations.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Evaluate macro-F1 and false-positive rates across annotation categories; review disagreement and avoid person-level labeling.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A permitted multimodal corpus, annotation rules, secure review tools and optional GPU compute."
    ],
    "contributorRoles": [
      "Multimodal modeling",
      "Annotation review and fairness analysis"
    ]
  },
  {
    "id": "demo-research-efficient-embedded",
    "title": "Energy-Efficient Embedded Intelligence",
    "domain": "Embedded systems",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: Firmware integration, model optimization and energy measurement.",
    "summary": "Compare practical model compression options under a fixed device budget.",
    "motivation": "Model accuracy alone may not justify memory and energy costs on embedded hardware.",
    "objectives": [
      "Compare practical model compression options under a fixed device budget.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Benchmark pruning, quantization and compact architectures on an identical recorded workload; pin toolchain and device settings.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure accuracy, peak memory, tail latency and energy per inference; report measurement uncertainty and warm-up effects.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "An embedded board, a power meter, a licensed benchmark and profiling software."
    ],
    "contributorRoles": [
      "Firmware integration",
      "Model optimization and energy measurement"
    ]
  },
  {
    "id": "demo-research-adaptive-grasping",
    "title": "Adaptive Robotic Grasping",
    "domain": "Robotics",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Grasp planning, simulation tooling and constrained control design.",
    "summary": "Explore feedback-based grasp adjustment for a small, explicitly bounded set of objects in simulation.",
    "motivation": "Object shape and placement changes can make fixed grasp strategies unreliable.",
    "objectives": [
      "Explore feedback-based grasp adjustment for a small, explicitly bounded set of objects in simulation.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare fixed and adaptive grasp policies using simulated contact feedback; define safety constraints before physical prototyping.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure grasp success, slip events and recovery attempts on held-out poses; document simulator limitations.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A grasping simulator, shareable object models and optional supervised access to a low-force gripper."
    ],
    "contributorRoles": [
      "Grasp planning",
      "Simulation tooling and constrained control design"
    ]
  },
  {
    "id": "demo-research-knowledge-graph-qa",
    "title": "Knowledge Graph Question Answering",
    "domain": "Knowledge representation",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Graph curation, semantic parsing and answer-path evaluation.",
    "summary": "Explore interpretable answer paths with explicit handling of missing knowledge.",
    "motivation": "Structured question answering can fail when entity linking is ambiguous or graph coverage is incomplete.",
    "objectives": [
      "Explore interpretable answer paths with explicit handling of missing knowledge.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Build a small licensed graph; compare template-based querying with learned entity linking and constrained traversal.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure answer accuracy, entity-linking errors and abstention on unsupported questions; inspect path correctness.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A curated licensed graph, a question set, a graph query engine and a CPU workstation."
    ],
    "contributorRoles": [
      "Graph curation",
      "Semantic parsing and answer-path evaluation"
    ]
  },
  {
    "id": "demo-research-autonomous-sensor-fusion",
    "title": "Sensor Fusion for Autonomous Systems",
    "domain": "Autonomous systems",
    "stage": "active",
    "teamRequirement": "Proposed contributor roles: State estimation, sensor synchronization and uncertainty evaluation.",
    "summary": "Explore resilient state estimation under bounded sensor dropouts and misalignment.",
    "motivation": "Sensors have different noise and timing characteristics that can destabilize state estimates.",
    "objectives": [
      "Explore resilient state estimation under bounded sensor dropouts and misalignment.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare a filtering baseline with learned fusion on permitted recorded or simulated sensor streams; model timing offsets explicitly.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure trajectory error, uncertainty consistency and recovery after dropouts; avoid claims of deployment readiness.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A sensor simulator or licensed logs, timestamped IMU and visual inputs and analysis tools."
    ],
    "contributorRoles": [
      "State estimation",
      "Sensor synchronization and uncertainty evaluation"
    ]
  },
  {
    "id": "demo-research-accessible-learning",
    "title": "Accessible Technology Learning",
    "domain": "Accessible education",
    "stage": "planned",
    "teamRequirement": "Proposed contributor roles: Accessible content design, frontend accessibility and learning evaluation.",
    "summary": "Prototype accessible explanations and alternative interaction paths for a bounded technical lesson.",
    "motivation": "Technical learning materials may assume visual, language or device access that learners do not share.",
    "objectives": [
      "Prototype accessible explanations and alternative interaction paths for a bounded technical lesson.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Review materials against accessibility guidance; develop text and audio alternatives and prepare a voluntary feedback study.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Assess keyboard access, reading clarity and task completion; report feedback only if an approved study is actually conducted.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "Accessible authoring tools, assistive-technology testing software and an optional approved participant process."
    ],
    "contributorRoles": [
      "Accessible content design",
      "Frontend accessibility and learning evaluation"
    ]
  },
  {
    "id": "demo-research-robust-speech-emotion",
    "title": "Robust Speech Emotion Recognition",
    "domain": "Speech processing",
    "stage": "paused",
    "teamRequirement": "Proposed contributor roles: Speech feature engineering, audio data review and robustness testing.",
    "summary": "Explore robust classification with explicit uncertainty and no inference about mental health or personal traits.",
    "motivation": "Noise, speaker differences and label ambiguity can reduce the reliability of speech-emotion classifiers.",
    "objectives": [
      "Explore robust classification with explicit uncertainty and no inference about mental health or personal traits.",
      "Document assumptions, limitations and reproducible procedures without claiming completed findings."
    ],
    "methodology": [
      "Compare acoustic and pretrained speech baselines on consented audio; add controlled noise and use speaker-separated partitions.",
      "Keep any experiments within approved data permissions and record configuration choices."
    ],
    "evaluationPlan": [
      "Measure macro-F1, calibration and performance degradation by noise level; document label disagreement and language coverage.",
      "Define a baseline and validation split before comparing approaches; publish no results until work is actually performed."
    ],
    "resources": [
      "A licensed consented speech corpus, audio augmentation tools and optional GPU compute."
    ],
    "contributorRoles": [
      "Speech feature engineering",
      "Audio data review and robustness testing"
    ]
  }
];

export function filterResearchDemos(query: ListQuery): ResearchDemo[] {
  const records = researchDemos.filter(entry => (!query.values.domain || entry.domain === query.values.domain) && (!query.values.researchStage || entry.stage === query.values.researchStage));
  // Publication-date sorts retain the defined preview order: demos have no publication dates.
  if (query.sort === 'title' || query.sort === '-title') records.sort((a, b) => a.title.localeCompare(b.title, 'en') * (query.sort === '-title' ? -1 : 1));
  return records;
}
