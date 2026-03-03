import { NextRequest, NextResponse } from 'next/server';
import { sendScheduledSMS } from '@/lib/sms-service';

/**
 * 예약 발송 API
 * POST /api/sms/send-scheduled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, text, scheduledDate, subject } = body;

    // 입력값 검증
    if (!to || !text || !scheduledDate) {
      return NextResponse.json(
        {
          success: false,
          message: '수신번호(to), 메시지 내용(text), 예약 날짜(scheduledDate)는 필수입니다.',
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // 날짜 형식 검증
    const scheduleDate = new Date(scheduledDate);
    if (isNaN(scheduleDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: '올바른 날짜 형식이 아닙니다. (예: 2024-12-31 23:59:59)',
          error: 'Invalid date format'
        },
        { status: 400 }
      );
    }

    // 과거 날짜 체크
    if (scheduleDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: '예약 날짜는 현재 시간보다 이후여야 합니다.',
          error: 'Past date not allowed'
        },
        { status: 400 }
      );
    }

    // 예약 발송
    const result = await sendScheduledSMS({
      to,
      text,
      subject,
      scheduledDate
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('예약 발송 API 오류:', error);
    
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
