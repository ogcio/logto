import { Page } from '@playwright/test';
import { handleWelcomePageAfterLogin } from './api-helpers';

/**
 * Login to Logto Admin console
 * @param page - Playwright page object
 * @param adminUrl - The Logto admin URL (defaults to localhost:3302)
 * @param username - Username for login
 * @param password - Password for login
 */

export async function loginToLogtoAdmin(
    page: Page,
    adminUrl: string = 'http://localhost:3302',
    username: string,
    password: string
): Promise<void> {
    console.log('Logging in to Logto admin console...');
    await page.goto(adminUrl);
    console.log('debug: we are currently on '+ page.url());
    
    // Fill in login credentials
    await page.locator('input[name="identifier"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for login to complete
    await page.waitForLoadState('networkidle');
    console.log('After login, current URL:', page.url());
    
    // Handle welcome page if redirected there
    await handleWelcomePageAfterLogin(page, adminUrl);
    
    console.log('Login completed, final URL:', page.url());
}

export async function addNewUser(
    page: Page,
    email: string,
    phone: string,
    username: string,
    displayName: string
): Promise<void> {
    await page.getByRole('link', { name: 'User management' }).click();
    await page.getByRole('button', { name: 'Add user' }).click();
    await page.getByRole('textbox').nth(0).fill(email);
    await page.getByRole('textbox').nth(1).fill(phone);
    await page.getByRole('textbox').nth(2).fill(username);
    await page.getByRole('textbox').nth(3).fill(displayName);
    await page.getByRole('button', { name: 'Add user' }).click();
}