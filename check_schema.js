const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    // Fetch one row to see structure
    const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        // If empty table, try to insert dummy to fail and list cols? No, hard to see.
        // Try listing tables or assuming empty.
        console.log('Table empty or no data returned.');

        // We can try to insert a dummy object with a random key and see the specific error "column does not exist"
        const { error: insertError } = await supabase.from('submissions').insert({
            thumbnail_path: 'test',
            // minimal required (guess)
            image_path: 'test',
            status: 'error'
        });

        if (insertError) {
            console.log('Insert Test Error:', insertError.message);
        } else {
            console.log('Insert Test Success (means column exists)');
        }
    }
}

checkSchema();
