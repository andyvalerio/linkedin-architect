# 🟦 LinkedIn Architect

> **Master the Art of LinkedIn Content with AI-Assisted Precision.**

LinkedIn Architect is a professional-grade content generation laboratory designed to help creators, executives, and architects craft high-impact LinkedIn posts and comments. By combining Multi-Vendor LLM support (Google & OpenAI) with an advanced Knowledge Base (RAG), it allows you to ground your content in real documents while maintaining your unique voice.

---

## ✨ Key Features

-   **🤖 Multi-Vendor Intelligence**: Seamlessly switch between **Gemini** and **OpenAI GPT** models.
-   **📚 Advanced Knowledge Base (RAG)**: 
    *   Upload PDF and Text documents to ground your generations.
    *   **Smart Search (RAG)**: Indexed search for large documents.
    *   **Full Reference**: Use the entire document context for maximum precision.
-   **✍️ Content Specialization**: Optimized strategies for both **Posts** and **Comments**.
-   **🗣️ Persona & Voice Modeling**: Define your unique tone to ensure every post sounds like *you*.
-   **🔄 Incremental Refinement**: Don't like a draft? Provide instructions to update and refine it rather than starting from scratch.
-   **💾 Zero-Loss Persistence**: All inputs, configurations, and drafts are automatically saved to your browser's LocalStorage.
-   **🔒 Privacy-First Architecture**: Your API keys are stored **only** in your browser's local storage and are never sent to any backend.

---

## 🛠️ Technology Stack

-   **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **AI Integration**: 
    *   [@google/genai](https://www.npmjs.com/package/@google/genai)
    *   [openai](https://www.npmjs.com/package/openai)
-   **Document Processing**: [pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist)
-   **Testing**: [Playwright](https://playwright.dev/) (E2E Requirements Validation)

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (Latest LTS recommended)
-   An API Key from [Google AI Studio](https://aistudio.google.com/) or [OpenAI Platform](https://platform.openai.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/andyvalerio/linkedin-architect.git
    cd linkedin-architect
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the App**:
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

5.  **Configure API Key**:
    Click the **Key icon** in the header to enter your Google or OpenAI API key.

---

## 🧪 Requirements & Testing

This project follows a "Test-as-Specification" approach. The `e2e.spec.ts` file contains the full suite of user stories and requirements validation.

To run the automated test suite:

```bash
# Run all tests
npm test

# Open Playwright UI for interactive testing
npm run test:ui
```

### Core User Stories
- **[US-UI-01] Persistence**: Inputs persist across refreshes via LocalStorage.
- **[US-RAG-03] Hybrid Knowledge**: Switch between Full Context and Smart Search modes.
- **[US-CFG-03] Vendor Persistence**: API keys and model selections are stored per vendor.
- **[US-GEN-04] Visual Feedback**: Clear loading states during AI reasoning and grounding.

---

## 📁 Project Structure

-   `/components`: Reusable UI components (Buttons, TextAreas, Document Manager).
-   `/services`: Provider-agnostic LLM logic and RAG implementation.
-   `/types.ts`: Shared TypeScript interfaces and enums.
-   `App.tsx`: Main application logic and state management.
-   `e2e.spec.ts`: Integrated requirements and Playwright tests.

---

<div align="center">
  <p><i>Crafted for the next generation of LinkedIn Architects.</i></p>
  <b>LinkedIn Architect v3.0</b>
</div>
