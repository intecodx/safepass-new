import { NextRequest, NextResponse } from 'next/server';
import { sendManySMS } from '@/lib/sms-service';

/**
 * 대량 문자 발송 API
 * POST /api/sms/send-many
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    // 입력값 검증
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: '발송할 메시지 배열(messages)은 필수이며, 최소 1개 이상이어야 합니다.',
          error: 'Invalid messages array'
        },
        { status: 400 }
      );
    }

    // 메시지 개수 제한 (예: 최대 1000개)
    if (messages.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: '한번에 최대 1000개의 메시지까지 발송할 수 있습니다.',
          error: 'Too many messages'
        },
        { status: 400 }
      );
    }

    // 각 메시지 유효성 검사
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.to || !msg.text) {
        return NextResponse.json(
          {
            success: false,
            message: `메시지 ${i + 1}번: 수신번호(to)와 메시지 내용(text)은 필수입니다.`,
            error: `Invalid message at index ${i}`
          },
          { status: 400 }
        );
      }
    }

    console.log(`=== 대량 SMS 발송 요청: ${messages.length}건 ===`);

    // 대량 SMS 발송
    const result = await sendManySMS(messages);

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('대량 SMS 발송 API 오류:', error);
    
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
