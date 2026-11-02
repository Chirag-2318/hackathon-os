import { describe, it, expect } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPrompts, STEP_PROMPTS, buildPromptInstructions } from '../src/prompts.js';

describe('Prompts', () => {
  it('registers all five prompts from the shared builder function', () => {
    const server = new McpServer({ name: 'test-mcp', version: '1.0.0' });
    registerPrompts(server);

    // Verify all 5 keys are configured in STEP_PROMPTS
    const expectedKeys = ['prd', 'tech', 'phases', 'tasks', 'demo'];
    expect(STEP_PROMPTS.map((p) => p.key)).toEqual(expectedKeys);

    for (const stepConfig of STEP_PROMPTS) {
      expect(stepConfig.title).toBeDefined();
      expect(stepConfig.description).toBeDefined();
      expect(stepConfig.stepDisplayName).toBeDefined();

      // Test instruction output with room argument
      const text1 = buildPromptInstructions(stepConfig, 'AlphaRoom');
      expect(text1).toContain('provided room input "AlphaRoom"');
      expect(text1).toContain('1. **Resolve the room**');
      expect(text1).toContain('2. **Retrieve the step brief**');
      expect(text1).toContain('3. **Produce and submit documents**');
      expect(text1).toContain('4. **Handle validation repairs (if needed)**');
      expect(text1).toContain('5. **Handle warnings confirmation**');
      expect(text1).toContain('6. **Final output**');
      expect(text1).toContain('=====FILE: filename.md=====');

      // Test instruction output without room argument
      const text2 = buildPromptInstructions(stepConfig, undefined);
      expect(text2).toContain('no room specified');
      expect(text2).toContain('If no room was provided and the user has exactly one room, use that room');
    }
  });
});
