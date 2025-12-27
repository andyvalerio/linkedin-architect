import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Copy, 
  Check, 
  Linkedin, 
  Settings2
} from 'lucide-react';
import { TextArea } from './components/TextArea';
import { Button } from './components/Button';
import { DocumentManager } from './components/DocumentManager';
import { UploadedDocument, PostType, GenerationConfig } from './types';
import { generateLinkedInContent } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [context, setContext] = useState<string>('');
  const [personality, setPersonality] = useState<string>('Professional, empathetic, yet authoritative. Use short sentences.');
  const [braindump, setBraindump] = useState<string>('');
  const [postType, setPostType] = useState<PostType>(PostType.POST);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-preview');

  // Handlers
  const handleGenerate = async () => {
    if (!braindump.trim()) {
      alert("Please enter a Braindump to guide the content generation.");
      return;
    }

    setIsLoading(true);
    setGeneratedContent('');

    const config: GenerationConfig = {
      context,
      personality,
      braindump,
      postType,
      model: selectedModel
    };

    try {
      const content = await generateLinkedInContent(config, documents);
      setGeneratedContent(content);
    } catch (error) {
      alert("Error generating content. Please check console or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Linkedin className="w-8 h-8 text-[#0077B5]" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              LinkedIn<span className="text-[#0077B5]">Architect</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
               <Settings2 className="w-3 h-3" />
               <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium text-xs cursor-pointer"
               >
                 <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                 <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash</option>
                 <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
               </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Post Type Selector */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
               <label className="text-sm font-semibold text-gray-700 mb-2 block">Content Format</label>
               <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="postType" 
                      checked={postType === PostType.POST} 
                      onChange={() => setPostType(PostType.POST)}
                      className="text-[#0077B5] focus:ring-[#0077B5]"
                    />
                    <span className="text-sm text-gray-700 font-medium">Post (Long)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="postType" 
                      checked={postType === PostType.COMMENT} 
                      onChange={() => setPostType(PostType.COMMENT)}
                      className="text-[#0077B5] focus:ring-[#0077B5]"
                    />
                    <span className="text-sm text-gray-700 font-medium">Comment (Short)</span>
                  </label>
               </div>
            </div>

            {/* Context */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <div className="flex items-center gap-2 mb-4">
                 <div className="bg-blue-100 p-2 rounded-md">
                   <Briefcase className="w-5 h-5 text-[#0077B5]" />
                 </div>
                 <h2 className="text-lg font-bold">Context</h2>
               </div>
               <TextArea 
                 label="Post/Article to Answer" 
                 placeholder="Paste the LinkedIn post, article, or news snippet you are reacting to here..."
                 value={context}
                 onChange={(e) => setContext(e.target.value)}
                 className="min-h-[150px]"
               />
            </div>

            {/* Strategy Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
               <div className="flex items-center gap-2 mb-4">
                 <div className="bg-purple-100 p-2 rounded-md">
                   <Sparkles className="w-5 h-5 text-purple-600" />
                 </div>
                 <h2 className="text-lg font-bold">Strategy & Voice</h2>
               </div>
               
               <div className="space-y-6">
                 <TextArea 
                   label="Personality & Tone" 
                   placeholder="Describe how you want to sound (e.g., Cynical CTO, Encouraging Mentor, Data-Driven Analyst)..."
                   value={personality}
                   onChange={(e) => setPersonality(e.target.value)}
                 />
                 
                 <TextArea 
                   label="Braindump (Instructions)" 
                   placeholder="What main points do you want to hit? List your raw thoughts here..."
                   value={braindump}
                   onChange={(e) => setBraindump(e.target.value)}
                   className="min-h-[150px] font-mono text-sm bg-gray-50"
                   helperText="This is the most important field. Tell the AI exactly what you think."
                 />
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RAG & Output */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            
            {/* Document Manager (RAG) */}
            <DocumentManager documents={documents} setDocuments={setDocuments} />

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              isLoading={isLoading} 
              className="w-full py-4 text-lg shadow-md hover:shadow-lg transition-all"
              icon={<Sparkles className="w-5 h-5" />}
            >
              {isLoading ? 'Crafting Content...' : 'Generate Response'}
            </Button>

            {/* Output Area */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-1 flex flex-col relative overflow-hidden">
               <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-semibold text-gray-700">Draft Preview</h3>
                 <Button 
                   variant="outline" 
                   onClick={handleCopy} 
                   className="text-xs py-1 h-8"
                   disabled={!generatedContent}
                 >
                   {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                   {copied ? 'Copied' : 'Copy'}
                 </Button>
               </div>
               
               <div className="p-6 flex-1 bg-white min-h-[400px]">
                 {generatedContent ? (
                   <div className="prose prose-sm prose-blue max-w-none whitespace-pre-wrap font-sans text-gray-800">
                     {generatedContent}
                   </div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                     <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                       <Sparkles className="w-8 h-8 text-gray-300" />
                     </div>
                     <p>Ready to create content.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;