
import { useRef, useState } from "react";
import {
  Upload,
  FolderOpen,
  Search,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  File,
  Download,
  Trash2,
  X,
  CheckCircle2,
  Folder,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import JSZip from "jszip";
import "./App.css";

const categories = [
  { name: "All Files", icon: FolderOpen },
  { name: "Images", icon: Image },
  { name: "Documents", icon: FileText },
  { name: "Videos", icon: Film },
  { name: "Audio", icon: Music },
  { name: "Archives", icon: Archive },
  { name: "Others", icon: File },
];

function getCategory(file) {
  const name = file.name.toLowerCase();
  const ext = name.includes(".") ? name.split(".").pop() : "";

  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "avif"].includes(ext) ||
    file.type.startsWith("image/")
  ) return "Images";

  if (
    ["pdf", "doc", "docx", "txt", "rtf", "odt", "xls", "xlsx", "csv", "ppt", "pptx"].includes(ext)
  ) return "Documents";

  if (
    ["mp4", "mov", "avi", "mkv", "webm", "wmv", "m4v"].includes(ext) ||
    file.type.startsWith("video/")
  ) return "Videos";

  if (
    ["mp3", "wav", "aac", "ogg", "flac", "m4a", "wma"].includes(ext) ||
    file.type.startsWith("audio/")
  ) return "Audio";

  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "Archives";

  return "Others";
}

