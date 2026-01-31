import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function updateAdmin() {
    const email = 'vamsi@prepassist.in';
    const password = 'adminuservamsi';

    console.log(`Updating user: ${email}`);

    // Get user id
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found, creating...');
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });
        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log('User created successfully:', createData.user?.id);
        }
    } else {
        console.log('User found, updating password and metadata...');
        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'admin' }
            }
        );
        if (updateError) {
            console.error('Error updating user:', updateError);
        } else {
            console.log('User updated successfully');
        }
    }
}

updateAdmin();
