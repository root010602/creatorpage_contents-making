const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpsert() {
    console.log('Testing full "upsert" on "contents" table...');
    const { data, error } = await supabase
        .from('contents')
        .upsert([
            {
                title: "Debug Save Test",
                type: "audio_video",
                category: "museum",
                city: "Paris",
                description: "Testing RLS and primary key logic",
                museum_name: "Louvre",
                museum_link: "https://louvre.fr",
                map_type: "image_map",
                status: 'Draft',
                updated_at: new Date().toISOString(),
            }
        ]);

    if (error) {
        console.error('UPSERT FAILED:', JSON.stringify(error, null, 2));
    } else {
        console.log('UPSERT SUCCESSFUL:', data);
    }
}

testUpsert();
