
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
  });

  /**
   * [US-UI-01] PERSISTENCE
   * Requirement: As a busy professional, I want my text inputs to persist across browser refreshes, 
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
   * Requirement: As a writer, I want to toggle between "Post" and "Comment" formats, 
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
   * Requirement: As a professional, I want to upload files as a Knowledge Base and toggle 
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
   * Requirement: As a power user, I want to select from different Gemini models, 
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
   * Requirement: As a writer, I want to copy the generated result to my clipboard with one click, 
   * so I can immediately paste it into LinkedIn.
   */
  test('Copy button behavior', async ({ page }) => {
    // Button should be hidden initially when no content exists
    const copyBtn = page.locator('button:has-text("Copy")');
    await expect(copyBtn).not.toBeVisible();
  });

});
