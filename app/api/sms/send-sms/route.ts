import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms-service';

/**
 * 단문 문자(SMS) 발송 API
 * POST /api/sms/send-sms
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text } = body;

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

    // SMS 발송
    const result = await sendSMS({ to, text });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('SMS 발송 API 오류:', error);
    
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

// OPTIONS 메서드 지원 (CORS)
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
