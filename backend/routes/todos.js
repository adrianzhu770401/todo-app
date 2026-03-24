const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// 所有 todo 路由都需要登录
router.use(auth);

// GET /api/todos - 获取当前用户所有 todos
router.get('/', (req, res) => {
  const { filter, priority } = req.query;
  let query = 'SELECT * FROM todos WHERE user_id = ?';
  const params = [req.user.userId];

  if (filter === 'active') {
    query += ' AND completed = 0';
  } else if (filter === 'completed') {
    query += ' AND completed = 1';
  }

  if (priority && ['low', 'normal', 'high'].includes(priority)) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY created_at DESC';

  const todos = db.prepare(query).all(...params);
  const stats = db.prepare(
    'SELECT COUNT(*) as total, SUM(completed) as completed FROM todos WHERE user_id = ?'
  ).get(req.user.userId);

  res.json({ todos, stats });
});

// POST /api/todos - 创建 todo
router.post('/', (req, res) => {
  const { title, description, priority } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: '标题不能为空' });
  }

  const result = db.prepare(
    'INSERT INTO todos (user_id, title, description, priority) VALUES (?, ?, ?, ?)'
  ).run(req.user.userId, title.trim(), description || '', priority || 'normal');

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ message: '创建成功', todo });
});

// PUT /api/todos/:id - 更新 todo
router.put('/:id', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (!todo) return res.status(404).json({ message: '任务不存在' });

  const { title, description, completed, priority } = req.body;
  db.prepare(
    `UPDATE todos SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      completed = COALESCE(?, completed),
      priority = COALESCE(?, priority),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?`
  ).run(
    title !== undefined ? title.trim() : null,
    description !== undefined ? description : null,
    completed !== undefined ? (completed ? 1 : 0) : null,
    priority !== undefined ? priority : null,
    req.params.id,
    req.user.userId
  );

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json({ message: '更新成功', todo: updated });
});

// DELETE /api/todos/:id - 删除 todo
router.delete('/:id', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (!todo) return res.status(404).json({ message: '任务不存在' });

  db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(req.params.id, req.user.userId);
  res.json({ message: '删除成功' });
});

// PATCH /api/todos/:id/toggle - 切换完成状态
router.patch('/:id/toggle', (req, res) => {
  const todo = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (!todo) return res.status(404).json({ message: '任务不存在' });

  db.prepare(
    'UPDATE todos SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).run(todo.completed ? 0 : 1, req.params.id, req.user.userId);

  const updated = db.prepare('SELECT * FROM todos WHERE id = ?').get(req.params.id);
  res.json({ message: '更新成功', todo: updated });
});

module.exports = router;
