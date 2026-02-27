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

async function inspectSchema() {
    console.log('--- Inspecting Table Schema ---');
    // Try to get one row to see columns
    const { data, error } = await supabase
        .from('contents')
        .select('*')
        .limit(1);

    if (error) {
        console.error('SCHEMA INSPECTION FAILED:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Found row. Columns:', Object.keys(data[0]));
    } else {
        console.log('Table is empty. Cannot inspect via row.');
        // Try to insert a dummy row with just title and see what happens
        const { data: dummy, error: dummyError } = await supabase
            .from('contents')
            .insert([{ title: 'Schema Test' }])
            .select();
        if (dummy && dummy[0]) {
            console.log('Inserted dummy. Columns:', Object.keys(dummy[0]));
        } else {
            console.error('Dummy insert failed:', dummyError);
        }
    }
}

async function testFullFlow() {
    console.log('--- Phase 1: Exhaustive Record Insert ---');
    const payload = {
        title: "Full Field Test",
        type: "electronic_book",
        category: "guidebook",
        city: "Seoul",
        description: "", // Empty string check
        museum_name: "", // Empty string check
        museum_link: "", // Empty string check
        map_type: "",    // Empty string check
        status: 'Draft',
        updated_at: new Date().toISOString(),
        price: null,
        thumbnail_url: null,
        gallery_urls: null,
        epub_url: null
    };

    const { data: insertData, error: insertError } = await supabase
        .from('contents')
        .insert([payload])
        .select();

    if (insertError) {
        console.error('FULL INSERT FAILED:', JSON.stringify(insertError, null, 2));
        if (insertError.code === '42703') {
            console.error('Note: Error 42703 indicates a missing column. Check museum_name, museum_link, map_type etc.');
        }
        return;
    }

    const newId = insertData[0].id;
    console.log('FULL INSERT SUCCESSFUL, ID:', newId);

    console.log('--- Phase 2: Update Existing Record (Simulation of 2nd Save) ---');
    const updatePayload = {
        id: newId,
        title: "Updated Title",
        type: "electronic_book",
        updated_at: new Date().toISOString()
    };

    const { data: updateData, error: updateError } = await supabase
        .from('contents')
        .upsert([updatePayload])
        .select();

    if (updateError) {
        console.error('UPDATE/UPSERT FAILED:', JSON.stringify(updateError, null, 2));
    } else {
        console.log('UPDATE/UPSERT SUCCESSFUL');
    }
}

async function main() {
    await inspectSchema();
    await testFullFlow();
}

main();
