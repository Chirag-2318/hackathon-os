import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:5173',
});

test.describe('Pitch Kit Q&A Panel', () => {
  const roomId = '00000000-0000-0000-0000-000000000001';

  test('renders Q&A without crashing when hardTruths and drills contain title and text objects', async ({ page }) => {
    // 1. Generic catch-all for any unmocked backend api calls (scoped to /api/v1/ so Vite's src/api/* is not intercepted)
    await page.route('**/api/v1/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    // 2. User authentication endpoint for ProtectedRoute
    await page.route('**/api/v1/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-1',
          name: 'Alex Builder',
          displayName: 'Alex',
          email: 'alex@example.com',
          username: 'alex',
          onboardingCompleted: true,
        }),
      });
    });

    // 3. Room endpoints
    await page.route(`**/api/v1/rooms/${roomId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: roomId,
          name: 'Room 1',
          stage: 'build',
          myRole: 'LEADER',
          isLeader: true,
        }),
      });
    });

    await page.route(`**/api/v1/rooms/${roomId}/overview`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: roomId,
          name: 'Room 1',
          stage: 'build',
          myRole: 'LEADER',
          isLeader: true,
          clock: {
            serverNow: Date.now(),
            startsInMs: 0,
            endsInMs: 86400000,
          },
        }),
      });
    });

    // 4. Pitch kit endpoints
    await page.route(`**/api/v1/rooms/${roomId}/pitch/demo`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.route(`**/api/v1/rooms/${roomId}/pitch/rehearse`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ runs: [] }) });
    });

    await page.route(`**/api/v1/rooms/${roomId}/pitch/qa`, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ questions: [] }) });
    });

    // 5. Intercept qna-doc API call and return structured items
    await page.route(`**/api/v1/rooms/${roomId}/pitch/qna-doc`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          exists: true,
          docVersion: 1,
          parseFailed: false,
          rawMarkdown: '',
          practicedCount: 1,
          totalCount: 3,
          categories: [
            {
              name: 'Problem and user',
              questions: [
                {
                  hash: 'q-hash-1',
                  question: 'Who is the primary user?',
                  owner: 'alex',
                  answer: 'Independent developers attending 48-hour hackathons.',
                  followUp: 'How did you validate this?',
                  counter: 'What about large enterprise teams?',
                  proof: 'Survey of 120 hackathon participants.',
                  practiced: true,
                },
              ],
            },
          ],
          codeDefenseDrills: [
            {
              title: 'Database connection failover',
              text: 'Fallback to read-only replica with exponential backoff.',
            },
          ],
          hardTruths: [
            {
              title: 'Mobile latency',
              text: 'Cold starts on 4G take 1.2s before the service worker warms up.',
            },
          ],
          questionsToAskJudges: [
            {
              title: 'Scale vs Polish',
              text: 'Would you prefer to see 3 finished features or 10 skeleton features?',
            },
          ],
          aiDraftQuestions: [],
          planStep: 4,
        }),
      });
    });

    // Navigate to Pitch Kit page with QA panel open
    await page.goto(`/app/room/${roomId}/pitch-kit?open=qa`);

    // Verify Pitch Kit header renders
    await expect(page.getByRole('heading', { name: 'Pitch kit', level: 1 })).toBeVisible({ timeout: 15000 });

    // Verify Q&A panel content rendered without React errors
    await expect(page.getByText('Judge Q&A Defense')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Who is the primary user?')).toBeVisible();

    // Verify code defense drill rendered with title and text
    await expect(page.getByText('Code defense drills')).toBeVisible();
    await expect(page.getByText('Database connection failover:')).toBeVisible();
    await expect(page.getByText('Fallback to read-only replica with exponential backoff.')).toBeVisible();

    // Verify hard truths rendered with title and text
    await expect(page.getByText('Hard truths to acknowledge')).toBeVisible();
    await expect(page.getByText('Mobile latency:')).toBeVisible();
    await expect(page.getByText('Cold starts on 4G take 1.2s before the service worker warms up.')).toBeVisible();

    // Verify questions to ask judges rendered with title and text
    await expect(page.getByText('Questions to ask the judges')).toBeVisible();
    await expect(page.getByText('Scale vs Polish:')).toBeVisible();
    await expect(page.getByText('Would you prefer to see 3 finished features or 10 skeleton features?')).toBeVisible();
  });
});

