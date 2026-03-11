ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_test_index INTEGER;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_visible_case BOOLEAN;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_input_preview VARCHAR(2000);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_expected_output_preview VARCHAR(2000);
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS failed_actual_output_preview VARCHAR(2000);
