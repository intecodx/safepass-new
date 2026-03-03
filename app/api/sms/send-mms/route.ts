import { NextRequest, NextResponse } from 'next/server';
import { sendMMS } from '@/lib/sms-service';

/**
 * 사진 문자(MMS) 발송 API
 * POST /api/sms/send-mms
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const to = formData.get('to') as string;
    const text = formData.get('text') as string;
    const subject = formData.get('subject') as string;
    const imageFile = formData.get('image') as File;

    // 입력값 검증
    if (!to || !text) {
      return NextResponse.json(
        {
          success: false,
          message: '수신번호(to)와 메시지 내용(text)은 필수입니다.',
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지 파일이 필요합니다.',
          error: 'Missing image file'
        },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (200KB)
    if (imageFile.size > 200 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: '이미지 파일 크기는 200KB 이하여야 합니다.',
          error: 'File size too large'
        },
        { status: 400 }
      );
    }

    // 파일 형식 검증 (jpg만)
    if (!imageFile.type.includes('jpeg') && !imageFile.type.includes('jpg')) {
      return NextResponse.json(
        {
          success: false,
          message: 'JPG 형식의 이미지만 업로드 가능합니다.',
          error: 'Invalid file format'
        },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // MMS 발송
    const result = await sendMMS(
      { to, text, subject }, 
      imageBuffer, 
      imageFile.name
    );

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('MMS 발송 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: '서버 내부 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
