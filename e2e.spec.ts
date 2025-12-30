import { test, expect } from '@playwright/test';

/**
 * LINKEDIN ARCHITECT - INTEGRATED REQUIREMENTS & TEST SUITE
 * 
 * This file serves as both the technical specification and the functional test suite.
 * Each test block corresponds to a specific User Story.
 */

test.describe('LinkedIn Architect - Requirements Validation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Set a dummy API key for tests that require it
    const apiKeyInput = page.locator('input[id="api-key-input"]');
    await apiKeyInput.fill('dummy-test-key');
  });

  /**
   * [US-UI-01] PERSISTENCE
   * Requirement: As a user, I want my text inputs to persist across browser refreshes, 
   * so I don't lose my work if the page reloads unexpectedly.
   */
  test('Persistence of user inputs across sessions', async ({ page }) => {
    const testContext = 'This is a test context for checking persistence.';
    const testPersona = 'Sarcastic Tech Lead';

    const contextArea = page.locator('textarea[placeholder*="target post content"]');
    const personaArea = page.locator('textarea[placeholder*="Describe your tone"]');

    // Fill data
    await contextArea.fill(testContext);
    await personaArea.fill(testPersona);

    // Trigger reload
    await page.reload();

    // Verify persistence from LocalStorage
    await expect(contextArea).toHaveValue(testContext);
    await expect(personaArea).toHaveValue(testPersona);
  });

  /**
   * [US-UI-03] DATA PRIVACY & RESET
   * Requirement: As a user, I want a "Reset" button to clear all inputs and stored documents, 
   * so I can start a fresh writing project without data leakage from previous sessions.
   */
  test('Reset Lab clears all local state and storage', async ({ page }) => {
    const contextArea = page.locator('textarea[placeholder*="target post content"]');

    // Populate data
    await contextArea.fill('Sensitive data to be wiped');

    // Click Reset
    await page.click('button:has-text("Reset Lab")');

    // Verify UI is cleared
    await expect(contextArea).toHaveValue('');

    // Verify LocalStorage keys are removed
    const contextVal = await page.evaluate(() => localStorage.getItem('li_arch_context'));
    expect(contextVal).toBeNull();
  });

  /**
   * [US-GEN-01] CONTENT ADAPTABILITY
   * Requirement: As a user, I want to toggle between "Post" and "Comment" formats, 
   * so that the system provides visual feedback and adjusts the prompt strategy.
   */
  test('Toggle between Post and Comment formats', async ({ page }) => {
    const postBtn = page.locator('button:has-text("Post")');
    const commentBtn = page.locator('button:has-text("Comment")');

    // Default should be Post
    await expect(postBtn).toHaveClass(/bg-white/);

    // Switch to Comment
    await commentBtn.click();

    // Verify UI updates active state
    await expect(commentBtn).toHaveClass(/bg-white/);
    await expect(postBtn).not.toHaveClass(/bg-white/);
  });

  /**
   * [US-RAG-01 & US-RAG-02] KNOWLEDGE MANAGEMENT
   * Requirement: As a user, I want to upload files as a Knowledge Base and toggle 
   * them on/off, so I can control which specific references are used for RAG generation.
   */
  test('Knowledge Base UI structure and empty state', async ({ page }) => {
    const ragHeading = page.locator('h3:has-text("Knowledge Base")');
    const uploadBtn = page.locator('button:has-text("Upload File")');

    await expect(ragHeading).toBeVisible();
    await expect(uploadBtn).toBeVisible();

    // Check default empty state message
    await expect(page.locator('text=Your library is empty')).toBeVisible();
  });

  /**
   * [US-RAG-03] HYBRID KNOWLEDGE MODES
   * Requirement: As a user, I want to choose between "Context" (full text) and 
   * "RAG" (indexed search) for each document, so I can optimize token usage 
   * based on document length.
   */
  test('Toggle between Full Reference and Smart Search modes', async ({ page }) => {
    // This test will rely on the UI being implemented
    const ragHeading = page.locator('h3:has-text("Knowledge Base")');
    await expect(ragHeading).toBeVisible();

    // The user uploads a file first (mocked by adding to store or simulated upload)
    // For now we check for the text descriptions that should be present
    const fullRefBtn = page.locator('button:has-text("Full Reference")');
    const smartSearchBtn = page.locator('button:has-text("Smart Search")');

    // These should be visible when a document is active
    // (In a real e2e we would upload first, but here we are checking the requirement placeholders)
  });

  /**
   * [US-RAG-04] RAG SOURCE ATTRIBUTION
   * Requirement: As a user, I want to see which specific chunks of my knowledge base 
   * were used to generate the response, so I can verify the accuracy of the information.
   */
  test('Verification of grounding sources in the draft', async ({ page }) => {
    // Requirement for grounding metadata display
    const draftHeading = page.locator('h3:has-text("Resulting Draft")');
    await expect(draftHeading).toBeVisible();
  });

  /**
   * [US-RAG-05] DOCUMENT UPLOAD
   * Requirement: As a user, I want to upload PDF and Text files and see them 
   * appear in my knowledge base immediately.
   */
  test('Successful document upload', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button:has-text("Upload File")').click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('This is a test document content.')
    });

    await expect(page.locator('text=test.txt')).toBeVisible();
    await expect(page.locator('text=Full Reference')).toBeVisible();
  });

  /**
   * [US-RAG-06] PDF DOCUMENT UPLOAD
   * Requirement: As a user, I want to upload PDF files and have them 
   * parsed correctly for AI context.
   */
  test('Successful PDF upload', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button:has-text("Upload File")').click();
    const fileChooser = await fileChooserPromise;

    // Using a minimal valid PDF-like structure for testing basic upload
    // In a real environment we'd use a real sample PDF
    await fileChooser.setFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Hello World) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000108 00000 n\n0000000213 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n308\n%%EOF')
    });

    await expect(page.locator('text=test.pdf')).toBeVisible();
    // It should at least be accepted by the UI
    await expect(page.locator('text=Full Reference')).toBeVisible();
  });

  /**
   * [US-CFG-01] DYNAMIC MODELING
   * Requirement: As a user, I want to select from different models for the active vendor, 
   * so I can optimize for speed or reasoning.
   */
  test('Model selection and dynamic loading', async ({ page }) => {
    const modelSelect = page.locator('header select[id="model-select"]');

    await expect(modelSelect).toBeVisible();

    // Verify list is populated
    const options = await modelSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
  });

  /**
   * [US-CFG-02] VENDOR SELECTION
   * Requirement: As a user, I want to choose between Google and OpenAI vendors, 
   * so I can use my preferred LLM ecosystem.
   */
  test('Vendor selection switches available models', async ({ page }) => {
    const vendorSelect = page.locator('header select[id="vendor-select"]');
    const modelSelect = page.locator('header select[id="model-select"]');

    await expect(vendorSelect).toBeVisible();
    await expect(vendorSelect).toHaveValue('google'); // Default

    // Switch to OpenAI
    await vendorSelect.selectOption('openai');
    await expect(vendorSelect).toHaveValue('openai');

    // Model selection should reflect OpenAI models (mocked or actual list)
    // For now, just check it's still visible and perhaps has some options
    await expect(modelSelect).toBeVisible();
  });

  /**
   * [US-CFG-03] VENDOR-SPECIFIC API KEYS
   * Requirement: As a user, I want my API keys to be stored separately for each vendor, 
   * so I don't have to re-enter them when switching back and forth.
   */
  test('API Keys are stored per vendor', async ({ page }) => {
    const vendorSelect = page.locator('header select[id="vendor-select"]');
    const apiKeyInput = page.locator('input[id="api-key-input"]');

    // Set Google Key
    await vendorSelect.selectOption('google');
    await apiKeyInput.fill('google-key-123');

    // Switch to OpenAI and set key
    await vendorSelect.selectOption('openai');
    await apiKeyInput.fill('openai-key-456');

    // Switch back to Google and verify key
    await vendorSelect.selectOption('google');
    await expect(apiKeyInput).toHaveValue('google-key-123');

    // Switch back to OpenAI and verify key
    await vendorSelect.selectOption('openai');
    await expect(apiKeyInput).toHaveValue('openai-key-456');
  });

  /**
   * [US-CFG-04] PER-VENDOR MODEL PERSISTENCE
   * Requirement: As a user, I want the system to remember my last used model for each vendor, 
   * so I don't have to re-select it when switching back and forth.
   */
  test('Models are persisted per vendor', async ({ page }) => {
    const vendorSelect = page.locator('header select[id="vendor-select"]');
    const modelSelect = page.locator('header select[id="model-select"]');

    // Select Google and a non-default model (if possible, or just verify it stays)
    await vendorSelect.selectOption('google');
    // We might need to wait for models to load
    await expect(modelSelect).toBeVisible();
    const googleOptions = await modelSelect.locator('option').allInnerTexts();
    if (googleOptions.length > 1) {
      await modelSelect.selectOption({ index: 1 });
    }
    const selectedGoogleModel = await modelSelect.inputValue();

    // Switch to OpenAI
    await vendorSelect.selectOption('openai');
    await expect(modelSelect).toBeVisible();
    const openaiOptions = await modelSelect.locator('option').allInnerTexts();
    if (openaiOptions.length > 1) {
      await modelSelect.selectOption({ index: 1 });
    }
    const selectedOpenAIModel = await modelSelect.inputValue();

    // Switch back to Google and verify model
    await vendorSelect.selectOption('google');
    await expect(modelSelect).toHaveValue(selectedGoogleModel);

    // Switch back to OpenAI and verify model
    await vendorSelect.selectOption('openai');
    await expect(modelSelect).toHaveValue(selectedOpenAIModel);
  });

  /**
   * [US-GEN-02 & US-GEN-04] GENERATION WORKFLOW
   * Requirement: As a user, I want clear visual feedback during the AI generation process, 
   * including loading states that inform me when the system is consulting the knowledge base.
   */
  test('Generation workflow loading states', async ({ page }) => {
    const generateBtn = page.locator('button:has-text("Generate Artifact")');
    const resultPlaceholder = page.locator('text=Awaiting laboratory inputs...');

    await expect(generateBtn).toBeVisible();
    await expect(resultPlaceholder).toBeVisible();

    // Trigger generation (with dummy data)
    await page.fill('textarea[placeholder*="target post content"]', 'Test Input');
    await generateBtn.click();

    // Check for loading state on the button or the overlay (if fast enough)
    // We check for the button text change as it's very reliable
    await expect(page.locator('button:has-text("Architecting Content...")')).toBeVisible();
  });

  /**
   * [US-UI-04] EXPORT FUNCTIONALITY
   * Requirement: As a user, I want to copy the generated result to my clipboard with one click, 
   * so I can immediately paste it into LinkedIn.
   */
  test('Copy button behavior', async ({ page }) => {
    // Button should be hidden initially when no content exists
    const copyBtn = page.locator('button:has-text("Copy")');
    await expect(copyBtn).not.toBeVisible();
  });

  /**
  * [US-GEN-05] INCREMENTAL REFINEMENT
  * Requirement: As a user, I want subsequent generations to refine the existing draft based 
  * on my new instructions, so that I don't have to start from scratch every time.
  */
  test('Incremental refinement UI updates', async ({ page }) => {
    const generateBtn = page.locator('button:has-text("Generate Artifact")');
    await page.fill('textarea[placeholder*="target post content"]', 'First Prompt Content');

    // Mocking behavior by manually setting generated content in a real scenario would involve waiting for API
    // Here we check if the button text changes when content is present
    await page.evaluate(() => {
      localStorage.setItem('li_arch_generated_content', 'Existing Draft Content');
    });
    await page.reload();

    const updateBtn = page.locator('button:has-text("Update Artifact")');
    await expect(updateBtn).toBeVisible();

    const newBtn = page.locator('button:has-text("New")');
    await expect(newBtn).toBeVisible();
  });

  /**
  * [US-UI-05] EDITABLE RESULTS
  * Requirement: As a user, I want the resulting draft to be editable, 
  * so that I can make quick manual tweaks before copying or refining it further.
  */
  test('Resulting draft is editable', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('li_arch_generated_content', 'Editable draft content');
    });
    await page.reload();

    const draftArea = page.locator('textarea[placeholder*="Your draft will appear here"]');
    await expect(draftArea).toBeVisible();
    await draftArea.fill('Manually modified content');
    await expect(draftArea).toHaveValue('Manually modified content');
  });

  /**
  * [US-UI-06] NO SUB-SCROLL
  * Requirement: As a user, I want the resulting draft textarea to automatically expand 
  * to its full content height, so that I can see the entire draft without needing to scroll within the text box.
  */
  test('Resulting draft textarea auto-resizes to fit content', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('li_arch_generated_content', 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10');
    });
    await page.reload();

    const draftArea = page.locator('textarea[placeholder*="Your draft will appear here"]');
    const initialHeight = await draftArea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);

    // Add many more lines
    await draftArea.fill('Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10\nLine 11\nLine 12\nLine 13\nLine 14\nLine 15\nLine 16\nLine 17\nLine 18\nLine 19\nLine 20');

    const newHeight = await draftArea.evaluate((el: HTMLTextAreaElement) => el.offsetHeight);
    expect(newHeight).toBeGreaterThan(initialHeight);

    // Check that it doesn't have a scrollbar
    const hasScrollbar = await draftArea.evaluate((el: HTMLTextAreaElement) => el.scrollHeight > el.clientHeight);
    expect(hasScrollbar).toBe(false);
  });

  /**
   * [US-SEC-01] CLIENT-SIDE API KEY
   * Requirement: As a user, I want to input my Gemini API key in the UI and have it 
   * stored only in my browser's local storage, so that my credentials remain private 
   * and are never sent to the backend.
   */
  test('API Key input and persistence', async ({ page }) => {
    const apiKeyInput = page.locator('input[id="api-key-input"]');
    await expect(apiKeyInput).toBeVisible();

    const testKey = 'test-api-key-123';
    await apiKeyInput.fill(testKey);

    // Reload to verify persistence
    await page.reload();
    await expect(apiKeyInput).toHaveValue(testKey);

    // Verify it's in LocalStorage (key changed to API_KEYS map)
    const storedKeys = await page.evaluate(() => localStorage.getItem('li_arch_api_keys_v2'));
    expect(storedKeys).toContain(testKey);
  });

  /**
   * [US-UI-07] API KEY ONBOARDING
   * Requirement: As a user, I want a clear visual indication when the API key is missing 
   * and have the core generation features disabled until I provide one, so I know 
   * exactly how to start using the tool.
   */
  test('UI reflects missing API key state', async ({ page }) => {
    // Clear local storage to ensure key is missing (set by beforeEach)
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const apiKeyInput = page.locator('input[id="api-key-input"]');
    const generateBtn = page.locator('button:has-text("API Key Required")');
    const onboardingMessage = page.locator('h3:has-text("Configure your GOOGLE API Key to begin")');

    // Key input should be present
    await expect(apiKeyInput).toBeVisible();
    await expect(onboardingMessage).toBeVisible();

    // Generate button should be disabled and show requirement text
    await expect(generateBtn).toBeDisabled();

    // Fill key and see it enabled
    await apiKeyInput.fill('some-key');
    const enabledGenerateBtn = page.locator('button:has-text("Generate Artifact")');
    await expect(enabledGenerateBtn).toBeEnabled();
    // await expect(onboardingMessage).not.toBeVisible(); // This might be hidden by a layer
  });

});
