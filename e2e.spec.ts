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
    const apiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
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
    const uploadBtn = page.locator('button:has-text("Local Upload")');

    await expect(ragHeading).toBeVisible();
    await expect(uploadBtn).toBeVisible();

    // Check default empty state message
    await expect(page.locator('text=No knowledge base files.')).toBeVisible();
  });

  /**
   * [US-CFG-01] DYNAMIC MODELING
   * Requirement: As a user, I want to select from different Gemini models, 
   * so I can optimize for speed (Flash) or reasoning (Pro).
   */
  test('Model selection and dynamic loading', async ({ page }) => {
    const modelSelect = page.locator('header select');

    await expect(modelSelect).toBeVisible();
    const initialModel = await modelSelect.inputValue();
    expect(initialModel).toContain('gemini');

    // Verify list is populated
    const options = await modelSelect.locator('option').count();
    expect(options).toBeGreaterThan(0);
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

    // Check for "Consulting..." state
    const loadingText = page.locator('text=Consulting Knowledge Base...');
    await expect(loadingText).toBeVisible();
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
    const apiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    await expect(apiKeyInput).toBeVisible();

    const testKey = 'test-api-key-123';
    await apiKeyInput.fill(testKey);

    // Reload to verify persistence
    await page.reload();
    await expect(apiKeyInput).toHaveValue(testKey);

    // Verify it's in LocalStorage
    const storedKey = await page.evaluate(() => localStorage.getItem('li_arch_api_key'));
    expect(storedKey).toBe(testKey);
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

    const apiKeyInput = page.locator('input[placeholder*="Gemini API Key"]');
    const generateBtn = page.locator('button:has-text("API Key Required")');
    const onboardingMessage = page.locator('text=Configure your Gemini API Key to begin');

    // Key input should be present
    await expect(apiKeyInput).toBeVisible();
    await expect(onboardingMessage).toBeVisible();

    // Generate button should be disabled and show requirement text
    await expect(generateBtn).toBeDisabled();

    // Fill key and see it enabled
    await apiKeyInput.fill('some-key');
    const enabledGenerateBtn = page.locator('button:has-text("Generate Artifact")');
    await expect(enabledGenerateBtn).toBeEnabled();
    await expect(onboardingMessage).not.toBeVisible();
  });

});
