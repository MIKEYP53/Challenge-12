// Import and Setup
const express = require('express');
const inquirer = require('inquirer');
const { Pool } = require('pg');
const Table = require('cli-table3')

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to Database
const pool = new Pool({
    user: 'postgres',
    password: 'mikepass',
    host: 'localhost',
    database: 'tracker_db',
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to the tracker_db database.');
    release();
});

// Command Menu
async function showMenu() {
    const { choice } = await inquirer.prompt({
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
            'View all departments',
            'View all roles',
            'View all employees',
            'Add a department',
            'Add a role',
            'Add an employee',
            'Update an employee role',
            'Exit',
        ],
    });
    await handleChoice(choice);
}

// Handle user choice
async function handleChoice(choice) {
    switch (choice) {
        case 'View all departments':
            await viewAllDepartments();
            break;
        case 'View all roles':
            await viewAllRoles();
            break;
        case 'View all employees':
            await viewAllEmployees();
            break;
        case 'Add a department':
            await addDepartment();
            break;
        case 'Add a role':
            await addRole();
            break;
        case 'Add an employee':
            await addEmployee();
            break;
        case 'Update an employee role':
            await updateEmployeeRole();
            break;
        case 'Exit':
            console.log('Goodbye!');
            process.exit(0);
            break;
        default:
            console.log('Invalid choice.');
    }
    await showMenu();
}

async function viewAllDepartments() {
    const { rows } = await pool.query('SELECT * FROM department');

    const table = new Table({
        head: ['ID', 'Department'],
        colWidths: [5, 18], // Adjust column widths as needed
    });

    rows.forEach((row) => {
        table.push([row.id, row.department_name]);
    });

    console.log(table.toString());
}

async function viewAllRoles() {
    const query = `
    SELECT
        roles.id,
        roles.role_title,
        roles.salary,
        department.department_name AS department_name
    FROM
        roles
    JOIN
        department ON roles.department_id = department.id;
    `;
    const { rows } = await pool.query(query);
    const table = new Table({
        head: ['ID', 'Role Title', 'Salary', 'Department'],
        colWidths: [5, 20, 10, 18], // Adjust column widths as needed
    });

    rows.forEach((row) => {
        table.push([row.id, row.role_title, row.salary, row.department_name]);
    });

    console.log(table.toString());
}

async function viewAllEmployees() {
    const query = `
        SELECT e.id, e.first_name, e.last_name, roles.role_title, 
               COALESCE(m.first_name || ' ' || m.last_name, 'No Manager') AS manager_name
        FROM employee e
        JOIN roles ON e.role_id = roles.id
        LEFT JOIN employee m ON e.manager_id = m.id;
    `;
    const { rows } = await pool.query(query);
    const table = new Table({
        head: ['ID', 'First', 'Last', 'Occupation', 'Manager'],
        colWidths: [5, 12, 12, 20, 18], // Adjust column widths as needed
    });

    rows.forEach((row) => {
        table.push([row.id, row.first_name, row.last_name, row.role_title, row.manager_name]);
    });

    console.log(table.toString());
}

async function addDepartment() {
    const { departmentName } = await inquirer.prompt({
        type: 'input',
        name: 'departmentName',
        message: 'Enter the new department name:',
    });
    await pool.query('INSERT INTO department (department_name) VALUES ($1)', [departmentName]);
    console.log(`Added department: ${departmentName}`);
}

async function addRole() {
  try {
    const { roleTitle, salary, departmentId } = await inquirer.prompt([
      { type: 'input', name: 'roleTitle', message: 'Enter the role title:' },
      { type: 'input', name: 'salary', message: 'Enter the salary:' },
      { type: 'input', name: 'departmentId', message: 'Enter the department ID:' },
    ]);
    await pool.query(
      'INSERT INTO roles (role_title, salary, department_id) VALUES ($1, $2, $3)', // Corrected table name to 'roles'
      [roleTitle, salary, departmentId]
    );
    console.log(`Added role: ${roleTitle}`);
  } catch (error) {
    console.error('Error adding role:', error);
  }
}

async function addEmployee() {
    const { firstName, lastName, roleId, managerId } = await inquirer.prompt([
        { type: 'input', name: 'firstName', message: 'Enter the employee\'s first name:' },
        { type: 'input', name: 'lastName', message: 'Enter the employee\'s last name:' },
        { type: 'input', name: 'roleId', message: 'Enter the role ID:' },
        { type: 'input', name: 'managerId', message: 'Enter the manager ID (or leave blank):' },
    ]);
    await pool.query(
        'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
        [firstName, lastName, roleId, managerId || null]
    );
    console.log(`Added employee: ${firstName} ${lastName}`);
}

async function updateEmployeeRole() {
  try {
    // Get the list of employees
    const employeesResult = await pool.query('SELECT id, first_name, last_name FROM employee');
    const employees = employeesResult.rows.map(employee => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    }));

    // Get the list of roles
    const rolesResult = await pool.query('SELECT id, role_title FROM roles');
    const roles = rolesResult.rows.map(role => ({
      name: role.role_title,
      value: role.id,
    }));

    // Prompt the user to select an employee and a role
    const { employeeId, roleId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'employeeId',
        message: 'Select the employee to update:',
        choices: employees,
      },
      {
        type: 'list',
        name: 'roleId',
        message: 'Select the new role for the employee:',
        choices: roles,
      },
    ]);

    // Update the employee's role in the database
    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [roleId, employeeId]);
    console.log('Employee role updated successfully!');
  } catch (error) {
    console.error('Error updating employee role:', error);
  }
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

showMenu();
