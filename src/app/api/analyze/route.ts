// ... (imports remain)
// ... (imports remain)
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { model } from '@/lib/gemini';
import ExifReader from 'exifreader';
import { Logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

// Helper to clean up orphaned files
async function cleanupFiles(supabase: ReturnType<typeof createAdminClient>, imagePath: string) {
    if (!imagePath) return;
    try {
        const pathsToCheck = [
            imagePath,
            imagePath.replace('uploads/', 'previews/'),
        ]
        Logger.info(`[Cleanup] Removing orphaned files: ${pathsToCheck.join(', ')}`)
        await supabase.storage.from('submissions').remove(pathsToCheck)
    } catch (e) {
        Logger.error('[Cleanup] Failed to remove files', e)
    }
}

export async function POST(req: NextRequest) {
    let imagePath = '';
    const supabase = createAdminClient();

    // Tracks whether a credit was atomically deducted for this request, so
    // any failure path below can refund it. Deducting up front (instead of
    // after Gemini returns) closes a race where two concurrent requests
    // from a user with 1 credit could both pass a "check" step before
    // either decremented — see check_and_decrement_credits in
    // supabase/migrations/20260721000001_credit_fixes.sql.
    let deductedUserId: string | null = null;
    const refundCreditIfDeducted = async () => {
        if (deductedUserId) {
            await supabase.rpc('increment_credits', { userid: deductedUserId, count: 1 });
            deductedUserId = null;
        }
    };

    try {
        const body = await req.json();
        imagePath = body.imagePath;
        const { category, goals, context, lessonId } = body;

        // 0. Auth & atomic Credit Check-and-Deduct (Optional; guests skip)
        const supabaseUser = await createClient();
        const { data: { user } } = await supabaseUser.auth.getUser();

        // Rate limit before spending any credit or calling Gemini. Keyed by
        // user id when logged in, otherwise by IP (guests share no other
        // stable identifier here).
        const rateLimitKey = user ? `analyze:${user.id}` : `analyze:${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'}`;
        const withinRateLimit = await checkRateLimit(supabase, rateLimitKey, 5, 60);
        if (!withinRateLimit) {
            await cleanupFiles(supabase, imagePath);
            return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429 });
        }

        if (user) {
            const { data: deducted } = await supabase.rpc('check_and_decrement_credits', { userid: user.id, count: 1 });

            if (deducted !== true) {
                await cleanupFiles(supabase, imagePath);
                return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
            deductedUserId = user.id;
        }

        if (!imagePath) {
            await refundCreditIfDeducted();
            return NextResponse.json({ error: 'Image path required' }, { status: 400 });
        }


        // 1. Fetch the preview, the original (EXIF lives only there — the
        // preview strips it) and the lesson row concurrently. They're
        // independent, so this costs one round-trip instead of three, and a
        // missing preview no longer triggers a second download of the original.
        const previewPath = imagePath.replace('uploads/', 'previews/');
        const bucket = supabase.storage.from('submissions');

        const [previewResult, originalResult, lessonResult] = await Promise.all([
            bucket.download(previewPath),
            previewPath !== imagePath ? bucket.download(imagePath) : Promise.resolve(null),
            lessonId
                ? supabase.from('lessons').select('id, title, learning_goals').eq('id', lessonId).single()
                : Promise.resolve({ data: null }),
        ]);

        const previewData = previewResult.error ? null : previewResult.data;
        const originalData = originalResult && !originalResult.error ? originalResult.data : null;

        if (!previewData) {
            Logger.info("Preview not found, falling back to original:", { imagePath });
        }

        // Prefer the (smaller) preview for Gemini; fall back to the original.
        const fileData = previewData ?? originalData;
        const downloadError = previewResult.error && (originalResult?.error ?? previewResult.error);

        if (!fileData) {
            Logger.error('Download error:', downloadError, { imagePath });
            await refundCreditIfDeducted();
            await cleanupFiles(supabase, imagePath);
            return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
        }

        // 2. Convert to base64 for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // 2a. Original bytes for EXIF (reuse the already-read buffer when the
        // original was the file sent to Gemini).
        const originalBuffer = originalData
            ? (originalData === fileData ? arrayBuffer : await originalData.arrayBuffer())
            : arrayBuffer;

        // 2a. Extract EXIF Metadata
        interface ExifData {
            make?: string
            camera?: string
            lens?: string
            iso?: string
            focal_length?: string
            aperture?: string
            shutter_speed?: string
            exposure_comp?: string
            metering?: string
            flash?: string
            datetime?: string
        }
        let exifData: ExifData = {}
        let technicalContext = ""
        try {
            const tags = ExifReader.load(originalBuffer);
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
                ;(Object.keys(exifData) as (keyof ExifData)[]).forEach(key => exifData[key] === undefined && delete exifData[key]);

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
            Logger.warn("EXIF Extraction failed (non-critical):", { error: e });
        }

        // 3. Construct Prompt with Homework Context
        let homeworkContext = "";
        let lessonData = null;

        if (lessonId) {
            const fetchedLesson = lessonResult.data as { title: string; learning_goals: string | null } | null;
            if (fetchedLesson) {
                lessonData = fetchedLesson;
                homeworkContext = `
                 ---
                 IMPORTANT: THIS IS A HOMEWORK ASSIGNMENT.
                 LESSON TOPIC: ${fetchedLesson.title}
                 LESSON GOALS: ${fetchedLesson.learning_goals || 'Follow general principles of this topic.'}
                 
                 CRITICAL INSTRUCTIONS:
                 1. Evaluate the image PRIMARILY against the "LESSON GOALS" above.
                 2. The "goal_score" in your JSON output must reflect how well the user achieved these specific lesson objectives.
                 3. In your "strengths" and "improvements", reference the lesson topic explicitly.
                 ---
                 `;
            }
        }

        const prompt = `
      Act as a world-class photography mentor. Analyze this ${category || 'photo'}.
      ${homeworkContext}
      User Goals: ${goals?.join(', ') || 'Improvement'}
      User Context: ${context || 'None provided.'}
      ${technicalContext}
      
      Provide the response in ANY valid JSON format. Do NOT use markdown code blocks.
      The JSON structure must include:
      - title: specific to the subject
      - scores: { composition: 0-100, technique: 0-100, creativity: 0-100, overall: 0-100 }
      - goal_score: 0-100 (Relevance to lesson goals / user goals. Critical for homework.)
      - goal_feedback: string (Specific feedback on how well the photo met the lesson goals)
      - nsfw_score: 0-100 (likelihood of NSFW content or nudity. 0 = clean, 100 = explicit)
      - ai_generated_score: 0-100 (likelihood of AI generation. 0 = real photo, 100 = definitely AI)
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
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonStr = responseText.substring(firstBrace, lastBrace + 1);
                analysisData = JSON.parse(jsonStr);
            } else {
                throw new Error("No JSON structure found in response");
            }
        } catch (e) {
            Logger.error("JSON Parse Error", e, { responseText });
            await refundCreditIfDeducted();
            await cleanupFiles(supabase, imagePath);
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // 5. Store Result in DB & Deduct Credit
        const submissionPayload: Record<string, unknown> = {
            image_path: imagePath,
            thumbnail_path: previewPath,
            category,
            goals,
            context,
            metadata: exifData,
            status: 'done',
            lesson_id: lessonId || null // Link to lesson
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
            Logger.error('Submission Insert Error:', submissionError);
            await refundCreditIfDeducted();
            await cleanupFiles(supabase, imagePath);
            return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
        }

        const submissionId = submissionData.id;
        const goalScore = analysisData.goal_score || analysisData.scores?.overall || 0;

        const AnalysisDataFormatted = {
            submission_id: submissionId,
            full_critique: analysisData,
            preview_text: analysisData.preview_summary,
            title: analysisData.title,
            is_unlocked: !!user,
            score: analysisData.scores?.overall || analysisData.score,
            goal_score: goalScore
        };

        const { error: analysisError } = await supabase
            .from('analyses')
            .insert(AnalysisDataFormatted);

        if (analysisError) {
            Logger.error('Analysis Insert Error:', analysisError);
            await refundCreditIfDeducted();
            await supabase.from('submissions').delete().eq('id', submissionId);
            await cleanupFiles(supabase, imagePath);
            return NextResponse.json({ error: `Failed to save analysis` }, { status: 500 });
        }

        // 6. Award Homework Points (Bonus XP) if User & Lesson
        if (user && lessonId && lessonData) {
            // Upsert to user_homework_progress
            // We use goal_score as the XP amount for homework
            const { error: hwError } = await supabase
                .from('user_homework_progress')
                .upsert({
                    user_id: user.id,
                    lesson_id: lessonId,
                    submission_id: submissionId,
                    points_awarded: goalScore
                }, { onConflict: 'user_id, lesson_id' }) // Overwrite previous attempt with best? Or upsert keeps latest?

            if (hwError) {
                Logger.error("Homework Progress Error:", hwError)
            } else {
                Logger.info(`[Homework] Awarded ${goalScore} points to user ${user.id} for lesson ${lessonId}`)
            }
        }

        // Credit was already deducted atomically up front (step 0) — nothing
        // left to do here on success.

        const response = NextResponse.json({ success: true, id: submissionId });

        if (!user) {
            response.cookies.set(`guest_token_${submissionId}`, 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 1 week
            });
        }

        return response;
    } catch (error) {
        Logger.error('Analysis error:', error, { imagePath });
        await refundCreditIfDeducted();
        await cleanupFiles(supabase, imagePath);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
