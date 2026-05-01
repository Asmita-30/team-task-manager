const db = require('../config/db');

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate } = req.body;

    // Check if user is admin of project
    const [project] = await db.query(
      'SELECT * FROM projects WHERE id = ? AND created_by = ?',
      [projectId, req.userId]
    );

    if (project.length === 0) {
      return res.status(403).json({ message: 'Only project admin can create tasks' });
    }

    // Create task
    const [result] = await db.query(
      `INSERT INTO tasks (title, description, project_id, assigned_to, due_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, projectId, assignedTo, dueDate]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: { id: result.insertId, title, description, projectId, assignedTo, dueDate }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.query;

    let query = `
      SELECT t.*, 
             p.name as project_name,
             assigned.name as assigned_to_name,
             creator.name as created_by_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN users assigned ON t.assigned_to = assigned.id
      LEFT JOIN users creator ON p.created_by = creator.id
      WHERE pm.user_id = ?
    `;
    
    const params = [req.userId];

    if (projectId) {
      query += ' AND t.project_id = ?';
      params.push(projectId);
    }

    query += ' ORDER BY t.due_date ASC, t.created_at DESC';

    const [tasks] = await db.query(query, params);
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if user has access to this task
    const [task] = await db.query(`
      SELECT t.* FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE t.id = ? AND pm.user_id = ?
    `, [id, req.userId]);

    if (task.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update status
    await db.query(
      'UPDATE tasks SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Task status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    // Get all tasks for user
    const [tasks] = await db.query(`
      SELECT t.* FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id
      WHERE pm.user_id = ?
    `, [req.userId]);

    const now = new Date();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
    ).length;

    // Recent tasks
    const recentTasks = tasks.slice(0, 5);

    res.json({
      stats: { total, completed, pending, inProgress, overdue },
      recentTasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};