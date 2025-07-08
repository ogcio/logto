import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: './ogcio-e2e-tests',
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 0 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : 3, // Use single worker in CI to avoid overloading
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? [
		['junit', { outputFile: 'test-results/results.xml' }],
		['html', { outputFolder: 'playwright-report', open: 'never' }],
		['list']
	] : 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.LOGTO_ADMIN_URL || 'http://localhost:3302',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'retain-on-failure',
		/* Always record video in CI environment, retain only on failure */
		video: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
		/* Increase timeouts for CI environment */
		navigationTimeout: process.env.CI ? 60000 : 30000,
		actionTimeout: process.env.CI ? 30000 : 10000,
		/* Take screenshot on failure */
		screenshot: 'only-on-failure',
	},

	/* Timeout for each test */
	timeout: process.env.CI ? 90000 : 30000,

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		// {
		//     name: 'firefox',
		//     use: { ...devices['Desktop Firefox'] },
		// },
		// {
		//     name: 'webkit',
		//     use: { ...devices['Desktop Safari'] },
		// },
	],

	/* Run your local dev server before starting the tests */
	// webServer: [
	//     {
	//         command: 'pnpm dev',
	//         url: 'http://localhost:3301',
	//         reuseExistingServer: !process.env.CI,
	//         timeout: 120 * 1000,
	//     },
	//     {
	//         command: 'cd mygovid-mock-service && pnpm dev',
	//         url: 'http://localhost:4005',
	//         reuseExistingServer: !process.env.CI,
	//         timeout: 30 * 1000,
	//     },
	// ],
});
