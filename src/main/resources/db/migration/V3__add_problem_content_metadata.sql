ALTER TABLE problems ADD COLUMN IF NOT EXISTS constraints_text VARCHAR(3000);

CREATE TABLE IF NOT EXISTS problem_tags (
    problem_id BIGINT NOT NULL,
    tag_order INTEGER NOT NULL,
    tag VARCHAR(50) NOT NULL,
    CONSTRAINT pk_problem_tags PRIMARY KEY (problem_id, tag_order),
    CONSTRAINT fk_problem_tags_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS problem_examples (
    problem_id BIGINT NOT NULL,
    example_order INTEGER NOT NULL,
    example_input VARCHAR(2000) NOT NULL,
    example_output VARCHAR(2000) NOT NULL,
    example_explanation VARCHAR(2000),
    CONSTRAINT pk_problem_examples PRIMARY KEY (problem_id, example_order),
    CONSTRAINT fk_problem_examples_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

UPDATE problems
SET constraints_text = '1 <= n <= 1000000'
WHERE title = 'Multiples of 3 or 5'
  AND (constraints_text IS NULL OR constraints_text = '');

INSERT INTO problem_tags (problem_id, tag_order, tag)
SELECT p.id, 0, 'math'
FROM problems p
WHERE p.title = 'Multiples of 3 or 5'
  AND NOT EXISTS (
      SELECT 1
      FROM problem_tags pt
      WHERE pt.problem_id = p.id
        AND pt.tag = 'math'
  );

INSERT INTO problem_tags (problem_id, tag_order, tag)
SELECT p.id, 1, 'project-euler'
FROM problems p
WHERE p.title = 'Multiples of 3 or 5'
  AND NOT EXISTS (
      SELECT 1
      FROM problem_tags pt
      WHERE pt.problem_id = p.id
        AND pt.tag = 'project-euler'
  );

INSERT INTO problem_examples (problem_id, example_order, example_input, example_output, example_explanation)
SELECT p.id, 0, '10', '23', '3, 5, 6 and 9 are below 10.'
FROM problems p
WHERE p.title = 'Multiples of 3 or 5'
  AND NOT EXISTS (
      SELECT 1
      FROM problem_examples pe
      WHERE pe.problem_id = p.id
        AND pe.example_order = 0
  );

INSERT INTO problem_examples (problem_id, example_order, example_input, example_output, example_explanation)
SELECT p.id, 1, '1000', '233168', 'Classic Project Euler sample.'
FROM problems p
WHERE p.title = 'Multiples of 3 or 5'
  AND NOT EXISTS (
      SELECT 1
      FROM problem_examples pe
      WHERE pe.problem_id = p.id
        AND pe.example_order = 1
  );
