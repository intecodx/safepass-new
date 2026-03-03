import { NextResponse } from 'next/server';

/**
 * SMS API 정보 및 헬스 체크
 * GET /api/sms
 */
export async function GET() {
  const apiDocumentation = {
    service: 'SOLAPI SMS 발송 서비스',
    version: '1.0.0',
    description: 'Next.js 프로젝트에 통합된 SOLAPI 기반 문자 메시지 발송 API',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/sms/send-sms': {
        description: '단문 문자(SMS) 발송',
        parameters: {
          to: '수신번호 (필수, 예: 01012345678)',
          text: '메시지 내용 (필수, 한글 45자/영자 90자까지)'
        },
        example: {
          to: '01012345678',
          text: '안녕하세요! 테스트 메시지입니다.'
        }
      },
      'POST /api/sms/send-lms': {
        description: '장문 문자(LMS) 발송',
        parameters: {
          to: '수신번호 (필수)',
          text: '메시지 내용 (필수, 긴 메시지)',
          subject: '제목 (선택사항)'
        },
        example: {
          to: '01012345678',
          text: '긴 메시지 내용...',
          subject: '메시지 제목'
        }
      },
      'POST /api/sms/send-mms': {
        description: '사진 문자(MMS) 발송',
        contentType: 'multipart/form-data',
        parameters: {
          to: '수신번호 (필수)',
          text: '메시지 내용 (필수)',
          subject: '제목 (선택사항)',
          image: '이미지 파일 (필수, 200KB 이내, JPG만)'
        }
      },
      'POST /api/sms/send-scheduled': {
        description: '예약 발송',
        parameters: {
          to: '수신번호 (필수)',
          text: '메시지 내용 (필수)',
          scheduledDate: '예약 날짜 (필수, ISO 형식)',
          subject: '제목 (선택사항)'
        },
        example: {
          to: '01012345678',
          text: '예약 발송 메시지',
          scheduledDate: '2024-12-31T23:59:59',
          subject: '예약 메시지 제목'
        }
      },
      'POST /api/sms/send-alimtalk': {
        description: '알림톡 발송',
        parameters: {
          to: '수신번호 (필수)',
          pfId: '비즈니스 채널 pfId (필수)',
          templateId: '알림톡 템플릿 ID (필수)',
          variables: '치환문구 변수들 (선택사항)',
          disableSms: '문자 대체발송 비활성화 (선택사항)'
        },
        example: {
          to: '01012345678',
          pfId: 'your_pf_id',
          templateId: 'your_template_id',
          variables: {
            '#{변수명}': '치환될 값'
          },
          disableSms: false
        }
      },
      'POST /api/sms/send-friendtalk': {
        description: '친구톡 발송',
        parameters: {
          to: '수신번호 (필수)',
          text: '메시지 내용 (필수, 2000byte 이내)',
          pfId: '비즈니스 채널 pfId (필수)',
          buttons: '버튼 배열 (선택사항, 최대 5개)',
          image: '이미지 파일 (선택사항, 500KB 이내, PNG/JPG)'
        },
        buttonTypes: {
          WL: '웹링크',
          AL: '앱링크',
          BK: '봇키워드',
          MD: '상담요청하기',
          BC: '상담톡 전환',
          BT: '챗봇 문의'
        }
      },
      'POST /api/sms/send-international': {
        description: '해외 문자 발송',
        parameters: {
          to: '수신번호 (필수, 국제번호 제외)',
          text: '메시지 내용 (필수)',
          country: '국가번호 (필수, 예: "1" - 미국)'
        },
        example: {
          to: '1234567890',
          text: 'International message',
          country: '1'
        }
      }
    },
    environment: {
      required: [
        'SOLAPI_API_KEY',
        'SOLAPI_API_SECRET',
        'SOLAPI_FROM_NUMBER'
      ],
      configured: {
        SOLAPI_API_KEY: !!process.env.SOLAPI_API_KEY,
        SOLAPI_API_SECRET: !!process.env.SOLAPI_API_SECRET,
        SOLAPI_FROM_NUMBER: !!process.env.SOLAPI_FROM_NUMBER
      }
    },
    notes: [
      '전화번호는 01012345678 형식으로 입력해야 합니다.',
      '특수문자(+, -, *) 등은 사용할 수 없습니다.',
      'MMS 이미지: 200KB 이내, JPG 파일만',
      '친구톡 이미지: 500KB 이내, PNG/JPG 파일',
      '친구톡 버튼: 최대 5개까지',
      '환경변수는 .env.local 파일에 설정하세요.'
    ]
  };

  return NextResponse.json(apiDocumentation, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
