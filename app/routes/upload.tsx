import { type FormEvent, useState } from "react"
import NavBar from "~/components/NavBar"
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";


const Upload = () => {
  const {auth, isLoading, fs, ai, kv} = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  }

 const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file } : { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
  setIsProcessing(true);
  setStatusText('Uploading the file...');

  const uploadedFile = await fs.upload([file]);
  if (!uploadedFile) return setStatusText('Error: failed to upload file');

  setStatusText('Converting to image ...');
  const imageFile = await convertPdfToImage(file);
  if (!imageFile.file) return setStatusText('Failed to convert PDF to image');

  setStatusText('Uploading the image ...');
  const uploadedImage = await fs.upload([imageFile.file]);
  if (!uploadedImage) return setStatusText('Error: failed to upload image');

  setStatusText('Preparing data ...');

  const uuid = generateUUID();
  const data = {
    id: uuid,
    resumePath: uploadedFile.path,
    imagePath: uploadedImage.path,
    companyName,
    jobTitle,
    jobDescription,
    feedback: null, // initially no feedback
  };

  // Save initial data
  await kv.set(`resume:${uuid}`, JSON.stringify(data));

  setStatusText('Analyzing ...');

  const feedback = await ai.feedback(
    uploadedFile.path,
    prepareInstructions({ jobTitle, jobDescription })
  );
  if (!feedback) return setStatusText('Error: Failed to analyze resume');

  let feedbackText: string;
  if (typeof feedback.message.content === "string") {
    feedbackText = feedback.message.content;
  } else {
    feedbackText = feedback.message.content[0]?.text || "{}";
  }

  try {
    data.feedback = JSON.parse(feedbackText);
  } catch (err) {
    console.error("Failed to parse feedback JSON:", feedbackText);
    return setStatusText("Error: Invalid feedback format");
  }

  // ✅ Always use the same key name (with colon)
  await kv.set(`resume:${uuid}`, JSON.stringify(data));

  setStatusText('Analysis complete, redirecting ...');
  navigate(`/resume/${uuid}`);
};


  const handleSubmit = (e:  FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
    const form = e.currentTarget.closest('form');
    if(!form) return;
    const formData = new FormData(form);

    const companyName = formData.get('company-name') as string;
    const jobTitle = formData.get('job-title') as string;
    const jobDescription = formData.get('job-description') as string;

    if(!file) return;

    handleAnalyze({companyName, jobTitle, jobDescription, file});
  }

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    
    <NavBar />

    <section className="main-section">
      <div className="main-section py-16">
        <h1>Smart feedback for your dream job</h1>
        {isProcessing ? (
          <>
            <h2>{statusText}</h2>
            <img src="/images/resume-scan.gif" alt="" className="w-full"/>
          </>
        ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
        )}
        {!isProcessing && (
          <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
            <div className="form-div">
              <label htmlFor="company-name">Company Name</label>
              <input type="text" name="company-name" placeholder="Comapny Name" id="company-name"/>
            </div>

            <div className="form-div">
              <label htmlFor="job-title">Job Title</label>
              <input type="text" name="job-title" placeholder="Job Title" id="job-title"/>
            </div>

            <div className="form-div">
              <label htmlFor="job-description">Job Description</label>
              <textarea rows={5} name="job-description" placeholder="Job description" id="job-description"/>
            </div>

            <div className="form-div">
              <label htmlFor="uploader">Upload Resume</label>
              <FileUploader onFileSelect={handleFileSelect}/>
            </div>

            <button className="primary-button" type="submit">Analyze Resume</button>
          </form>
        )}
      </div>
    </section>
    </main>
  )
}

export default Upload