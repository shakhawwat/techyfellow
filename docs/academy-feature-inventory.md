# Academy feature inventory

Inspected before implementation: public course DTO/schema and controllers, admin course controllers, account session/provider and account endpoints, public route layouts, catalog and course components.

| Feature | Existing support | This pass |
| --- | --- | --- |
| Search, categories, filters | Public API supports level/delivery mode/sort; no text/category search or course category field | Search and category/level/title-sort filter loaded catalog previews locally; published listing keeps its API filters and pagination |
| Course details | Public course details: summary, level, prerequisites, syllabus topics, delivery mode, duration | Dedicated existing `/academy/courses/[slug]` routes, with supplied fields only; demo routes gated on successful global empty response |
| Wishlist | No API | Explicit browser-local storage, not account-synced or enrollment |
| Cart | No API | Informational unavailable route; no add-to-cart simulation |
| Enrollment / payment | No endpoints or integration | Express interest through existing inquiry destination; operational notices remain |
| My Learning | No enrollment/learner library API | Truthful unavailable state, existing account entry points |
| Lesson player / progress | No lesson or progress API; public course media DTO does not provide approved course video | No simulated lessons or progress; syllabus topics remain information |
| Quizzes / reviews / certificates | No supporting APIs | Unavailable notices, no fabricated scores, ratings or certificates |
| Instructor / admin management | Permission-controlled admin course publishing already exists; no instructor profile/teaching workflow | Keep existing admin access; no second management or account system |
| Authentication | Existing account session, login, signup and logout | Reuse provider and account menu with existing routes |

No backend schemas, database writes or payment integrations are introduced. Instructor, price, rating, lesson-video and outcomes metadata for published records cannot be invented or exposed until the existing public contract supports it. Demo outcomes/audiences are explicitly illustrative. Corporate homepage sections remain unchanged.
