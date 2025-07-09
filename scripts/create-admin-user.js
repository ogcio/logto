const { execSync } = require('child_process');
const crypto = require('crypto');

// Import hash-wasm for Argon2i
const { argon2i } = require('hash-wasm');

async function createAdminUser() {
  try {
    const username = process.env.TEST_USERNAME || 'admin';
    const password = process.env.TEST_PASSWORD || 'admin123';
    const userId = 'admin-' + Date.now();
    
    console.log('Encrypting password with Argon2i...');
    
    // Encrypt password using Argon2i (same as Logto)
    const salt = crypto.randomBytes(16);
    const hashedPassword = await argon2i({
      password: password,
      salt: salt,
      iterations: 256,
      parallelism: 1,
      memorySize: 4096,
      hashLength: 32,
      outputType: 'encoded'
    });
    
    console.log('Inserting admin user into database...');
    
    // Insert admin user with hashed password
    const insertUserQuery = `INSERT INTO users (id, username, primary_email, name, password_encrypted, password_encryption_method, created_at) VALUES ('${userId}', '${username}', 'admin@test.com', 'Test Admin', '${hashedPassword}', 'Argon2i', NOW()) ON CONFLICT (username) DO UPDATE SET password_encrypted = EXCLUDED.password_encrypted, password_encryption_method = EXCLUDED.password_encryption_method;`;
    
    execSync(`docker exec postgres psql -U postgres -d logto -c "${insertUserQuery}"`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Admin user created successfully');
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error.message);
    process.exit(1);
  }
}

createAdminUser();
