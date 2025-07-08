# OGCIO E2E Tests CI Pipeline Setup

This document describes how to set up the OGCIO E2E tests CI pipeline using Azure DevOps.

## Pipeline File

The CI pipeline is defined in `OGCIO-tests.yml` and runs the Playwright e2e tests in the `ogcio-e2e-tests/` folder.

## Required Azure DevOps Setup

### 1. Variable Groups

Create a variable group named `ogcio-e2e-test-credentials` in Azure DevOps Library with the following variables:

#### Development Environment (Tests only run on dev branch and PRs)
- `TEST_USERNAME_DEV`: The admin username for the dev environment
- `TEST_PASSWORD_DEV`: The admin password for the dev environment

**Note**: E2E tests only run against the dev environment, so UAT and production credentials are not needed.

### 2. Pipeline Configuration

1. In Azure DevOps, create a new pipeline
2. Choose "Existing Azure Pipelines YAML file"
3. Select `OGCIO-tests.yml` from the repository
4. Save and run

### 3. Environment URLs

The pipeline automatically constructs the Logto admin URLs based on the environment:
- **Dev**: `https://logto-admin-LifeEvents-dev.ogcio.gov.ie`
- **UAT**: `https://logto-admin-LifeEvents-uat.ogcio.gov.ie`  
- **Prod**: `https://logto-admin-LifeEvents-prd.ogcio.gov.ie`

## Pipeline Features

- **Triggers**: Runs on pushes to `dev`, `uat`, and `prod` branches, and on all pull requests
- **Security Scanning**: Includes GitLeaks security scan
- **Test Results**: Publishes JUnit test results and HTML reports
- **Artifacts**: Uploads Playwright reports and test results as pipeline artifacts
- **Environment-specific**: Tests run against the appropriate environment based on the branch

## Local Development

To run the tests locally:

```bash
# Install dependencies (includes dotenv)
pnpm install

# Install Playwright browsers
npx playwright install

# Create .env file with your test credentials
echo "LOGTO_ADMIN_URL=http://localhost:3302" > .env
echo "TEST_USERNAME=your-username" >> .env
echo "TEST_PASSWORD=your-password" >> .env

# Or set environment variables directly
export LOGTO_ADMIN_URL="http://localhost:3302"
export TEST_USERNAME="your-username"  
export TEST_PASSWORD="your-password"

# Run tests
pnpm exec playwright test
```

## Test Structure

The tests are located in `ogcio-e2e-tests/` and include:
- User management (create, assign roles, delete)
- Organization verification
- Role verification  
- API resource verification
- Connector verification
- Branding verification

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Verify the TEST_USERNAME and TEST_PASSWORD variables are correctly set in the variable group
2. **Network Issues**: Ensure the pipeline agents can access the target environment URLs
3. **Test Timeouts**: The pipeline uses Chromium only to speed up test execution

### Viewing Results

- Test results are published to Azure DevOps Tests tab
- HTML reports are available as pipeline artifacts
- Failed tests include screenshots and traces for debugging
