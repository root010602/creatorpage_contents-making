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

async function checkColumns() {
    const columnsToTest = [
        'title', 'type', 'category', 'city', 'description',
        'museum_name', 'museum_link', 'map_type', 'status', 'updated_at'
    ];

    console.log('Testing individual columns in "contents" table...');

    for (const col of columnsToTest) {
        const { error } = await supabase
            .from('contents')
            .select(col)
            .limit(1);

        if (error && error.code === 'PGRST204') {
            console.log(`[MISSING] Column "${col}" is not found.`);
        } else if (error) {
            console.log(`[ERROR] Column "${col}": ${error.message}`);
        } else {
            console.log(`[EXISTS] Column "${col}" exists.`);
        }
    }
}

checkColumns();
