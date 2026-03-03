import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 특정 MCP 서버 관리 API
 * GET /api/admin/mcp-servers/[id] - 특정 MCP 서버 조회
 * PUT /api/admin/mcp-servers/[id] - MCP 서버 정보 수정
 * DELETE /api/admin/mcp-servers/[id] - MCP 서버 삭제
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`🔍 MCP 서버 ID ${id} 조회 시작...`)

    const { data, error } = await supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ MCP 서버 조회 실패:', error)
      
      if (error.code === 'PGRST116') { // 데이터 없음
        return NextResponse.json({
          success: false,
          message: '해당 MCP 서버를 찾을 수 없습니다.',
          error: 'Server not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        message: 'MCP 서버 조회에 실패했습니다.',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ MCP 서버 조회 성공:', data.server_name)

    return NextResponse.json({
      success: true,
      data,
      message: `MCP 서버 '${data.server_name}' 정보를 조회했습니다.`
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`✏️ MCP 서버 ID ${id} 수정 시작...`)

    const body = await request.json()
    const updateData = { ...body }
    delete updateData.id // ID는 수정할 수 없음
    delete updateData.created_at // 생성일은 수정할 수 없음

    const { data, error } = await supabase
      .from('mcp_servers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ MCP 서버 수정 실패:', error)
      
      if (error.code === 'PGRST116') { // 데이터 없음
        return NextResponse.json({
          success: false,
          message: '해당 MCP 서버를 찾을 수 없습니다.',
          error: 'Server not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: false,
        message: 'MCP 서버 수정에 실패했습니다.',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ MCP 서버 수정 성공:', data.server_name)

    return NextResponse.json({
      success: true,
      data,
      message: `MCP 서버 '${data.server_name}'가 성공적으로 수정되었습니다.`
    })

  } catch (error: any) {
    console.error('❌ MCP 서버 수정 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`🗑️ MCP 서버 ID ${id} 삭제 시작...`)

    // 먼저 해당 서버 정보 조회
    const { data: serverData, error: fetchError } = await supabase
      .from('mcp_servers')
      .select('server_name')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: '해당 MCP 서버를 찾을 수 없습니다.',
          error: 'Server not found'
        }, { status: 404 })
      }
      throw fetchError
    }

    // 서버 삭제
    const { error } = await supabase
      .from('mcp_servers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ MCP 서버 삭제 실패:', error)
      return NextResponse.json({
        success: false,
        message: 'MCP 서버 삭제에 실패했습니다.',
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ MCP 서버 삭제 성공:', serverData.server_name)

    return NextResponse.json({
      success: true,
      message: `MCP 서버 '${serverData.server_name}'가 성공적으로 삭제되었습니다.`
    })

  } catch (error: any) {
    console.error('❌ MCP 서버 삭제 중 예외 발생:', error)
    return NextResponse.json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message
    }, { status: 500 })
  }
}
