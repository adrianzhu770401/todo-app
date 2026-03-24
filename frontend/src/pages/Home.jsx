import { useState, useEffect } from 'react';
import { todoApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

const PRIORITY_LABELS = { low: '低', normal: '普通', high: '高' };
const PRIORITY_COLORS = { low: '#6ee7b7', normal: '#93c5fd', high: '#fca5a5' };

export default function Home() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTodos = async () => {
    try {
      const res = await todoApi.getAll({ filter: filter === 'all' ? undefined : filter });
      setTodos(res.data.todos);
      setStats(res.data.stats || { total: 0, completed: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTodos(); }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      if (editTodo) {
        await todoApi.update(editTodo.id, form);
      } else {
        await todoApi.create(form);
      }
      setForm({ title: '', description: '', priority: 'normal' });
      setShowForm(false);
      setEditTodo(null);
      fetchTodos();
    } catch (err) {
      alert(err.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    await todoApi.toggle(id);
    fetchTodos();
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条任务吗？')) return;
    await todoApi.remove(id);
    fetchTodos();
  };

  const handleEdit = (todo) => {
    setEditTodo(todo);
    setForm({ title: todo.title, description: todo.description, priority: todo.priority });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditTodo(null);
    setForm({ title: '', description: '', priority: 'normal' });
  };

  const completedCount = stats.completed || 0;
  const totalCount = stats.total || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="app">
      {/* 顶部导航 */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <span className="logo">✓ TodoApp</span>
          </div>
          <div className="header-right">
            <span className="username">👤 {user?.username}</span>
            <button onClick={logout} className="btn-logout">退出</button>
          </div>
        </div>
      </header>

      <main className="main">
        {/* 统计卡片 */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-num">{totalCount}</span>
            <span className="stat-label">全部任务</span>
          </div>
          <div className="stat-item">
            <span className="stat-num" style={{ color: '#6ee7b7' }}>{completedCount}</span>
            <span className="stat-label">已完成</span>
          </div>
          <div className="stat-item">
            <span className="stat-num" style={{ color: '#fca5a5' }}>{totalCount - completedCount}</span>
            <span className="stat-label">进行中</span>
          </div>
          <div className="stat-progress">
            <div className="progress-label">完成率 {progress}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="toolbar">
          <div className="filter-tabs">
            {[['all', '全部'], ['active', '进行中'], ['completed', '已完成']].map(([val, label]) => (
              <button
                key={val}
                className={`filter-tab ${filter === val ? 'active' : ''}`}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="btn-add" onClick={() => { setShowForm(true); setEditTodo(null); }}>
            + 新建任务
          </button>
        </div>

        {/* 新建/编辑表单 */}
        {showForm && (
          <div className="form-card">
            <h3>{editTodo ? '编辑任务' : '新建任务'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="任务标题 *"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="描述（可选）"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>优先级</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">低</option>
                    <option value="normal">普通</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={cancelForm}>取消</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '保存中...' : (editTodo ? '保存' : '创建')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Todo 列表 */}
        <div className="todo-list">
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>{filter === 'completed' ? '还没有完成的任务' : filter === 'active' ? '太棒了，没有待办任务！' : '还没有任务，点击「新建任务」开始吧'}</p>
            </div>
          ) : (
            todos.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <button className="check-btn" onClick={() => handleToggle(todo.id)}>
                  {todo.completed ? '✓' : '○'}
                </button>
                <div className="todo-content">
                  <div className="todo-title">{todo.title}</div>
                  {todo.description && <div className="todo-desc">{todo.description}</div>}
                  <div className="todo-meta">
                    <span className="priority-badge" style={{ background: PRIORITY_COLORS[todo.priority] }}>
                      {PRIORITY_LABELS[todo.priority]}
                    </span>
                    <span className="todo-date">
                      {new Date(todo.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="todo-actions">
                  <button onClick={() => handleEdit(todo)} className="btn-icon" title="编辑">✏️</button>
                  <button onClick={() => handleDelete(todo.id)} className="btn-icon" title="删除">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
