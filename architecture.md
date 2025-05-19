src/ ├── domain/ # Modelo de domínio puro │ ├── auth/ │ │
├── application/ │ │ │ ├── repositories/ │ │ │ │ ├──
i-account-repository.ts │ │ │ │ └── i-role-repository.ts │ │
│ └── use-cases/ │ │ │ ├── create-account.ts │ │ │ ├──
authenticate-user.ts │ │ │ └── refresh-token.ts │ │ └──
enterprise/ │ │ └── entities/ │ │ ├── User.ts │ │ ├──
Role.ts │ │ ├── Session.ts │ │ └── Token.ts │ │ │ ├──
student-profile/ │ │ ├── application/ │ │ │ ├──
repositories/ │ │ │ │ ├── i-enrollment-repository.ts │ │ │ │
└── i-progress-repository.ts │ │ │ └── use-cases/ │ │ │ ├──
enroll-student.ts │ │ │ ├── track-progress.ts │ │ │ └──
issue-certificate.ts │ │ └── enterprise/ │ │ └── entities/ │
│ ├── Enrollment.ts │ │ ├── Progress.ts │ │ └──
Certificate.ts │ │ │ ├── course-catalog/ │ │ ├──
application/ │ │ │ ├── repositories/ │ │ │ │ ├──
i-course-repository.ts │ │ │ │ └── i-content-repository.ts │
│ │ └── use-cases/ │ │ │ ├── create-course.ts │ │ │ ├──
add-module.ts │ │ │ └── publish-content.ts │ │ └──
enterprise/ │ │ └── entities/ │ │ ├── Course.ts │ │ ├──
Module.ts │ │ └── Content.ts │ │ │ ├── assessment/ │ │ ├──
application/ │ │ │ ├── repositories/ │ │ │ │ ├──
i-quiz-repository.ts │ │ │ │ └── i-submission-repository.ts
│ │ │ └── use-cases/ │ │ │ ├── create-quiz.ts │ │ │ ├──
submit-quiz-answers.ts │ │ │ └── grade-submission.ts │ │ └──
enterprise/ │ │ └── entities/ │ │ ├── Quiz.ts │ │ ├──
Question.ts │ │ ├── Option.ts │ │ └── Submission.ts │ │ │
├── flashcards/ │ │ ├── application/ │ │ │ ├── repositories/
│ │ │ │ ├── i-deck-repository.ts │ │ │ │ └──
i-card-repository.ts │ │ │ └── use-cases/ │ │ │ ├──
create-deck.ts │ │ │ ├── review-cards.ts │ │ │ └──
track-mastery.ts │ │ └── enterprise/ │ │ └── entities/ │ │
├── Deck.ts │ │ ├── Card.ts │ │ └── MasteryRecord.ts │ │ │
├── forum/ │ │ ├── application/ │ │ │ ├── repositories/ │ │
│ │ ├── i-topic-repository.ts │ │ │ │ └──
i-post-repository.ts │ │ │ └── use-cases/ │ │ │ ├──
create-topic.ts │ │ │ ├── reply-to-post.ts │ │ │ └──
list-notifications.ts │ │ └── enterprise/ │ │ └── entities/
│ │ ├── Topic.ts │ │ ├── Post.ts │ │ └── Reply.ts │ │ │ ├──
live-sessions/ │ │ ├── application/ │ │ │ ├── repositories/
│ │ │ │ ├── i-webinar-repository.ts │ │ │ │ └──
i-attendance-repository.ts │ │ │ └── use-cases/ │ │ │ ├──
schedule-webinar.ts │ │ │ └── register-attendance.ts │ │ └──
enterprise/ │ │ └── entities/ │ │ ├── Webinar.ts │ │ └──
AttendanceRecord.ts │ │ │ └── billing-enrollment/ │ ├──
application/ │ │ ├── repositories/ │ │ │ ├──
i-payment-repository.ts │ │ │ └── i-invoice-repository.ts │
│ └── use-cases/ │ │ ├── process-hotmart-webhook.ts │ │ ├──
issue-invoice.ts │ │ └── auto-onboard-student.ts │ └──
enterprise/ │ └── entities/ │ ├── PaymentEvent.ts │ ├──
Invoice.ts │ └── OnboardingRecord.ts │ ├── application/ #
Orquestração de use-cases e serviços │ ├── auth/ │ │ └──
services/ │ │ ├── sign-in.service.ts │ │ └──
reset-password.service.ts │ ├── student-profile/ │ │ └──
services/ │ │ ├── enrollment.service.ts │ │ └──
progress-report.service.ts │ ├── assessment/ │ │ └──
services/ │ │ ├── quiz-grading.service.ts │ │ └──
submission-review.service.ts │ └── … (idem para demais
domínios) │ ├── infra/ # Adapters / implementação concreta │
├── controllers/ # HTTP controllers separados por domínio │
│ ├── auth/ │ │ │ ├── auth.controller.ts │ │ │ └──
password-reset.controller.ts │ │ ├── student-profile/ │ │ │
├── enrollment.controller.ts │ │ │ └──
progress.controller.ts │ │ ├── course-catalog/ │ │ │ ├──
courses.controller.ts │ │ │ └── modules.controller.ts │ │
├── assessment/ │ │ │ ├── quiz.controller.ts │ │ │ └──
submission.controller.ts │ │ ├── flashcards/ │ │ │ ├──
deck.controller.ts │ │ │ └── card.controller.ts │ │ ├──
forum/ │ │ │ ├── topics.controller.ts │ │ │ └──
posts.controller.ts │ │ ├── live-sessions/ │ │ │ ├──
webinars.controller.ts │ │ │ └── attendance.controller.ts │
│ └── billing-enrollment/ │ │ ├── payments.controller.ts │ │
└── onboarding.controller.ts │ │ │ ├── auth/ # infra/auth
com guards, strategies, dtos… │ │ ├── guards/ │ │ ├──
strategies/ │ │ ├── repositories/ │ │ ├── dtos/ │ │ └──
auth.module.ts │ │ │ ├── database/ # Infraestrutura de dados
│ │ └── prisma/ │ │ ├── repositories/ # Implementações de
repositório por domínio │ │ │ ├── auth/ │ │ │ │ ├──
user.repository.ts │ │ │ │ └── role.repository.ts │ │ │ ├──
student-profile/ │ │ │ │ ├── enrollment.repository.ts │ │ │
│ ├── progress.repository.ts │ │ │ │ └──
certificate.repository.ts │ │ │ ├── course-catalog/ │ │ │ │
├── course.repository.ts │ │ │ │ ├── module.repository.ts │
│ │ │ └── content.repository.ts │ │ │ ├── assessment/ │ │ │
│ ├── quiz.repository.ts │ │ │ │ ├── question.repository.ts
│ │ │ │ ├── option.repository.ts │ │ │ │ └──
submission.repository.ts │ │ │ ├── flashcards/ │ │ │ │ ├──
deck.repository.ts │ │ │ │ └── card.repository.ts │ │ │ ├──
forum/ │ │ │ │ ├── topic.repository.ts │ │ │ │ ├──
post.repository.ts │ │ │ │ └── reply.repository.ts │ │ │ ├──
live-sessions/ │ │ │ │ ├── webinar.repository.ts │ │ │ │ └──
attendance.repository.ts │ │ │ └── billing-enrollment/ │ │ │
├── payment-event.repository.ts │ │ │ ├──
invoice.repository.ts │ │ │ └── onboarding.repository.ts │ │
└── utils/ │ │ └── convert-status.util.ts │ │ │ ├── http/ #
Infraestrutura HTTP externa e interna │ │ ├── api-erp/ │ │
└── controllers/ │ │ │ ├── integrations/ # Webhooks, Zoom,
Hotmart, Asaas… │ │ │ ├── notifications/ # Event handlers
desacoplados │ │ └── handlers/ │ │ │ └── persistence/ #
Serviços S3, Vimeo, etc. │ └── shared/ # Kernel comum e
cross-cutting ├── kernel/ ├── logging/ ├── config/ └──
utils/
