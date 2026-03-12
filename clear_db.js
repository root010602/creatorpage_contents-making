const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAll() {
    console.log('Clearing tracks...');
    await supabase.from('tracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Clearing spots...');
    await supabase.from('spots').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Clearing contents...');
    const { error: contentsError } = await supabase.from('contents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (contentsError) {
        console.error('Error clearing contents:', contentsError);
    } else {
        console.log('All contents cleared successfully.');
    }
}

clearAll();
