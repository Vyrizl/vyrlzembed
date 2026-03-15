import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

interface FileRecord {
  id: string;
  original_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  embed_slug: string;
  created_at: string;
  view_count: number;
  embedUrl: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const router = useRouter();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  async function checkAuth() {
    const res = await fetch("/api/auth/check");
    const data = await res.json();
    if (!data.authenticated) router.replace("/");
  }

  async function loadFiles() {
    try {
      const res = await fetch("/api/files");
      if (res.status === 401) { router.replace("/"); return; }
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      notify("Failed to load files", "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuth().then(loadFiles);
  }, []);

  async function uploadFile(file: File) {
    if (file.size > 50 * 1024 * 1024) {
      notify("File too large (max 50MB)", "err");
      return;
    }
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 10, 85));
    }, 200);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(interval);
      setUploadProgress(100);

      if (!res.ok) {
        const err = await res.json();
        notify(err.error || "Upload failed", "err");
      } else {
        const data = await res.json();
        notify(`✓ Uploaded: ${data.originalName}`);
        await loadFiles();
      }
    } catch {
      clearInterval(interval);
      notify("Upload failed", "err");
    } finally {
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  async function copyLink(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteFile(id: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    setDeleting(id);
    const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      setFiles((f) => f.filter((x) => x.id !== id));
      notify("File deleted");
    } else {
      notify("Delete failed", "err");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/");
  }

  const typeIcon = (ft: string) =>
    ft === "image" ? "🖼" : ft === "video" ? "🎬" : "📄";

  return (
    <>
      <Head>
        <title>EmbedLink — Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #08080a; color: #e4e4f0; font-family: 'Inter', sans-serif; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }
        @keyframes barFill { from { width: 0; } to { width: var(--w); } }

        .header {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(12,12,16,0.95);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: 'Space Mono', monospace;
          font-size: 1rem;
          font-weight: 700;
          color: #e4e4f0;
        }
        .brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #5865f2, #7983f5);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        .logout-btn {
          padding: 0.45rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #71717a;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .logout-btn:hover { color: #e4e4f0; border-color: rgba(255,255,255,0.15); }

        .main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem;
        }

        .notification {
          position: fixed;
          top: 5rem;
          right: 1.5rem;
          z-index: 999;
          padding: 0.75rem 1.2rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-family: 'Space Mono', monospace;
          animation: slideIn 0.3s ease;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .notification.ok {
          background: rgba(34,197,94,0.15);
          border: 1px solid rgba(34,197,94,0.3);
          color: #86efac;
        }
        .notification.err {
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
        }

        .drop-zone {
          border: 2px dashed rgba(88,101,242,0.3);
          border-radius: 16px;
          padding: 3rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          background: rgba(88,101,242,0.03);
          margin-bottom: 2rem;
          position: relative;
        }
        .drop-zone:hover, .drop-zone.active {
          border-color: rgba(88,101,242,0.7);
          background: rgba(88,101,242,0.08);
        }
        .drop-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .drop-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.4rem; color: #a1a1aa; }
        .drop-sub { font-size: 0.8rem; color: #52525b; }
        .drop-link { color: #7983f5; cursor: pointer; text-decoration: underline; }

        .progress-bar-wrap {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255,255,255,0.05);
          border-radius: 0 0 14px 14px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #5865f2, #7983f5);
          transition: width 0.3s ease;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card {
          background: rgba(18,18,22,0.95);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1.2rem 1.5rem;
        }
        .stat-label { font-size: 0.7rem; color: #52525b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.4rem; }
        .stat-value { font-family: 'Space Mono', monospace; font-size: 1.5rem; font-weight: 700; color: #e4e4f0; }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #52525b;
          margin-bottom: 1rem;
          font-family: 'Space Mono', monospace;
        }

        .files-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .file-row {
          background: rgba(18,18,22,0.95);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          align-items: center;
          gap: 1rem;
          animation: fadeIn 0.3s ease;
          transition: border-color 0.2s;
        }
        .file-row:hover { border-color: rgba(255,255,255,0.1); }

        .file-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(88,101,242,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .file-info { overflow: hidden; }
        .file-name {
          font-weight: 500;
          color: #e4e4f0;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.2rem;
        }
        .file-meta { font-size: 0.72rem; color: #52525b; }
        .file-meta span { margin-right: 0.75rem; }
        .badge {
          display: inline-block;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.65rem;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .badge-image { background: rgba(34,197,94,0.1); color: #86efac; }
        .badge-video { background: rgba(239,68,68,0.1); color: #fca5a5; }
        .badge-other { background: rgba(148,163,184,0.1); color: #94a3b8; }

        .file-url {
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          color: #7983f5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }

        .actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .btn-copy {
          padding: 0.45rem 1rem;
          background: rgba(88,101,242,0.15);
          border: 1px solid rgba(88,101,242,0.3);
          border-radius: 8px;
          color: #7983f5;
          font-family: 'Space Mono', monospace;
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-copy:hover { background: rgba(88,101,242,0.25); }
        .btn-copy.copied { color: #86efac; border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.1); }
        .btn-delete {
          padding: 0.45rem 0.6rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px;
          color: #52525b;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
        }
        .btn-delete:hover { color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.08); }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #3f3f46;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .empty-title { font-size: 1rem; margin-bottom: 0.4rem; color: #52525b; }

        .spinner-sm {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr 1fr; }
          .file-row { grid-template-columns: auto 1fr; }
          .file-url, .actions { grid-column: 2; }
          .file-url { max-width: 100%; }
        }
      `}</style>

      <div className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">🔗</div>
            EmbedLink
          </div>
          <button className="logout-btn" onClick={logout}>LOGOUT</button>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      <main className="main">
        {/* Upload Drop Zone */}
        <div
          className={`drop-zone ${dragActive ? "active" : ""}`}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileInput}
            accept="image/*,video/*,application/pdf,text/*,application/zip"
          />
          {uploading ? (
            <>
              <div className="drop-icon">⏳</div>
              <div className="drop-title">Uploading... {uploadProgress}%</div>
              <div className="drop-sub">Please wait</div>
            </>
          ) : (
            <>
              <div className="drop-icon">{dragActive ? "📂" : "☁️"}</div>
              <div className="drop-title">
                {dragActive ? "Drop to upload" : "Drag & drop a file"}
              </div>
              <div className="drop-sub">
                or <span className="drop-link">click to browse</span> · Max 50MB · Images, Videos, PDFs, ZIPs
              </div>
            </>
          )}
          {uploading && (
            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>

        {/* Stats */}
        {!loading && files.length > 0 && (
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Files</div>
              <div className="stat-value">{files.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Size</div>
              <div className="stat-value">{formatBytes(files.reduce((s, f) => s + f.file_size, 0))}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Views</div>
              <div className="stat-value">{files.reduce((s, f) => s + f.view_count, 0)}</div>
            </div>
          </div>
        )}

        {/* File List */}
        <div className="section-title">Your Files</div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#52525b" }}>
            <div className="spinner-sm" style={{ width: 24, height: 24, borderWidth: 3 }} />
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No files yet</div>
            <div>Upload your first file above to get an embed link</div>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <div key={file.id} className="file-row">
                <div className="file-icon">{typeIcon(file.file_type)}</div>
                <div className="file-info">
                  <div className="file-name">{file.original_name}</div>
                  <div className="file-meta">
                    <span>{formatBytes(file.file_size)}</span>
                    <span>{timeAgo(file.created_at)}</span>
                    <span>👁 {file.view_count}</span>
                    <span className={`badge badge-${file.file_type}`}>
                      {file.file_type}
                    </span>
                  </div>
                </div>
                <div className="file-url">{file.embedUrl}</div>
                <div className="actions">
                  <button
                    className={`btn-copy ${copied === file.id ? "copied" : ""}`}
                    onClick={() => copyLink(file.embedUrl, file.id)}
                  >
                    {copied === file.id ? "✓ COPIED" : "COPY LINK"}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deleteFile(file.id)}
                    disabled={deleting === file.id}
                    title="Delete"
                  >
                    {deleting === file.id ? <span className="spinner-sm" /> : "🗑"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
