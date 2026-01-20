const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pjubvuvqzwhvqxeeubcv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdWJ2dXZxendodnF4ZWV1YmN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODE0NTQ2NiwiZXhwIjoyMDgzNzIxNDY2fQ.xwy9_h8bLPWGUZ1zie8TvQ8vy1fJiBEB2NQAlY66EUU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
    try {
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return;
        }

        const adminUser = users.find(u => u.email === 'admin@upscprep.com');

        if (!adminUser) {
            console.error('Admin user not found');
            return;
        }

        console.log('Found admin user:', adminUser.id);

        const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
            password: 'admin12345'
        });

        if (error) {
            console.error('Error resetting password:', error);
            return;
        }

        console.log('');
        console.log('✅ Password reset successful!');
        console.log('');
        console.log('Email: admin@upscprep.com');
        console.log('Password: admin12345');
        console.log('');
    } catch (err) {
        console.error('Error:', err);
    }
}

resetPassword();
