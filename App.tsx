import React, { useState, useEffect, useRef } from 'react';
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
  Layout,
  Trash2,
  FilePlus2,
  Key
} from 'lucide-react';
import { TextArea } from './components/TextArea';
import { Button } from './components/Button';
import { DocumentManager } from './components/DocumentManager';
import { UploadedDocument, PostType, GenerationConfig } from './types';
import { generateLinkedInContent, fetchAvailableModels, ModelInfo } from './services/geminiService';

const DEFAULT_PERSONALITY = 'Professional, empathetic, yet authoritative. Insightful and bold.';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const STORAGE_KEYS = {
  CONTEXT: 'li_arch_context',
  PERSONALITY: 'li_arch_personality',
  BRAINDUMP: 'li_arch_braindump',
  POST_TYPE: 'li_arch_post_type',
  DOCUMENTS: 'li_arch_documents',
  SELECTED_MODEL: 'li_arch_selected_model',
  GENERATED_CONTENT: 'li_arch_generated_content',
  API_KEY: 'li_arch_api_key'
};

const App: React.FC = () => {
  // Persistence Initialization
  const [context, setContext] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.CONTEXT) || '');
  const [personality, setPersonality] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.PERSONALITY) || DEFAULT_PERSONALITY
  );
  const [braindump, setBraindump] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.BRAINDUMP) || '');
  const [postType, setPostType] = useState<PostType>(() =>
    (localStorage.getItem(STORAGE_KEYS.POST_TYPE) as PostType) || PostType.POST
  );
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || DEFAULT_MODEL
  );
  const [generatedContent, setGeneratedContent] = useState<string>(() =>
    localStorage.getItem(STORAGE_KEYS.GENERATED_CONTENT) || ''
  );
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.API_KEY) || '');
  const draftAreaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize draft textarea
  useEffect(() => {
    if (draftAreaRef.current) {
      draftAreaRef.current.style.height = 'auto'; // Reset height to get correct scrollHeight
      draftAreaRef.current.style.height = `${draftAreaRef.current.scrollHeight}px`;
    }
  }, [generatedContent]);

  // Other State
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  // Persistence Effects
  useEffect(() => {
    if (context) localStorage.setItem(STORAGE_KEYS.CONTEXT, context);
    else localStorage.removeItem(STORAGE_KEYS.CONTEXT);
  }, [context]);

  useEffect(() => {
    if (personality && personality !== DEFAULT_PERSONALITY) localStorage.setItem(STORAGE_KEYS.PERSONALITY, personality);
    else localStorage.removeItem(STORAGE_KEYS.PERSONALITY);
  }, [personality]);

  useEffect(() => {
    if (braindump) localStorage.setItem(STORAGE_KEYS.BRAINDUMP, braindump);
    else localStorage.removeItem(STORAGE_KEYS.BRAINDUMP);
  }, [braindump]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POST_TYPE, postType);
  }, [postType]);

  useEffect(() => {
    try {
      if (documents.length > 0) {
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
      }
    } catch (e) {
      console.warn("Local storage limit reached. Some documents may not be saved.", e);
    }
  }, [documents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (generatedContent) localStorage.setItem(STORAGE_KEYS.GENERATED_CONTENT, generatedContent);
    else localStorage.removeItem(STORAGE_KEYS.GENERATED_CONTENT);
  }, [generatedContent]);

  useEffect(() => {
    if (apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
    else localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      loadModels();
    }
  }, [apiKey]);

  const loadModels = async () => {
    if (!apiKey) {
      setAvailableModels([]);
      return;
    }
    setIsModelLoading(true);
    setError(null);
    try {
      const models = await fetchAvailableModels(apiKey);
      setAvailableModels(models);

      const currentSelectionInList = models.some(m => m.name === selectedModel);
      if (!currentSelectionInList) {
        const preferredModel = models.find(m => m.name.includes(DEFAULT_MODEL));
        if (preferredModel) {
          setSelectedModel(preferredModel.name);
        } else if (models.length > 0) {
          setSelectedModel(models[0].name);
        }
      }
    } catch (err: any) {
      console.error("Failed to load models:", err);
      setError("Failed to load available models. Check your API key.");
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Please provide a Gemini API Key in the top right settings.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const config: GenerationConfig = {
      context,
      personality,
      braindump,
      postType,
      model: selectedModel,
      currentDraft: generatedContent || undefined
    };

    try {
      const result = await generateLinkedInContent(apiKey, config, documents);
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

  const handleClearAll = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    setContext('');
    setBraindump('');
    setDocuments([]);
    setGeneratedContent('');
    setSources([]);
    setPersonality(DEFAULT_PERSONALITY);
    setSelectedModel(DEFAULT_MODEL);
  };

  const handleNewDraft = () => {
    setGeneratedContent('');
    setSources([]);
    localStorage.removeItem(STORAGE_KEYS.GENERATED_CONTENT);
  };

  return (
    <div className="min-h-screen xl:h-screen bg-[#F3F2EF] text-gray-900 flex flex-col xl:overflow-hidden">
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
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Reset Lab
            </button>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <Key className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Gemini API Key..."
                className="bg-transparent border-none focus:ring-0 text-gray-700 outline-none w-32"
              />
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
              <Settings2 className="w-3.5 h-3.5" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer outline-none"
                disabled={isModelLoading || !apiKey}
              >
                {!apiKey ? (
                  <option>Set API Key first...</option>
                ) : availableModels.length > 0 ? (
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
                disabled={!apiKey}
                className={`p-1 hover:bg-gray-200 rounded-full transition-all ${isModelLoading ? 'animate-spin' : ''} ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 xl:overflow-hidden">
        <div className="max-w-[1800px] mx-auto xl:h-full px-6 py-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 flex flex-col xl:h-full xl:overflow-hidden">
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col xl:h-full xl:overflow-hidden">
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
                <div className="flex flex-col">
                  <TextArea
                    label="Post/Article to Answer"
                    placeholder="Paste the target post content or URL here. This is the source of truth for the response..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[250px] text-base font-medium resize-none"
                    helperText="URLs will be analyzed using Google Search. Your text is auto-saved locally."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextArea
                    label="Main Points / Refinement Instructions"
                    placeholder="Initial points OR update instructions for the existing draft..."
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
                  className={`w-full h-14 text-lg shadow-md active:scale-[0.99] transition-all ${generatedContent ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#0077B5] hover:bg-[#004182]'}`}
                  icon={generatedContent ? <RefreshCw className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                >
                  {isLoading ? 'Architecting Content...' : generatedContent ? 'Update Artifact' : 'Generate Artifact'}
                </Button>
              </div>
            </section>
          </div>

          <div className="xl:col-span-4 flex flex-col min-h-[600px] xl:min-h-0 xl:h-full xl:overflow-hidden gap-6">
            <div className="flex-shrink-0">
              <DocumentManager documents={documents} setDocuments={setDocuments} />
            </div>

            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-gray-200 xl:overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Resulting Draft</h3>
                </div>
                <div className="flex items-center gap-2">
                  {generatedContent && (
                    <>
                      <button
                        onClick={handleNewDraft}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                        title="Start a fresh draft from scratch"
                      >
                        <FilePlus2 className="w-3 h-3" /> New
                      </button>
                      <Button
                        variant="outline"
                        onClick={handleCopy}
                        className="text-xs h-8 px-3"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-0 flex-1 xl:overflow-y-auto relative bg-gray-50/30 flex flex-col">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-8 text-center z-10 backdrop-blur-sm animate-in fade-in">
                    <div className="w-16 h-16 border-4 border-[#0077B5]/10 border-t-[#0077B5] rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-gray-900">Consulting Knowledge Base...</p>
                  </div>
                )}

                {error && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 z-20">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-2 opacity-50" />
                    <p className="text-xs text-red-600 bg-red-50 p-4 rounded-lg border border-red-100 w-full font-mono">
                      {error}
                    </p>
                    <Button variant="outline" className="mt-4" onClick={() => setError(null)}>Clear Error</Button>
                  </div>
                )}

                {generatedContent ? (
                  <div className="flex-shrink-0 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <textarea
                      ref={draftAreaRef}
                      className="w-full p-6 bg-transparent border-none focus:ring-0 text-gray-800 leading-relaxed font-sans text-base resize-none outline-none overflow-hidden"
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                      placeholder="Your draft will appear here..."
                    />

                    {sources.length > 0 && (
                      <div className="p-6 pt-2 border-t border-gray-100 bg-white/50 overflow-y-auto max-h-[150px]">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Grounding Sources</h4>
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
                ) : (
                  !isLoading && !error && (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 space-y-4 text-center">
                      <Zap className="w-12 h-12 text-gray-200" />
                      <p className="text-sm font-semibold text-gray-500">Awaiting laboratory inputs...</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Persistence Enabled</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest flex-shrink-0">
        <div className="flex gap-4">
          <span>Engine: {selectedModel.split('-').pop()?.toUpperCase()}</span>
          <span>Status: Standby</span>
        </div>
        <span>LinkedIn Architect v2.5 Incremental Wipe</span>
      </footer>
    </div>
  );
};

export default App;