import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResumeUpload from "../components/candidate/ResumeUpload";
import SkillsList from "../components/candidate/SkillsList";
import Button from "../components/common/Button";
import { useToast } from "../components/common/Toast";
import { useAuth } from "../contexts/AuthContext";

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  // Held in page state: the API has no "get my profile" endpoint, so the upload
  // response is the only source for this. Re-uploading replaces it.
  const [profile, setProfile] = useState(null);

  const handleUploaded = async (data) => {
    setProfile(data);
    try {
      await refreshUser();
    } catch {
      // The uploaded profile data is already in hand, so a failed refresh should
      // not block the rest of the candidate dashboard from updating.
    }
    toast("Resume processed. Your skills are below.", "success");
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Candidate</p>
          <h1 className="display mt-1 text-2xl">Your resume</h1>
        </div>

        {profile && (
          <Button onClick={() => navigate("/candidate/matches")}>
            Search for HRs
          </Button>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {profile ? (
          <>
            <SkillsList
              parsedSkills={profile.parsedSkills}
              skillsCount={profile.skillsCount}
              atsScore={profile.atsScore}
            />

            <section className="card px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="display text-base">Replace your resume</h2>
                  <p className="mt-0.5 text-sm text-muted">
                    Uploading a new PDF re-extracts your skills.
                  </p>
                </div>
                {profile.resume?.path && (
                  <a
                    href={profile.resume.path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-teal underline-offset-4 hover:underline"
                  >
                    View current resume
                  </a>
                )}
              </div>

              <div className="mt-5">
                <ResumeUpload onUploaded={handleUploaded} />
              </div>
            </section>
          </>
        ) : (
          <>
            <ResumeUpload onUploaded={handleUploaded} />

            {/* The empty state invites the next action rather than reporting
                absence — "Search for HRs" is deliberately inert until there are
                skills to search with. */}
            <section className="card px-8 py-12 text-center">
              <div aria-hidden="true" className="mx-auto mb-5 h-px w-10 bg-gold" />
              <h2 className="display text-lg">No skills yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Upload a resume to see your extracted skills and find the
                recruiters hiring for them.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
