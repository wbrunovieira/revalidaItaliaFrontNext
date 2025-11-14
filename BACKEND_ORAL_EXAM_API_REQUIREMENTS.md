# Backend API Requirements for ORAL_EXAM Feature

## Issue Identified

The endpoint `/api/v1/attempts/{attemptId}/results` is **NOT** returning the required `audioAnswerUrl` field for ORAL_EXAM type assessments.

## Current Behavior (INCORRECT)

When fetching attempt results for an ORAL_EXAM assessment, the API returns:

```json
{
  "attempt": {
    "id": "742873cb-31c9-4dbe-994e-df1be166b054",
    "assessmentId": "3dc18a47-0fdf-4122-9fae-56537e1c7f40",
    "status": "SUBMITTED",
    "submittedAt": "2025-11-14T16:26:30.689Z"
  },
  "assessment": {
    "id": "3dc18a47-0fdf-4122-9fae-56537e1c7f40",
    "title": "exame oral",
    "type": "ORAL_EXAM",
    "passingScore": 70
  },
  "answers": [
    {
      "id": "a8ea7288-bec3-4ac9-aae0-457194305a57",
      "questionId": "71d2edb3-f0c6-46be-b2a5-3102b3c7be00",
      "questionText": "pergunta da prova oral",
      "questionType": "OPEN",  // ⚠️ Should be "ORAL" not "OPEN"
      "textAnswer": null,
      "isCorrect": null,
      "status": "SUBMITTED",
      "submittedAt": "2025-11-13T22:41:06.228Z",
      "teacherComment": null
      // ❌ MISSING: audioAnswerUrl field!
    }
  ]
}
```

## Expected Behavior (CORRECT)

For ORAL_EXAM assessments, the API response **MUST** include the `audioAnswerUrl` field:

```json
{
  "attempt": {
    "id": "742873cb-31c9-4dbe-994e-df1be166b054",
    "assessmentId": "3dc18a47-0fdf-4122-9fae-56537e1c7f40",
    "status": "SUBMITTED",
    "submittedAt": "2025-11-14T16:26:30.689Z"
  },
  "assessment": {
    "id": "3dc18a47-0fdf-4122-9fae-56537e1c7f40",
    "title": "exame oral",
    "type": "ORAL_EXAM",
    "passingScore": 70
  },
  "answers": [
    {
      "id": "a8ea7288-bec3-4ac9-aae0-457194305a57",
      "questionId": "71d2edb3-f0c6-46be-b2a5-3102b3c7be00",
      "questionText": "pergunta da prova oral",
      "questionType": "ORAL",  // ✅ Correct question type
      "textAnswer": null,
      "audioAnswerUrl": "https://your-storage-url/path/to/student-audio.webm",  // ✅ REQUIRED for ORAL_EXAM
      "isCorrect": null,
      "status": "SUBMITTED",
      "submittedAt": "2025-11-13T22:41:06.228Z",
      "teacherComment": null
    }
  ]
}
```

## Required Changes

### 1. Add `audioAnswerUrl` field to response

The backend must include the `audioAnswerUrl` field in the answers array when:
- Assessment type is `ORAL_EXAM`
- The student has submitted an audio answer

### 2. Fix `questionType` field

For ORAL_EXAM questions, the `questionType` should be:
- `"ORAL"` (NOT `"OPEN"`)

### 3. Database Query Update

Ensure the query that fetches attempt results includes:
- The audio answer URL from storage (S3, Cloudflare R2, etc.)
- Correct question type mapping

### 4. Expected Data Flow

1. **Student submits ORAL_EXAM**:
   - Records audio using frontend AudioRecorder
   - Uploads audio to storage (e.g., Cloudflare R2)
   - Submits attempt with `audioAnswerUrl` in the answer

2. **Tutor reviews ORAL_EXAM**:
   - Fetches `/api/v1/attempts/{attemptId}/results`
   - **Backend MUST return `audioAnswerUrl`**
   - Frontend displays audio player for review
   - Tutor records audio feedback and submits

3. **Backend saves review**:
   - Stores tutor's audio feedback URL
   - Updates answer status to GRADED

## Frontend Dependencies

The frontend code in `TutorReviewPage.tsx` and `OralExamReviewForm.tsx` relies on the `audioAnswerUrl` field to:

1. Display the student's audio answer
2. Enable the audio review form
3. Allow tutors to record and submit audio feedback

**Without this field, tutors cannot review ORAL_EXAM attempts!**

## Testing

To verify the fix works:

1. Have a student submit an ORAL_EXAM with audio
2. Fetch `/api/v1/attempts/{attemptId}/results`
3. Verify response includes `audioAnswerUrl` in answers array
4. Verify `questionType` is `"ORAL"` not `"OPEN"`

## Implementation Priority

**HIGH PRIORITY** - Blocking feature for ORAL_EXAM reviews.

Without this fix, tutors cannot:
- Listen to student audio answers
- Provide audio feedback
- Complete the review process for ORAL_EXAM assessments

---

**Related Files:**
- Frontend: `src/components/TutorReviewPage.tsx` (lines 170-178, 200, 660-681, 755-795)
- Frontend: `src/components/OralExamReviewForm.tsx`
- Backend: Endpoint `/api/v1/attempts/{attemptId}/results`

**Issue Created:** 2025-11-14
**Reported By:** Frontend Development Team
