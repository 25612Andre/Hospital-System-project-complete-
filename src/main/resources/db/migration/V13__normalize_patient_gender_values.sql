-- Normalize legacy gender values (e.g. "M"/"F") to canonical values used by the UI ("MALE"/"FEMALE").

UPDATE patients
SET gender = 'MALE'
WHERE gender IS NOT NULL
  AND lower(trim(gender)) IN ('m', 'male');

UPDATE patients
SET gender = 'FEMALE'
WHERE gender IS NOT NULL
  AND lower(trim(gender)) IN ('f', 'female');

UPDATE patients
SET gender = 'OTHER'
WHERE gender IS NOT NULL
  AND lower(trim(gender)) IN ('o', 'other');

