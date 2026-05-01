const db = require('../config/db');

exports.createProject = async (req, res) => {
  try {
    const { name, memberIds = [] } = req.body;
    const createdBy = req.userId;

    // Create project
    const [result] = await db.query(
      'INSERT INTO projects (name, created_by) VALUES (?, ?)',
      [name, createdBy]
    );

    const projectId = result.insertId;

    // Add creator as member
    await db.query(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, createdBy]
    );

    // Add other members
    for (const memberId of memberIds) {
      await db.query(
        'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
        [projectId, memberId]
      );
    }

    res.status(201).json({
      message: 'Project created successfully',
      project: { id: projectId, name, created_by: createdBy }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    // Get projects where user is member
    const [projects] = await db.query(`
      SELECT p.*, u.name as created_by_name 
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      JOIN users u ON p.created_by = u.id
      WHERE pm.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.userId]);

    // Get members for each project
    for (let project of projects) {
      const [members] = await db.query(`
        SELECT u.id, u.name, u.email, u.role
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
      `, [project.id]);
      project.members = members;
    }

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { projectId, userId } = req.body;

    // Check if user is admin of project
    const [project] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND created_by = ?',
      [projectId, req.userId]
    );

    if (project.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add member
    await db.query(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAvailableUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role FROM users WHERE role = "member"'
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};