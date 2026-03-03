import crypto from "crypto"
import FormData from "form-data"

// SOLAPI 설정
const apiKey = process.env.SOLAPI_API_KEY || "NCSJWPTZ4C17OQ8L"
const apiSecret = process.env.SOLAPI_API_SECRET || "4TSWUWEHVRXGFFDEPX8NZR7APRTJM4HP"
const defaultFrom = process.env.SOLAPI_FROM_PHONE || "01054887216"
const baseURL = "https://api.solapi.com"

console.log("=== SOLAPI 환경변수 확인 ===")
console.log("API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "없음")
console.log("API Secret:", apiSecret ? `${apiSecret.substring(0, 8)}...` : "없음")
console.log("From Phone:", defaultFrom)

// HMAC 인증을 위한 헬퍼 함수들
function createSignature(stringToSign: string, key: string): string {
  return crypto.createHmac("sha256", key).update(stringToSign).digest("hex")
}

function createAuthorization(): { [key: string]: string } {
  const salt = Math.random().toString(36).substring(2, 15)
  const date = new Date().toISOString()
  const stringToSign = date + salt
  const signature = createSignature(stringToSign, apiSecret)

  return {
    Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
    "Content-Type": "application/json",
  }
}

export interface SMSResponse {
  success: boolean
  data?: any
  error?: string
  message: string
  statusCode?: number
  errorCode?: string
  errorMessage?: string
}

export interface SMSRequest {
  to: string
  text: string
  from?: string
  subject?: string
}

// SOLAPI send-many/detail API용 인터페이스
export interface SolapiMessage {
  to: string
  from: string
  text: string
  type?: "SMS" | "LMS" | "MMS" | "ATA" | "CTA"
  subject?: string
  autoTypeDetect?: boolean
  customFields?: Record<string, string>
  kakaoOptions?: any
}

export interface SolapiSendManyRequest {
  messages: SolapiMessage[]
  scheduledDate?: string
}

export interface SolapiSendManyResponse {
  groupId: string
  messageCount: number
  accountId: string
  price: {
    [key: string]: number
  }
  balance: {
    sms: number
    lms: number
    mms: number
    ata: number
    cta: number
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return ""
  const cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.length === 11 && cleaned.startsWith("010")) {
    return cleaned
  }
  if (cleaned.length === 10 && cleaned.startsWith("10")) {
    return "0" + cleaned
  }
  return cleaned
}

// 새로운 SOLAPI send-many/detail API 사용
export async function sendSMSWithSolapiAPI(args: SMSRequest): Promise<SMSResponse> {
  console.log("=== SOLAPI API SMS 발송 시작 ===")
  console.log("요청 데이터:", JSON.stringify(args, null, 2))

  try {
    if (!args.to || !args.text) {
      return {
        success: false,
        error: "수신번호와 메시지는 필수입니다.",
        message: "SMS 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    const to = normalizePhone(args.to)
    const from = normalizePhone(args.from || defaultFrom)
    const text = args.text.toString()

    console.log("정규화 후:", { to, from, textLength: text.length })

    // SOLAPI send-many/detail API 요청 데이터 구성
    const requestData: SolapiSendManyRequest = {
      messages: [
        {
          to,
          from,
          text,
          autoTypeDetect: true, // 자동으로 SMS/LMS 타입 감지
          ...(args.subject && { subject: args.subject }),
        },
      ],
    }

    console.log("SOLAPI API 발송 시도:", JSON.stringify(requestData, null, 2))

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("SOLAPI API 오류:", result)
      return {
        success: false,
        error: result.errorMessage || result.message || "SOLAPI API 오류",
        message: "SMS 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "SOLAPI_API_ERROR",
      }
    }

    console.log("SOLAPI API 발송 성공:", JSON.stringify(result, null, 2))

    return {
      success: true,
      data: result,
      message: "SMS 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    console.error("=== SOLAPI API 일반 오류 ===")
    console.error("오류:", error)

    return {
      success: false,
      error: `SMS 발송 오류: ${error?.message || "알 수 없는 오류"}`,
      message: "SMS 발송 실패",
      statusCode: 500,
      errorCode: "GENERAL_ERROR",
    }
  }
}

// 여러 건의 메시지를 한번에 발송
export async function sendManySMS(messages: SMSRequest[]): Promise<SMSResponse> {
  console.log("=== 대량 SMS 발송 시작 ===")
  console.log(`총 ${messages.length}건의 메시지 발송`)

  try {
    if (!messages || messages.length === 0) {
      return {
        success: false,
        error: "발송할 메시지가 없습니다.",
        message: "대량 SMS 발송 실패",
        statusCode: 400,
        errorCode: "NO_MESSAGES",
      }
    }

    // 메시지 데이터 검증 및 변환
    const solapiMessages: SolapiMessage[] = messages.map((msg) => {
      if (!msg.to || !msg.text) {
        throw new Error(`잘못된 메시지 데이터: ${JSON.stringify(msg)}`)
      }

      return {
        to: normalizePhone(msg.to),
        from: normalizePhone(msg.from || defaultFrom),
        text: msg.text.toString(),
        autoTypeDetect: true,
        ...(msg.subject && { subject: msg.subject }),
      }
    })

    const requestData: SolapiSendManyRequest = {
      messages: solapiMessages,
    }

    console.log("SOLAPI 대량 발송 시도:", JSON.stringify(requestData, null, 2))

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("SOLAPI 대량 발송 오류:", result)
      return {
        success: false,
        error: result.errorMessage || result.message || "SOLAPI API 오류",
        message: "대량 SMS 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "SOLAPI_API_ERROR",
      }
    }

    console.log("SOLAPI 대량 발송 성공:", JSON.stringify(result, null, 2))

    return {
      success: true,
      data: result,
      message: `${solapiMessages.length}건의 SMS 발송 성공`,
      statusCode: 200,
    }
  } catch (error: any) {
    console.error("=== 대량 SMS 발송 오류 ===")
    console.error("오류:", error)

    return {
      success: false,
      error: `대량 SMS 발송 오류: ${error?.message || "알 수 없는 오류"}`,
      message: "대량 SMS 발송 실패",
      statusCode: 500,
      errorCode: "BULK_SEND_ERROR",
    }
  }
}

// 기존 함수는 호환성을 위해 유지 (새 API 사용)
export async function sendSMS(args: SMSRequest): Promise<SMSResponse> {
  return sendSMSWithSolapiAPI(args)
}

export async function sendLMS(request: SMSRequest): Promise<SMSResponse> {
  // LMS는 SMS와 동일하게 처리 (SOLAPI가 자동으로 길이에 따라 판단)
  return sendSMS(request)
}

// 예약 발송 (SOLAPI API 사용)
export async function sendScheduledSMS(request: SMSRequest & { scheduledDate: string | Date }): Promise<SMSResponse> {
  console.log("=== 예약 SMS 발송 시작 ===")

  try {
    if (!request.to || !request.text || !request.scheduledDate) {
      return {
        success: false,
        error: "수신번호, 메시지, 예약일시는 필수입니다.",
        message: "예약 SMS 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    const to = normalizePhone(request.to)
    const from = normalizePhone(request.from || defaultFrom)

    // 예약일시를 ISO 문자열로 변환
    const scheduledDate =
      typeof request.scheduledDate === "string" ? request.scheduledDate : request.scheduledDate.toISOString()

    const requestData: SolapiSendManyRequest = {
      messages: [
        {
          to,
          from,
          text: request.text.toString(),
          autoTypeDetect: true,
          ...(request.subject && { subject: request.subject }),
        },
      ],
      scheduledDate,
    }

    console.log("예약 발송 요청 데이터:", JSON.stringify(requestData, null, 2))

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("예약 발송 오류:", result)
      return {
        success: false,
        error: result.errorMessage || result.message || "예약 발송 실패",
        message: "예약 SMS 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "SCHEDULE_ERROR",
      }
    }

    console.log("예약 발송 성공:", JSON.stringify(result, null, 2))

    return {
      success: true,
      data: result,
      message: "예약 SMS 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    console.error("=== 예약 발송 오류 ===")
    console.error("오류:", error)

    return {
      success: false,
      error: `예약 발송 실패: ${error?.message || "알 수 없는 오류"}`,
      message: "예약 SMS 발송 실패",
      statusCode: 500,
      errorCode: "SCHEDULE_ERROR",
    }
  }
}

// 알림톡 발송 인터페이스
export interface AlimtalkRequest {
  to: string
  from?: string
  templateId: string
  pfId: string
  variables?: Record<string, string>
  disableSms?: boolean
  text?: string
  subject?: string
}

// 알림톡 발송
export async function sendAlimtalk(request: AlimtalkRequest): Promise<SMSResponse> {
  console.log("=== 알림톡 발송 시작 ===")

  try {
    if (!request.to || !request.templateId || !request.pfId) {
      return {
        success: false,
        error: "수신번호, 템플릿ID, 발신프로필ID는 필수입니다.",
        message: "알림톡 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    const to = normalizePhone(request.to)
    const from = normalizePhone(request.from || defaultFrom)

    const requestData = {
      messages: [
        {
          to,
          from,
          text: request.text || "",
          type: "ATA" as const,
          kakaoOptions: {
            pfId: request.pfId,
            templateId: request.templateId,
            disableSms: request.disableSms !== false, // 기본값은 true (SMS 대체발송 비활성화)
            ...(request.variables && { variables: request.variables }),
          },
          ...(request.subject && { subject: request.subject }),
        },
      ],
    }

    console.log("알림톡 발송 요청 데이터:", JSON.stringify(requestData, null, 2))

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("알림톡 발송 오류:", result)
      return {
        success: false,
        error: result.errorMessage || result.message || "알림톡 발송 실패",
        message: "알림톡 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "ALIMTALK_ERROR",
      }
    }

    console.log("알림톡 발송 성공:", JSON.stringify(result, null, 2))

    return {
      success: true,
      data: result,
      message: "알림톡 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    console.error("=== 알림톡 발송 오류 ===")
    console.error("오류:", error)

    return {
      success: false,
      error: `알림톡 발송 실패: ${error?.message || "알 수 없는 오류"}`,
      message: "알림톡 발송 실패",
      statusCode: 500,
      errorCode: "ALIMTALK_ERROR",
    }
  }
}

// 친구톡 발송 (카카오톡 친구톡)
export async function sendFriendTalk(request: {
  to: string
  from?: string
  pfId: string
  text: string
  buttons?: Array<{
    name: string
    type: string
    url_mobile?: string
    url_pc?: string
  }>
}): Promise<SMSResponse> {
  console.log("=== 친구톡 발송 시작 ===")

  try {
    if (!request.to || !request.pfId || !request.text) {
      return {
        success: false,
        error: "수신번호, 발신프로필ID, 메시지는 필수입니다.",
        message: "친구톡 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    const to = normalizePhone(request.to)
    const from = normalizePhone(request.from || defaultFrom)

    const requestData = {
      messages: [
        {
          to,
          from,
          text: request.text,
          type: "CTA" as const,
          kakaoOptions: {
            pfId: request.pfId,
            ...(request.buttons && { buttons: request.buttons }),
          },
        },
      ],
    }

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.errorMessage || "친구톡 발송 실패",
        message: "친구톡 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "FRIENDTALK_ERROR",
      }
    }

    return {
      success: true,
      data: result,
      message: "친구톡 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `친구톡 발송 실패: ${error?.message || "알 수 없는 오류"}`,
      message: "친구톡 발송 실패",
      statusCode: 500,
      errorCode: "FRIENDTALK_ERROR",
    }
  }
}

// 카카오 이미지 업로드
export async function uploadKakaoImage(imageFile: File | Buffer | string): Promise<{
  success: boolean
  imageId?: string
  error?: string
}> {
  console.log("=== 카카오 이미지 업로드 시작 ===")

  try {
    const formData = new FormData()

    if (typeof imageFile === "string") {
      // Base64 문자열인 경우
      const response = await fetch(imageFile)
      const blob = await response.blob()
      formData.append("file", blob)
    } else if (imageFile instanceof File) {
      formData.append("file", imageFile)
    } else {
      // Buffer인 경우
      const blob = new Blob([imageFile])
      formData.append("file", blob)
    }

    const response = await fetch(`${baseURL}/storage/v1/files`, {
      method: "POST",
      headers: {
        ...createAuthorization(),
        // Content-Type을 제거하여 브라우저가 자동으로 설정하도록 함
      },
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.errorMessage || "이미지 업로드 실패",
      }
    }

    return {
      success: true,
      imageId: result.fileId,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `이미지 업로드 실패: ${error?.message || "알 수 없는 오류"}`,
    }
  }
}

// 국제 SMS 발송
export async function sendInternationalSMS(request: {
  to: string
  from?: string
  text: string
  country?: string
}): Promise<SMSResponse> {
  console.log("=== 국제 SMS 발송 시작 ===")

  try {
    if (!request.to || !request.text) {
      return {
        success: false,
        error: "수신번호와 메시지는 필수입니다.",
        message: "국제 SMS 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    // 국제번호 형식 검증 (+ 또는 00으로 시작)
    let to = request.to.replace(/[^0-9+]/g, "")
    if (!to.startsWith("+") && !to.startsWith("00")) {
      to = "+" + to
    }

    const requestData = {
      messages: [
        {
          to,
          from: request.from || defaultFrom,
          text: request.text,
          type: "SMS" as const,
          country: request.country || "INTL",
        },
      ],
    }

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.errorMessage || "국제 SMS 발송 실패",
        message: "국제 SMS 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "INTL_SMS_ERROR",
      }
    }

    return {
      success: true,
      data: result,
      message: "국제 SMS 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `국제 SMS 발송 실패: ${error?.message || "알 수 없는 오류"}`,
      message: "국제 SMS 발송 실패",
      statusCode: 500,
      errorCode: "INTL_SMS_ERROR",
    }
  }
}

// MMS 발송 (이미지 포함)
export async function sendMMS(request: {
  to: string
  from?: string
  text: string
  subject?: string
  imageId?: string
  imageUrl?: string
}): Promise<SMSResponse> {
  console.log("=== MMS 발송 시작 ===")

  try {
    if (!request.to || !request.text) {
      return {
        success: false,
        error: "수신번호와 메시지는 필수입니다.",
        message: "MMS 발송 실패 - 필수 파라미터 누락",
        statusCode: 400,
        errorCode: "MISSING_PARAMS",
      }
    }

    const to = normalizePhone(request.to)
    const from = normalizePhone(request.from || defaultFrom)

    const messageData: any = {
      to,
      from,
      text: request.text,
      type: "MMS" as const,
      ...(request.subject && { subject: request.subject }),
    }

    // 이미지 첨부
    if (request.imageId) {
      messageData.imageId = request.imageId
    } else if (request.imageUrl) {
      messageData.imageUrl = request.imageUrl
    }

    const requestData = {
      messages: [messageData],
    }

    const response = await fetch(`${baseURL}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: createAuthorization(),
      body: JSON.stringify(requestData),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.errorMessage || "MMS 발송 실패",
        message: "MMS 발송 실패",
        statusCode: response.status,
        errorCode: result.errorCode || "MMS_ERROR",
      }
    }

    return {
      success: true,
      data: result,
      message: "MMS 발송 성공",
      statusCode: 200,
    }
  } catch (error: any) {
    return {
      success: false,
      error: `MMS 발송 실패: ${error?.message || "알 수 없는 오류"}`,
      message: "MMS 발송 실패",
      statusCode: 500,
      errorCode: "MMS_ERROR",
    }
  }
}
