import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * MCP 서버 설정 관리 API
 * GET /api/admin/mcp-servers - 모든 MCP 서버 조회
 * POST /api/admin/mcp-servers - 새 MCP 서버 추가
 */

export async function GET() {
  try {
    console.log('🔍 MCP 서버 목록 조회 시작...')

    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ MCP 서버 조회 실패:', error)
      return NextResponse.json({
        success: false,
        message: 'MCP 서버 조회에 실패했습니다.',
        error: error.message
      }, { status: 500 })
    }

    console.log(`✅ MCP 서버 ${data?.length || 0}개 조회됨`)

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `${data?.length || 0}개의 MCP 서버를 조회했습니다.`
    })

  } catch (error: any) {
    console.error('❌ MCP 서버 조회 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('➕ 새 MCP 서버 추가 시작...')

    const body = await request.json()
    const { 
      server_name, 
      command, 
      args, 
      env, 
      is_read_only, 
      project_ref, 
      description,
      status = 'active'
    } = body

    // 필수 필드 검증
    if (!server_name || !command || !args) {
      return NextResponse.json({
        success: false,
        message: 'server_name, command, args는 필수 필드입니다.',
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // 데이터 삽입
    const { data, error } = await supabase
      .from('mcp_servers')
      .insert({
        server_name,
        command,
        args,
        env: env || {},
        is_read_only: is_read_only ?? true,
        project_ref,
        description,
        status
      })
      .select()
      .single()

    if (error) {
      console.error('❌ MCP 서버 추가 실패:', error)
      
      if (error.code === '23505') { // 중복 키 오류
        return NextResponse.json({
          success: false,
          message: '이미 존재하는 서버 이름입니다.',
          error: error.message
        }, { status: 409 })
      }

      return NextResponse.json({
        success: false,
        message: 'MCP 서버 추가에 실패했습니다.',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ MCP 서버 추가 성공:', data.server_name)

    return NextResponse.json({
      success: true,
      data,
      message: `MCP 서버 '${data.server_name}'가 성공적으로 추가되었습니다.`
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ MCP 서버 추가 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}
