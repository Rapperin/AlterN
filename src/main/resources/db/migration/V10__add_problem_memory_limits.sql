ALTER TABLE problems
ADD COLUMN memory_limit_mb INTEGER;

UPDATE problems
SET memory_limit_mb = 256
WHERE memory_limit_mb IS NULL;

ALTER TABLE problems
ALTER COLUMN memory_limit_mb SET DEFAULT 256;

ALTER TABLE problems
ALTER COLUMN memory_limit_mb SET NOT NULL;
