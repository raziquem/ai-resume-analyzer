import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import Summary from '~/components/Summary';
import { usePuterStore } from '~/lib/puter';
import Details from '~/components/Details';
import ATS from '~/components/ATS';

export const meta = () => ([
  { title: 'ATSly | Review' },
  { name: 'description', content: 'Detailed overview of your resume' }
])

const Resume = () => {
  const { id } = useParams();
  const { auth, isLoading, fs, kv } = usePuterStore();
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, auth, id, navigate]);

  // Load resume + feedback
  useEffect(() => {
    const loadResume = async () => {
      try {
        const resume = await kv.get(`resume:${id}`);
        if (!resume) {
          console.warn("No resume found in KV store");
          return;
        }

        const data = JSON.parse(resume);

        // Load PDF file
        if (data.resumePath) {
          const resumeBlob = await fs.read(data.resumePath);
          if (resumeBlob) {
            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            setResumeUrl(URL.createObjectURL(pdfBlob));
          } else {
            console.warn("Failed to read resume PDF");
          }
        }

        // Load preview image
        if (data.imagePath) {
          const imageBlob = await fs.read(data.imagePath);
          if (imageBlob) {
            setImageUrl(URL.createObjectURL(imageBlob));
          } else {
            console.warn("Failed to read resume preview image");
          }
        }

        // Load feedback
        if (data.feedback) {
          setFeedback(data.feedback);
        } else {
          console.warn("No feedback found in resume data");
        }

        console.log({
          resumeUrl,
          imageUrl,
          feedback: data.feedback || null
        });
      } catch (err) {
        console.error("Failed to load resume:", err);
      }
    };

    loadResume();
  }, [id, kv, fs]);

  return (
    <main className='!pt-0'>
      {/* Back navigation */}
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className='w-2.5 h-2.5' />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        
        {/* Left Section (Resume Preview) */}
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 items-center">
          {imageUrl && resumeUrl ? (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target='_blank' rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  alt="Resume Preview"
                  className='w-full h-full object-contain rounded-2xl'
                  title='resume'
                />
              </a>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-4">Loading resume preview...</p>
          )}
        </section>

        {/* Right Section (Feedback) */}
        <section className="feedback-section">
          <h2 className='text-4xl !text-black font-bold'>Resume Review</h2>
          {feedback ? (
            <div className='flex flex-col gap-8 animate-in fade-in duration-1000'>
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS?.score || 0} suggestions={feedback.ATS?.tips || []} />
              <Details feedback={feedback} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <img src="/images/resume-scan-2.gif" alt="Loading feedback" className='w-full max-w-md' />
              <p className="text-gray-500 mt-2">Analyzing your resume, please wait...</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Resume;
