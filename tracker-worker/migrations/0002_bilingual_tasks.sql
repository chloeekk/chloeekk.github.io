ALTER TABLE time_entries ADD COLUMN task_zh TEXT;
ALTER TABLE time_entries ADD COLUMN task_en TEXT;

UPDATE time_entries
SET task_zh = task
WHERE task IS NOT NULL AND task_zh IS NULL;
