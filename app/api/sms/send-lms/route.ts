import { NextRequest, NextResponse } from 'next/server';
import { sendLMS } from '@/lib/sms-service';

/**
 * 장문 문자(LMS) 발송 API
 * POST /api/sms/send-lms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text, subject } = body;

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

    // LMS 발송
    const result = await sendLMS({ to, text, subject });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('LMS 발송 API 오류:', error);
    
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
