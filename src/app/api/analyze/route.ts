// ... (imports remain)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { model } from '@/lib/gemini';
import ExifReader from 'exifreader';

export async function POST(req: NextRequest) {
    try {
        const { imagePath, category, goals, context } = await req.json();

        // 0. Auth & Credit Check (Optional)
        const supabaseUser = await createClient();
        const { data: { user } } = await supabaseUser.auth.getUser();

        const supabase = createAdminClient();

        if (user) {
            // Check credits
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits_balance')
                .eq('id', user.id)
                .single();

            if (!profile || (profile.credits_balance || 0) < 1) {
                return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
        }

        if (!imagePath) {
            return NextResponse.json({ error: 'Image path required' }, { status: 400 });
        }


        // 1. Download image from Supabase Storage (Prefer Preview)
        const previewPath = imagePath.replace('uploads/', 'previews/');

        // Try downloading preview first
        let fileData, downloadError;

        ({ data: fileData, error: downloadError } = await supabase
            .storage
            .from('submissions')
            .download(previewPath));

        // Fallback to original if preview missing
        if (downloadError) {
            console.log("Preview not found, falling back to original:", imagePath);
            ({ data: fileData, error: downloadError } = await supabase
                .storage
                .from('submissions')
                .download(imagePath));
        }

        if (downloadError || !fileData) {
            console.error('Download error:', downloadError);
            return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
        }

        // 2. Convert to base64 for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // 2a. Download ORIGINAL for EXIF (since preview strips it)
        let originalBuffer = arrayBuffer;
        if (imagePath.includes('uploads/')) {
            // If we downloaded preview above, we need to fetch original for EXIF
            // Check if fileData is actually the preview?
            // Actually, we can just attempt to download original separately if we are using preview for AI

            // To be efficient, let's just try to grab original if we haven't already
            if (previewPath !== imagePath && !downloadError) {
                const { data: originalData, error: originalErr } = await supabase
                    .storage
                    .from('submissions')
                    .download(imagePath)

                if (originalData && !originalErr) {
                    originalBuffer = await originalData.arrayBuffer()
                }
            }
        }

        // 2a. Extract EXIF Metadata
        let exifData: any = {}
        let technicalContext = ""
        try {
            const tags = ExifReader.load(originalBuffer);
            // Extract key fields
            if (tags) {
                exifData = {
                    make: tags['Make']?.description,
                    camera: tags['Model']?.description,
                    lens: tags['LensModel']?.description,
                    iso: tags['ISOSpeedRatings']?.description,
                    focal_length: tags['FocalLength']?.description,
                    aperture: tags['FNumber']?.description,
                    shutter_speed: tags['ExposureTime']?.description,
                    exposure_comp: tags['ExposureBiasValue']?.description,
                    metering: tags['MeteringMode']?.description,
                    flash: tags['Flash']?.description,
                    datetime: tags['DateTimeOriginal']?.description
                }

                // Clean undefined values
                Object.keys(exifData).forEach(key => exifData[key] === undefined && delete exifData[key]);

                if (Object.keys(exifData).length > 0) {
                    technicalContext = `
                     Camera Settings (EXIF Data):
                     Camera: ${exifData.make || ''} ${exifData.camera || 'Unknown'}
                     Lens: ${exifData.lens || 'Unknown'}
                     Settings: ISO ${exifData.iso || 'Auto'}, ${exifData.focal_length || ''}, ${exifData.aperture || ''}, ${exifData.shutter_speed || ''}
                     Exposure: ${exifData.exposure_comp || '0'} EV, Metering: ${exifData.metering || 'Unknown'}, Flash: ${exifData.flash || 'Unknown'}
                     Timestamp: ${exifData.datetime || 'Unknown'}
                     `
                }
            }
        } catch (e) {
            console.log("EXIF Extraction failed (non-critical):", e)
        }

        // 3. Construct Prompt
        const prompt = `
      Act as a world-class photography mentor. Analyze this ${category || 'photo'} based on these goals: ${goals?.join(', ')}.
      User Context: ${context || 'None provided.'}
      ${technicalContext}
      
      Provide the response in ANY valid JSON format. Do NOT use markdown code blocks.
      The JSON structure must include:
      - title: specific to the subject
      - scores: { composition: 0-100, technique: 0-100, creativity: 0-100, overall: 0-100 }
      - nsfw_score: 0-100 (likelihood of NSFW content or nudity. 0 = clean, 100 = explicit)
      - description: 1-2 sentence aesthetic summary
      - strengths: array of 2-3 strings
      - improvements: array of objects { title, description, priority: 'high'|'medium'|'low' }
      - technical_assessment: string (lighting, focus, etc.)
      - next_steps: array of actionable drills
      - preview_summary: A 2-3 sentence overview of the analysis for the photo
    `;

        // 4. Call Gemini
        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: fileData.type || 'image/jpeg'
                }
            }
        ]);

        const responseText = result.response.text();
        let analysisData;

        try {
            // Clean up markdown code blocks if Gemini adds them
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            analysisData = JSON.parse(jsonStr);
        } catch (e) {
            console.error("JSON Parse Error", responseText);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // 5. Store Result in DB & Deduct Credit

        // A. Create Submission Record
        const submissionPayload: any = {
            image_path: imagePath,
            thumbnail_path: previewPath,
            category,
            goals,
            context,
            metadata: exifData,
            status: 'done'
        };

        if (user) {
            submissionPayload.user_id = user.id;
        }

        const { data: submissionData, error: submissionError } = await supabase
            .from('submissions')
            .insert(submissionPayload)
            .select('id')
            .single();

        if (submissionError || !submissionData) {
            console.error('Submission Insert Error:', submissionError);
            return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
        }

        const submissionId = submissionData.id;

        // B. Create Analysis Record (Unlocked only if user exists/paid)
        const AnalysisDataFormatted = {
            submission_id: submissionId,
            full_critique: analysisData,
            preview_text: analysisData.preview_summary,
            title: analysisData.title,
            is_unlocked: !!user, // Unlocked if user exists (and paid via credit)
            score: analysisData.scores?.overall || analysisData.score // Handle both new and potentially old/fallback formats
        };

        const { error: analysisError } = await supabase
            .from('analyses')
            .insert(AnalysisDataFormatted);

        if (analysisError) {
            console.error('Analysis Insert Error:', analysisError);
            return NextResponse.json({ error: `Failed to save analysis: ${analysisError.message || JSON.stringify(analysisError)}` }, { status: 500 });
        }

        if (user) {
            // Deduct Credit (Best Effort)
            const { error: rpcError } = await supabase.rpc('decrement_credits', { userid: user.id, count: 1 });

            if (rpcError) {
                console.warn("RPC Failed, falling back to manual update", rpcError);
                // Fallback
                const { data: current } = await supabase.from('profiles').select('credits_balance').eq('id', user.id).single();
                if (current) {
                    await supabase.from('profiles').update({ credits_balance: (current.credits_balance || 0) - 1 }).eq('id', user.id);
                }
            }
        }

        // Return the Submission ID to the frontend
        return NextResponse.json({ success: true, id: submissionId });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
