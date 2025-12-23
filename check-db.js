
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
    const submissionId = 'b6306e82-0557-449f-8c6d-bb947de45669'
    console.log('Checking for submission:', submissionId)

    const { data: analysis, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('submission_id', submissionId)

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Analysis Record:', analysis)
    }
}

check()
