import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/upsc_app';

// Check if this is a Supabase pooler connection
const isPooler = connectionString.includes('pooler.supabase.com');

// Add connection options with better error handling
const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30, // Increased timeout for pooler
    ssl: isPooler ? { rejectUnauthorized: false } : false, // Enable SSL for pooler
    onnotice: () => { }, // Suppress notices
    prepare: false, // Required for transaction pooler (port 6543)
});

// Test connection on startup
if (connectionString && !connectionString.includes('localhost')) {
    client`SELECT 1`
        .then(() => {
            console.log('✅ Database connection established');
        })
        .catch((error) => {
            console.error('❌ Database connection failed:', error.message);
            console.error('💡 Please check:');
            console.error('   1. DATABASE_URL in .env.local is correct');
            console.error('   2. Supabase project is active (not paused)');
            console.error('   3. Database password is correct');
            console.error('   4. Get exact connection string from: Supabase Dashboard > Connect button');
        });
}

export const db = drizzle(client, { schema });

