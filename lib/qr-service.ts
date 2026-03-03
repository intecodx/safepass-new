import QRCode from 'qrcode'

export interface QRCodeData {
  userId: number
  userName: string
  phone: string
  approvedAt: string
  expiresAt: string
}

export async function generateQRCode(data: QRCodeData): Promise<string> {
  try {
    const qrString = JSON.stringify(data)
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    return qrCodeDataURL
  } catch (error) {
    console.error('QR코드 생성 실패:', error)
    throw error
  }
}

export function validateQRCode(qrData: QRCodeData): boolean {
  const now = new Date()
  const expiresAt = new Date(qrData.expiresAt)
  
  return now <= expiresAt
}

export function createQRCodeData(user: any): QRCodeData {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30일 후
  
  return {
    userId: user.id,
    userName: user.name,
    phone: user.phone,
    approvedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  }
}
