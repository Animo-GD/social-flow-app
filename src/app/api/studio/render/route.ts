import { NextRequest, NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mediaUrl, text, lang, animation } = body;

    if (!mediaUrl) {
      return NextResponse.json({ error: 'mediaUrl is required' }, { status: 400 });
    }

    // 1. Bundle the Remotion project
    const entryPoint = path.resolve(process.cwd(), 'src/remotion/index.ts');
    
    console.log('Bundling Remotion project at:', entryPoint);
    const bundleLocation = await bundle({
      entryPoint,
      webpackOverride: (config) => config,
    });

    // 2. Select composition
    const compositionId = 'StudioComposition';
    const inputProps = { mediaUrl, text, lang, animation };
    
    console.log('Selecting composition...');
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: compositionId,
      inputProps,
    });

    // 3. Render video
    const outputDir = path.resolve(process.cwd(), 'tmp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const fileName = `render-${crypto.randomBytes(8).toString('hex')}.mp4`;
    const outputPath = path.join(outputDir, fileName);

    console.log(`Rendering video to ${outputPath}...`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
    });

    console.log('Rendering complete. Uploading to Supabase...');

    // 4. Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(outputPath);
    const storagePath = `${session.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('generated_media')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Clean up local file
    fs.unlinkSync(outputPath);

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('generated_media')
      .getPublicUrl(storagePath);

    // 5. Save as a new post in the database so it appears in the gallery
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: session.id,
        platform: 'instagram', // default
        status: 'draft',
        text: `Studio Export: ${text || 'Edited Media'}`,
        video_url: publicUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (postError) {
      console.error('Error creating post record:', postError);
    }

    return NextResponse.json({ success: true, videoUrl: publicUrl, post });

  } catch (error: any) {
    console.error('Render API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
