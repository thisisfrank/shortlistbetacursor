-- Rename column sourcer_name to sourcer_id and change its type to uuid
ALTER TABLE jobs RENAME COLUMN sourcer_name TO sourcer_id;
ALTER TABLE jobs ALTER COLUMN sourcer_id TYPE uuid USING sourcer_id::uuid;
-- Optionally, you can add a foreign key constraint if you want strict referential integrity:
-- ALTER TABLE jobs ADD CONSTRAINT fk_sourcer_id FOREIGN KEY (sourcer_id) REFERENCES user_profiles(id) ON DELETE SET NULL; 
-- NOTE: If you have existing data, you may need to backfill or clean up sourcer_name values before running this migration, as text values cannot be cast to uuid unless they are valid UUIDs. 