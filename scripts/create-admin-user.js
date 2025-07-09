const { execSync } = require('child_process');

async function createAdminUser() {
  try {
    const username = process.env.TEST_USERNAME || 'admin';
    const password = process.env.TEST_PASSWORD || 'admin123';
    
    console.log('Creating admin user via Logto API...');
    
    // First get an access token for the Management API
    const tokenResponse = execSync(`
      curl -s -X POST "http://localhost:3301/oidc/token" \\
        -H "Content-Type: application/x-www-form-urlencoded" \\
        -d "grant_type=client_credentials&client_id=admin_console&scope=all"
    `, { encoding: 'utf-8' });
    
    const tokenData = JSON.parse(tokenResponse);
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token: ' + tokenResponse);
    }
    
    console.log('Got access token, creating user...');
    
    // Create the user via Management API
    const createUserResponse = execSync(`
      curl -s -X POST "http://localhost:3302/api/users" \\
        -H "Authorization: Bearer ${tokenData.access_token}" \\
        -H "Content-Type: application/json" \\
        -d '{"username": "${username}", "password": "${password}"}'
    `, { encoding: 'utf-8' });
    
    const userData = JSON.parse(createUserResponse);
    if (!userData.id) {
      // Check if user already exists
      console.log('User creation response:', createUserResponse);
      console.log('User may already exist, trying to find existing user...');
      
      const getUserResponse = execSync(`
        curl -s "http://localhost:3302/api/users?search=${username}" \\
          -H "Authorization: Bearer ${tokenData.access_token}"
      `, { encoding: 'utf-8' });
      
      const users = JSON.parse(getUserResponse);
      const existingUser = users.find ? users.find(user => user.username === username) : null;
      
      if (existingUser) {
        console.log('Found existing user:', existingUser.id);
        userData.id = existingUser.id;
      } else {
        throw new Error('Failed to create user and no existing user found: ' + createUserResponse);
      }
    }
    
    console.log('User created/found with ID:', userData.id);
    
    // Get all available roles
    console.log('Getting available roles...');
    const rolesResponse = execSync(`
      curl -s "http://localhost:3302/api/roles" \\
        -H "Authorization: Bearer ${tokenData.access_token}"
    `, { encoding: 'utf-8' });
    
    const roles = JSON.parse(rolesResponse);
    if (!roles || !Array.isArray(roles)) {
      throw new Error('Failed to get roles: ' + rolesResponse);
    }
    
    console.log('Found', roles.length, 'roles');
    
    // Filter to only user roles (not machine-to-machine roles)
    const userRoles = roles.filter(role => role.type !== 'MachineToMachine');
    console.log('Found', userRoles.length, 'user roles');
    
    // Assign all user roles to the admin user
    if (userRoles.length > 0) {
      const roleIds = userRoles.map(role => role.id);
      console.log('Assigning roles to user...');
      
      const assignRolesResponse = execSync(`
        curl -s -X POST "http://localhost:3302/api/users/${userData.id}/roles" \\
          -H "Authorization: Bearer ${tokenData.access_token}" \\
          -H "Content-Type: application/json" \\
          -d '{"roleIds": ${JSON.stringify(roleIds)}}'
      `, { encoding: 'utf-8' });
      
      console.log('Role assignment response:', assignRolesResponse);
    }
    
    console.log('✅ Admin user created and configured successfully');
    console.log('Username:', username);
    console.log('User ID:', userData.id);
    
  } catch (error) {
    console.error('❌ Admin user creation failed:', error.message);
    process.exit(1);
  }
}

createAdminUser();
