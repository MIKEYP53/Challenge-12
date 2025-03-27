DELETE FROM employee;
DELETE FROM roles;
DELETE FROM department;


-- Insert into departments
INSERT INTO department (department_name)
VALUES 
  ('Engineering'),
  ('Finance'),
  ('Legal'),
  ('Sales');

-- Insert into roles (note we are using the department_id now)
INSERT INTO roles (role_title, salary, department_id)
VALUES 
  ('Sales Lead', 100000, (SELECT id FROM department WHERE department_name = 'Sales')),
  ('Salesperson', 80000, (SELECT id FROM department WHERE department_name = 'Sales')),
  ('Lead Engineer', 150000, (SELECT id FROM department WHERE department_name = 'Engineering')),
  ('Software Engineer', 120000, (SELECT id FROM department WHERE department_name = 'Engineering')),
  ('Account Manager', 160000, (SELECT id FROM department WHERE department_name = 'Finance')),
  ('Accountant', 125000, (SELECT id FROM department WHERE department_name = 'Finance')),
  ('Legal Team Lead', 250000, (SELECT id FROM department WHERE department_name = 'Legal')),
  ('Lawyer', 190000, (SELECT id FROM department WHERE department_name = 'Legal'));

-- Insert into employees (you can add manager relationships here)
-- For the manager_id, you could manually set it once the employees are inserted
INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
  ('John', 'Doe', (SELECT id FROM roles WHERE role_title = 'Sales Lead'), NULL),  -- No manager for top-level employee
  ('Jane', 'Smith', (SELECT id FROM roles WHERE role_title = 'Salesperson'), 1),  -- John Doe is Jane's manager
  ('Alice', 'Johnson', (SELECT id FROM roles WHERE role_title = 'Lead Engineer'), NULL),
  ('Bob', 'Williams', (SELECT id FROM roles WHERE role_title = 'Software Engineer'), 3);  -- Alice is Bob's manager
