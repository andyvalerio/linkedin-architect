
import React, { useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, Circle } from 'lucide-react';
import { UploadedDocument } from '../types';
import { fileToBase64, formatFileSize } from '../services/fileUtils';

interface DocumentManagerProps {
  documents: UploadedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<UploadedDocument[]>>;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, setDocuments }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocs: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf' || file.type.startsWith('text/') || file.type.startsWith('image/')) {
        try {
          const base64 = await fileToBase64(file);
          newDocs.push({
            id: crypto.randomUUID(),
            name: file.name,
            mimeType: file.type,
            data: base64,
            isActive: true,
            size: file.size
          });
        } catch (error) {
          console.error("Error reading file", file.name, error);
        }
      } else {
        alert(`File type ${file.type} not supported. Please upload PDF, Text, or Images.`);
      }
    }

    setDocuments(prev => [...prev, ...newDocs]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleDocument = (id: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, isActive: !doc.isActive } : doc
    ));
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Knowledge Base (RAG)</h3>
          <p className="text-xs text-gray-500">Attach files for context.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-[#0077B5] text-sm hover:underline flex items-center gap-1 font-medium"
          >
            <Upload className="w-4 h-4" /> Local Upload
          </button>
        </div>
        <input 
          type="file" 
          multiple 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
          accept=".pdf,.txt,.md,image/*"
        />
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {documents.length === 0 && (
          <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-md text-gray-400 text-sm">
            No knowledge base files.
          </div>
        )}
        {documents.map(doc => (
          <div 
            key={doc.id} 
            className={`flex items-center justify-between p-3 rounded-md border ${doc.isActive ? 'border-blue-100 bg-blue-50' : 'border-gray-100 bg-gray-50'} transition-all`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <button onClick={() => toggleDocument(doc.id)} className="flex-shrink-0 text-gray-400 hover:text-[#0077B5]">
                {doc.isActive ? 
                  <CheckCircle2 className="w-5 h-5 text-[#0077B5]" /> : 
                  <Circle className="w-5 h-5" />
                }
              </button>
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${doc.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {doc.name}
                </p>
                <p className="text-xs text-gray-400">{formatFileSize(doc.size)}</p>
              </div>
            </div>
            <button 
              onClick={() => removeDocument(doc.id)}
              className="text-gray-400 hover:text-red-500 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
