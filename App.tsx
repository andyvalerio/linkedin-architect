
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  Copy, 
  Check, 
  Linkedin, 
  Settings2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Zap,
  MessageSquare,
  BookOpen,
  Layout
} from 'lucide-react';
import { TextArea } from './components/TextArea';
import { Button } from './components/Button';
import { DocumentManager } from './components/DocumentManager';
import { UploadedDocument, PostType, GenerationConfig } from './types';
import { generateLinkedInContent, fetchAvailableModels, ModelInfo } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [context, setContext] = useState<string>('');
  const [personality, setPersonality] = useState<string>('Professional, empathetic, yet authoritative. Insightful and bold.');
  const [braindump, setBraindump] = useState<string>('');
  const [postType, setPostType] = useState<PostType>(PostType.POST);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-preview');

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsModelLoading(true);
    try {
      const models = await fetchAvailableModels();
      setAvailableModels(models);
      
      const proModel = models.find(m => m.name.includes('gemini-2.5-flash'));
      if (proModel) {
        setSelectedModel(proModel.name);
      } else if (models.length > 0) {
        setSelectedModel(models[0].name);
      }
    } catch (err: any) {
      console.error("Failed to load models:", err);
      setError("Failed to load available models. Check your API key.");
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedContent('');
    setSources([]);
    setError(null);

    const config: GenerationConfig = {
      context,
      personality,
      braindump,
      postType,
      model: selectedModel
    };

    try {
      const result = await generateLinkedInContent(config, documents);
      setGeneratedContent(result.text);
      setSources(result.sources);
    } catch (err: any) {
      console.error("App Error:", err);
      setError(err.message || "An unexpected error occurred during generation.");
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
    <div className="h-screen bg-[#F3F2EF] text-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 z-50 shadow-sm flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#0077B5] p-1.5 rounded-md">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              LinkedIn<span className="text-[#0077B5]">Architect</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
               <Settings2 className="w-3.5 h-3.5" />
               <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer"
                disabled={isModelLoading}
               >
                 {availableModels.length > 0 ? (
                   availableModels.map(m => (
                     <option key={m.name} value={m.name}>
                       {m.displayName}
                     </option>
                   ))
                 ) : (
                   <option value={selectedModel}>{selectedModel.replace('models/', '')}</option>
                 )}
               </select>
               <button 
                onClick={loadModels}
                className={`p-1 hover:bg-gray-200 rounded-full transition-all ${isModelLoading ? 'animate-spin' : ''}`}
               >
                 <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
               </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto h-full px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: Deep Writing Lab */}
          <div className="xl:col-span-8 flex flex-col h-full overflow-hidden">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
               <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                 <div className="flex items-center gap-2">
                   <Layout className="w-4 h-4 text-[#0077B5]" />
                   <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Writing Laboratory</h2>
                 </div>
                 
                 <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                   <button 
                    onClick={() => setPostType(PostType.POST)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${postType === PostType.POST ? 'bg-white text-[#0077B5] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     <div className="flex items-center gap-1.5">
                       <BookOpen className="w-3.5 h-3.5" /> Post
                     </div>
                   </button>
                   <button 
                    onClick={() => setPostType(PostType.COMMENT)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${postType === PostType.COMMENT ? 'bg-white text-[#0077B5] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                   >
                     <div className="flex items-center gap-1.5">
                       <MessageSquare className="w-3.5 h-3.5" /> Comment
                     </div>
                   </button>
                 </div>
               </div>

               <div className="p-6 flex-1 overflow-y-auto space-y-6">
                 {/* LARGE TEXT AREA */}
                 <div className="flex flex-col">
                   <TextArea 
                     label="Post/Article to Answer" 
                     placeholder="Paste the target post content or URL here. This is the source of truth for the response..."
                     value={context}
                     onChange={(e) => setContext(e.target.value)}
                     className="min-h-[250px] text-base font-medium resize-none"
                     helperText="URLs will be analyzed using Google Search."
                   />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <TextArea 
                     label="Main Points / Braindump" 
                     placeholder="What specific insights do you want to include?"
                     value={braindump}
                     onChange={(e) => setBraindump(e.target.value)}
                     className="min-h-[150px]"
                   />
                   <TextArea 
                     label="Persona & Voice" 
                     placeholder="Describe your tone (e.g., 'Authoritative expert')"
                     value={personality}
                     onChange={(e) => setPersonality(e.target.value)}
                     className="min-h-[150px]"
                   />
                 </div>
               </div>

               <div className="p-4 bg-gray-50 border-t border-gray-100 flex-shrink-0">
                  <Button 
                    onClick={handleGenerate} 
                    isLoading={isLoading} 
                    className="w-full h-14 text-lg shadow-md bg-[#0077B5] hover:bg-[#004182] active:scale-[0.99] transition-all"
                    icon={<Sparkles className="w-5 h-5" />}
                  >
                    {isLoading ? 'Processing...' : 'Generate Artifact'}
                  </Button>
               </div>
            </section>
          </div>

          {/* RIGHT: Documents & Preview */}
          <div className="xl:col-span-4 flex flex-col h-full overflow-hidden gap-6">
            <div className="flex-shrink-0">
              <DocumentManager documents={documents} setDocuments={setDocuments} />
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Resulting Draft</h3>
                </div>
                {generatedContent && (
                  <Button 
                    variant="outline" 
                    onClick={handleCopy} 
                    className="text-xs h-8 px-3"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>

              <div className="p-6 flex-1 overflow-y-auto relative bg-gray-50/30">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-8 text-center z-10 backdrop-blur-sm animate-in fade-in">
                    <div className="w-16 h-16 border-4 border-[#0077B5]/10 border-t-[#0077B5] rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-gray-900">Architecting Content...</p>
                  </div>
                )}

                {error && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-2 opacity-50" />
                    <p className="text-xs text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 w-full font-mono">
                      {error}
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setError(null)}>Clear Error</Button>
                  </div>
                )}

                {generatedContent && !isLoading && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="prose prose-blue prose-sm max-w-none text-gray-800 leading-relaxed font-sans whitespace-pre-wrap text-base">
                      {generatedContent}
                    </div>
                    
                    {sources.length > 0 && (
                      <div className="mt-10 pt-6 border-t border-gray-200">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Grounding Sources</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {sources.map((s, i) => (
                            <a 
                              key={i}
                              href={s.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg text-xs font-semibold text-[#0077B5] hover:bg-blue-50 transition-all shadow-sm"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{s.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!generatedContent && !isLoading && !error && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 space-y-4 text-center">
                    <Zap className="w-12 h-12 text-gray-200" />
                    <p className="text-sm font-semibold text-gray-500">Awaiting inputs...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest flex-shrink-0">
        <div className="flex gap-4">
          <span>Engine: {selectedModel.split('-')[1].toUpperCase()}</span>
          <span>Status: Standby</span>
        </div>
        <span>LinkedIn Architect v2.1</span>
      </footer>
    </div>
  );
};

export default App;
