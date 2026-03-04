/**
 * 아마노코리아 주차관제 시스템 REST API 연동
 *
 * 방문차량 등록/삭제를 통해 SafePass 승인된 차량이
 * 인천종합에너지 주차장 게이트를 자동 통과할 수 있도록 연동
 *
 * API 문서: Content-Type: application/json, UTF8
 * 인증: Basic Auth (userId:userPw → UTF8 → Base64)
 * HTTP: 9948, HTTPS: 9938
 */

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

/**
 * AMANO_API_URL에서 HTTPS URL 생성
 * http://a22789.parkingweb.kr:9948 → https://a22789.parkingweb.kr:9938
 */
function getHttpsUrl(): string {
  return AMANO_API_URL.replace("http://", "https://").replace(":9948", ":9938")
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
 * 아마노 API POST 요청 공통 함수
 * HTTPS 먼저 시도, 실패하면 HTTP로 폴백
 */
async function amanoPost(endpoint: string, body: Record<string, any>): Promise<any> {
  const jsonBody = JSON.stringify(body)
  const headers = {
    Authorization: createBasicAuth(),
    "Content-Type": "application/json",
  }

  // 1차: HTTPS 시도 (포트 9938)
  const httpsUrl = `${getHttpsUrl()}/interop/${endpoint}`
  console.log(`아마노 API 요청 [HTTPS]: ${httpsUrl}`)
  console.log("요청 body:", jsonBody)

  try {
    const httpsResponse = await fetch(httpsUrl, {
      method: "POST",
      headers,
      body: jsonBody,
    })
    const httpsResult = await httpsResponse.json()
    console.log("아마노 API 응답 [HTTPS]:", JSON.stringify(httpsResult, null, 2))

    // HTTPS 성공 시 (컨텐츠 비어있음 에러가 아니면) 바로 리턴
    if (httpsResult.data?.errorMessage?.includes("비어있음") !== true) {
      return { response: httpsResponse, result: httpsResult, protocol: "HTTPS" }
    }
    console.log("⚠️ HTTPS에서도 컨텐츠 비어있음 - HTTP로 폴백 시도")
  } catch (httpsError: any) {
    console.log(`⚠️ HTTPS 실패 (${httpsError.message}) - HTTP로 폴백`)
  }

  // 2차: HTTP 폴백 (포트 9948)
  const httpUrl = `${AMANO_API_URL}/interop/${endpoint}`
  console.log(`아마노 API 요청 [HTTP]: ${httpUrl}`)

  const httpResponse = await fetch(httpUrl, {
    method: "POST",
    headers,
    body: jsonBody,
  })
  const httpResult = await httpResponse.json()
  console.log("아마노 API 응답 [HTTP]:", JSON.stringify(httpResult, null, 2))

  return { response: httpResponse, result: httpResult, protocol: "HTTP" }
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

    const { response, result, protocol } = await amanoPost("insertPreDiscountInfo.do", requestBody)
    console.log(`아마노 등록 응답 (${protocol}):`, JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error("❌ 아마노 API HTTP 오류:", response.status)
      return {
        success: false,
        error: `아마노 API HTTP 오류: ${response.status}`,
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

    const { response, result, protocol } = await amanoPost("deletePreDiscountInfo.do", requestBody)
    console.log(`아마노 삭제 응답 (${protocol}):`, JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error("❌ 아마노 삭제 HTTP 오류:", response.status)
      return {
        success: false,
        error: `아마노 API HTTP 오류: ${response.status}`,
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
