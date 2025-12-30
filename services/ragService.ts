import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Chunk, KnowledgeMode, UploadedDocument, Vendor } from '../types';

// Set up pdfjs worker using local file via Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DB_NAME = 'li_arch_rag_db';
const STORE_NAME = 'embeddings';
const DB_VERSION = 1;

export class RagService {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('documentId', 'documentId', { unique: false });
                    store.createIndex('vendor', 'vendor', { unique: false });
                }
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async parsePDF(base64: string): Promise<string> {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
        }

        return fullText;
    }

    chunkText(text: string, documentId: string, chunkSize: number = 1000, chunkOverlap: number = 200): Chunk[] {
        const chunks: Chunk[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            const chunkText = text.substring(start, end);
            chunks.push({
                id: `${documentId}-chunk-${chunks.length}`,
                documentId,
                text: chunkText
            });
            start += (chunkSize - chunkOverlap);
        }

        return chunks;
    }

    async saveChunks(chunks: Chunk[], vendor: Vendor, embeddings: number[][]) {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (let i = 0; i < chunks.length; i++) {
            store.put({
                ...chunks[i],
                vendor,
                embedding: embeddings[i]
            });
        }

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    async searchSimilar(queryEmbedding: number[], vendor: Vendor, limit: number = 5): Promise<Chunk[]> {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('vendor');
        const request = index.getAll(vendor);

        const allChunks = await new Promise<any[]>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const scored = allChunks.map(chunk => ({
            chunk,
            score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map(s => s.chunk);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async deleteDocumentData(documentId: string) {
        const db = await this.getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('documentId');
        const request = index.getAllKeys(documentId);

        request.onsuccess = () => {
            const keys = request.result;
            keys.forEach(key => store.delete(key));
        };

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }
}

export const ragService = new RagService();
