// Frontend-only proposals for the clearly labeled illustrative concepts.
export const conceptDetails = {
 agriculture: {
  users:'Proposed audience: growers and researchers exploring environmental monitoring.',
  problem:'Proposed focus: bringing scattered soil and environmental readings into one view.',
  solution:'Proposed solution: sensor nodes send timestamped readings to a dashboard for human interpretation.',
  features:['Proposed soil moisture, temperature and humidity readings','Proposed trend charts and configurable threshold alerts','Proposed sensor health and last-reading indicators'],
  hardware:['Suggested ESP32 sensor node','Suggested soil moisture and temperature/humidity sensors','Suggested regulated power supply and weather-resistant enclosure'],
  software:['Suggested microcontroller firmware','Suggested MQTT messaging and a time-series store','Suggested web dashboard'],
  workflow:['Example architecture: sensors → ESP32 → MQTT gateway → data store → dashboard','Proposed workflow: sample, validate, transmit and display readings for human review'],
  next:['Proposed next step: calibrate sensors against reference measurements','Proposed next step: evaluate connectivity, enclosure protection and power needs','Design consideration: readings depend on calibration and sensor placement'],
 },
 robot: {
  users:'Proposed audience: robotics students and researchers exploring indoor navigation.',
  problem:'Proposed focus: navigating a bounded space while detecting obstacles.',
  solution:'Proposed solution: combine range sensing, a local map and motion planning with a supervised mobile platform.',
  features:['Proposed obstacle detection and local mapping','Proposed waypoint navigation','Proposed manual override and emergency stop'],
  hardware:['Suggested differential-drive chassis, motors and encoders','Suggested range sensor and inertial measurement unit','Suggested compute board, motor driver and emergency-stop circuit'],
  software:['Suggested ROS 2 integration','Suggested mapping and navigation software','Suggested motor-control firmware'],
  workflow:['Example architecture: sensors → localization/map → planner → motor controller','Proposed workflow: perceive, plan and move under operator supervision'],
  next:['Proposed next step: test localization and stopping behavior in a controlled space','Proposed next step: evaluate battery runtime and sensor blind spots','Design consideration: navigation depends on the environment and sensor coverage'],
 },
 vision: {
  users:'Proposed audience: engineers exploring camera-assisted inspection with human review.',
  problem:'Proposed focus: identifying visible differences consistently enough to assist an inspector.',
  solution:'Proposed solution: a camera and vision model flag candidate differences for a reviewer to assess.',
  features:['Proposed image capture and region selection','Proposed visual difference flags with review controls','Proposed review history for traceable decisions'],
  hardware:['Suggested camera and fixed mounting fixture','Suggested controlled illumination','Suggested workstation or edge compute device'],
  software:['Suggested OpenCV image processing','Suggested model inference framework','Suggested review interface and image storage'],
  workflow:['Example architecture: camera → preprocessing → model inference → human review','Proposed workflow: capture, flag, review and record the reviewer’s decision'],
  next:['Proposed next step: collect representative, permission-approved images','Proposed next step: evaluate false positives and missed detections on held-out images','Design consideration: lighting and changing inputs may affect model behavior'],
 },
} as const;
