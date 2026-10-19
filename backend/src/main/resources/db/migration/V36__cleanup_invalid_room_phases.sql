-- Clean up invalid room_phases that were erroneously created from non-phase headings (e.g. Risk windows)
DELETE FROM room_phase_docs
WHERE phase_key !~ '^P[0-9]+$';

DELETE FROM plan_phases p
WHERE p.plan_key !~ '^P[0-9]+$'
  AND NOT EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.phase_id = p.id
         OR t.phase_key = p.plan_key
  );
