/**
 * 아마노코리아 주차관제 시스템 REST API 연동
 *
 * 방문차량 등록/삭제를 통해 SafePass 승인된 차량이
 * 인천종합에너지 주차장 게이트를 자동 통과할 수 있도록 연동
 *
 * 주의: 아마노 서버가 HTTP/1.0을 사용하므로 fetch(undici) 대신
 * Node.js http 모듈을 직접 사용해야 함 (chunked encoding 방지)
 */

import http from "http"

// 환경변수에서 설정 로드
const AMANO_API_URL = process.env.AMANO_API_URL || ""
const AMANO_USER_ID = process.env.AMANO_USER_ID || ""
const AMANO_USER_PW = process.env.AMANO_USER_PW || ""
const AMANO_LOT_AREA = parseInt(process.env.AMANO_LOT_AREA || "0")
const AMANO_DISC_CODE = parseInt(process.env.AMANO_DISC_CODE || "0")

function createBasicAuth(): string {
  const credentials = `${AMANO_USER_ID}:${AMANO_USER_PW}`
  return `Basic ${Buffer.from(credentials, "utf8").toString("base64")}`
}

export interface AmanoResponse {
  success: boolean
  preDiscountId?: number
  error?: string
  data?: any
}

export interface RegisterVehicleParams {
  carNo: string
  startDate: string // ISO date: "2026-03-04"
  endDate: string   // ISO date: "2026-03-10"
  userName?: string
  mobile?: string
  memo?: string
}

export interface DeleteVehicleParams {
  preDiscountId: number
}

/**
 * ISO 날짜 문자열을 아마노 날짜 형식으로 변환
 * "2026-03-04" → "20260304000000" (시작) 또는 "20260304235959" (종료)
 */
function toAmanoDate(isoDate: string, isEnd: boolean): string {
  const dateOnly = isoDate.replace(/-/g, "")
  return isEnd ? `${dateOnly}235959` : `${dateOnly}000000`
}

/**
 * Node.js http 모듈로 POST 요청 (HTTP/1.0 호환)
 * fetch(undici)는 chunked encoding을 사용하여 HTTP/1.0 서버에서 body가 비어보이는 문제 발생
 */
function httpPost(apiUrl: string, endpoint: string, body: Record<string, any>): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${apiUrl}/interop/${endpoint}`)
    const jsonBody = Buffer.from(JSON.stringify(body), "utf8")

    console.log(`아마노 API 요청: ${url.href}`)
    console.log("요청 body:", JSON.stringify(body, null, 2))
    console.log("Content-Length:", jsonBody.length)

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 9948,
      path: url.pathname,
      method: "POST",
      headers: {
        Authorization: createBasicAuth(),
        "Content-Type": "application/json",
        "Content-Length": jsonBody.length,
      },
    }

    const req = http.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => { data += chunk })
      res.on("end", () => {
        console.log("아마노 API 응답 상태:", res.statusCode)
        console.log("아마노 API 응답:", data)
        try {
          const result = JSON.parse(data)
          resolve({ statusCode: res.statusCode, result })
        } catch {
          reject(new Error(`JSON 파싱 실패: ${data}`))
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.write(jsonBody)
    req.end()
  })
}

/**
 * 방문차량 등록 (InsertPreDiscountInfo)
 * 승인된 차량을 아마노 시스템에 등록하여 게이트 자동 오픈
 */
export async function registerVehicle(params: RegisterVehicleParams): Promise<AmanoResponse> {
  console.log("=== 아마노 방문차량 등록 시작 ===")
  console.log("차량번호:", params.carNo)
  console.log("기간:", params.startDate, "~", params.endDate)

  if (!AMANO_API_URL || !AMANO_USER_ID || !AMANO_USER_PW) {
    console.warn("⚠️ 아마노 API 설정이 없습니다. 환경변수를 확인해주세요.")
    return {
      success: false,
      error: "아마노 API 환경변수가 설정되지 않았습니다.",
    }
  }

  try {
    const requestBody = {
      lotAreaNo: AMANO_LOT_AREA,
      registUserId: "SAFEPASS",
      registUserName: params.userName || "SafePass시스템",
      discCodeNo: AMANO_DISC_CODE,
      carNo: params.carNo,
      dcCount: 0,
      startDtm: toAmanoDate(params.startDate, false),
      endDtm: toAmanoDate(params.endDate, true),
      dongcode: "",
      hocode: "",
      memo: params.memo || "SafePass 출입승인",
      mobile: params.mobile?.replace(/[^0-9]/g, "") || "",
    }

    const { statusCode, result } = await httpPost(AMANO_API_URL, "insertPreDiscountInfo.do", requestBody)

    if (statusCode !== 200) {
      console.error("❌ 아마노 API HTTP 오류:", statusCode)
      return {
        success: false,
        error: `아마노 API HTTP 오류: ${statusCode}`,
        data: result,
      }
    }

    if (result.data?.success === false) {
      console.error("❌ 아마노 등록 실패:", result.data?.errorMessage)
      return {
        success: false,
        error: result.data?.errorMessage || "아마노 방문차량 등록 실패",
        data: result,
      }
    }

    const preDiscountId = result.data?.preDiscountId
    console.log("✅ 아마노 방문차량 등록 성공! preDiscountId:", preDiscountId)

    return {
      success: true,
      preDiscountId,
      data: result,
    }
  } catch (error: any) {
    console.error("❌ 아마노 API 호출 오류:", error)
    return {
      success: false,
      error: `아마노 API 호출 실패: ${error?.message || "알 수 없는 오류"}`,
    }
  }
}

/**
 * 방문차량 삭제 (DeletePreDiscountInfo)
 * 거절/취소 시 아마노 시스템에서 차량 등록 제거
 */
export async function deleteVehicle(params: DeleteVehicleParams): Promise<AmanoResponse> {
  console.log("=== 아마노 방문차량 삭제 시작 ===")
  console.log("preDiscountId:", params.preDiscountId)

  if (!AMANO_API_URL || !AMANO_USER_ID || !AMANO_USER_PW) {
    console.warn("⚠️ 아마노 API 설정이 없습니다.")
    return {
      success: false,
      error: "아마노 API 환경변수가 설정되지 않았습니다.",
    }
  }

  try {
    const requestBody = {
      lotAreaNo: AMANO_LOT_AREA,
      registUserId: "SAFEPASS",
      preDiscountId: params.preDiscountId,
    }

    const { statusCode, result } = await httpPost(AMANO_API_URL, "deletePreDiscountInfo.do", requestBody)

    if (statusCode !== 200) {
      console.error("❌ 아마노 삭제 HTTP 오류:", statusCode)
      return {
        success: false,
        error: `아마노 API HTTP 오류: ${statusCode}`,
        data: result,
      }
    }

    if (result.data?.success === false) {
      console.error("❌ 아마노 삭제 실패:", result.data?.errorMessage)
      return {
        success: false,
        error: result.data?.errorMessage || "아마노 방문차량 삭제 실패",
        data: result,
      }
    }

    console.log("✅ 아마노 방문차량 삭제 성공!")
    return {
      success: true,
      data: result,
    }
  } catch (error: any) {
    console.error("❌ 아마노 삭제 API 호출 오류:", error)
    return {
      success: false,
      error: `아마노 삭제 API 호출 실패: ${error?.message || "알 수 없는 오류"}`,
    }
  }
}
