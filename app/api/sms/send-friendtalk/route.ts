import { NextRequest, NextResponse } from 'next/server';
import { sendFriendTalk, uploadKakaoImage } from '@/lib/sms-service';

/**
 * 친구톡 발송 API
 * POST /api/sms/send-friendtalk
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    
    let to: string, text: string, pfId: string, buttons: any, imageFile: File | null = null;

    if (contentType && contentType.includes('multipart/form-data')) {
      // 이미지가 포함된 경우 (FormData)
      const formData = await request.formData();
      
      to = formData.get('to') as string;
      text = formData.get('text') as string;
      pfId = formData.get('pfId') as string;
      const buttonsString = formData.get('buttons') as string;
      imageFile = formData.get('image') as File;

      buttons = buttonsString ? JSON.parse(buttonsString) : [];
    } else {
      // 이미지가 없는 경우 (JSON)
      const body = await request.json();
      ({ to, text, pfId, buttons } = body);
      buttons = buttons || [];
    }

    // 입력값 검증
    if (!to || !text || !pfId) {
      return NextResponse.json(
        {
          success: false,
          message: '수신번호(to), 메시지 내용(text), pfId는 필수입니다.',
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // 버튼 개수 검증
    if (buttons && buttons.length > 5) {
      return NextResponse.json(
        {
          success: false,
          message: '버튼은 최대 5개까지만 추가할 수 있습니다.',
          error: 'Too many buttons'
        },
        { status: 400 }
      );
    }

    let imageId: string | undefined;

    // 이미지가 있는 경우 업로드
    if (imageFile) {
      // 파일 크기 검증 (500KB)
      if (imageFile.size > 500 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: '이미지 파일 크기는 500KB 이하여야 합니다.',
            error: 'File size too large'
          },
          { status: 400 }
        );
      }

      // 파일 형식 검증 (png, jpg)
      if (!imageFile.type.includes('png') && !imageFile.type.includes('jpeg') && !imageFile.type.includes('jpg')) {
        return NextResponse.json(
          {
            success: false,
            message: 'PNG 또는 JPG 형식의 이미지만 업로드 가능합니다.',
            error: 'Invalid file format'
          },
          { status: 400 }
        );
      }

      // 파일을 Buffer로 변환
      const arrayBuffer = await imageFile.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // 이미지 업로드
      const uploadResult = await uploadKakaoImage(imageBuffer, imageFile.name);
      
      if (!uploadResult.success) {
        return NextResponse.json(uploadResult, { status: 500 });
      }

      imageId = uploadResult.data?.fileId;
    }

    // 친구톡 발송
    const result = await sendFriendTalk({
      to,
      text,
      pfId,
      buttons,
      imageId
    });

    if (result.success) {
      return NextResponse.json(result, { status: 200 });
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('친구톡 발송 API 오류:', error);
    
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
