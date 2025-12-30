import React, { useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle2, Circle, Database, Loader2, BookOpen, Search, Info } from 'lucide-react';
import { UploadedDocument, KnowledgeMode, Vendor } from '../types';
import { fileToBase64, formatFileSize } from '../services/fileUtils';
import { ragService } from '../services/ragService';
import { getProvider } from '../services/llmFactory';

interface DocumentManagerProps {
  documents: UploadedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
  vendor: Vendor;
  apiKey: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments, vendor, apiKey }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIndexing, setIsIndexing] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocs: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isText = file.type.startsWith('text/') ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.txt');

      if (isPDF || isText) {
        try {
          const base64 = await fileToBase64(file);
          let parsedText = '';

          if (isPDF) {
            parsedText = await ragService.parsePDF(base64);
          } else {
            // Use modern file.text() for robust UTF-8 reading
            parsedText = await file.text();
          }

          newDocs.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type || (isPDF ? 'application/pdf' : 'text/plain'),
            data: base64,
            parsedText,
            isActive: true,
            size: file.size,
            knowledgeMode: KnowledgeMode.CONTEXT,
            isIndexed: false
          });
        } catch (error) {
          console.error("Error reading file", file.name, error);
          alert(`Error reading ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        alert(`File type "${file.type}" for "${file.name}" not supported. Please upload PDF or Text (.txt, .md).`);
      }
    }

    if (newDocs.length > 0) {
      setDocuments(prev => [...prev, ...newDocs]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIndexDocument = async (doc: UploadedDocument) => {
    if (!apiKey) {
      alert("Please provide an API Key to analyze documents for Smart Search.");
      return;
    }

    setIsIndexing(doc.id);
    try {
      const provider = getProvider(vendor);
      const text = doc.parsedText || atob(doc.data);
      const chunks = ragService.chunkText(text, doc.id);
      const embeddings = await provider.generateEmbeddings(apiKey, chunks.map(c => c.text));

      await ragService.saveChunks(chunks, vendor, embeddings);

      setDocuments(prev => prev.map(d =>
        d.id === doc.id ? { ...d, isIndexed: true, knowledgeMode: KnowledgeMode.RAG } : d
      ));
    } catch (error) {
      console.error("Indexing failed:", error);
      alert("Failed to analyze document. Check console and API key.");
    } finally {
      setIsIndexing(null);
    }
  };

  const toggleDocument = (id: string) => {
    setDocuments(prev => prev.map(doc =>
      doc.id === id ? { ...doc, isActive: !doc.isActive } : doc
    ));
  };

  const setKnowledgeMode = (id: string, mode: KnowledgeMode) => {
    const doc = documents.find(d => d.id === id);
    if (mode === KnowledgeMode.RAG && doc && !doc.isIndexed) {
      handleIndexDocument(doc);
    } else {
      setDocuments(prev => prev.map(d =>
        d.id === id ? { ...d, knowledgeMode: mode } : d
      ));
    }
  };

  const removeDocument = async (id: string) => {
    await ragService.deleteDocumentData(id);
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <Database className="w-4 h-4 text-[#0077B5]" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Knowledge Base</h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Add context for the AI</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#0077B5] text-white px-4 py-2 rounded-lg text-xs hover:bg-[#005a8a] transition-all flex items-center gap-2 font-bold shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.txt,.md"
        />
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {documents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 space-y-3 bg-gray-50/30">
            <FileText className="w-10 h-10 opacity-10" />
            <div className="text-center">
              <p className="text-xs font-bold text-gray-500">Your library is empty</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Upload PDFs or text files to begin</p>
            </div>
          </div>
        )}
        {documents.map(doc => (
          <div
            key={doc.id}
            className={`flex flex-col p-4 rounded-xl border transition-all duration-300 ${doc.isActive ? 'border-blue-200 bg-white shadow-sm ring-1 ring-blue-50/50' : 'border-gray-100 bg-gray-50/50 grayscale opacity-60'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  onClick={() => toggleDocument(doc.id)}
                  className={`flex-shrink-0 transition-all duration-300 ${doc.isActive ? 'scale-110' : 'hover:scale-105'}`}
                >
                  {doc.isActive ?
                    <CheckCircle2 className="w-5 h-5 text-[#0077B5]" /> :
                    <Circle className="w-5 h-5 text-gray-300" />
                  }
                </button>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${doc.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono font-bold tracking-tight">{formatFileSize(doc.size)}</span>
                    {doc.isActive && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${doc.isIndexed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doc.isIndexed ? 'Analyzed' : 'Ready'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeDocument(doc.id)}
                className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {doc.isActive && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 p-1 bg-gray-50 rounded-xl border border-gray-100">
                  <button
                    onClick={() => setKnowledgeMode(doc.id, KnowledgeMode.CONTEXT)}
                    className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${doc.knowledgeMode === KnowledgeMode.CONTEXT ? 'bg-white text-[#0077B5] shadow-sm border border-blue-100' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <BookOpen className={`w-3 h-3 ${doc.knowledgeMode === KnowledgeMode.CONTEXT ? 'text-[#0077B5]' : 'text-gray-400'}`} />
                    Full Reference
                  </button>
                  <button
                    onClick={() => setKnowledgeMode(doc.id, KnowledgeMode.RAG)}
                    disabled={isIndexing === doc.id}
                    className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${doc.knowledgeMode === KnowledgeMode.RAG ? 'bg-[#0077B5] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {isIndexing === doc.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Search className={`w-3 h-3 ${doc.knowledgeMode === KnowledgeMode.RAG ? 'text-white' : 'text-gray-400'}`} />
                    )}
                    Smart Search
                  </button>
                </div>

                <div className="flex items-start gap-2 px-1 text-[10px] leading-relaxed">
                  <Info className="w-3 h-3 text-gray-300 mt-0.5 flex-shrink-0" />
                  {doc.knowledgeMode === KnowledgeMode.CONTEXT ? (
                    <p className="text-gray-400 italic font-medium">Model reads the <span className="text-gray-600 font-bold">entire document</span>. Best for short notes or critical context.</p>
                  ) : (
                    <p className="text-gray-400 italic font-medium">Model <span className="text-gray-600 font-bold">searches relevant parts</span> of the file. Best for books or long reports.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
