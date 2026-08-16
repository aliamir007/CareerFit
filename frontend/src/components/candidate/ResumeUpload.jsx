import { useRef, useState } from "react";
import Button from "../common/Button";
import { InlineError } from "../common/States";
import api, { LONG_RUNNING_TIMEOUT, getErrorMessage } from "../../api/axiosInstance";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB, mirroring the server-side multer cap

// The backend parses the PDF and then calls Gemini to categorise skills. That is
// not instant, so we narrate the stages rather than showing a bare spinner.
const STAGES = ["Reading your resume", "Extracting skills"];

const validate = (file) => {
  if (!file) return "Choose a PDF to upload.";
  // Checked before the request is made, so a wrong file never costs a round trip.
  if (file.type !== "application/pdf") {
    return "That file is not a PDF. Export your resume as a PDF and try again.";
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That file is ${mb}MB. The limit is 5MB — try compressing it.`;
  }
  if (file.size === 0) {
    return "That file is empty. Choose a different PDF.";
  }
  return null;
};

export default function ResumeUpload({ onUploaded }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState(-1);

  const uploading = stage >= 0;

  const pick = (candidate) => {
    const problem = validate(candidate);
    if (problem) {
      setError(problem);
      setFile(null);
      return;
    }
    setError("");
    setFile(candidate);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    pick(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    const problem = validate(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setStage(0);

    // The stage label advances on a timer because the backend does not stream
    // progress. It is an honest approximation of the two phases, not a fake bar.
    const advance = setTimeout(() => setStage(1), 2500);

    const body = new FormData();
    body.append("resume", file); // field name must be "resume"

    try {
      const res = await api.post("/findJob/upload", body, {
        timeout: LONG_RUNNING_TIMEOUT,
      });
      onUploaded?.(res.data?.data);
    } catch (err) {
      setError(getErrorMessage(err, "We could not process that resume."));
    } finally {
      clearTimeout(advance);
      setStage(-1);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`card flex flex-col items-center px-8 py-12 text-center transition-colors ${
          dragging ? "border-teal bg-teal/5" : ""
        } ${uploading ? "opacity-60" : ""}`}
      >
        <div aria-hidden="true" className="mb-5 h-px w-10 bg-gold" />

        {uploading ? (
          <>
            <p className="display text-lg">{STAGES[stage]}…</p>
            <p className="mt-2 text-sm text-muted">
              This usually takes a few seconds. Keep this tab open.
            </p>
            <div
              className="mt-6 h-1 w-56 overflow-hidden bg-hairline"
              role="progressbar"
              aria-valuetext={STAGES[stage]}
            >
              <div
                className="h-full bg-gold transition-[width] duration-700"
                style={{ width: stage === 0 ? "45%" : "85%" }}
              />
            </div>
          </>
        ) : (
          <>
            <p className="display text-lg">Upload your resume</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Drag a PDF here, or choose a file. We read it, pull out your
              skills, and use them to find who is hiring.
            </p>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(e) => pick(e.target.files?.[0])}
            />

            <div className="mt-6 flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
              >
                Choose PDF
              </Button>
              <Button onClick={handleUpload} disabled={!file}>
                extract skills
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted">
              {file ? (
                <span className="text-ink">
                  {file.name}{" "}
                  <span className="numeric">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </span>
              ) : (
                "PDF only, up to 5MB."
              )}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4">
          <InlineError message={error} />
        </div>
      )}
    </div>
  );
}
