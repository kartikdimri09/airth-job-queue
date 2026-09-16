import { useEffect, useMemo, useState } from 'react';
import {
  createJob,
  deleteJob,
  getJobs,
  updateJobStatus,
} from './api';

const statuses = ['pending', 'running', 'completed', 'failed'];

const nextStatuses = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function loadJobs() {
    try {
      setLoading(true);
      setError('');
      const response = await getJobs();
      setJobs(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load jobs.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();

    if (!title.trim() || !type.trim()) {
      setError('Title and type are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await createJob({
        title: title.trim(),
        type: type.trim(),
      });
      setJobs((current) => [response.data, ...current]);
      setTitle('');
      setType('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create job.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setError('');
      const response = await updateJobStatus(id, status);
      setJobs((current) =>
        current.map((job) => (job.id === id ? response.data : job)),
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Status update failed. Refresh and try again.',
      );
      await loadJobs();
    }
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteJob(id);
      setJobs((current) => current.filter((job) => job.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete job.');
    }
  }

  const counts = useMemo(
    () =>
      statuses.reduce(
        (result, status) => ({
          ...result,
          [status]: jobs.filter((job) => job.status === status).length,
        }),
        {},
      ),
    [jobs],
  );

  const visibleJobs =
    filter === 'all' ? jobs : jobs.filter((job) => job.status === filter);

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div>
            <p className="eyebrow">Airth Interview Assignment</p>
            <h1>Mini Job Queue Dashboard</h1>
            <p className="muted">
              Manage jobs and move them through valid lifecycle states.
            </p>
          </div>
          <button className="secondary-button" onClick={loadJobs}>
            Refresh
          </button>
        </header>

        <section className="stats-grid">
          <StatCard label="Total" value={jobs.length} />
          {statuses.map((status) => (
            <StatCard key={status} label={status} value={counts[status]} />
          ))}
        </section>

        <section className="panel">
          <h2>Create a new job</h2>
          <form className="form" onSubmit={handleCreate}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Job title"
              maxLength={120}
            />
            <input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Job type, e.g. email"
              maxLength={60}
            />
            <button disabled={submitting}>
              {submitting ? 'Creating...' : 'Create job'}
            </button>
          </form>
        </section>

        {error && <div className="error">{error}</div>}

        <section className="toolbar">
          <h2>Jobs</h2>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="panel">Loading jobs...</div>
        ) : visibleJobs.length === 0 ? (
          <div className="panel empty">No jobs found.</div>
        ) : (
          <section className="jobs-list">
            {visibleJobs.map((job) => (
              <article className="job-card" key={job.id}>
                <div className="job-main">
                  <h3>{job.title}</h3>
                  <p className="muted">
                    {job.type} · {new Date(job.createdAt).toLocaleString()}
                  </p>
                  <span className={`status status-${job.status}`}>
                    {job.status}
                  </span>
                </div>

                <div className="job-actions">
                  {nextStatuses[job.status].map((status) => (
                    <button
                      className="secondary-button"
                      key={status}
                      onClick={() => handleStatusChange(job.id, status)}
                    >
                      Mark {status}
                    </button>
                  ))}
                  <button
                    className="danger-button"
                    onClick={() => handleDelete(job.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