function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function App() {
  const [files, setFiles] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Files");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState([]);
  const [notice, setNotice] = useState("");
  const [zipping, setZipping] = useState(false);
  const inputRef = useRef(null);

  const visibleFiles = files.filter((file) => {
    const matchesCategory =
      activeCategory === "All Files" || file.category === activeCategory;
    const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  function addFiles(fileList) {
    const incoming = Array.from(fileList);
    if (!incoming.length) return;

    setFiles((previous) => {
      const existingKeys = new Set(
        previous.map((f) => `${f.name}-${f.size}-${f.lastModified}`)
      );
      const additions = incoming
        .filter((f) => !existingKeys.has(`${f.name}-${f.size}-${f.lastModified}`))
        .map((file) => ({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
          category: getCategory(file),
        }));

      if (!additions.length) {
        setNotice("Those files are already in your list.");
        return previous;
      }

      setNotice(`${additions.length} file(s) added successfully.`);
      return [...additions, ...previous];
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(id) {
    setFiles((previous) => previous.filter((file) => file.id !== id));
    setSelected((previous) => previous.filter((selectedId) => selectedId !== id));
    setNotice("File removed from the list.");
  }

  function toggleSelected(id) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function toggleSelectVisible() {
    const visibleIds = visibleFiles.map((file) => file.id);
    const allSelected = visibleIds.length > 0 &&
      visibleIds.every((id) => selected.includes(id));

    setSelected((previous) =>
      allSelected
        ? previous.filter((id) => !visibleIds.includes(id))
        : [...new Set([...previous, ...visibleIds])]
    );
  }

  function downloadFile(item) {
    const url = URL.createObjectURL(item.file);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadZip() {
    const chosen = files.filter((file) => selected.includes(file.id));
    if (!chosen.length) {
      setNotice("Select at least one file to download as ZIP.");
      return;
    }

    try {
      setZipping(true);
      const zip = new JSZip();

      chosen.forEach((item) => {
        zip.file(`${item.category}/${item.name}`, item.file);
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "organized-files.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Your ZIP file is ready.");
    } catch {
      setNotice("Could not create the ZIP file. Please try again.");
    } finally {
      setZipping(false);
    }
  }

  function categoryIcon(category) {
    const icons = {
      Images: Image,
      Documents: FileText,
      Videos: Film,
      Audio: Music,
      Archives: Archive,
      Others: File,
    };
    return icons[category] || File;
  }

  function iconColor(category) {
    const colors = {
      Images: "purple",
      Documents: "blue",
      Videos: "pink",
      Audio: "orange",
      Archives: "green",
      Others: "gray",
    };
    return colors[category] || "gray";
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-mark"><FolderOpen size={24} /></span>
          <span>File<span className="brand-light">Nest</span></span>
        </a>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          {categories.map(({ name, icon: Icon }) => {
            const count = name === "All Files"
              ? files.length
              : files.filter((file) => file.category === name).length;

            return (
              <button
                key={name}
                className={`nav-item ${activeCategory === name ? "active" : ""}`}
                onClick={() => setActiveCategory(name)}
              >
                <Icon size={18} />
                <span>{name}</span>
                <span className="nav-count">{count}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={22} />
            <strong>Your files stay yours</strong>
            <p>Files are processed in your browser and are not uploaded to our server.</p>
          </div>
          <div className="sidebar-foot">FileNest · Your space, organized.</div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {activeCategory}</div>
          <div className="topbar-right">
            <span className="local-badge"><span /> Local processing</span>
            <div className="avatar">FN</div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><Sparkles size={14} /> YOUR DIGITAL WORKSPACE</div>
              <h1>File Organizer</h1>
              <p className="subtitle">A little order goes a long way. Organize your digital world.</p>
            </div>
            <button className="primary-button" onClick={() => inputRef.current?.click()}>
              <Upload size={17} /> Upload files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden-input"
              onChange={(event) => addFiles(event.target.files)}
            />
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top"><span>Total files</span><FolderOpen size={18} /></div>
              <div className="stat-number">{files.length}</div>
              <div className="stat-note">Files in this session</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>Total size</span><Archive size={18} /></div>
              <div className="stat-number">{formatSize(totalSize)}</div>
              <div className="stat-note">Combined file size</div>
            </div>
            <div className="stat-card">
              <div className="stat-top"><span>Categories</span><Folder size={18} /></div>
              <div className="stat-number">
                {new Set(files.map((file) => file.category)).size}
              </div>
              <div className="stat-note">Categories in use</div>
            </div>
          </div>

          <div
            className={`dropzone ${dragging ? "dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <div className="upload-illustration"><Upload size={24} /></div>
            <div className="drop-title">{dragging ? "Drop your files here" : "Drop files here to get organized"}</div>
            <div className="drop-description">
              Drag and drop your files, or{" "}
              <button className="text-button" onClick={() => inputRef.current?.click()}>
                browse files
              </button>
            </div>
            <div className="file-hint">Multiple files supported · Files stay on your device</div>
          </div>

          {notice && (
            <div className="notice" role="status">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
              <button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={16} /></button>
            </div>
          )}

          <section className="files-section">
            <div className="section-heading">
              <div>
                <h2>{activeCategory}</h2>
                <p>{visibleFiles.length} {visibleFiles.length === 1 ? "file" : "files"} shown</p>
              </div>
              <div className="file-actions">
                {selected.length > 0 && (
                  <button className="secondary-button" onClick={downloadZip} disabled={zipping}>
                    <Download size={16} /> {zipping ? "Creating ZIP..." : `Download ZIP (${selected.length})`}
                  </button>
                )}
                <div className="search-box">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search files..."
                    aria-label="Search files"
                  />
                  {search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={15} /></button>}
                </div>
              </div>
            </div>

            {visibleFiles.length > 0 ? (
              <div className="table-wrap">
                <table className="files-table">
                  <thead>
                    <tr>
                      <th className="check-column">
                        <input
                          type="checkbox"
                          aria-label="Select visible files"
                          checked={visibleFiles.length > 0 && visibleFiles.every((file) => selected.includes(file.id))}
                          onChange={toggleSelectVisible}
                        />
                      </th>
                      <th>FILE NAME</th>
                      <th>CATEGORY</th>
                      <th>SIZE</th>
                      <th className="action-column">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFiles.map((item) => {
                      const Icon = categoryIcon(item.category);
                      return (
                        <tr key={item.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.includes(item.id)}
                              onChange={() => toggleSelected(item.id)}
                              aria-label={`Select ${item.name}`}
                            />
                          </td>
                          <td>
                            <div className="file-name-cell">
                              <span className={`file-icon ${iconColor(item.category)}`}><Icon size={19} /></span>
                              <span className="file-name-text" title={item.name}>{item.name}</span>
                            </div>
                          </td>
                          <td><span className={`category-pill ${iconColor(item.category)}`}>{item.category}</span></td>
                          <td className="size-cell">{formatSize(item.size)}</td>
                          <td>
                            <div className="row-actions">
                              <button title="Download file" aria-label={`Download ${item.name}`} onClick={() => downloadFile(item)}><Download size={16} /></button>
                              <button title="Remove file" aria-label={`Remove ${item.name}`} onClick={() => removeFile(item.id)}><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon"><FolderOpen size={30} /></div>
                <h3>{search ? "No matching files" : files.length ? "No files in this category" : "Your workspace is ready"}</h3>
                <p>
                  {search
                    ? "Try another search term."
                    : files.length
                      ? "Choose another category to see your files."
                      : "Upload files to see them automatically sorted into categories."}
                </p>
                {!files.length && (
                  <button className="primary-button" onClick={() => inputRef.current?.click()}>
                    <Upload size={17} /> Choose files
                  </button>
                )}
              </div>
            )}
          </section>

          <footer className="page-footer">
            <span>Made for a more organized digital life.</span>
            <span><ShieldCheck size={15} /> Private by design</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
