import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import NavBar from "~/components/NavBar";
import ResumeCard from "~/components/ResumeCard";
import { usePuterStore } from "~/lib/puter";
import { Link, useNavigate } from "react-router";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "ATSly" },
    { name: "description", content: "An AI-powered resume checker that makes your resume ATS-friendly and improves your chances of landing interviews." },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingresumes] = useState(false);


  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingresumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
        JSON.parse(resume.value) as Resume
      ))

      setResumes(parsedResumes || []);
      setLoadingresumes(false);
    }
    loadResumes();
  }, []);
  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    
    <NavBar />

    <section className="main-section">
      <div className="page-heading py-18">
        <h1>Track Applications & Resume Ratings</h1>
        {!loadingResumes && resumes?.length === 0 ? (
          <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ): (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>
      {loadingResumes && (
        <div>
          <img src="/images/resume-scan-2.gif" className="w-[200px]" />
        </div>
      )}

    {!loadingResumes && resumes.length > 0 && (
      <div className="resumes-section">
        {resumes.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}

      </div>
    )}

    {!loadingResumes && resumes?.length === 0 && (
      <div className="flex flex-col items-center justify-center mt-10 gap-4">
        <Link to="/upload" className="primary-button w-fit text-xl font-semibold">Upload Resume</Link>
      </div>
    )}
    </section>
  </main>
}
